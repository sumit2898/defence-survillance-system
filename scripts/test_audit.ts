
import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("=== AUDIT TRAIL VERIFICATION ===");

    // 1. Insert a Drone
    console.log("Creating Audit Test Drone...");
    const droneCode = `AUDIT-TEST-${Date.now()}`;
    const insertRes = await db.execute(sql`
        INSERT INTO drones (code_name, type, status, last_known_location)
        VALUES (
            ${droneCode}, 
            'UNKNOWN', 
            'IDLE', 
            ST_SetSRID(ST_MakePoint(0, 0), 4326)
        )
        RETURNING id;
    `);
    const droneId = insertRes.rows[0].id; // UUID

    // 2. Delete the Drone
    console.log(`Deleting Drone ${droneId}...`);
    await db.execute(sql`DELETE FROM drones WHERE id = ${droneId}::uuid`);

    // 3. Check Audit Log
    console.log("Checking Audit Logs...");
    // We look for a record with operation 'DELETE' and potentially the record_id matches
    // Note: record_id in audit_logs is JSON or text depending on implementation. 
    // setup_audit.ts schema says record_id is UUID.

    const logs = await db.execute(sql`
        SELECT * FROM audit_logs 
        WHERE table_name = 'drones' 
        AND operation = 'DELETE' 
        AND record_id = ${droneId}::uuid
        ORDER BY timestamp DESC
        LIMIT 1
    `);

    if (logs.rowCount && logs.rowCount > 0) {
        console.log("✅ SUCCESS: Deletion recorded in audit_logs.");
        console.log("Log Entry:", logs.rows[0]);
    } else {
        console.error("❌ FAILURE: No audit log found for deletion.");
    }

    process.exit(0);
}

main().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
