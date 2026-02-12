import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { checkZoneBreach } from "../server/storage";
// Wait, I need to check if checkZoneBreach is exported. It is.
// But importing from server/storage might be tricky if it has other init logic.
// storage.ts initializes MemStorage but doesn't do side effects other than that.
// But checkZoneBreach is a standalone export.
// Let's check imports in storage.ts.


import { fileURLToPath } from "url";

export async function runSetupDb() {
    console.log("Running DB Setup...");


    // 1. Extensions
    try {
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "postgis";`);
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    } catch (e) {
        console.warn("Warning: Could not enable extensions. They might already be active or require superuser privileges.");
        // Continue, as some cloud DBs have these pre-installed but forbid CREATE EXTENSION.
    }

    // 2. Tables
    console.log("Creating tables...");
    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "drones" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "code_name" varchar(50) NOT NULL,
      "type" varchar(20) NOT NULL,
      "status" varchar(20) DEFAULT 'IDLE',
      "battery_level" integer DEFAULT 100,
      "last_known_location" geography(POINT, 4326),
      "updated_at" timestamp DEFAULT now()
    );
  `);

    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "ai_detections" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "drone_id" uuid REFERENCES "drones"("id"),
      "detected_object" varchar(100) NOT NULL,
      "confidence" integer,
      "bounding_box" jsonb,
      "detected_at" timestamp DEFAULT now()
    );
  `);

    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "surveillance_zones" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" varchar(100) NOT NULL,
      "zone_type" varchar(20) NOT NULL,
      "area" geography(POLYGON, 4326) NOT NULL,
      "created_at" timestamp DEFAULT now()
    );
  `);

    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "system_events" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "event_type" varchar(50) NOT NULL,
      "severity" varchar(20) DEFAULT 'INFO',
      "metadata" jsonb,
      "created_at" timestamp DEFAULT now()
    );
  `);

    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "intel_hotspots" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "title" varchar(100) NOT NULL,
      "location" geography(POINT, 4326) NOT NULL,
      "severity" varchar(20),
      "is_active" boolean DEFAULT true
    );
  `);

    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "threat_assessments" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "threat_level" varchar(50),
      "decision" text,
      "created_at" timestamp DEFAULT now()
    );
  `);

    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "audit_logs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "table_name" varchar(50) NOT NULL,
      "action" varchar(20) NOT NULL,
      "old_data" jsonb,
      "new_data" jsonb,
      "changed_by" uuid,
      "created_at" timestamp DEFAULT now()
    );
  `);

    // 3. Seed Data
    console.log("Seeding data...");
    await db.execute(sql`
    INSERT INTO surveillance_zones (name, zone_type, area)
    SELECT 'Sector 44 Restricted', 'RESTRICTED', ST_GeomFromText('POLYGON((78.9 20.5, 79.0 20.5, 79.0 20.6, 78.9 20.6, 78.9 20.5))', 4326)
    WHERE NOT EXISTS (SELECT 1 FROM surveillance_zones WHERE name = 'Sector 44 Restricted');
  `);

    await db.execute(sql`
    INSERT INTO drones (code_name, type, status, last_known_location)
    SELECT 'Reaper-X', 'INTERCEPTOR', 'ACTIVE', ST_SetSRID(ST_MakePoint(78.95, 20.55), 4326)
    WHERE NOT EXISTS (SELECT 1 FROM drones WHERE code_name = 'Reaper-X');
  `);

    await db.execute(sql`
    INSERT INTO drones (code_name, type, status, last_known_location)
    SELECT 'Scout-01', 'SCOUT', 'IDLE', ST_SetSRID(ST_MakePoint(70.0, 20.0), 4326)
    WHERE NOT EXISTS (SELECT 1 FROM drones WHERE code_name = 'Scout-01');
  `);



    // 4. Materialized Views
    console.log("Creating materialized views...");

    await db.execute(sql`DROP MATERIALIZED VIEW IF EXISTS "dashboard_stats" CASCADE;`);

    await db.execute(sql`
    CREATE MATERIALIZED VIEW "dashboard_stats" AS
    SELECT 
        (SELECT count(*) FROM "drones" WHERE status = 'ACTIVE') as "active_drones",
        (SELECT count(*) FROM "ai_detections" WHERE "detected_at" > now() - interval '24 hours') as "recent_threats",
        (SELECT avg("battery_level") FROM "drones") as "avg_fleet_battery",
        (SELECT count(*) FROM "system_events" WHERE severity = 'CRITICAL' AND created_at > now() - interval '1 hour') as "critical_alerts_hourly",
        NOW() as "last_updated";
  `);

    await db.execute(sql`
    CREATE UNIQUE INDEX "idx_dashboard_stats_updated" ON "dashboard_stats" ("last_updated");
  `);

    console.log("DB Setup Complete.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runSetupDb()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error("Setup Failed:", err instanceof Error ? err.message : String(err));
            if (err instanceof Error && (err as any).length) {
                // Drizzle/Postgres errors sometimes have internal array
                console.error("Detailed Errors:", (err as any).length);
                (err as any).forEach((e: any) => console.error(e.message));
            }
            process.exit(1);
        });
}
