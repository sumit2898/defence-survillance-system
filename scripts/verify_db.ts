import "dotenv/config";
import pg from "pg";

const { Client } = pg;

async function verifySetup() {
    console.log("🔍 Verifying Database Setup...\n");

    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();
        console.log("✅ Connected to database\n");

        // List all tables
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log("📋 Tables in database:");
        tables.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        console.log("\n📊 Data Summary:");

        // Check devices
        const devices = await client.query('SELECT * FROM devices ORDER BY id');
        console.log(`\n  🚁 Devices (${devices.rows.length}):`);
        devices.rows.forEach(d => {
            console.log(`    - ${d.name} (${d.type}) - ${d.status} - Battery: ${d.battery || 'N/A'}%`);
        });

        // Check alerts
        const alerts = await client.query('SELECT * FROM alerts ORDER BY id');
        console.log(`\n  🚨 Alerts (${alerts.rows.length}):`);
        alerts.rows.forEach(a => {
            console.log(`    - ${a.title} - ${a.severity} - ${a.status}`);
        });

        // Check incidents
        const incidents = await client.query('SELECT * FROM incidents ORDER BY id');
        console.log(`\n  📝 Incidents (${incidents.rows.length}):`);
        if (incidents.rows.length === 0) {
            console.log(`    (No incidents yet)`);
        } else {
            incidents.rows.forEach(i => {
                console.log(`    - ${i.title} - ${i.priority} - ${i.status}`);
            });
        }

        // Check logs
        const logs = await client.query('SELECT * FROM logs ORDER BY id DESC LIMIT 5');
        console.log(`\n  📜 Recent Logs (showing last 5):`);
        logs.rows.forEach(l => {
            console.log(`    - [${l.level.toUpperCase()}] ${l.action} by ${l.user}`);
        });

        console.log("\n✨ Database verification complete!");

        process.exit(0);
    } catch (error: any) {
        console.error("❌ Verification failed:");
        console.error(error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

verifySetup();
