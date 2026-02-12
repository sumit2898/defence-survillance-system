
import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
    try {
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);
        console.log("✅ PostGIS Extension Enabled");

        const version = await db.execute(sql`SELECT PostGIS_Version()`);
        console.log("PostGIS Version:", version.rows[0]);
    } catch (e) {
        console.error("❌ Failed to enable PostGIS:", e);
    }
    process.exit(0);
}
run();
