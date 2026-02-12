
import { db } from "./db";
import { sql } from "drizzle-orm";
import {
  type Alert, type InsertAlert,
  type Device, type InsertDevice,
  type Incident, type InsertIncident,
  type Log, type InsertLog,
  aiDetections, systemEvents,
  dronePaths, type InsertDronePath // Import new table and type
} from "@shared/schema";
// Manual GIS helpers
import { isPointInPolygon, minDistanceToPolygon } from "./lib/gis";

export interface IStorage {
  // Alerts
  getAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, updates: Partial<InsertAlert>): Promise<Alert>;

  // Devices
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;

  // Incidents
  getIncidents(): Promise<Incident[]>;
  getIncident(id: number): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident): Promise<Incident>;

  // Logs
  getLogs(): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;

  // Dashboard Stats
  getDashboardStats(): Promise<any>;

  // Map & GIS
  getMapHotspots(): Promise<any[]>;
  getZones(): Promise<any[]>;

  // Fleet Command
  initiateReturnToBase(): Promise<void>;
}

export class MemStorage implements IStorage {
  private alerts: Alert[] = [];
  private devices: Device[] = [];
  private incidents: Incident[] = [];
  private logs: Log[] = [];

  private alertId = 1;
  private deviceId = 1;
  private incidentId = 1;
  private logId = 1;

  constructor() {
    // Seed some initial data if needed
  }

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    return this.alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const alert: Alert = {
      ...insertAlert,
      id: this.alertId++,
      timestamp: new Date(),
      status: insertAlert.status ?? 'active',
      metadata: insertAlert.metadata ?? {}
    };
    this.alerts.push(alert);
    return alert;
  }

  async updateAlert(id: number, updates: Partial<InsertAlert>): Promise<Alert> {
    const index = this.alerts.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Alert not found");
    const updated = { ...this.alerts[index], ...updates };
    this.alerts[index] = updated;
    return updated;
  }

  // Devices
  async getDevices(): Promise<Device[]> {
    return this.devices;
  }

  async getDevice(id: number): Promise<Device | undefined> {
    return this.devices.find(d => d.id === id);
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const device: Device = {
      ...insertDevice,
      id: this.deviceId++,
      lastPing: new Date(),
      battery: insertDevice.battery ?? null,
      ipAddress: insertDevice.ipAddress ?? null,
      videoUrl: insertDevice.videoUrl ?? null,
      x: insertDevice.x ?? 2500,
      y: insertDevice.y ?? 2500
    };
    this.devices.push(device);
    return device;
  }

  // Incidents
  async getIncidents(): Promise<Incident[]> {
    return this.incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getIncident(id: number): Promise<Incident | undefined> {
    return this.incidents.find(i => i.id === id);
  }

  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const now = new Date();
    const incident: Incident = {
      ...insertIncident,
      id: this.incidentId++,
      createdAt: now,
      updatedAt: now,
      status: insertIncident.status ?? 'open'
    };
    this.incidents.push(incident);
    return incident;
  }

  // Logs
  async getLogs(): Promise<Log[]> {
    return this.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createLog(insertLog: InsertLog): Promise<Log> {
    const log: Log = {
      ...insertLog,
      id: this.logId++,
      timestamp: new Date(),
      details: insertLog.details ?? null
    };
    this.logs.push(log);
    return log;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    // Mock data for in-memory storage
    return {
      active_drones: this.devices.filter(d => d.type === 'drone' && d.status === 'online').length,
      recent_threats: 0,
      avg_fleet_battery: this.devices.filter(d => d.battery !== null).reduce((sum, d) => sum + (d.battery || 0), 0) / Math.max(1, this.devices.filter(d => d.battery !== null).length),
      critical_alerts_hourly: this.alerts.filter(a => a.severity === 'critical').length,
      last_updated: new Date()
    };
  }

  // Map & GIS
  async getMapHotspots(): Promise<any[]> {
    return []; // Mock implementation
  }

  async getZones(): Promise<any[]> {
    return []; // Mock implementation
  }

  // Fleet Command
  async initiateReturnToBase(): Promise<void> {
    // Mock implementation
  }
}

export const storage = new MemStorage();


export async function getDrones() {
  // Use raw SQL to convert PostGIS geography to simple lat/lng
  // We used 'location' as the column name
  const result = await db.execute(sql`
    SELECT 
      id, 
      code_name as "codeName", 
      type, 
      status, 
      battery_level as "batteryLevel",
      (last_known_location->>'lng')::float as lng, 
      (last_known_location->>'lat')::float as lat,
      updated_at as "updatedAt"
    FROM drones
  `);
  return result.rows;
}

export async function logDetection(droneId: string, objectName: string, conf: number, box: object) {
  await db.insert(aiDetections).values({
    droneId: droneId,
    detectedObject: objectName,
    confidence: conf,
    boundingBox: box,
  });

  // Logic: If confidence > 90%, trigger a System Event
  if (conf > 90) {
    await db.insert(systemEvents).values({
      eventType: 'CRITICAL_DETECTION',
      severity: 'HIGH',
      metadata: { object: objectName, drone: droneId }
    });
  }
}

