"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import {
  ArrowLeftRight,
  Loader2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { formatTimeSlot } from "@/lib/constants";
import { SwapListingWithDetails, AppointmentWithListing, PreferredDate } from "@/types";
import { useSession } from "next-auth/react";

function matchesPreferences(
  apptDate: string,
  apptSlot: string,
  preferred: PreferredDate[]
): boolean {
  return preferred.some((p) => {
    if (p.date !== apptDate) return false;
    if (p.timeSlots.length === 0) return true;
    return p.timeSlots.includes(apptSlot);
  });
}

export default function SwapBoardPage() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<SwapListingWithDetails[]>([]);
  const [myAppointments, setMyAppointments] = useState<AppointmentWithListing[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedListing, setSelectedListing] = useState<SwapListingWithDetails | null>(null);
  const [offeredApptId, setOfferedApptId] = useState("");
  const [swapLoading, setSwapLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [listingsRes, apptsRes] = await Promise.all([
        fetch("/api/swap-listings"),
        fetch("/api/appointments"),
      ]);
      const [listingsData, apptsData] = await Promise.all([
        listingsRes.json(),
        apptsRes.json(),
      ]);
      setListings(listingsData.listings ?? []);
      setMyAppointments(
        (apptsData.appointments ?? []).filter(
          (a: AppointmentWithListing) => a.status === "ACTIVE"
        )
      );
    } catch {
      toast.error("Failed to load swap board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRequestSwap() {
    if (!selectedListing || !offeredApptId) {
      toast.error("Please select an appointment to offer");
      return;
    }
    setSwapLoading(true);
    try {
      const res = await fetch("/api/swap-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selectedListing.id,
          offeredAppointmentId: offeredApptId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send swap request");
      } else {
        toast.success("Swap request sent! You'll be notified when they respond.");
        setSelectedListing(null);
        setOfferedApptId("");
        fetchData();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSwapLoading(false);
    }
  }

  const eligibleAppointments = selectedListing
    ? myAppointments.filter((a) => {
        const apptDate = format(parseISO(a.date), "yyyy-MM-dd");
        return matchesPreferences(
          apptDate,
          a.timeSlot,
          selectedListing.preferredDates as PreferredDate[]
        );
      })
    : [];

  const nonMatchingAppointments = selectedListing
    ? myAppointments.filter((a) => {
        const apptDate = format(parseISO(a.date), "yyyy-MM-dd");
        return !matchesPreferences(
          apptDate,
          a.timeSlot,
          selectedListing.preferredDates as PreferredDate[]
        );
      })
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Swap Board</h1>
        <p className="text-dark-400 mt-1 text-sm">
          Browse available appointments listed for swap
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-gold-500" size={30} />
        </div>
      ) : listings.length === 0 ? (
        <div className="card text-center py-14">
          <ArrowLeftRight className="mx-auto text-dark-600 mb-3" size={36} />
          <p className="text-dark-300 font-medium">No swaps available right now</p>
          <p className="text-dark-500 text-sm mt-1">
            Check back later, or list your own appointment to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((listing) => {
            const apptDate = format(parseISO(listing.appointment.date), "yyyy-MM-dd");
            const hasMatch = myAppointments.some((a) => {
              const d = format(parseISO(a.date), "yyyy-MM-dd");
              return matchesPreferences(d, a.timeSlot, listing.preferredDates as PreferredDate[]);
            });
            const isPending = listing.status === "PENDING";
            const alreadyRequested = listing.swapRequests.some(
              (r) => r.requester.id === session?.user.id
            );

            return (
              <div key={listing.id} className="card space-y-4">
                {/* Appointment being offered */}
                <div>
                  <p className="text-xs text-dark-500 uppercase tracking-wide font-medium mb-2">
                    Appointment available
                  </p>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center flex-shrink-0">
                      <Calendar className="text-gold-500" size={17} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {format(parseISO(listing.appointment.date), "EEE, MMM d, yyyy")}
                      </p>
                      <p className="text-dark-400 text-sm flex items-center gap-1 mt-0.5">
                        <Clock size={12} />
                        {formatTimeSlot(listing.appointment.timeSlot)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Listed by */}
                <div className="flex items-center gap-2 text-sm text-dark-400">
                  <User size={13} />
                  <span>Listed by <span className="text-dark-200">{listing.user.name}</span></span>
                  {hasMatch && (
                    <span className="ml-auto badge-gold">
                      <CheckCircle2 size={11} />
                      Matches your dates
                    </span>
                  )}
                </div>

                {/* Preferred dates */}
                <div>
                  <p className="text-xs text-dark-500 uppercase tracking-wide font-medium mb-2">
                    They want
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(listing.preferredDates as PreferredDate[]).map((pd) => (
                      <span
                        key={pd.date}
                        className="inline-block bg-dark-800 text-dark-300 text-xs px-2.5 py-1 rounded-md"
                      >
                        {format(parseISO(pd.date), "MMM d")}
                        {pd.timeSlots.length > 0 ? ` · ${pd.timeSlots.join(", ")}` : ""}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Message */}
                {listing.message && (
                  <p className="text-sm text-dark-400 italic border-l-2 border-dark-700 pl-3">
                    &ldquo;{listing.message}&rdquo;
                  </p>
                )}

                {/* Action */}
                <div>
                  {alreadyRequested ? (
                    <div className="flex items-center gap-2 text-sm text-gold-400 bg-gold-500/10 border border-gold-500/20 rounded-lg px-3 py-2">
                      <CheckCircle2 size={15} />
                      Swap request sent — awaiting response
                    </div>
                  ) : isPending ? (
                    <div className="flex items-center gap-2 text-sm text-dark-400 bg-dark-800 rounded-lg px-3 py-2">
                      <Info size={15} />
                      A swap request is being reviewed
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedListing(listing);
                        setOfferedApptId("");
                      }}
                      disabled={myAppointments.length === 0}
                      className="btn-primary w-full"
                    >
                      <ArrowLeftRight size={15} />
                      Request Swap
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Swap Request Modal */}
      <Modal
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        title="Request a Swap"
        maxWidth="max-w-xl"
      >
        {selectedListing && (
          <div className="space-y-5">
            <div className="bg-dark-800 rounded-lg px-4 py-3">
              <p className="text-xs text-dark-400 mb-1">You will receive</p>
              <p className="font-semibold text-white">
                {format(parseISO(selectedListing.appointment.date), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-dark-400 text-sm">
                {formatTimeSlot(selectedListing.appointment.timeSlot)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-dark-300 mb-3">
                Choose your appointment to offer in exchange
              </p>

              {myAppointments.length === 0 ? (
                <p className="text-dark-400 text-sm bg-dark-800 rounded-lg p-3">
                  You have no active appointments to offer. Add one first.
                </p>
              ) : (
                <>
                  {eligibleAppointments.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gold-400 mb-2 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Matches their preferred dates
                      </p>
                      <div className="space-y-2">
                        {eligibleAppointments.map((appt) => (
                          <label
                            key={appt.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              offeredApptId === appt.id
                                ? "border-gold-500 bg-gold-500/10"
                                : "border-dark-700 bg-dark-800 hover:border-dark-600"
                            }`}
                          >
                            <input
                              type="radio"
                              name="offeredAppt"
                              value={appt.id}
                              checked={offeredApptId === appt.id}
                              onChange={() => setOfferedApptId(appt.id)}
                              className="w-auto border-none p-0 m-0 accent-yellow-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {format(parseISO(appt.date), "EEE, MMM d, yyyy")}
                              </p>
                              <p className="text-xs text-dark-400">
                                {formatTimeSlot(appt.timeSlot)}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {nonMatchingAppointments.length > 0 && (
                    <div>
                      {eligibleAppointments.length > 0 && (
                        <p className="text-xs text-dark-500 mb-2">Other appointments</p>
                      )}
                      <div className="space-y-2 opacity-70">
                        {nonMatchingAppointments.map((appt) => (
                          <label
                            key={appt.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              offeredApptId === appt.id
                                ? "border-gold-500 bg-gold-500/10"
                                : "border-dark-700 bg-dark-800 hover:border-dark-600"
                            }`}
                          >
                            <input
                              type="radio"
                              name="offeredAppt"
                              value={appt.id}
                              checked={offeredApptId === appt.id}
                              onChange={() => setOfferedApptId(appt.id)}
                              className="w-auto border-none p-0 m-0 accent-yellow-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {format(parseISO(appt.date), "EEE, MMM d, yyyy")}
                              </p>
                              <p className="text-xs text-dark-400">
                                {formatTimeSlot(appt.timeSlot)}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedListing(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestSwap}
                disabled={swapLoading || !offeredApptId}
                className="btn-primary flex-1"
              >
                {swapLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {swapLoading ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
