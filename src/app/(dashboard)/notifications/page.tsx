"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import {
  Bell,
  Loader2,
  CheckCheck,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  PartyPopper,
} from "lucide-react";
import toast from "react-hot-toast";
import { NotificationItem } from "@/types";
import { formatTimeSlot } from "@/lib/constants";

interface SwapRequestDetail {
  id: string;
  status: string;
  requester: { id: string; name: string };
  offeredAppointment: { id: string; date: string; timeSlot: string };
  listing: {
    id: string;
    appointment: { id: string; date: string; timeSlot: string };
    user: { id: string; name: string };
  };
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "SWAP_REQUEST_RECEIVED") return <ArrowLeftRight className="text-gold-400" size={18} />;
  if (type === "SWAP_REQUEST_ACCEPTED" || type === "SWAP_COMPLETED") return <PartyPopper className="text-green-400" size={18} />;
  if (type === "SWAP_REQUEST_REJECTED") return <XCircle className="text-red-400" size={18} />;
  return <Bell className="text-dark-400" size={18} />;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<SwapRequestDetail[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [notifRes, requestsRes] = await Promise.all([
        fetch("/api/notifications"),
        fetch("/api/swap-requests/incoming"),
      ]);
      const [notifData, requestsData] = await Promise.all([
        notifRes.json(),
        requestsRes.ok ? requestsRes.json() : { requests: [] },
      ]);
      setNotifications(notifData.notifications ?? []);
      setPendingRequests(requestsData.requests ?? []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    markAllRead();
  }, [fetchData]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read", { method: "POST" });
    } catch {
      // silent
    }
  }

  async function handleAccept(requestId: string) {
    setActionLoading(requestId + "-accept");
    try {
      const res = await fetch(`/api/swap-requests/${requestId}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to accept swap");
      } else {
        toast.success("Swap accepted! Both appointments have been updated.");
        fetchData();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(requestId: string) {
    setActionLoading(requestId + "-reject");
    try {
      const res = await fetch(`/api/swap-requests/${requestId}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to reject swap");
      } else {
        toast.success("Swap request declined.");
        fetchData();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-dark-400 mt-1 text-sm">Stay up to date on your swap requests</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <button onClick={markAllRead} className="btn-secondary text-sm px-3 py-1.5">
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Pending swap requests requiring action */}
      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-3">
            Pending Requests
            <span className="ml-2 badge-gold">{pendingRequests.length}</span>
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="card border-gold-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowLeftRight className="text-gold-500" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">
                      {req.requester.name} wants to swap
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="bg-dark-800 rounded-lg p-2.5">
                        <p className="text-xs text-dark-500 mb-1">You give up</p>
                        <p className="text-sm font-medium text-white">
                          {format(parseISO(req.listing.appointment.date), "MMM d")}
                        </p>
                        <p className="text-xs text-dark-400">
                          {formatTimeSlot(req.listing.appointment.timeSlot)}
                        </p>
                      </div>
                      <div className="bg-dark-800 rounded-lg p-2.5">
                        <p className="text-xs text-dark-500 mb-1">You receive</p>
                        <p className="text-sm font-medium text-white">
                          {format(parseISO(req.offeredAppointment.date), "MMM d")}
                        </p>
                        <p className="text-xs text-dark-400">
                          {formatTimeSlot(req.offeredAppointment.timeSlot)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAccept(req.id)}
                        disabled={actionLoading !== null}
                        className="btn-primary flex-1 text-sm py-2"
                      >
                        {actionLoading === req.id + "-accept" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={actionLoading !== null}
                        className="btn-danger flex-1 text-sm py-2"
                      >
                        {actionLoading === req.id + "-reject" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <XCircle size={14} />
                        )}
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification history */}
      <div>
        {pendingRequests.length > 0 && (
          <h2 className="text-base font-semibold text-white mb-3">History</h2>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-gold-500" size={30} />
          </div>
        ) : notifications.length === 0 && pendingRequests.length === 0 ? (
          <div className="card text-center py-14">
            <Bell className="mx-auto text-dark-600 mb-3" size={36} />
            <p className="text-dark-300 font-medium">No notifications yet</p>
            <p className="text-dark-500 text-sm mt-1">
              You&apos;ll be notified when someone requests or responds to a swap
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-colors ${
                  n.read
                    ? "bg-dark-900 border-dark-800"
                    : "bg-dark-800 border-dark-700"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <NotificationIcon type={n.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${n.read ? "text-dark-300" : "text-white"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-dark-400 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-dark-600 mt-1.5">
                    {format(parseISO(n.createdAt), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
