import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSwapListingSchema } from "@/lib/validations";
import { startOfDay } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = startOfDay(new Date());

  const listings = await prisma.swapListing.findMany({
    where: {
      status: "OPEN",
      userId: { not: session.user.id },
      appointment: {
        date: { gte: today },
        status: "LISTED",
      },
    },
    include: {
      appointment: {
        select: { id: true, date: true, timeSlot: true },
      },
      user: {
        select: { id: true, name: true },
      },
      swapRequests: {
        where: { status: { in: ["PENDING"] } },
        select: {
          id: true,
          status: true,
          requesterId: true,
          createdAt: true,
          requester: { select: { id: true, name: true } },
          offeredAppointment: { select: { id: true, date: true, timeSlot: true } },
        },
      },
    },
    orderBy: { appointment: { date: "asc" } },
  });

  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = createSwapListingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { appointmentId, preferredDates, message } = result.data;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { swapListing: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appointment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (appointment.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Only active appointments can be listed for swap" },
        { status: 400 }
      );
    }

    if (new Date(appointment.date) < startOfDay(new Date())) {
      return NextResponse.json(
        { error: "Cannot list a past appointment for swap" },
        { status: 400 }
      );
    }

    if (appointment.swapListing) {
      return NextResponse.json(
        { error: "This appointment is already listed for swap" },
        { status: 409 }
      );
    }

    const [listing] = await prisma.$transaction([
      prisma.swapListing.create({
        data: {
          appointmentId,
          userId: session.user.id,
          preferredDates,
          message: message ?? null,
        },
        include: {
          appointment: { select: { id: true, date: true, timeSlot: true } },
          user: { select: { id: true, name: true } },
          swapRequests: true,
        },
      }),
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "LISTED" },
      }),
    ]);

    return NextResponse.json({ listing }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
