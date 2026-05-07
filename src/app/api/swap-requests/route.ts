import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSwapRequestSchema } from "@/lib/validations";
import { sendSwapRequestEmail } from "@/lib/email";
import { format } from "date-fns";
import { formatTimeSlot } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = createSwapRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { listingId, offeredAppointmentId } = result.data;

    const [listing, offeredAppointment] = await Promise.all([
      prisma.swapListing.findUnique({
        where: { id: listingId },
        include: {
          appointment: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.appointment.findUnique({
        where: { id: offeredAppointmentId },
      }),
    ]);

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "OPEN") {
      return NextResponse.json(
        { error: "This listing is no longer available" },
        { status: 409 }
      );
    }

    if (listing.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot request a swap on your own listing" },
        { status: 400 }
      );
    }

    if (!offeredAppointment) {
      return NextResponse.json(
        { error: "Offered appointment not found" },
        { status: 404 }
      );
    }

    if (offeredAppointment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (offeredAppointment.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "You can only offer active appointments for swap" },
        { status: 400 }
      );
    }

    const existingRequest = await prisma.swapRequest.findFirst({
      where: {
        listingId,
        requesterId: session.user.id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending swap request for this listing" },
        { status: 409 }
      );
    }

    const swapRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.swapRequest.create({
        data: {
          listingId,
          requesterId: session.user.id,
          offeredAppointmentId,
        },
        include: {
          requester: { select: { id: true, name: true } },
          offeredAppointment: { select: { date: true, timeSlot: true } },
        },
      });

      await tx.swapListing.update({
        where: { id: listingId },
        data: { status: "PENDING" },
      });

      await tx.notification.create({
        data: {
          userId: listing.userId,
          type: "SWAP_REQUEST_RECEIVED",
          title: "New Swap Request",
          message: `${session.user.name} wants to swap their ${format(offeredAppointment.date, "MMM d")} at ${formatTimeSlot(offeredAppointment.timeSlot)} appointment for yours on ${format(listing.appointment.date, "MMM d")} at ${formatTimeSlot(listing.appointment.timeSlot)}.`,
          data: { swapRequestId: request.id },
        },
      });

      return request;
    });

    try {
      await sendSwapRequestEmail({
        to: listing.user.email,
        toName: listing.user.name,
        requesterName: session.user.name,
        listedDate: listing.appointment.date,
        listedTime: formatTimeSlot(listing.appointment.timeSlot),
        offeredDate: offeredAppointment.date,
        offeredTime: formatTimeSlot(offeredAppointment.timeSlot),
        swapRequestId: swapRequest.id,
      });
    } catch {
      // Email failure is non-fatal; the swap request was created successfully
    }

    return NextResponse.json({ swapRequest }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
