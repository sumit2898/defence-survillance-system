
import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

console.log("=== ENVIRONMENT DIAGNOSTICS ===");
console.log("CWD:", process.cwd());
console.log("Script Path:", fileURLToPath(import.meta.url));

const envPath = path.resolve(process.cwd(), ".env");
console.log(".env Path:", envPath);
console.log(".env Exists:", fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const hasDbUrl = content.includes("DATABASE_URL=");
    console.log(".env contains DATABASE_URL:", hasDbUrl);
}

console.log("process.env.DATABASE_URL Set:", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL Length:", process.env.DATABASE_URL.length);
    // Masked output
    console.log("DATABASE_URL Start:", process.env.DATABASE_URL.substring(0, 15) + "...");
} else {
    console.error("❌ DATABASE_URL is MISSING from process.env");
}
