
import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { storage, checkZoneBreach, getDronePaths } from "../server/storage";
import { drones, systemEvents } from "@shared/schema";

async function runTest() {
    console.log("📍 Starting Breadcrumb Test...");

    // 1. Get or Create a test drone
    let drone = await db.query.drones.findFirst({
        where: (drones, { eq }) => eq(drones.codeName, "Breadcrumb-Test-Drone")
    });

    if (!drone) {
        console.log("Creating test drone...");
        // @ts-ignore
        const result = await db.insert(drones).values({
            codeName: "Breadcrumb-Test-Drone",
            type: "SCOUT",
            status: "ACTIVE",
            location: { lng: 79.0, lat: 21.0 }
        }).returning();
        drone = result[0];
    }

    console.log(`Using Drone: ${drone.codeName} (${drone.id})`);

    // 2. Simulate Movement (3 steps)
    // This should trigger logDronePath inside checkZoneBreach
    const path = [
        { lat: 21.001, lng: 79.001 },
        { lat: 21.002, lng: 79.002 },
        { lat: 21.003, lng: 79.003 }
    ];

    for (const step of path) {
        console.log(`Moving to ${step.lat}, ${step.lng}...`);
        await checkZoneBreach(drone.id, step.lat, step.lng);
        // Simulate delay
        await new Promise(r => setTimeout(r, 100));
    }

    // 3. Verify Breadcrumbs
    console.log("Verifying stored path...");
    // @ts-ignore
    const storedPath = await getDronePaths(drone.id);

    console.log(`Found ${storedPath.length} path points.`);
    if (storedPath.length >= 3) {
        console.log("✅ Breadcrumbs verified successfully!");
        // Print last 3
        console.log(storedPath.slice(-3));
    } else {
        console.error("❌ Failed to store all breadcrumbs.");
    }

    process.exit(0);
}

runTest().catch((err) => {
    console.error("Test Failed:", err);
    process.exit(1);
});
