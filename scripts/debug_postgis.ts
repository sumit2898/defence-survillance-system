
import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
    const version = await db.execute(sql`SELECT PostGIS_Version()`);
    console.log("PostGIS Version:", version.rows[0]);

    // Try to find the function
    const funcs = await db.execute(sql`
    SELECT proname, proargtypes::regtype[] 
    FROM pg_proc 
    WHERE proname = 'st_geomfromgeojson';
  `);
    console.log("ST_GeomFromGeoJSON signatures:", funcs.rows);

    process.exit(0);
}
run().catch(console.error);
