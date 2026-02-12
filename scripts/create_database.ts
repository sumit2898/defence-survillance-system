import "dotenv/config";
import pg from "pg";

const { Client } = pg;

async function createDatabase() {
    console.log("🔧 Creating Database 'mydb'...\n");

    // Connect to the default 'postgres' database to create our target database
    // We need to parse the DATABASE_URL and replace the database name with 'postgres'
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("❌ DATABASE_URL not set in .env file");
        process.exit(1);
    }

    // Replace the database name with 'postgres' to connect to the default database
    const defaultDbUrl = dbUrl.replace(/\/[^\/]*$/, '/postgres');

    console.log("Connecting to default 'postgres' database...");
    const client = new Client({ connectionString: defaultDbUrl });

    try {
        await client.connect();
        console.log("✅ Connected to PostgreSQL server\n");

        // Check if database already exists
        const checkDb = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = 'mydb'"
        );

        if (checkDb.rows.length > 0) {
            console.log("ℹ️  Database 'mydb' already exists");
        } else {
            // Create the database
            await client.query("CREATE DATABASE mydb");
            console.log("✅ Database 'mydb' created successfully!");
        }

        console.log("\n🎉 Database setup complete!");
        console.log("\nYou can now run:");
        console.log("  npx tsx scripts/test_db_connection.ts  - to test the connection");
        console.log("  npx tsx scripts/setup_db.ts           - to create tables and seed data");

        process.exit(0);
    } catch (error: any) {
        console.error("❌ Database creation failed:");

        if (error.code === 'ECONNREFUSED') {
            console.error("   Reason: Connection Refused. PostgreSQL server is not running.");
            console.error("   Solution: Start PostgreSQL service (e.g., via Services.msc or 'pg_ctl start').");
        } else if (error.code === '28P01') {
            console.error("   Reason: Invalid Password. Check your .env file.");
            console.error("   Current DATABASE_URL uses password with @ symbol (URL-encoded as %40)");
        } else if (error.code === '42P04') {
            console.error("   Reason: Database 'mydb' already exists.");
            console.log("\n✅ You can proceed to test the connection!");
        } else {
            console.error(error);
        }

        process.exit(1);
    } finally {
        await client.end();
    }
}

createDatabase();
