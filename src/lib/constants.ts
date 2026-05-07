export const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export const SWAP_WINDOW_DAYS = 20;

export const SHOP_NAME =
  process.env.NEXT_PUBLIC_SHOP_NAME ?? "Barber Shop";

export function formatTimeSlot(slot: string): string {
  const [hours, minutes] = slot.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}
