
import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Creating Materialized View: dashboard_stats...");

    try {
        // Drop if exists to ensure clean state during dev
        await db.execute(sql`DROP MATERIALIZED VIEW IF EXISTS dashboard_stats;`);

        // Create the view
        await db.execute(sql`
      CREATE MATERIALIZED VIEW dashboard_stats AS
      SELECT 
          (SELECT count(*) FROM drones WHERE status = 'ACTIVE') as active_drones,
          (SELECT count(*) FROM ai_detections WHERE detected_at > now() - interval '24 hours') as recent_threats,
          (SELECT avg(battery_level) FROM drones) as avg_fleet_battery,
          (SELECT count(*) FROM system_events WHERE severity = 'CRITICAL' AND created_at > now() - interval '1 hour') as critical_alerts_hourly,
          NOW() as last_updated;
    `);

        // Create index for performance
        await db.execute(sql`
      CREATE UNIQUE INDEX idx_dashboard_stats_updated ON dashboard_stats (last_updated);
    `);

        console.log("✅ Materialized View created successfully.");

        // Initial Refresh
        console.log("Performing initial refresh...");
        await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;`);
        console.log("✅ Initial refresh complete.");

    } catch (error) {
        console.error("❌ Failed to create materialized view:", error);
    }

    process.exit(0);
}

main();