export async function checkZoneBreach(droneId: string, lat: number, lng: number) {
  // Log path history
  await logDronePath({
    droneId,
    lat,
    lng,
    timestamp: new Date()
  });

  // Manual GIS Check (PostGIS not available)

  // Fetch all restricted zones
  const zonesResult = await db.execute(sql`
    SELECT name, area 
    FROM surveillance_zones 
    WHERE zone_type = 'RESTRICTED'
  `);

  const zones = zonesResult.rows;
  const point = { lat, lng };

  for (const zone of zones) {
    const polygon = zone.area as any; // Type assertion for GeoJSON

    // 1. Check Breach
    if (isPointInPolygon(point, polygon)) {
      console.log(`🚨 CRITICAL: Drone ${droneId} breached ${zone.name}`);
      await db.insert(systemEvents).values({
        eventType: 'ZONE_BREACH',
        severity: 'CRITICAL',
        metadata: {
          zone: zone.name,
          drone: droneId,
          coords: { lat, lng }
        }
      });

      // Notify WebSocket
      await db.execute(sql`
        NOTIFY high_threat_alert, ${JSON.stringify({
        type: 'SYSTEM_EVENT',
        data: {
          eventType: 'ZONE_BREACH',
          severity: 'CRITICAL',
          title: `ZONE BREACH: ${zone.name}`,
          timestamp: new Date().toISOString(),
          metadata: { drone: droneId }
        }
      })}
      `);
      return; // Stop on first breach
    }

    // 2. Check Proximity (500m)
    const distance = minDistanceToPolygon(point, polygon);
    if (distance <= 500) {
      console.log(`⚠️ WARNING: Drone ${droneId} approaching ${zone.name} (${Math.round(distance)}m)`);

      // Notify WebSocket (using generic alert)
      await db.execute(sql`
        NOTIFY high_threat_alert, ${JSON.stringify({
        type: 'SYSTEM_EVENT',
        data: {
          eventType: 'PROXIMITY_ALERT',
          severity: 'MEDIUM',
          title: `Approaching ${zone.name}`,
          timestamp: new Date().toISOString(),
          metadata: { drone: droneId, distance: Math.round(distance) }
        }
      })}
      `);

      // Log to DB (optional, maybe rate limit)
      await db.insert(systemEvents).values({
        eventType: 'PROXIMITY_ALERT',
        severity: 'MEDIUM',
        metadata: {
          zone: zone.name,
          drone: droneId,
          distance: `${Math.round(distance)}m`
        }
      });
    }
  }
}

export async function getDetectionTrends() {
  const result = await db.execute(sql`
    SELECT 
      date_trunc('hour', detected_at) AS hour, 
      count(id) AS detection_count
    FROM ai_detections
    WHERE detected_at > now() - interval '24 hours'
    GROUP BY hour
    ORDER BY hour ASC;
  `);
  return result.rows;
}

export async function getAuditLogs() {
  const result = await db.execute(sql`
    SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;
  `);
  return result.rows;
}

export async function createThreat(level: string, decision: string, role: string = 'analyst') {
  // Insert with the specific role
  await db.transaction(async (tx) => {
    // Set role
    await tx.execute(sql`SET LOCAL ROLE ${sql.raw(role)}`);
    // Set current user ID for audit log (dummy UUID for demo if not using real auth)
    await tx.execute(sql`SELECT set_config('app.current_user_id', '00000000-0000-0000-0000-000000000000', true)`);

    await tx.execute(sql`
      INSERT INTO threat_assessments (threat_level, decision)
      VALUES (${level}, ${decision})
    `);
  });
}

export async function getThreats(role: string) {
  // Use transaction to limit the scope of SET LOCAL ROLE
  return await db.transaction(async (tx) => {
    // Validate role to prevent SQL injection via sql.raw
    if (!['analyst', 'commander'].includes(role)) {
      throw new Error("Invalid role");
    }

    await tx.execute(sql`SET LOCAL ROLE ${sql.raw(role)}`);

    const result = await tx.execute(sql`
      SELECT * FROM threat_assessments ORDER BY created_at DESC
    `);
    return result.rows;
  });
}

export async function getDashboardStats() {
  const result = await db.execute(sql`SELECT * FROM dashboard_stats`);

  // Add the "Fleet Status" breakdown for the Pie Chart
  const fleetStatus = await db.execute(sql`
    SELECT status, count(*)::int as count 
    FROM drones 
    GROUP BY status
  `);

  return {
    summary: result.rows[0] || null,
    fleet: fleetStatus.rows
  };
}

export async function refreshDashboardStats() {
  await db.execute(sql`REFRESH MATERIALIZED VIEW dashboard_stats;`);
  return { success: true, refreshed_at: new Date() };
}

export async function getZones() {
  const result = await db.execute(sql`
    SELECT 
      id, 
      name, 
      zone_type as "zoneType", 
      area 
    FROM surveillance_zones
  `);
  return result.rows;
}

export async function getMapHotspots() {
  const result = await db.execute(sql`
    SELECT 
      id, 
      title, 
      severity,
      (location->>'lng')::float as lng, 
      (location->>'lat')::float as lat
    FROM intel_hotspots
    WHERE is_active = true
  `);
  return result.rows;
}

export async function initiateReturnToBase() {
  // Update status
  await db.execute(sql`
    UPDATE drones 
    SET status = 'RETURNING', updated_at = now()
    WHERE status = 'ACTIVE'
  `);

  // Log the command
  await db.insert(systemEvents).values({
    eventType: 'FLEET_RECALL',
    severity: 'CRITICAL',
    metadata: { issuedBy: 'Commander_Alpha' }
  });
}

export async function getDronePaths(droneId: string) {
  // Simple retrieval of last 24h path
  const result = await db.execute(sql`
    SELECT lat, lng, timestamp 
    FROM drone_paths 
    WHERE drone_id = ${droneId} 
    AND timestamp > now() - interval '24 hours'
    ORDER BY timestamp ASC
  `);
  return result.rows;
}

export async function logDronePath(path: InsertDronePath) {
  await db.insert(dronePaths).values({
    droneId: path.droneId,
    lat: path.lat,
    lng: path.lng,
    timestamp: path.timestamp ? new Date(path.timestamp) : new Date()
  });
}
