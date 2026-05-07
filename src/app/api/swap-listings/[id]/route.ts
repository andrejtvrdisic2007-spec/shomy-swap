import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listing = await prisma.swapListing.findUnique({
    where: { id: params.id },
    include: {
      swapRequests: { where: { status: "PENDING" } },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (listing.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Cannot cancel a completed swap listing" },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.swapRequest.updateMany({
      where: { listingId: params.id, status: "PENDING" },
      data: { status: "CANCELLED" },
    }),
    prisma.swapListing.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    }),
    prisma.appointment.update({
      where: { id: listing.appointmentId },
      data: { status: "ACTIVE" },
    }),
  ]);

  return NextResponse.json({ success: true });
}
