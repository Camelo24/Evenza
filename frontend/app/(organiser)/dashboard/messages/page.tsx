import { DashboardShell } from "@/shared/components/dashboard-shell";
import { MessagingPanel, type Conversation } from "@/shared/components/messaging-panel";
import { getOrganiserDashboard } from "@backend/bookings/queries";
import { requireRole } from "@backend/auth/session";

export const dynamic = "force-dynamic";

export default async function OrganiserMessagesPage() {
  const session = await requireRole("organiser");
  const data = await getOrganiserDashboard(session.userId);
  const conversations: Conversation[] = data.bookings.filter(({ booking }) => ["confirmed", "in_progress", "awaiting_review", "disputed"].includes(booking.status)).map(({ booking, vendor, service }) => ({ bookingId: booking.id, reference: booking.reference, title: vendor.businessName, subtitle: service?.name ?? booking.eventType, status: booking.status, messages: data.messages.filter(({ message }) => message.bookingId === booking.id) }));
  return <DashboardShell role="organiser" name={session.fullName} active="Messages" allowViewSwitch={true}><p className="eyebrow text-berry">Booking conversations</p><h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Messages.</h1><p className="mt-3 text-sm text-ink/50">Coordinate each confirmed booking in one private conversation.</p><MessagingPanel conversations={conversations} currentUserId={session.userId}/></DashboardShell>;
}
