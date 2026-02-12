import "dotenv/config";
import pg from "pg";

const { Client } = pg;

async function enablePostGIS() {
    console.log("🌍 Enabling PostGIS Extension...\n");

    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();
        console.log("✅ Connected to database\n");

        // Try to enable PostGIS
        console.log("📦 Installing PostGIS extension...");
        try {
            await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");
            console.log("✅ PostGIS extension enabled successfully!\n");
        } catch (error: any) {
            if (error.code === '58P01') {
                console.error("❌ PostGIS is not installed on your PostgreSQL server.");
                console.error("\n📥 To install PostGIS:");
                console.error("   1. Download PostGIS for PostgreSQL 17 from:");
                console.error("      https://postgis.net/windows_downloads/");
                console.error("   2. Run the installer and select your PostgreSQL 17 installation");
                console.error("   3. After installation, run this script again");
                process.exit(1);
            } else if (error.code === '42501') {
                console.error("❌ Permission denied. You need superuser privileges to install extensions.");
                console.error("   Try connecting as the postgres superuser.");
                process.exit(1);
            } else {
                throw error;
            }
        }

        // Verify PostGIS is working
        console.log("🔍 Verifying PostGIS installation...");
        const version = await client.query("SELECT PostGIS_Full_Version();");
        console.log("✅ PostGIS Version:");
        console.log(`   ${version.rows[0].postgis_full_version}\n`);

        // Also enable pgcrypto for UUID generation
        console.log("📦 Installing pgcrypto extension...");
        await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
        console.log("✅ pgcrypto extension enabled\n");

        console.log("🎉 All extensions enabled successfully!");
        console.log("\n📍 You can now use geo-spatial features:");
        console.log("   - Store drone locations as geographic points");
        console.log("   - Define surveillance zones as polygons");
        console.log("   - Perform spatial queries (distance, intersections, etc.)");
        console.log("\n💡 Next step: Run 'npx tsx scripts/setup_db.ts' to create geo-spatial tables");

        process.exit(0);
    } catch (error: any) {
        console.error("\n❌ Failed to enable PostGIS:");
        console.error(error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

enablePostGIS();
