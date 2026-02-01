import { db } from "./db";
import {
  alerts, devices, incidents, logs,
  type Alert, type InsertAlert,
  type Device, type InsertDevice,
  type Incident, type InsertIncident,
  type Log, type InsertLog
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  // Alerts
  async getAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).orderBy(desc(alerts.timestamp));
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db.insert(alerts).values(insertAlert).returning();
    return alert;
  }

  async updateAlert(id: number, updates: Partial<InsertAlert>): Promise<Alert> {
    const [alert] = await db.update(alerts)
      .set(updates)
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  // Devices
  async getDevices(): Promise<Device[]> {
    return await db.select().from(devices).orderBy(devices.name);
  }

  async getDevice(id: number): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device;
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const [device] = await db.insert(devices).values(insertDevice).returning();
    return device;
  }

  // Incidents
  async getIncidents(): Promise<Incident[]> {
    return await db.select().from(incidents).orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: number): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident;
  }

  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const [incident] = await db.insert(incidents).values(insertIncident).returning();
    return incident;
  }

  // Logs
  async getLogs(): Promise<Log[]> {
    return await db.select().from(logs).orderBy(desc(logs.timestamp)).limit(100);
  }

  async createLog(insertLog: InsertLog): Promise<Log> {
    const [log] = await db.insert(logs).values(insertLog).returning();
    return log;
  }
}

export const storage = new DatabaseStorage();
