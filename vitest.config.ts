import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        globals: true, // Allows using describe, it, etc. without import
        env: {
            DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/defence_surveillance_test",
            PORT: "5001"
        }
    },
    resolve: {
        alias: {
            "@shared": path.resolve(import.meta.dirname, "shared"),
        },
    },
});
