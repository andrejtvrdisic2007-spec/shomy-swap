import { z } from "zod";
import { TIME_SLOTS } from "./constants";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .trim(),
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

const timeSlotEnum = z.enum(TIME_SLOTS);

export const createAppointmentSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  timeSlot: timeSlotEnum,
});

export const preferredDateSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  timeSlots: z.array(timeSlotEnum),
});

export const createSwapListingSchema = z.object({
  appointmentId: z.string().cuid("Invalid appointment ID"),
  preferredDates: z
    .array(preferredDateSchema)
    .min(1, "Select at least one preferred date")
    .max(10, "Too many preferred dates"),
  message: z.string().max(300, "Message is too long").optional(),
});

export const createSwapRequestSchema = z.object({
  listingId: z.string().cuid("Invalid listing ID"),
  offeredAppointmentId: z.string().cuid("Invalid appointment ID"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CreateSwapListingInput = z.infer<typeof createSwapListingSchema>;
export type CreateSwapRequestInput = z.infer<typeof createSwapRequestSchema>;
export type PreferredDate = z.infer<typeof preferredDateSchema>;
