
import "dotenv/config";
import pg from "pg";

const { Client } = pg;

async function checkConnection() {
    console.log("Checking Database Connection...");
    console.log("URL:", process.env.DATABASE_URL ? "Set (masked)" : "Not Set");

    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();
        console.log("✅ Connection Successful!");

        const res = await client.query("SELECT version()");
        console.log("DB Version:", res.rows[0].version);

        try {
            const postgisRes = await client.query("SELECT PostGIS_Full_Version()");
            console.log("✅ PostGIS Version:", postgisRes.rows[0].postgis_full_version);
        } catch (e) {
            console.warn("⚠️ PostGIS is NOT enabled or not installed.");
        }

        process.exit(0);
    } catch (error: any) {
        console.error("❌ Connection Failed:");
        if (error.code === 'ECONNREFUSED') {
            console.error("   Reason: Connection Refused. The database server is likely OFFLINE.");
            console.error("   Solution: Please start your PostgreSQL service (e.g., via Services.msc or 'pg_ctl start').");
        } else if (error.code === '28P01') {
            console.error("   Reason: Invalid Password. Check your .env file.");
        } else if (error.code === '3D000') {
            console.error("   Reason: Database 'defence_surveillance' does not exist.");
            console.error("   Solution: Create the database using 'createdb defence_surveillance' or via pgAdmin.");
        } else {
            console.error(error);
        }
        process.exit(1);
    } finally {
        await client.end();
    }
}

checkConnection();
