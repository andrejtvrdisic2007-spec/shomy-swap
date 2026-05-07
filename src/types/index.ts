import { AppointmentStatus, SwapListingStatus, SwapRequestStatus, NotificationType } from "@prisma/client";

export type { AppointmentStatus, SwapListingStatus, SwapRequestStatus, NotificationType };

export interface PreferredDate {
  date: string;
  timeSlots: string[];
}

export interface AppointmentWithListing {
  id: string;
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  createdAt: string;
  swapListing: {
    id: string;
    status: SwapListingStatus;
    preferredDates: PreferredDate[];
    message: string | null;
  } | null;
}

export interface SwapListingWithDetails {
  id: string;
  status: SwapListingStatus;
  preferredDates: PreferredDate[];
  message: string | null;
  createdAt: string;
  appointment: {
    id: string;
    date: string;
    timeSlot: string;
  };
  user: {
    id: string;
    name: string;
  };
  swapRequests: SwapRequestSummary[];
}

export interface SwapRequestSummary {
  id: string;
  status: SwapRequestStatus;
  createdAt: string;
  requester: {
    id: string;
    name: string;
  };
  offeredAppointment: {
    id: string;
    date: string;
    timeSlot: string;
  };
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, string> | null;
  createdAt: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  }
}

