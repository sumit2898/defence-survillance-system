
import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("=== REAL-TIME ALERT TEST ===");

    // 1. Create/Find a drone to attach detection to
    console.log("Ensuring valid drone exists...");
    const droneRes = await db.execute(sql`
        INSERT INTO drones (code_name, type, status, last_known_location)
        VALUES (
            'TEST-GHOST-1', 
            'UNKNOWN', 
            'ACTIVE', 
            ST_SetSRID(ST_MakePoint(77.2, 28.6), 4326) -- New Delhi
        )
        ON CONFLICT DO NOTHING
        RETURNING id;
    `);

    let droneId;
    if (droneRes.rowCount && droneRes.rowCount > 0) {
        droneId = droneRes.rows[0].id;
    } else {
        const existing = await db.execute(sql`SELECT id FROM drones WHERE code_name = 'TEST-GHOST-1' LIMIT 1`);
        droneId = existing.rows[0].id;
    }

    // 2. Insert AI Detection
    console.log(`Injecting detection for drone ${droneId}...`);

    // Random offset to simulate movement
    const lat = 28.6 + (Math.random() * 0.01);
    const lng = 77.2 + (Math.random() * 0.01);

    // Update drone location first so the JOIN works with fresh data (if we relied on JOIN)
    // Actually our trigger joins on 'drones'.last_known_location.
    // So we should update drone location to match where we say the detection is? 
    // Or normally detection happens AT the drone's location.

    await db.execute(sql`
        UPDATE drones 
        SET last_known_location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        WHERE id = ${droneId}::uuid
    `);

    // Now insert detection
    const res = await db.execute(sql`
        INSERT INTO ai_detections (drone_id, detected_object, confidence, bounding_box)
        VALUES (
            ${droneId}::uuid,
            'TEST_TARGET',
            95,
            '{"x": 100, "y": 100, "w": 50, "h": 50}'::jsonb
        )
        RETURNING id;
    `);

    console.log(`✅ Detection Injected! ID: ${res.rows[0].id}`);
    console.log("Check the Dashboard Map. You should see a pulsing RED ALERT marker appear instantly.");

    process.exit(0);
}

main().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
