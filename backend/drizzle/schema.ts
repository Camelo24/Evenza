import {
	pgTable,
	pgEnum,
	serial,
	uuid,
	varchar,
	text,
	json,
	boolean,
	integer,
	numeric,
	timestamp,
	primaryKey,
	unique,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["admin", "client", "service_provider"]);
export const organizerVerificationStatus = pgEnum("organizer_verification_status", ["not_requested", "pending", "approved", "rejected"]);
export const serviceProviderStatus = pgEnum("service_provider_status", ["not_requested", "pending", "approved", "rejected"]);
export const requestStatus = pgEnum("request_status", ["pending", "approved", "rejected"]);
export const bookingStatus = pgEnum("booking_status", [
	"pending_vendor_acceptance",
	"confirmed",
	"rejected",
	"in_progress",
	"awaiting_review",
	"completed",
	"disputed",
	"cancelled",
]);

export const paymentStatus = pgEnum("payment_status", ["initiated", "authorized", "failed", "refunded", "partially_refunded"]);
export const escrowStatus = pgEnum("escrow_status", ["held", "release_scheduled", "released", "disputed", "refunded", "split"]);
export const disputeStatus = pgEnum("dispute_status", ["open", "under_review", "resolved_vendor", "resolved_organiser", "resolved_split"]);
export const contractStatus = pgEnum("contract_status", ["pending", "partially_signed", "executed", "void"]);
export const evidenceType = pgEnum("evidence_type", ["photo", "video", "gps", "qr", "document"]);
export const eventVisibility = pgEnum("event_visibility", ["private", "public"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: varchar("full_name", { length: 140 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("client"),
  organizerVerificationStatus: organizerVerificationStatus("organizer_verification_status").default("not_requested").notNull(),
  serviceProviderStatus: serviceProviderStatus("service_provider_status").default("not_requested").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  mustChangePassword: boolean("must_change_password").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizerApplications = pgTable("organizer_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  businessName: varchar("business_name", { length: 180 }).notNull(),
  documentPath: text("document_path"),
  documentName: varchar("document_name", { length: 255 }),
  message: text("message"),
  status: organizerVerificationStatus("status").default("pending").notNull(),
  reviewedBy: uuid("reviewed_by"),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accessRequests = pgTable("access_requests", {
	id: uuid("id").defaultRandom().primaryKey(),
	fullName: varchar("full_name", { length: 140 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	desiredRole: varchar("desired_role", { length: 40 }).notNull(),
	message: text("message"),
	phone: varchar("phone", { length: 30 }),
	businessName: varchar("business_name", { length: 180 }),
	identityDocumentPath: text("identity_document_path"),
	identityDocumentName: varchar("identity_document_name", { length: 255 }),
	status: requestStatus("status").default("pending").notNull(),
	reviewedBy: uuid("reviewed_by"),
	reviewNote: text("review_note"),
	reviewedAt: timestamp("reviewed_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vendorProfiles = pgTable("vendor_profiles", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id").notNull(),
	businessName: varchar("business_name", { length: 180 }).notNull(),
	slug: varchar("slug", { length: 180 }).notNull(),
	tagline: varchar("tagline", { length: 240 }).notNull(),
	description: text("description").notNull(),
	city: varchar("city", { length: 90 }).notNull(),
	address: varchar("address", { length: 240 }).notNull(),
	latitude: numeric("latitude"),
	longitude: numeric("longitude"),
	rating: numeric("rating").default(sql`0`).notNull(),
	reviewCount: integer("review_count").default(0).notNull(),
	startingPrice: integer("starting_price").notNull(),
	verified: boolean("verified").default(false).notNull(),
	responseTime: varchar("response_time", { length: 80 }).default("Within 2 hours").notNull(),
	imageUrl: text("image_url").notNull(),
	coverUrl: text("cover_url").notNull(),
	completedEvents: integer("completed_events").default(0).notNull(),
	featured: boolean("featured").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	slug: varchar("slug", { length: 100 }).notNull(),
	icon: varchar("icon", { length: 50 }).notNull(),
});

export const vendorCategories = pgTable("vendor_categories", {
	vendorId: uuid("vendor_id").notNull(),
	categoryId: integer("category_id").notNull(),
});

export const services = pgTable("services", {
	id: uuid("id").defaultRandom().primaryKey(),
	vendorId: uuid("vendor_id").notNull(),
	name: varchar("name", { length: 160 }).notNull(),
	description: text("description").notNull(),
	price: integer("price").notNull(),
	durationHours: integer("duration_hours").default(4).notNull(),
	active: boolean("active").default(true).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vendorUnavailableDates = pgTable("vendor_unavailable_dates", {
	id: uuid("id").defaultRandom().primaryKey(),
	vendorId: uuid("vendor_id").notNull(),
	date: timestamp("date").notNull(),
	reason: varchar("reason", { length: 180 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
	id: uuid("id").defaultRandom().primaryKey(),
	organiserId: uuid("organiser_id").notNull(),
	title: varchar("title", { length: 180 }).notNull(),
	eventType: varchar("event_type", { length: 100 }).notNull(),
	description: text("description"),
	venue: varchar("venue", { length: 240 }).notNull(),
	city: varchar("city", { length: 90 }).notNull(),
	startsAt: timestamp("starts_at").notNull(),
	guestCount: integer("guest_count").notNull(),
	visibility: eventVisibility("visibility").default("private").notNull(),
	ticketPrice: integer("ticket_price"),
	coverUrl: text("cover_url"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventVendors = pgTable("event_vendors", {
	eventId: uuid("event_id").notNull(),
	vendorId: uuid("vendor_id").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
	id: uuid("id").defaultRandom().primaryKey(),
	reference: varchar("reference", { length: 30 }).notNull(),
	organiserId: uuid("organiser_id").notNull(),
	vendorId: uuid("vendor_id").notNull(),
	serviceId: uuid("service_id"),
	eventId: uuid("event_id"),
	eventType: varchar("event_type", { length: 100 }).notNull(),
	eventDate: timestamp("event_date").notNull(),
	venue: varchar("venue", { length: 240 }).notNull(),
	guestCount: integer("guest_count").notNull(),
	notes: text("notes"),
	totalAmount: integer("total_amount").notNull(),
	escrowMode: varchar("escrow_mode", { length: 20 }).default("full").notNull(),
	depositPercent: integer("deposit_percent").default(100).notNull(),
	fundedAmount: integer("funded_amount").notNull(),
	status: bookingStatus("status").default("pending_vendor_acceptance").notNull(),
	completionMarkedAt: timestamp("completion_marked_at"),
	reviewDeadline: timestamp("review_deadline"),
	reviewSubmitted: boolean("review_submitted").default(false).notNull(),
	termsSnapshot: json("terms_snapshot"),
	termsAcceptedAt: timestamp("terms_accepted_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contracts = pgTable("contracts", {
	id: uuid("id").defaultRandom().primaryKey(),
	bookingId: uuid("booking_id").notNull(),
	termsContent: json("terms_content").notNull(),
	organiserSignedAt: timestamp("organiser_signed_at"),
	vendorSignedAt: timestamp("vendor_signed_at"),
	status: contractStatus("status").default("pending").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
	id: uuid("id").defaultRandom().primaryKey(),
	bookingId: uuid("booking_id").notNull(),
	provider: varchar("provider", { length: 40 }).default("Campay").notNull(),
	providerReference: varchar("provider_reference", { length: 120 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 30 }).notNull(),
	amount: integer("amount").notNull(),
	currency: varchar("currency", { length: 3 }).default("XAF").notNull(),
	status: paymentStatus("status").default("initiated").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const escrowTransactions = pgTable("escrow_transactions", {
	id: uuid("id").defaultRandom().primaryKey(),
	bookingId: uuid("booking_id").notNull(),
	paymentId: uuid("payment_id").notNull(),
	amount: integer("amount").notNull(),
	status: escrowStatus("status").default("held").notNull(),
	releaseScheduledAt: timestamp("release_scheduled_at"),
	releasedAt: timestamp("released_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
	id: uuid("id").defaultRandom().primaryKey(),
	vendorId: uuid("vendor_id").notNull().unique(),
	balance: integer("balance").default(0).notNull(),
	currency: varchar("currency", { length: 3 }).default("XAF").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const walletTransactions = pgTable("wallet_transactions", {
	id: uuid("id").defaultRandom().primaryKey(),
	walletId: uuid("wallet_id").notNull(),
	bookingId: uuid("booking_id").notNull(),
	type: varchar("type", { length: 30 }).notNull(),
	amount: integer("amount").notNull(),
	balanceAfter: integer("balance_after").notNull(),
	description: text("description").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookingConversations = pgTable("booking_conversations", {
	id: uuid("id").defaultRandom().primaryKey(),
	bookingId: uuid("booking_id").notNull().unique(),
	organiserId: uuid("organiser_id").notNull(),
	vendorId: uuid("vendor_id").notNull(),
	unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export const bookingEvidence = pgTable("booking_evidence", {
	id: uuid("id").defaultRandom().primaryKey(),
	bookingId: uuid("booking_id").notNull(),
	uploadedBy: uuid("uploaded_by").notNull(),
	type: evidenceType("type").notNull(),
	url: text("url"),
	note: text("note"),
	latitude: numeric("latitude"),
	longitude: numeric("longitude"),
	capturedAt: timestamp("captured_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const disputes = pgTable("disputes", {
	id: uuid("id").defaultRandom().primaryKey(),
	bookingId: uuid("booking_id").notNull(),
	openedBy: uuid("opened_by").notNull(),
	reason: varchar("reason", { length: 180 }).notNull(),
	description: text("description").notNull(),
	status: disputeStatus("status").default("open").notNull(),
	resolutionNote: text("resolution_note"),
	vendorShare: integer("vendor_share"),
	organiserRefund: integer("organiser_refund"),
	resolvedBy: uuid("resolved_by"),
	resolvedAt: timestamp("resolved_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const disputeLogs = pgTable("dispute_logs", {
	id: uuid("id").defaultRandom().primaryKey(),
	disputeId: uuid("dispute_id").notNull(),
	actorId: uuid("actor_id").notNull(),
	action: varchar("action", { length: 100 }).notNull(),
	details: text("details").notNull(),
	evidenceUrl: text("evidence_url"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
	id: uuid("id").defaultRandom().primaryKey(),
	bookingId: uuid("booking_id").notNull(),
	senderId: uuid("sender_id").notNull(),
	body: text("body").notNull(),
	attachmentPath: text("attachment_path"),
	attachmentName: varchar("attachment_name", { length: 255 }),
	attachmentType: varchar("attachment_type", { length: 120 }),
	readAt: timestamp("read_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tickets = pgTable("tickets", {
	id: uuid("id").defaultRandom().primaryKey(),
	eventId: uuid("event_id").notNull(),
	attendeeId: uuid("attendee_id").notNull(),
	code: varchar("code", { length: 80 }).notNull(),
	quantity: integer("quantity").default(1).notNull(),
	amount: integer("amount").notNull(),
	checkedInAt: timestamp("checked_in_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
	id: uuid("id").defaultRandom().primaryKey(),
	bookingId: uuid("booking_id").notNull(),
	vendorId: uuid("vendor_id").notNull(),
	authorId: uuid("author_id").notNull(),
	rating: integer("rating").notNull(),
	comment: text("comment").notNull(),
	moderatedAt: timestamp("moderated_at"),
	moderatedBy: uuid("moderated_by"),
	isHidden: boolean("is_hidden").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id").notNull(),
	title: varchar("title", { length: 180 }).notNull(),
	body: text("body").notNull(),
	href: text("href"),
	read: boolean("read").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailLog = pgTable("email_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 240 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordSetupTokens = pgTable("password_setup_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schema = {
	users,
	accessRequests,
	vendorProfiles,
	categories,
	vendorCategories,
	services,
	vendorUnavailableDates,
	events,
	eventVendors,
	bookings,
	contracts,
	payments,
	escrowTransactions,
	wallets,
	walletTransactions,
	bookingConversations,
	bookingEvidence,
	disputes,
	disputeLogs,
	messages,
	tickets,
	reviews,
	notifications,
	emailLog,
	passwordSetupTokens,
};

export default schema;
