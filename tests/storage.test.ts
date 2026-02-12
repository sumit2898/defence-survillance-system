import { describe, it, expect, beforeEach } from "vitest";
import { MemStorage } from "../server/storage";
import { insertAlertSchema, insertDeviceSchema } from "@shared/schema";

describe("MemStorage", () => {
    let storage: MemStorage;

    beforeEach(() => {
        storage = new MemStorage();
    });

    it("should start empty", async () => {
        const alerts = await storage.getAlerts();
        expect(alerts).toHaveLength(0);
    });

    it("should create and retrieve an alert", async () => {
        const newAlert = {
            title: "Test Alert",
            description: "Unit Test",
            severity: "low",
            location: "Test Zone",
            status: "active"
        };

        // Zod Parse to simulate API behavior (optional but good)
        const parsed = insertAlertSchema.parse(newAlert);
        const created = await storage.createAlert(parsed);

        expect(created.id).toBe(1);
        expect(created.title).toBe("Test Alert");

        const all = await storage.getAlerts();
        expect(all).toHaveLength(1);
    });

    it("should create and retrieve a device", async () => {
        const newDevice = {
            name: "Test Drone",
            type: "drone",
            status: "offline",
            location: "Hangar",
            x: 100,
            y: 100
        };

        const created = await storage.createDevice(newDevice);
        expect(created.id).toBe(1);
        expect(created.status).toBe("offline");

        const fetched = await storage.getDevice(1);
        expect(fetched).toBeDefined();
        expect(fetched?.name).toBe("Test Drone");
    });
});
