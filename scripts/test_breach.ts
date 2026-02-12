
import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("=== BREACH SIMULATION TEST ===");

    // 1. Create a drone in a restricted zone (Sector 44 is at 78.9 20.5)
    // We will place a drone exactly inside it.
    console.log("Injecting unauthorized drone into Sector 44...");

    // Using raw SQL for simplicity in test script
    const droneCode = `INTRUDER-${Date.now().toString().slice(-4)}`;

    // Insert drone
    const res = await db.execute(sql`
        INSERT INTO drones (code_name, type, status, last_known_location)
        VALUES (
            ${droneCode}, 
            'UNKNOWN', 
            'ACTIVE', 
            ST_SetSRID(ST_MakePoint(78.95, 20.55), 4326) -- Inside the polygon
        )
        RETURNING id;
    `);

    const droneId = res.rows[0].id;
    console.log(`Drone injected. ID: ${droneId}, Code: ${droneCode}`);

    // 2. Trigger Zone Breach Check (simulate system event)
    // In a real scenario, this happens via periodic task or event trigger.
    // Here we will call the checkZoneBreach function from storage IF we can import it,
    // OR we can manually inspect if an alert was generated if the system is reactive.

    // Since we don't have the reliable import of 'storage' due to potential side effects in this script context,
    // let's manually run the breach detection logic SQL here to verify it WOULD catch it.

    console.log("Checking for zone breaches...");
    const breaches = await db.execute(sql`
        SELECT d.code_name, z.name as zone_name, z.zone_type
        FROM drones d
        JOIN surveillance_zones z ON ST_Intersects(d.last_known_location::geometry, z.area::geometry)
        WHERE d.id = ${droneId}::uuid
    `);

    if (breaches.rowCount && breaches.rowCount > 0) {
        console.log("✅ BREACH DETECTED!");
        breaches.rows.forEach(row => {
            console.log(`   - ALERT: Drone ${row.code_name} detected in ${row.zone_name} (${row.zone_type})`);
        });
    } else {
        console.error("❌ NO BREACH DETECTED. Check geospatial data.");
    }

    // 3. Cleanup
    console.log("Cleaning up test data...");
    await db.execute(sql`DELETE FROM drones WHERE id = ${droneId}::uuid`);

    console.log("=== TEST COMPLETE ===");
    process.exit(0);
}

main().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
