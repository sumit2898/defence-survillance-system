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

  // Initial Seed Data (if empty)
  // Note: This runs on server start but checking if data exists first
  const existingDevices = await storage.getDevices();
  if (existingDevices.length === 0) {
    await storage.createDevice({ name: "Cam-01 Main Gate", type: "camera", status: "online", location: "Zone A", ipAddress: "192.168.1.101", battery: null });
    await storage.createDevice({ name: "Cam-02 Loading Dock", type: "camera", status: "online", location: "Zone B", ipAddress: "192.168.1.102", battery: null });
    await storage.createDevice({ name: "Drone-Alpha", type: "drone", status: "warning", location: "Perimeter", ipAddress: "192.168.1.201", battery: 34 });
    await storage.createDevice({ name: "Sensor-Perimeter-N", type: "sensor", status: "online", location: "North Wall", ipAddress: "192.168.1.55", battery: 88 });
    
    await storage.createAlert({ title: "Perimeter Breach", description: "Motion detected in Zone A (North)", severity: "critical", status: "active", location: "Zone A" });
    await storage.createAlert({ title: "Drone Battery Low", description: "Drone-Alpha battery below 35%", severity: "medium", status: "active", location: "Perimeter" });
    await storage.createAlert({ title: "Connection Lost", description: "Cam-04 signal lost for >10s", severity: "high", status: "resolved", location: "Zone C" });
    
    await storage.createLog({ level: "info", action: "System Startup", user: "SYSTEM", details: "Initialization complete" });
    await storage.createLog({ level: "warning", action: "Auth Failed", user: "unknown", details: "Failed login attempt from 10.0.0.5" });
  }

  return httpServer;
}
