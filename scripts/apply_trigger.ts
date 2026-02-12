
import { pool } from "../server/db";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyTrigger() {
    try {
        const migrationPath = path.join(__dirname, "../migrations/0002_add_detection_trigger.sql");
        const sql = fs.readFileSync(migrationPath, "utf-8");

        console.log("Applying migration from:", migrationPath);
        await pool.query(sql);
        console.log("✅ Migration applied successfully!");
    } catch (error) {
        console.error("❌ Error applying migration:", error);
    } finally {
        await pool.end();
    }
}

applyTrigger();
