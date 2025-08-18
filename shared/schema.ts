import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum('role', ['ADMIN', 'AGENT', 'APPROVER', 'REQUESTER', 'AUDITOR']);
export const priorityEnum = pgEnum('priority', ['P1', 'P2', 'P3', 'P4', 'P5']);
export const ticketStatusEnum = pgEnum('ticket_status', [
  'NEW', 'TRIAGE', 'IN_PROGRESS', 'WAITING_CUSTOMER',
  'WAITING_APPROVAL', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'CANCELED'
]);
export const commentVisibilityEnum = pgEnum('comment_visibility', ['PUBLIC', 'INTERNAL']);
export const approvalStatusEnum = pgEnum('approval_status', ['PENDING', 'APPROVED', 'REJECTED']);
export const articleStatusEnum = pgEnum('article_status', ['DRAFT', 'REVIEW', 'PUBLISHED']);
export const notificationChannelEnum = pgEnum('notification_channel', ['EMAIL', 'WEBHOOK']);
export const slaClockTypeEnum = pgEnum('sla_clock_type', ['FIRST_RESPONSE', 'RESOLUTION']);

// Organizations
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Departments
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teams
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  departmentId: varchar("department_id").references(() => departments.id),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  mfaSecret: text("mfa_secret"),
  locale: text("locale").default("pt-BR"),
  timeZone: text("time_zone").default("America/Sao_Paulo"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Memberships (User-Team-Role relationships)
export const memberships = pgTable("memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  roles: roleEnum("roles").array().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service Catalog
export const serviceCatalog = pgTable("service_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  defaultPriority: priorityEnum("default_priority").default("P3"),
  requiresApproval: boolean("requires_approval").default(false),
  formJson: jsonb("form_json"), // Dynamic form definition
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tickets
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  code: text("code").notNull().unique(), // SD-2024-0001
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  assigneeId: varchar("assignee_id").references(() => users.id),
  teamId: varchar("team_id").references(() => teams.id),
  catalogId: varchar("catalog_id").references(() => serviceCatalog.id),
  priority: priorityEnum("priority").notNull(),
  status: ticketStatusEnum("status").default("NEW"),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  customFieldsJson: jsonb("custom_fields_json"),
  dueAt: timestamp("due_at"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket Events (Timeline/Audit)
export const ticketEvents = pgTable("ticket_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id).notNull(),
  actorId: varchar("actor_id").references(() => users.id),
  eventType: text("event_type").notNull(), // CREATED, ASSIGNED, STATUS_CHANGED, etc.
  oldValue: text("old_value"),
  newValue: text("new_value"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket Comments
export const ticketComments = pgTable("ticket_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  visibility: commentVisibilityEnum("visibility").default("PUBLIC"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attachments
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  commentId: varchar("comment_id").references(() => ticketComments.id),
  key: text("key").notNull(), // S3 key or file path
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  contentType: text("content_type").notNull(),
  uploaderId: varchar("uploader_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// SLA definitions
export const sla = pgTable("sla", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  appliesToJson: jsonb("applies_to_json"), // Conditions for when this SLA applies
  firstResponseMins: integer("first_response_mins").notNull(),
  resolutionMins: integer("resolution_mins").notNull(),
  calendarJson: jsonb("calendar_json"), // Business hours and holidays
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// SLA Clock tracking
export const slaClock = pgTable("sla_clock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id).notNull(),
  slaId: varchar("sla_id").references(() => sla.id).notNull(),
  type: slaClockTypeEnum("type").notNull(),
  startedAt: timestamp("started_at").notNull(),
  pausedAt: timestamp("paused_at"),
  stoppedAt: timestamp("stopped_at"),
  dueAt: timestamp("due_at").notNull(),
  breachedAt: timestamp("breached_at"),
});

// Automation Rules
export const automationRules = pgTable("automation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  triggersJson: jsonb("triggers_json").notNull(), // When to trigger
  conditionsJson: jsonb("conditions_json"), // Additional conditions
  actionsJson: jsonb("actions_json").notNull(), // What actions to take
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Approvals
export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id).notNull(),
  approverId: varchar("approver_id").references(() => users.id).notNull(),
  status: approvalStatusEnum("status").default("PENDING"),
  comment: text("comment"),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge Base Articles
export const knowledgeArticles = pgTable("knowledge_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  body: text("body").notNull(),
  status: articleStatusEnum("status").default("DRAFT"),
  version: integer("version").default(1),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  updatedById: varchar("updated_by_id").references(() => users.id),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Webhook Endpoints
export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  isActive: boolean("is_active").default(true),
  events: text("events").array().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  templateKey: text("template_key").notNull(),
  payloadJson: jsonb("payload_json").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// CSAT Surveys
export const csatSurveys = pgTable("csat_surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id).notNull(),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  score: integer("score").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  code: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  closedAt: true,
});

export const insertServiceCatalogSchema = createInsertSchema(serviceCatalog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketCommentSchema = createInsertSchema(ticketComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutomationRuleSchema = createInsertSchema(automationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSLASchema = createInsertSchema(sla).omit({
  id: true,
  createdAt: true,
});

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type ServiceCatalog = typeof serviceCatalog.$inferSelect;
export type InsertServiceCatalog = z.infer<typeof insertServiceCatalogSchema>;

export type TicketComment = typeof ticketComments.$inferSelect;
export type InsertTicketComment = z.infer<typeof insertTicketCommentSchema>;

export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;

export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = z.infer<typeof insertAutomationRuleSchema>;

export type SLA = typeof sla.$inferSelect;
export type InsertSLA = z.infer<typeof insertSLASchema>;

export type TicketEvent = typeof ticketEvents.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type SLAClock = typeof slaClock.$inferSelect;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type CSATSurvey = typeof csatSurveys.$inferSelect;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  name: z.string().min(1, "Nome é obrigatório"),
  orgName: z.string().min(1, "Nome da organização é obrigatório"),
  orgDomain: z.string().min(1, "Domínio da organização é obrigatório"),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;