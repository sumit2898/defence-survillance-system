import { z } from "zod";
import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  real,
  timestamp,
  boolean,
  jsonb,
  customType,
  pgRole,
  pgPolicy
} from 'drizzle-orm/pg-core';

// Custom type for PostGIS Geography Point
const geographyPoint = customType<{ data: { lng: number; lat: number } }>({
  dataType() {
    return 'jsonb';
  },
});

// 1. DRONES TABLE
export const drones = pgTable('drones', {
  id: uuid('id').defaultRandom().primaryKey(),
  codeName: varchar('code_name', { length: 50 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // SCOUT, INTERCEPTOR
  status: varchar('status', { length: 20 }).default('IDLE'),
  batteryLevel: integer('battery_level').default(100),
  location: geographyPoint('last_known_location'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const dronePaths = pgTable('drone_paths', {
  id: uuid('id').defaultRandom().primaryKey(),
  droneId: uuid('drone_id').references(() => drones.id).notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});

// 2. AI DETECTIONS (The Neural Core)
export const aiDetections = pgTable('ai_detections', {
  id: uuid('id').defaultRandom().primaryKey(),
  droneId: uuid('drone_id').references(() => drones.id),
  detectedObject: varchar('detected_object', { length: 100 }).notNull(), // 'human', 'vehicle'
  confidence: integer('confidence'), // 0-100
  boundingBox: jsonb('bounding_box'), // { x, y, w, h }
  detectedAt: timestamp('detected_at').defaultNow(),
});

// 3. SYSTEM EVENTS (The Activity Feed)
export const systemEvents = pgTable('system_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'DRONE_LAUNCH'
  severity: varchar('severity', { length: 20 }).default('INFO'),
  metadata: jsonb('metadata'), // Extra flexible data
  createdAt: timestamp('created_at').defaultNow(),
});

// Custom type for PostGIS Geography Polygon
const geographyPolygon = customType<{ data: string }>({
  dataType() {
    return 'jsonb';
  },
});

// 4. SURVEILLANCE ZONES
export const surveillanceZones = pgTable('surveillance_zones', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  zoneType: varchar('zone_type', { length: 20 }).notNull(), // 'RESTRICTED', 'BASE', 'BORDER'
  area: geographyPolygon('area').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. INTEL HOTSPOTS
export const intelHotspots = pgTable('intel_hotspots', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 100 }).notNull(),
  location: geographyPoint('location').notNull(),
  severity: varchar('severity', { length: 20 }), // 'LOW', 'MEDIUM', 'HIGH'
  isActive: boolean('is_active').default(true),
});

// 6. THREAT ASSESSMENTS (RLS Protected)
// Define our Roles
export const analystRole = pgRole('analyst');
export const commanderRole = pgRole('commander');

export const threatAssessments = pgTable('threat_assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  threatLevel: varchar('threat_level', { length: 50 }), // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  decision: text('decision'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  // POLICY: Analysts can only see threats up to 'HIGH'. 
  // 'CRITICAL' threats are for Commanders only.
  pgPolicy('analyst_view_limit', {
    for: 'select',
    to: analystRole,
    using: sql`${table.threatLevel} != 'CRITICAL'`,
  }),
  // POLICY: Commanders see everything
  pgPolicy('commander_full_access', {
    for: 'select',
    to: commanderRole,
    using: sql`true`,
  }),
]);

// 7. AUDIT LOGS (Non-Repudiation)
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tableName: varchar('table_name', { length: 50 }).notNull(),
  action: varchar('action', { length: 20 }).notNull(), // INSERT, UPDATE, DELETE
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  changedBy: uuid('changed_by'), // Intended to be set via current_setting('app.current_user_id')
  createdAt: timestamp('created_at').defaultNow(),
});

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

// === SCHEMAS (Manually defined to avoid mixing server dependencies with client) ===

export const insertAlertSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  status: z.enum(['active', 'resolved', 'acknowledged']).default('active'),
  location: z.string(),
  metadata: z.record(z.any()).default({}).optional(),
  // id and timestamp are DB generated
});

export const insertDeviceSchema = z.object({
  name: z.string(),
  type: z.enum(['camera', 'drone', 'sensor', 'server']),
  status: z.enum(['online', 'offline', 'warning', 'maintenance']),
  location: z.string(),
  battery: z.number().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  x: z.number().default(2500),
  y: z.number().default(2500),
  // id and lastPing are DB generated
});

export const insertIncidentSchema = z.object({
  title: z.string(),
  summary: z.string(),
  status: z.enum(['open', 'investigating', 'closed']).default('open'),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  // id, createdAt, updatedAt are DB generated
});

export const insertLogSchema = z.object({
  level: z.enum(['info', 'warning', 'error', 'success']),
  action: z.string(),
  user: z.string(),
  details: z.string().optional().nullable(),
  // id and timestamp are DB generated
});

export const insertDronePathSchema = z.object({
  droneId: z.string(), // uuid
  lat: z.number(),
  lng: z.number(),
  timestamp: z.date().optional(), // Or allow string input if dates need parsing
});

// === TYPES ===

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = InsertAlert & { id: number; timestamp: Date | string };

export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = InsertDevice & { id: number; lastPing: Date | string };

export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = InsertIncident & { id: number; createdAt: Date | string; updatedAt: Date | string };

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = InsertLog & { id: number; timestamp: Date | string };

export type InsertDronePath = z.infer<typeof insertDronePathSchema>;
export type DronePath = InsertDronePath & { id: string; timestamp: Date | string };
