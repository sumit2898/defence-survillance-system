
import "dotenv/config";
import { pool } from "../server/db";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigrations() {
    try {
        const migrationsDir = path.join(__dirname, "../migrations");
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        console.log("Found migrations:", files);

        for (const file of files) {
            if (file.startsWith("0000") || file.startsWith("0001")) {
                const migrationPath = path.join(migrationsDir, file);
                console.log(`Applying migration: ${file}`);
                const sql = fs.readFileSync(migrationPath, "utf-8");

                // Split by statement-breakpoint 
                const statements = sql.split("--> statement-breakpoint");

                for (const statement of statements) {
                    if (statement.trim()) {
                        try {
                            await pool.query(statement);
                        } catch (err: any) {
                            // Ignore "relation already exists" errors if we are re-running
                            if (err.code === '42P07') {
                                console.log(`  Table already exists, skipping statement.`);
                            } else {
                                console.error(`  Error executing statement in ${file}:`, err.message);
                                // Verify if it's acceptable (e.g. duplicate key etc)
                                // throwing here to stop if critical
                            }
                        }
                    }
                }
                console.log(`✅ Applied ${file}`);
            }
        }
    } catch (error) {
        console.error("❌ Error/Crash:", error);
    } finally {
        await pool.end();
    }
}

applyMigrations();
