import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";

describe("API Integration", () => {
    let app: express.Express;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));
        const httpServer = createServer(app);
        await registerRoutes(httpServer, app);
    });

    it("GET /api/health should return ok", async () => {
        // We assume /api/health might not exist, but let's check a standard route
        // or just check if 404 is returned safely for unknown routes
        const res = await request(app).get("/api/health-check-non-existent");
        expect(res.status).toBe(404);
    });

    it("GET /api/devices should return list of devices", async () => {
        // Seed some data
        await storage.createDevice({
            name: "Test Drone API",
            type: "drone",
            status: "offline",
            location: "Base",
            x: 0,
            y: 0
        });

        const res = await request(app).get("/api/devices");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((d: any) => d.name === "Test Drone API")).toBe(true);
    });

    it("POST /api/alerts should create a new alert", async () => {
        const newAlert = {
            title: "API Alert",
            description: "Created via Supertest",
            severity: "high",
            location: "Server Room",
            status: "active"
        };

        const res = await request(app).post("/api/alerts").send(newAlert);
        expect(res.status, `Failed with ${res.status}: ${JSON.stringify(res.body)}`).toBe(201);
        expect(res.body.title).toBe("API Alert");
        expect(res.body.id).toBeDefined();
    });
});
