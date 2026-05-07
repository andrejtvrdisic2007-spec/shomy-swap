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

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: { swapListing: true },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  if (appointment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (appointment.status === "SWAPPED") {
    return NextResponse.json(
      { error: "Cannot delete a swapped appointment" },
      { status: 400 }
    );
  }

  if (appointment.swapListing?.status === "PENDING") {
    return NextResponse.json(
      { error: "Cannot delete an appointment with a pending swap request" },
      { status: 400 }
    );
  }

  await prisma.appointment.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ success: true });
}
