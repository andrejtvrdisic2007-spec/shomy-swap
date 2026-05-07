import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSwapRejectedEmail } from "@/lib/email";
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
            user: { select: { id: true, name: true } },
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

    if (swapRequest.listing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (swapRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This swap request is no longer pending" },
        { status: 409 }
      );
    }

    const otherPendingCount = await prisma.swapRequest.count({
      where: {
        listingId: swapRequest.listingId,
        id: { not: params.id },
        status: "PENDING",
      },
    });

    await prisma.$transaction([
      prisma.swapRequest.update({
        where: { id: params.id },
        data: { status: "REJECTED" },
      }),
      // Re-open listing only if no other pending requests remain
      ...(otherPendingCount === 0
        ? [
            prisma.swapListing.update({
              where: { id: swapRequest.listingId },
              data: { status: "OPEN" },
            }),
          ]
        : []),
      prisma.notification.create({
        data: {
          userId: swapRequest.requesterId,
          type: "SWAP_REQUEST_REJECTED",
          title: "Swap Request Declined",
          message: `${session.user.name} declined your swap request for the ${formatTimeSlot(swapRequest.offeredAppointment.timeSlot)} slot.`,
          data: { swapRequestId: params.id },
        },
      }),
    ]);

    try {
      await sendSwapRejectedEmail({
        to: swapRequest.requester.email,
        toName: swapRequest.requester.name,
        listingOwnerName: session.user.name,
        offeredDate: swapRequest.offeredAppointment.date,
        offeredTime: formatTimeSlot(swapRequest.offeredAppointment.timeSlot),
      });
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
