import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CalendarDays, ArrowLeftRight, Bell, ChevronRight } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { formatTimeSlot } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const today = startOfDay(new Date());

  const [upcomingAppointments, openListings, unreadCount, pendingRequestsCount] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          userId,
          status: { in: ["ACTIVE", "LISTED"] },
          date: { gte: today },
        },
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
        take: 3,
        include: { swapListing: { select: { status: true } } },
      }),
      prisma.swapListing.count({
        where: {
          status: "OPEN",
          userId: { not: userId },
          appointment: { date: { gte: today }, status: "LISTED" },
        },
      }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
      prisma.swapRequest.count({
        where: {
          listing: { userId },
          status: "PENDING",
        },
      }),
    ]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {session!.user.name.split(" ")[0]}
        </h1>
        <p className="text-dark-400 mt-1">Here&apos;s what&apos;s happening with your appointments.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/appointments" className="card hover:border-dark-700 transition-colors group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-dark-400 text-sm">Upcoming Appointments</p>
              <p className="text-3xl font-bold text-white mt-1">
                {upcomingAppointments.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center">
              <CalendarDays className="text-gold-500" size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-dark-500 mt-3 group-hover:text-dark-400 transition-colors">
            Manage appointments <ChevronRight size={12} />
          </div>
        </Link>

        <Link href="/swap-board" className="card hover:border-dark-700 transition-colors group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-dark-400 text-sm">Available Swaps</p>
              <p className="text-3xl font-bold text-white mt-1">{openListings}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center">
              <ArrowLeftRight className="text-gold-500" size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-dark-500 mt-3 group-hover:text-dark-400 transition-colors">
            Browse swap board <ChevronRight size={12} />
          </div>
        </Link>

        <Link href="/notifications" className="card hover:border-dark-700 transition-colors group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-dark-400 text-sm">Notifications</p>
              <p className="text-3xl font-bold text-white mt-1">{unreadCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center">
              <Bell className="text-gold-500" size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-dark-500 mt-3 group-hover:text-dark-400 transition-colors">
            {pendingRequestsCount > 0
              ? `${pendingRequestsCount} pending swap request${pendingRequestsCount > 1 ? "s" : ""}`
              : "No pending requests"}
            <ChevronRight size={12} />
          </div>
        </Link>
      </div>

      {/* Upcoming appointments preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Upcoming Appointments</h2>
          <Link href="/appointments" className="text-sm text-gold-400 hover:text-gold-300 font-medium">
            View all
          </Link>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="card text-center py-10">
            <CalendarDays className="mx-auto text-dark-600 mb-3" size={32} />
            <p className="text-dark-400">No upcoming appointments.</p>
            <Link href="/appointments" className="btn-primary mt-4 inline-flex text-sm px-5 py-2">
              Add Appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((appt) => (
              <div key={appt.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">
                    {format(appt.date, "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-dark-400 text-sm mt-0.5">
                    {formatTimeSlot(appt.timeSlot)}
                  </p>
                </div>
                <div>
                  {appt.status === "LISTED" && (
                    <span className="badge-gold">Listed for swap</span>
                  )}
                  {appt.status === "ACTIVE" && (
                    <span className="badge-green">Confirmed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
