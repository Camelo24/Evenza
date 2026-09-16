export type Role = "admin" | "client" | "service_provider" | (string & {});
export type BookingStatus =
  | "pending_vendor_acceptance"
  | "confirmed"
  | "rejected"
  | "in_progress"
  | "awaiting_review"
  | "completed"
  | "disputed"
  | "cancelled";
export type EscrowStatus = "held" | "release_scheduled" | "released" | "disputed" | "refunded" | "split";
