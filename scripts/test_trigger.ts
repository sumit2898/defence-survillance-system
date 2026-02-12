
import "dotenv/config";
import postgres from "postgres";
import { pool } from "../server/db";
import { aiDetections } from "../shared/schema";
import { db } from "../server/db";

async function testTrigger() {
    console.log("🧪 Starting Trigger Test...");

    // 1. Setup Listener using postgres.js (same as server/websocket.ts)
    const sql = postgres(process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/defence_surveillance");

    let notificationReceived = false;

    const cleanup = async () => {
        await sql.end();
        await pool.end();
    };

    await sql.listen('high_threat_alert', (payload) => {
        console.log("🔔 Notification Received!");
        console.log("📦 Payload:", payload);
        const data = JSON.parse(payload);
        if (data.confidence > 80) {
            console.log("✅ Verified: High confidence detection received.");
            notificationReceived = true;
        } else {
            console.error("❌ Error: Received notification but confidence was low/missing?");
        }
        // We can exit now
        cleanup().then(() => process.exit(0));
    });

    console.log("🎧 Listening for 'high_threat_alert'...");

    // 2. Insert a High Confidence Detection
    console.log("➕ Inserting High Confidence Detection...");

    // Wait a bit to ensure listener is ready
    await new Promise(r => setTimeout(r, 1000));

    try {
        // Using Drizzle to insert
        await db.insert(aiDetections).values({
            detectedObject: "TEST_THREAT",
            confidence: 95,
            boundingBox: { x: 0, y: 0, w: 100, h: 100 },
        });
        console.log("📝 Inserted record with 95% confidence");
    } catch (err) {
        console.error("❌ Insert failed:", err);
        await cleanup();
        process.exit(1);
    }

    // 3. Set a timeout to fail if no notification
    setTimeout(async () => {
        if (!notificationReceived) {
            console.error("❌ Timeout: No notification received within 5 seconds.");
            await cleanup();
            process.exit(1);
        }
    }, 5000);
}

testTrigger();
