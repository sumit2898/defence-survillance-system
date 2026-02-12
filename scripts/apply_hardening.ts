
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function applyHardening() {
    try {
        console.log("Reading hardening.sql...");
        const migrationPath = path.join(process.cwd(), 'server', 'db', 'migrations', 'hardening.sql');
        const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

        console.log("Applying Hardening...");
        await db.transaction(async (tx) => {
            await tx.execute(sql.raw(sqlContent));
        });

        console.log("✅ Database Hardening Applied Successfully.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Hardening Failed", e);
        process.exit(1);
    }
}

applyHardening();
