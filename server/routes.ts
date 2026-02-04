import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

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
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
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
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: "Missing query parameter 'q'" });
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
      const start = (req.query.start as string).split(',');
      const end = (req.query.end as string).split(',');

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
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const info = await bhuvanService.getVillageInfo(lat, lon);
    res.json(info);
  });

  // Official Routing
  app.get("/api/gis/bhuvan/route", async (req, res) => {
    try {
      const start = (req.query.start as string).split(',');
      const end = (req.query.end as string).split(',');

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
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const data = await bhuvanService.getLulcAnalysis(lat, lon);
    res.json(data);
  });

  // Geoid Elevation
  app.get("/api/gis/bhuvan/elevation", async (req, res) => {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const data = await bhuvanService.getElevation(lat, lon);
    res.json(data);
  });

  // Bhuvan: Satellite WMS Proxy (Bypasses CORS)
  app.get("/api/gis/bhuvan/wms", async (req, res) => {
    const bhuvanUrl = "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms";
    try {
      const { bhuvanService } = await import("./services/bhuvan"); // Lazy load if needed or just use axios directly
      const axios = (await import("axios")).default;

      const response = await axios.get(bhuvanUrl, {
        params: req.query,
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
      const data = await bhuvanService.searchVillage(String(q));
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Bhuvan Search Error" });
    }
  });

  // Bhuvan: Reverse Geocode (Village Info)
  app.get('/api/gis/bhuvan/reverse', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Missing coordinates" });
    try {
      const data = await bhuvanService.reverseGeocodeVillage(Number(lat), Number(lon));
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

  return httpServer;
}
