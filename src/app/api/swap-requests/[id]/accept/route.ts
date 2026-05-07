import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSwapAcceptedEmail } from "@/lib/email";
import { formatTimeSlot } from "@/lib/constants";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: params.id },
      include: {
        listing: {
          include: {
            appointment: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        requester: { select: { id: true, name: true, email: true } },
        offeredAppointment: true,
      },
    });

    if (!swapRequest) {
      return NextResponse.json(
        { error: "Swap request not found" },
        { status: 404 }
      );
    }

    // Only the listing owner can accept
    if (swapRequest.listing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (swapRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This swap request is no longer pending" },
        { status: 409 }
      );
    }

    const listedAppointment = swapRequest.listing.appointment;
    const offeredAppointment = swapRequest.offeredAppointment;

    // Verify both appointments are still in the expected state
    if (listedAppointment.status !== "LISTED") {
      return NextResponse.json(
        { error: "The listed appointment is no longer available" },
        { status: 409 }
      );
    }

    if (offeredAppointment.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "The offered appointment is no longer available" },
        { status: 409 }
      );
    }

    // Atomic swap transaction — this is the critical section
    await prisma.$transaction(async (tx) => {
      // Swap the userId fields between the two appointments
      await tx.appointment.update({
        where: { id: listedAppointment.id },
        data: {
          userId: swapRequest.requesterId,
          status: "SWAPPED",
        },
      });

      await tx.appointment.update({
        where: { id: offeredAppointment.id },
        data: {
          userId: swapRequest.listing.userId,
          status: "SWAPPED",
        },
      });

      // Mark this request as accepted
      await tx.swapRequest.update({
        where: { id: params.id },
        data: { status: "ACCEPTED" },
      });

      // Cancel all other pending requests for the same listing
      await tx.swapRequest.updateMany({
        where: {
          listingId: swapRequest.listingId,
          id: { not: params.id },
          status: "PENDING",
        },
        data: { status: "CANCELLED" },
      });

      // Mark listing as completed
      await tx.swapListing.update({
        where: { id: swapRequest.listingId },
        data: { status: "COMPLETED" },
      });

      // Notify the requester
      await tx.notification.create({
        data: {
          userId: swapRequest.requesterId,
          type: "SWAP_REQUEST_ACCEPTED",
          title: "Swap Accepted!",
          message: `${session.user.name} accepted your swap. Your new appointment is ${formatTimeSlot(listedAppointment.timeSlot)} on ${listedAppointment.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
          data: { swapRequestId: params.id },
        },
      });

      // Notify the listing owner (current user)
      await tx.notification.create({
        data: {
          userId: swapRequest.listing.userId,
          type: "SWAP_COMPLETED",
          title: "Swap Completed",
          message: `You swapped your ${formatTimeSlot(listedAppointment.timeSlot)} slot with ${swapRequest.requester.name}. Your new appointment is ${formatTimeSlot(offeredAppointment.timeSlot)} on ${offeredAppointment.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
          data: { swapRequestId: params.id },
        },
      });
    });

    // Send confirmation emails (non-fatal)
    try {
      await Promise.all([
        sendSwapAcceptedEmail({
          to: swapRequest.requester.email,
          toName: swapRequest.requester.name,
          newDate: listedAppointment.date,
          newTime: formatTimeSlot(listedAppointment.timeSlot),
          oldDate: offeredAppointment.date,
          oldTime: formatTimeSlot(offeredAppointment.timeSlot),
        }),
        sendSwapAcceptedEmail({
          to: swapRequest.listing.user.email,
          toName: swapRequest.listing.user.name,
          newDate: offeredAppointment.date,
          newTime: formatTimeSlot(offeredAppointment.timeSlot),
          oldDate: listedAppointment.date,
          oldTime: formatTimeSlot(listedAppointment.timeSlot),
        }),
      ]);
    } catch {
      // Email failure is non-fatal
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
