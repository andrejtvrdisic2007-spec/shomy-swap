import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.swapRequest.findMany({
    where: {
      status: "PENDING",
      listing: {
        userId: session.user.id,
      },
    },
    include: {
      requester: { select: { id: true, name: true } },
      offeredAppointment: { select: { id: true, date: true, timeSlot: true } },
      listing: {
        include: {
          appointment: { select: { id: true, date: true, timeSlot: true } },
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ requests });
}
