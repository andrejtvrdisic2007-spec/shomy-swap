import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAppointmentSchema } from "@/lib/validations";
import { TIME_SLOTS } from "@/lib/constants";
import { parseISO, startOfDay, addDays, isBefore, isAfter } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      userId: session.user.id,
      status: { not: "CANCELLED" },
    },
    include: {
      swapListing: {
        select: {
          id: true,
          status: true,
          preferredDates: true,
          message: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
  });

  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = createAppointmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { date: dateStr, timeSlot } = result.data;

    if (!TIME_SLOTS.includes(timeSlot as never)) {
      return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });
    }

    const appointmentDate = parseISO(dateStr);
    const today = startOfDay(new Date());
    const maxDate = addDays(today, 90);

    if (isBefore(appointmentDate, today)) {
      return NextResponse.json(
        { error: "Appointment date must be in the future" },
        { status: 400 }
      );
    }

    if (isAfter(appointmentDate, maxDate)) {
      return NextResponse.json(
        { error: "Appointment date is too far in the future" },
        { status: 400 }
      );
    }

    const conflictingSlot = await prisma.appointment.findUnique({
      where: {
        date_timeSlot: {
          date: appointmentDate,
          timeSlot,
        },
      },
    });

    if (conflictingSlot) {
      return NextResponse.json(
        { error: "This time slot is already taken by another client" },
        { status: 409 }
      );
    }

    const userConflict = await prisma.appointment.findFirst({
      where: {
        userId: session.user.id,
        date: appointmentDate,
        status: { not: "CANCELLED" },
      },
    });

    if (userConflict) {
      return NextResponse.json(
        { error: "You already have an appointment on this date" },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: session.user.id,
        date: appointmentDate,
        timeSlot,
      },
      include: {
        swapListing: true,
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
