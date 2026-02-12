
import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { threatAssessments, drones } from "@shared/schema";

async function main() {
    console.log("=== RLS VERIFICATION TEST ===");

    // 1. Setup Data: Create a threat assessment that is CRITICAL
    console.log("Setting up test data...");

    // Ensure we have a drone
    await db.execute(sql`
        INSERT INTO drones (code_name, type, status, last_known_location)
        VALUES ('RLS-TEST-DRONE', 'RECON', 'ACTIVE', ST_SetSRID(ST_MakePoint(75, 25), 4326))
        ON CONFLICT (code_name) DO NOTHING;
    `);

    // Insert CRITICAL threat (Analysts NOT allowed to see this via policy)
    // Note: We insert as the superuser/app user, so it bypasses RLS on insert physically
    // But we will test SELECT visibility.
    await db.execute(sql`
        INSERT INTO threat_assessments (drone_id, threat_level, assessment_notes, timestamp)
        SELECT id, 'CRITICAL', 'Top Secret Classified Info', NOW()
        FROM drones WHERE code_name = 'RLS-TEST-DRONE'
        LIMIT 1;
    `);

    console.log("Test Data Inserted (CRITICAL Threat).");

    // 2. Test as ANALYST
    console.log("\n--- Testing as ANALYST ---");
    // We simulate switching role within the transaction or session
    // Drizzle pool client needs to be used directly to ensure session state persists for the query

    const client = await (db as any)._?.client || (await import("pg")).Pool;
    // Wait, Drizzle's `db` is a pool. We need a specific client to SET ROLE.

    // Let's use raw PG client for this specific test to guarantee session state
    const { Client } = await import("pg");
    const testClient = new Client({ connectionString: process.env.DATABASE_URL });
    await testClient.connect();

    try {
        await testClient.query("BEGIN");
        await testClient.query("SET ROLE analyst");

        const resAnalyst = await testClient.query(`
            SELECT * FROM threat_assessments 
            WHERE assessment_notes = 'Top Secret Classified Info'
        `);

        if (resAnalyst.rowCount === 0) {
            console.log("✅ SUCCESS: Analyst CANNOT see CRITICAL threat.");
        } else {
            console.error("❌ FAILURE: Analyst SAW CRITICAL threat! RLS is broken or not applied.");
        }
        await testClient.query("ROLLBACK"); // Reset
    } catch (e) {
        console.error("Error testing analyst:", e);
        await testClient.query("ROLLBACK");
    }

    // 3. Test as COMMANDER
    console.log("\n--- Testing as COMMANDER ---");
    try {
        await testClient.query("BEGIN");
        await testClient.query("SET ROLE commander");

        const resCommander = await testClient.query(`
            SELECT * FROM threat_assessments 
            WHERE assessment_notes = 'Top Secret Classified Info'
        `);

        if (resCommander.rowCount && resCommander.rowCount > 0) {
            console.log("✅ SUCCESS: Commander CAN see CRITICAL threat.");
        } else {
            console.error("❌ FAILURE: Commander could NOT see threat. Check permissions.");
        }
        await testClient.query("ROLLBACK");
    } catch (e) {
        console.error("Error testing commander:", e);
        await testClient.query("ROLLBACK");
    }

    await testClient.end();

    // Cleanup
    console.log("\nCleaning up...");
    await db.execute(sql`DELETE FROM threat_assessments WHERE assessment_notes = 'Top Secret Classified Info'`);
    await db.execute(sql`DELETE FROM drones WHERE code_name = 'RLS-TEST-DRONE'`);

    process.exit(0);
}

main().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
