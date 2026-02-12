
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function verifyAudit() {
    try {
        console.log("1. Updating a Drone to trigger audit...");
        // Update drone status to TRIGGER audit
        await db.execute(sql`
      UPDATE drones 
      SET status = 'MAINTENANCE', battery_level = 99
      WHERE code_name = 'Reaper-X'
    `);

        console.log("2. Querying Audit Logs...");
        const logs = await db.execute(sql`
      SELECT * FROM audit_logs 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);

        if (logs.rows.length > 0) {
            console.log("✅ Audit Log Found:", logs.rows[0]);
        } else {
            console.error("❌ No Audit Logs found!");
        }

        process.exit(0);
    } catch (e) {
        console.error("Verification Failed", e);
        process.exit(1);
    }
}

verifyAudit();
