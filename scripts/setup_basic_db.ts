import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "../server/db/schema";
import { sql } from "drizzle-orm";

const { Pool } = pg;

async function setupBasicDb() {
    console.log("🚀 Setting up basic database schema...\n");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL not set in .env file");
        process.exit(1);
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    try {
        console.log("📋 Creating tables...");

        // Create alerts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "alerts" (
                "id" SERIAL PRIMARY KEY,
                "title" TEXT NOT NULL,
                "description" TEXT NOT NULL,
                "severity" TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
                "status" TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'acknowledged')),
                "location" TEXT NOT NULL,
                "timestamp" TIMESTAMP DEFAULT NOW() NOT NULL,
                "metadata" JSONB DEFAULT '{}'::jsonb
            );
        `);
        console.log("  ✅ alerts table created");

        // Create devices table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "devices" (
                "id" SERIAL PRIMARY KEY,
                "name" TEXT NOT NULL,
                "type" TEXT NOT NULL CHECK (type IN ('camera', 'drone', 'sensor', 'server')),
                "status" TEXT NOT NULL CHECK (status IN ('online', 'offline', 'warning', 'maintenance')),
                "location" TEXT NOT NULL,
                "last_ping" TIMESTAMP DEFAULT NOW() NOT NULL,
                "battery" INTEGER,
                "ip_address" TEXT,
                "video_url" TEXT,
                "x" INTEGER DEFAULT 2500,
                "y" INTEGER DEFAULT 2500
            );
        `);
        console.log("  ✅ devices table created");

        // Create incidents table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "incidents" (
                "id" SERIAL PRIMARY KEY,
                "title" TEXT NOT NULL,
                "summary" TEXT NOT NULL,
                "status" TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'closed')),
                "priority" TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
                "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
                "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
            );
        `);
        console.log("  ✅ incidents table created");

        // Create logs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "logs" (
                "id" SERIAL PRIMARY KEY,
                "timestamp" TIMESTAMP DEFAULT NOW() NOT NULL,
                "level" TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
                "action" TEXT NOT NULL,
                "user" TEXT NOT NULL,
                "details" TEXT
            );
        `);
        console.log("  ✅ logs table created");

        console.log("\n🌱 Seeding initial data...");

        // Seed some sample devices
        await pool.query(`
            INSERT INTO devices (name, type, status, location, battery, x, y)
            SELECT 'Drone Alpha', 'drone', 'online', 'Sector A', 85, 1200, 1800
            WHERE NOT EXISTS (SELECT 1 FROM devices WHERE name = 'Drone Alpha');
        `);

        await pool.query(`
            INSERT INTO devices (name, type, status, location, battery, x, y)
            SELECT 'Drone Beta', 'drone', 'online', 'Sector B', 92, 3200, 2100
            WHERE NOT EXISTS (SELECT 1 FROM devices WHERE name = 'Drone Beta');
        `);

        await pool.query(`
            INSERT INTO devices (name, type, status, location, x, y)
            SELECT 'Camera 01', 'camera', 'online', 'Main Gate', 2800, 1500
            WHERE NOT EXISTS (SELECT 1 FROM devices WHERE name = 'Camera 01');
        `);

        await pool.query(`
            INSERT INTO devices (name, type, status, location, x, y)
            SELECT 'Sensor Array 1', 'sensor', 'online', 'Perimeter North', 1500, 800
            WHERE NOT EXISTS (SELECT 1 FROM devices WHERE name = 'Sensor Array 1');
        `);

        console.log("  ✅ Sample devices seeded");

        // Seed a sample alert
        await pool.query(`
            INSERT INTO alerts (title, description, severity, status, location, metadata)
            SELECT 
                'Perimeter Breach Detected',
                'Unauthorized movement detected in restricted zone',
                'high',
                'active',
                'Sector C - North Perimeter',
                '{"confidence": 0.95, "source": "Sensor Array 1"}'::jsonb
            WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE title = 'Perimeter Breach Detected');
        `);

        console.log("  ✅ Sample alert seeded");

        // Seed a sample log
        await pool.query(`
            INSERT INTO logs (level, action, "user", details)
            SELECT 'info', 'System Initialized', 'system', 'Database setup completed successfully'
            WHERE NOT EXISTS (SELECT 1 FROM logs WHERE action = 'System Initialized');
        `);

        console.log("  ✅ Sample log seeded");

        console.log("\n✨ Database setup complete!");
        console.log("\n📊 Summary:");

        const deviceCount = await pool.query('SELECT COUNT(*) FROM devices');
        const alertCount = await pool.query('SELECT COUNT(*) FROM alerts');
        const incidentCount = await pool.query('SELECT COUNT(*) FROM incidents');
        const logCount = await pool.query('SELECT COUNT(*) FROM logs');

        console.log(`  - Devices: ${deviceCount.rows[0].count}`);
        console.log(`  - Alerts: ${alertCount.rows[0].count}`);
        console.log(`  - Incidents: ${incidentCount.rows[0].count}`);
        console.log(`  - Logs: ${logCount.rows[0].count}`);

        console.log("\n🎉 Your database is ready to use!");

        process.exit(0);
    } catch (error: any) {
        console.error("\n❌ Setup failed:");
        console.error(error.message);
        if (error.stack) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setupBasicDb();
