import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === DOMAIN TYPES ===

export const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
} as const;

export const STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  ACKNOWLEDGED: 'acknowledged',
  OFFLINE: 'offline',
  ONLINE: 'online',
  WARNING: 'warning'
} as const;

// === TABLES ===

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity", { enum: ['critical', 'high', 'medium', 'low', 'info'] }).notNull(),
  status: text("status", { enum: ['active', 'resolved', 'acknowledged'] }).default('active').notNull(),
  location: text("location").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<{ confidence?: number; source?: string; detectedObjects?: string[] }>().default({}),
});

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ['camera', 'drone', 'sensor', 'server'] }).notNull(),
  status: text("status", { enum: ['online', 'offline', 'warning', 'maintenance'] }).notNull(),
  location: text("location").notNull(),
  lastPing: timestamp("last_ping").defaultNow().notNull(),
  battery: integer("battery"), // Percentage, nullable for wired devices
  ipAddress: text("ip_address"),
});

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  status: text("status", { enum: ['open', 'investigating', 'closed'] }).default('open').notNull(),
  priority: text("priority", { enum: ['critical', 'high', 'medium', 'low'] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  level: text("level", { enum: ['info', 'warning', 'error', 'success'] }).notNull(),
  action: text("action").notNull(),
  user: text("user").notNull(),
  details: text("details"),
});

// === SCHEMAS ===

export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, timestamp: true });
export const insertDeviceSchema = createInsertSchema(devices).omit({ id: true, lastPing: true });
export const insertIncidentSchema = createInsertSchema(incidents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLogSchema = createInsertSchema(logs).omit({ id: true, timestamp: true });

// === TYPES ===

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
