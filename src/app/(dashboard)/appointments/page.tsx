"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Plus, Loader2, ArrowLeftRight, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { PreferredDatesSelector } from "@/components/PreferredDatesSelector";
import { TIME_SLOTS, formatTimeSlot } from "@/lib/constants";
import { AppointmentWithListing, PreferredDate } from "@/types";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Add appointment modal
  const [showAdd, setShowAdd] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addSlot, setAddSlot] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // List for swap modal
  const [listingAppt, setListingAppt] = useState<AppointmentWithListing | null>(null);
  const [preferredDates, setPreferredDates] = useState<PreferredDate[]>([]);
  const [message, setMessage] = useState("");
  const [listLoading, setListLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      setAppointments(data.appointments ?? []);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function handleAddAppointment() {
    if (!addDate || !addSlot) {
      toast.error("Please select a date and time");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: addDate, timeSlot: addSlot }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add appointment");
      } else {
        toast.success("Appointment added!");
        setShowAdd(false);
        setAddDate("");
        setAddSlot("");
        fetchAppointments();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeleteAppointment(id: string) {
    if (!confirm("Remove this appointment?")) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to remove");
      } else {
        toast.success("Appointment removed");
        fetchAppointments();
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleCreateListing() {
    if (!listingAppt) return;
    if (preferredDates.length === 0) {
      toast.error("Add at least one preferred date");
      return;
    }
    setListLoading(true);
    try {
      const res = await fetch("/api/swap-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: listingAppt.id,
          preferredDates,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to list appointment");
      } else {
        toast.success("Appointment listed for swap!");
        setListingAppt(null);
        setPreferredDates([]);
        setMessage("");
        fetchAppointments();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setListLoading(false);
    }
  }

  async function handleCancelListing(listingId: string) {
    if (!confirm("Cancel this swap listing?")) return;
    try {
      const res = await fetch(`/api/swap-listings/${listingId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to cancel listing");
      } else {
        toast.success("Listing cancelled");
        fetchAppointments();
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const maxDate = format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Appointments</h1>
          <p className="text-dark-400 mt-1 text-sm">
            Register your appointments from the booking site here
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} />
          Add
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-gold-500" size={30} />
        </div>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-14">
          <CalendarDays className="mx-auto text-dark-600 mb-3" size={36} />
          <p className="text-dark-300 font-medium">No appointments yet</p>
          <p className="text-dark-500 text-sm mt-1">
            Add your appointments from the booking site to get started
          </p>
          <button onClick={() => setShowAdd(true)} className="btn-primary mt-5 text-sm">
            <Plus size={15} />
            Add Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => {
            const isPast = new Date(appt.date) < new Date();
            return (
              <div key={appt.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">
                        {format(parseISO(appt.date), "EEEE, MMMM d, yyyy")}
                      </p>
                      {appt.status === "LISTED" && (
                        <span className="badge-gold">Listed for swap</span>
                      )}
                      {appt.status === "ACTIVE" && !isPast && (
                        <span className="badge-green">Confirmed</span>
                      )}
                      {appt.status === "SWAPPED" && (
                        <span className="badge-gray">Swapped</span>
                      )}
                      {isPast && appt.status === "ACTIVE" && (
                        <span className="badge-gray">Past</span>
                      )}
                    </div>
                    <p className="text-dark-400 text-sm mt-1">
                      {formatTimeSlot(appt.timeSlot)}
                    </p>

                    {appt.swapListing && (
                      <div className="mt-3 bg-dark-800 rounded-lg px-3 py-2.5">
                        <p className="text-xs text-dark-400 mb-1">Preferred swap dates:</p>
                        {(appt.swapListing.preferredDates as PreferredDate[]).map((pd) => (
                          <p key={pd.date} className="text-xs text-dark-300">
                            {format(parseISO(pd.date), "MMM d")}
                            {pd.timeSlots.length > 0
                              ? ` — ${pd.timeSlots.join(", ")}`
                              : " — any time"}
                          </p>
                        ))}
                        {appt.swapListing.message && (
                          <p className="text-xs text-dark-400 mt-1.5 italic">
                            &ldquo;{appt.swapListing.message}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {appt.status === "ACTIVE" && !isPast && (
                      <button
                        onClick={() => {
                          setListingAppt(appt);
                          setPreferredDates([]);
                          setMessage("");
                        }}
                        className="btn-secondary text-xs px-3 py-1.5"
                        title="List for swap"
                      >
                        <ArrowLeftRight size={13} />
                        List for swap
                      </button>
                    )}
                    {appt.status === "LISTED" && appt.swapListing && (
                      <button
                        onClick={() => handleCancelListing(appt.swapListing!.id)}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        <X size={13} />
                        Cancel listing
                      </button>
                    )}
                    {appt.status !== "SWAPPED" && (
                      <button
                        onClick={() => handleDeleteAppointment(appt.id)}
                        className="p-2 text-dark-500 hover:text-red-400 rounded-lg hover:bg-dark-800 transition-colors"
                        title="Remove appointment"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Appointment Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Appointment">
        <div className="space-y-4">
          <div>
            <label>Date</label>
            <input
              type="date"
              value={addDate}
              min={today}
              max={maxDate}
              onChange={(e) => setAddDate(e.target.value)}
            />
          </div>
          <div>
            <label>Time Slot</label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setAddSlot(slot)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    addSlot === slot
                      ? "bg-gold-500 text-dark-950"
                      : "bg-dark-800 text-dark-300 hover:bg-dark-700"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAddAppointment}
            disabled={addLoading || !addDate || !addSlot}
            className="btn-primary w-full mt-2"
          >
            {addLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {addLoading ? "Adding…" : "Add Appointment"}
          </button>
        </div>
      </Modal>

      {/* List for Swap Modal */}
      <Modal
        open={!!listingAppt}
        onClose={() => setListingAppt(null)}
        title="List Appointment for Swap"
        maxWidth="max-w-xl"
      >
        {listingAppt && (
          <div className="space-y-5">
            <div className="bg-dark-800 rounded-lg px-4 py-3">
              <p className="text-xs text-dark-400 mb-1">Your appointment to swap away</p>
              <p className="font-semibold text-white">
                {format(parseISO(listingAppt.date), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-dark-400 text-sm">{formatTimeSlot(listingAppt.timeSlot)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-dark-300 mb-2 block">
                Preferred alternative dates *
              </label>
              <PreferredDatesSelector
                value={preferredDates}
                onChange={setPreferredDates}
              />
            </div>

            <div>
              <label>Note (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any additional info for potential swappers…"
                rows={2}
                maxLength={300}
                className="resize-none"
              />
            </div>

            <button
              onClick={handleCreateListing}
              disabled={listLoading || preferredDates.length === 0}
              className="btn-primary w-full"
            >
              {listLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {listLoading ? "Listing…" : "Post to Swap Board"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
