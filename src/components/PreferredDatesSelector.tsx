"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TIME_SLOTS } from "@/lib/constants";
import { PreferredDate } from "@/types";
import { format, parseISO, startOfDay, addDays } from "date-fns";

interface Props {
  value: PreferredDate[];
  onChange: (dates: PreferredDate[]) => void;
}

const today = startOfDay(new Date());
const maxDate = addDays(today, 90);

function toDateInputValue(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function PreferredDatesSelector({ value, onChange }: Props) {
  const [newDate, setNewDate] = useState("");
  const [newSlots, setNewSlots] = useState<string[]>([]);

  function addEntry() {
    if (!newDate) return;
    const already = value.find((v) => v.date === newDate);
    if (already) return;
    onChange([...value, { date: newDate, timeSlots: newSlots }]);
    setNewDate("");
    setNewSlots([]);
  }

  function removeEntry(date: string) {
    onChange(value.filter((v) => v.date !== date));
  }

  function toggleSlot(slot: string) {
    setNewSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  }

  return (
    <div className="space-y-3">
      {/* Existing entries */}
      {value.map((entry) => (
        <div
          key={entry.date}
          className="flex items-start justify-between bg-dark-800 rounded-lg px-3 py-2.5 gap-3"
        >
          <div>
            <p className="text-sm font-medium text-white">
              {format(parseISO(entry.date), "EEE, MMM d, yyyy")}
            </p>
            <p className="text-xs text-dark-400 mt-0.5">
              {entry.timeSlots.length === 0
                ? "Any time"
                : entry.timeSlots.join(", ")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeEntry(entry.date)}
            className="text-dark-500 hover:text-red-400 transition-colors mt-0.5"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      {/* Add new entry */}
      {value.length < 10 && (
        <div className="border border-dashed border-dark-700 rounded-lg p-3 space-y-3">
          <div>
            <label className="text-xs text-dark-400 mb-1 block">Date</label>
            <input
              type="date"
              value={newDate}
              min={toDateInputValue(addDays(today, 1))}
              max={toDateInputValue(maxDate)}
              onChange={(e) => setNewDate(e.target.value)}
              className="text-sm py-1.5"
            />
          </div>

          {newDate && (
            <div>
              <label className="text-xs text-dark-400 mb-2 block">
                Preferred times <span className="text-dark-600">(leave blank = any time)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      newSlots.includes(slot)
                        ? "bg-gold-500 text-dark-950"
                        : "bg-dark-800 text-dark-300 hover:bg-dark-700"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={addEntry}
            disabled={!newDate}
            className="flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} />
            Add date
          </button>
        </div>
      )}
    </div>
  );
}
