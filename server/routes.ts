import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Alerts
  app.get(api.alerts.list.path, async (req, res) => {
    const alerts = await storage.getAlerts();
    res.json(alerts);
  });

  app.post(api.alerts.create.path, async (req, res) => {
    try {
      const input = api.alerts.create.input.parse(req.body);
      const alert = await storage.createAlert(input);
      res.status(201).json(alert);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const zodError = err as any;
        return res.status(400).json({
          message: zodError.errors[0]?.message || "Invalid input",
          field: zodError.errors[0]?.path.join('.') || "unknown",
        });
      }
      throw err;
    }
  });

  app.patch(api.alerts.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.alerts.update.input.parse(req.body);
      const alert = await storage.updateAlert(id, input);
      res.json(alert);
    } catch (err) {
      res.status(400).json({ message: "Invalid input or ID" });
    }
  });

  // AI Detections Ingest
  app.post("/api/detections", async (req, res) => {
    try {
      const { droneId, objectName, confidence, boundingBox } = req.body;
      const { logDetection } = await import("./storage"); // Lazy load to avoid circular deps if any
      await logDetection(droneId, objectName, confidence, boundingBox);
      res.json({ status: "logged" });
    } catch (e) {
      console.error("Detection Log Error", e);
      res.status(500).json({ error: "Failed to log detection" });
    }
  });

  // Detection Trends
  app.get("/api/detections/trends", async (req, res) => {
    try {
      const { getDetectionTrends } = await import("./storage");
      const trends = await getDetectionTrends();
      res.json(trends);
    } catch (e) {
      console.error("Trends Fetch Error", e);
      res.status(500).json({ error: "Failed to fetch trends" });
    }
  });

  // Drones GIS Data
  app.get("/api/drones", async (req, res) => {
    try {
      const { getDrones } = await import("./storage");
      const drones = await getDrones();
      res.json(drones);
    } catch (e) {
      console.error("Drone Fetch Error", e);
      res.status(500).json({ error: "Failed to fetch drones" });
    }
  });

  app.get("/api/drones/:id/path", async (req, res) => {
    try {
      const { getDronePaths } = await import("./storage");
      const path = await getDronePaths(req.params.id);
      res.json(path);
    } catch (e) {
      console.error("Drone Path Fetch Error", e);
      res.status(500).json({ error: "Failed to fetch drone path" });
    }
  });

  // Security & Audit Routes
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const { getAuditLogs } = await import("./storage");
      const logs = await getAuditLogs();
      res.json(logs);
    } catch (e) {
      console.error("Audit Log Fetch Error", e);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/threats", async (req, res) => {
    try {
      const roleParam = req.query.role;
      const role = typeof roleParam === 'string' ? roleParam : 'analyst';
      const { getThreats } = await import("./storage");
      const threats = await getThreats(role);
      res.json(threats);
    } catch (e) {
      console.error("Threat Fetch Error", e);
      // RLS might throw an error or return empty, usually it just returns filtered rows.
      // If the role is invalid, storage throws.
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/threats", async (req, res) => {
    try {
      const { threatLevel, decision, role } = req.body;
      const { createThreat } = await import("./storage");
      await createThreat(threatLevel, decision, role || 'analyst');
      res.json({ status: "recorded" });
    } catch (e) {
      console.error("Threat Creation Error", e);
      res.status(500).json({ error: "Failed to record threat" });
    }
  });


  // Devices
  app.get(api.devices.list.path, async (req, res) => {
    const devices = await storage.getDevices();
    res.json(devices);
  });

  app.get(api.devices.get.path, async (req, res) => {
    const device = await storage.getDevice(parseInt(req.params.id));
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json(device);
  });

  // Incidents
  app.get(api.incidents.list.path, async (req, res) => {
    const incidents = await storage.getIncidents();
    res.json(incidents);
  });

  app.get(api.incidents.get.path, async (req, res) => {
    const incident = await storage.getIncident(parseInt(req.params.id));
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    res.json(incident);
  });

  // Logs
  app.get(api.logs.list.path, async (req, res) => {
    const logs = await storage.getLogs();
    res.json(logs);
  });

  // Dashboard Stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const { getDashboardStats } = await import("./storage");
      const stats = await getDashboardStats();
      res.json(stats);
    } catch (e) {
      console.error("Dashboard Stats Error", e);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Refresh Dashboard Stats
  app.post("/api/dashboard/stats/refresh", async (req, res) => {
    try {
      const { refreshDashboardStats } = await import("./storage");
      const result = await refreshDashboardStats();
      res.json(result);
    } catch (e) {
      console.error("Dashboard Stats Refresh Error", e);
      res.status(500).json({ error: "Failed to refresh dashboard stats" });
    }
  });

  // Map Hotspots
  app.get("/api/map/hotspots", async (req, res) => {
    try {
      const { getMapHotspots } = await import("./storage");
      const hotspots = await getMapHotspots();
      res.json(hotspots);
    } catch (e) {
      console.error("Map Hotspots Error", e);
      res.status(500).json({ error: "Failed to fetch map hotspots" });
    }
  });

  // Fleet Kill-Switch
  app.post("/api/fleet/recall", async (req, res) => {
    try {
      const { initiateReturnToBase } = await import("./storage");
      await initiateReturnToBase();
      res.json({ status: "RECALL_INITIATED", timestamp: new Date() });
    } catch (e) {
      console.error("Fleet Recall Error", e);
      res.status(500).json({ error: "Failed to initiate fleet recall" });
    }
  });

  // Restricted Zones (PostGIS Polygons)
  app.get("/api/gis/zones", async (req, res) => {
    try {
      const { getZones } = await import("./storage");
      const zones = await getZones();
      res.json(zones);
    } catch (e) {
      console.error("Zone Fetch Error", e);
      res.status(500).json({ error: "Failed to fetch zones" });
    }
  });

  // --- GIS PROXY ROUTES (Geoapify & Bhuvan) ---

  // 1. Map Tiles (Geoapify)
  // GET /api/gis/tiles/:z/:x/:y
  const { geoapifyService } = await import("./services/geoapify");
  app.get("/api/gis/tiles/:z/:x/:y", async (req, res) => {
    try {
      const { z, x, y } = req.params;
      const tileData = await geoapifyService.getTile(z, x, y);
      res.setHeader('Content-Type', 'image/png');
      res.send(tileData);
    } catch (e) {
      console.error("Tile Error", e);
      res.status(500).send("Tile Error");
    }
  });

  // 2. Search (Geoapify)
  app.get("/api/gis/search", async (req, res) => {
    try {
      const q = req.query.q;
      if (!q) return res.status(400).json({ error: "Missing query parameter 'q'" });
      const query = Array.isArray(q) ? q[0] : (q as string);
      const data = await geoapifyService.search(query);
      res.json(data);
    } catch (e) {
      console.error("Search Route Error:", e);
      res.status(500).json({ error: "Search failed", details: e instanceof Error ? e.message : String(e) });
    }
  });

  // 3. Routing (Geoapify)
  // GET /api/gis/route?start=lat,lon&end=lat,lon
  app.get("/api/gis/route", async (req, res) => {
    try {
      const startParam = req.query.start;
      const endParam = req.query.end;

      if (!startParam || !endParam) return res.status(400).send("Missing start or end params");

      const startStr = Array.isArray(startParam) ? startParam[0] : (startParam as string);
      const endStr = Array.isArray(endParam) ? endParam[0] : (endParam as string);

      const start = startStr.split(',');
      const end = endStr.split(',');

      if (start.length !== 2 || end.length !== 2) return res.status(400).send("Invalid format");

      const data = await geoapifyService.route(
        { lat: parseFloat(start[0]), lon: parseFloat(start[1]) },
        { lat: parseFloat(end[0]), lon: parseFloat(end[1]) }
      );
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Routing Failed" });
    }
  });

  // 4. Bhuvan Services (Official ISRO Data)
  const { bhuvanService } = await import("./services/bhuvan");

  // Village / General Info
  app.get("/api/gis/bhuvan/info", async (req, res) => {
    const latParam = req.query.lat;
    const lonParam = req.query.lon;
    const lat = parseFloat(Array.isArray(latParam) ? latParam[0] : (latParam as string));
    const lon = parseFloat(Array.isArray(lonParam) ? lonParam[0] : (lonParam as string));
    const info = await bhuvanService.getVillageInfo(lat, lon);
    res.json(info);
  });

  // Official Routing
  app.get("/api/gis/bhuvan/route", async (req, res) => {
    try {
      const startParam = req.query.start;
      const endParam = req.query.end;

      if (!startParam || !endParam) return res.status(400).send("Missing params");

      const startStr = Array.isArray(startParam) ? startParam[0] : (startParam as string);
      const endStr = Array.isArray(endParam) ? endParam[0] : (endParam as string);

      const start = startStr.split(',');
      const end = endStr.split(',');

      if (start.length !== 2 || end.length !== 2) return res.status(400).send("Invalid format");

      const data = await bhuvanService.getRoute(
        { lat: parseFloat(start[0]), lon: parseFloat(start[1]) },
        { lat: parseFloat(end[0]), lon: parseFloat(end[1]) }
      );
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Bhuvan Route Failed" });
    }
  });

  // LULC Analysis
  app.get("/api/gis/bhuvan/lulc", async (req, res) => {
    const latParam = req.query.lat;
    const lonParam = req.query.lon;
    const lat = parseFloat(Array.isArray(latParam) ? latParam[0] : (latParam as string));
    const lon = parseFloat(Array.isArray(lonParam) ? lonParam[0] : (lonParam as string));
    const data = await bhuvanService.getLulcAnalysis(lat, lon);
    res.json(data);
  });

  // Geoid Elevation
  app.get("/api/gis/bhuvan/elevation", async (req, res) => {
    const latParam = req.query.lat;
    const lonParam = req.query.lon;
    const lat = parseFloat(Array.isArray(latParam) ? latParam[0] : (latParam as string));
    const lon = parseFloat(Array.isArray(lonParam) ? lonParam[0] : (lonParam as string));
    const data = await bhuvanService.getElevation(lat, lon);
    res.json(data);
  });

  // Bhuvan: Satellite WMS Proxy (Bypasses CORS)
  app.get("/api/gis/bhuvan/wms", async (req, res) => {
    const bhuvanUrl = "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms";
    try {
      const { bhuvanService } = await import("./services/bhuvan"); // Lazy load if needed or just use axios directly
      const axios = (await import("axios")).default;

      // Type-safe query params
      const params = req.query as Record<string, string | number | boolean>;

      const response = await axios.get(bhuvanUrl, {
        params: params,
        responseType: 'arraybuffer'
      });

      res.set('Content-Type', response.headers['content-type']);
      res.send(response.data);
    } catch (e) {
      console.warn("Bhuvan WMS Proxy Error");
      res.status(502).send("Bhuvan WMS Error");
    }
  });

  // Bhuvan: Village Search
  app.get('/api/gis/bhuvan/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Missing query" });
    try {
      const query = Array.isArray(q) ? q[0] : (q as string);
      const data = await bhuvanService.searchVillage(query);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Bhuvan Search Error" });
    }
  });

  // Bhuvan: Reverse Geocode (Village Info)
  app.get('/api/gis/bhuvan/reverse', async (req, res) => {
    const { lat: latParam, lon: lonParam } = req.query;
    if (!latParam || !lonParam) return res.status(400).json({ error: "Missing coordinates" });
    try {
      const lat = Number(Array.isArray(latParam) ? latParam[0] : latParam);
      const lon = Number(Array.isArray(lonParam) ? lonParam[0] : lonParam);
      const data = await bhuvanService.reverseGeocodeVillage(lat, lon);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Bhuvan Reverse Geo Error" });
    }
  });

  // Initial Seed Data (if empty)
  // Note: This runs on server start but checking if data exists first
  const existingDevices = await storage.getDevices();
  if (existingDevices.length === 0) {
    // Seed devices with coordinates mapped to the India Layer (centered approx 2500,2500)
    await storage.createDevice({
      name: "Cam-01 Delhi HQ",
      type: "camera",
      status: "online",
      location: "Zone A",
      ipAddress: "192.168.1.101",
      battery: null,
      videoUrl: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=800",
      x: 2500, // Delhi approx relative to map center
      y: 2300
    });

    await storage.createDevice({
      name: "Cam-02 Mumbai Port",
      type: "camera",
      status: "online",
      location: "Zone B",
      ipAddress: "192.168.1.102",
      battery: null,
      videoUrl: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&q=80&w=800",
      x: 2420, // Mumbai left/down
      y: 2450
    });

    await storage.createDevice({
      name: "Drone-Alpha Border",
      type: "drone",
      status: "warning",
      location: "Perimeter",
      ipAddress: "192.168.1.201",
      battery: 34,
      videoUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=800",
      x: 2350, // Gujarat border area
      y: 2400
    });

    await storage.createDevice({
      name: "Sensor-Bangalore",
      type: "sensor",
      status: "online",
      location: "South Hub",
      ipAddress: "192.168.1.55",
      battery: 88,
      videoUrl: null,
      x: 2500, // South center
      y: 2550
    });

    await storage.createAlert({ title: "Perimeter Breach", description: "Motion detected in Zone A (North)", severity: "critical", status: "active", location: "Zone A" });
    await storage.createAlert({ title: "Drone Battery Low", description: "Drone-Alpha battery below 35%", severity: "medium", status: "active", location: "Perimeter" });
    await storage.createAlert({ title: "Connection Lost", description: "Cam-04 signal lost for >10s", severity: "high", status: "resolved", location: "Zone C" });

    await storage.createLog({ level: "info", action: "System Startup", user: "SYSTEM", details: "Initialization complete" });
    await storage.createLog({ level: "warning", action: "Auth Failed", user: "unknown", details: "Failed login attempt from 10.0.0.5" });
  }

  // --- TEMPORARY SETUP ROUTE (Run via curl) ---
  app.post("/api/setup-db", async (req, res) => {
    try {
      console.log("Running DB Setup...");

      // 1. Extensions
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "postgis";`);
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`); // For gen_random_uuid()

      // 2. Tables (Manual Migration)
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "drones" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "code_name" varchar(50) NOT NULL,
          "type" varchar(20) NOT NULL,
          "status" varchar(20) DEFAULT 'IDLE',
          "battery_level" integer DEFAULT 100,
          "last_known_location" jsonb,
          "updated_at" timestamp DEFAULT now()
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "ai_detections" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "drone_id" uuid REFERENCES "drones"("id"),
          "detected_object" varchar(100) NOT NULL,
          "confidence" integer,
          "bounding_box" jsonb,
          "detected_at" timestamp DEFAULT now()
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "surveillance_zones" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "name" varchar(100) NOT NULL,
          "zone_type" varchar(20) NOT NULL,
          "area" jsonb NOT NULL,
          "created_at" timestamp DEFAULT now()
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "system_events" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "event_type" varchar(50) NOT NULL,
          "severity" varchar(20) DEFAULT 'INFO',
          "metadata" jsonb,
          "created_at" timestamp DEFAULT now()
        );
      `);

      // 2.5 CREATE TRIGGER for Real-time Notifications
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION notify_high_threat() RETURNS TRIGGER AS $$
        BEGIN
          -- Only notify for high confidence detections
          IF NEW.confidence > 80 THEN
            PERFORM pg_notify('high_threat_alert', row_to_json(NEW)::text);
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trigger_high_threat_alert ON ai_detections;
        
        CREATE TRIGGER trigger_high_threat_alert
        AFTER INSERT ON ai_detections
        FOR EACH ROW
        EXECUTE FUNCTION notify_high_threat();
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "intel_hotspots" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "title" varchar(100) NOT NULL,
          "location" jsonb NOT NULL,
          "severity" varchar(20),
          "is_active" boolean DEFAULT true
        );
      `);

      // 3. Seed Data
      // Restricted Zone (Square around 20.5937, 78.9629)
      // Polygon coords must stay closed (first point = last point)
      // GeoJSON: [[ [78.9, 20.5], [79.0, 20.5], [79.0, 20.6], [78.9, 20.6], [78.9, 20.5] ]]
      // WKT: POLYGON((78.9 20.5, 79.0 20.5, 79.0 20.6, 78.9 20.6, 78.9 20.5))
      await db.execute(sql`
        INSERT INTO surveillance_zones (name, zone_type, area)
        SELECT 'Sector 44 Restricted', 'RESTRICTED', '{"type": "Polygon", "coordinates": [[[78.9, 20.5], [79.0, 20.5], [79.0, 20.6], [78.9, 20.6], [78.9, 20.5]]]}'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM surveillance_zones WHERE name = 'Sector 44 Restricted');
      `);

      // Seed Drone (Inside Zone)
      // Inside: 78.95, 20.55
      await db.execute(sql`
        INSERT INTO drones (code_name, type, status, last_known_location)
        SELECT 'Reaper-X', 'INTERCEPTOR', 'ACTIVE', '{"lat": 20.55, "lng": 78.95}'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM drones WHERE code_name = 'Reaper-X');
      `);

      // Seed Drone (Outside Zone)
      await db.execute(sql`
        INSERT INTO drones (code_name, type, status, last_known_location)
        SELECT 'Scout-01', 'SCOUT', 'IDLE', '{"lat": 20.0, "lng": 70.0}'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM drones WHERE code_name = 'Scout-01');
      `);

      // Test Breach check for internal verification
      const { checkZoneBreach } = await import("./storage");
      // Check Reaper-X (Inside)
      // Fetch Reaper-X ID first? No need, just pass a dummy ID for test or fetch if needed
      // Let's just run checkZoneBreach for test coords
      await checkZoneBreach("TEST_DRONE_INSIDE", 20.55, 78.95);

      console.log("DB Setup Complete");
      res.json({ status: "Setup Complete", message: "Tables created and data seeded" });

    } catch (e) {
      console.error("Setup Failed", e);
      res.status(500).json({ error: "Setup Failed", details: String(e) });
    }
  });

  // --- DATABASE HARDENING (Apply Auditing) ---
  app.post("/api/harden-db", async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const migrationPath = path.join(process.cwd(), 'server', 'db', 'migrations', 'hardening.sql');

      const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

      // Split by semicolon to execute statements individually if needed, 
      // but db.execute can often handle blocks if simpler. 
      // Ideally use a transaction.
      await db.transaction(async (tx) => {
        await tx.execute(sql.raw(sqlContent));
      });

      console.log("Database Hardening Applied Successfully.");
      res.json({ status: "Hardening Applied", message: "Audit logs and triggers created." });

    } catch (e) {
      console.error("Hardening Failed", e);
      res.status(500).json({ error: "Hardening Failed", details: String(e) });
    }
  });

  return httpServer;
}
