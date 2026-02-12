
import 'dotenv/config';
import { checkZoneBreach } from "../server/storage";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runTest() {
  console.log("📍 Starting GIS Proximity Test...");

  // 1. Ensure Zone Exists
  await db.execute(sql`
    INSERT INTO surveillance_zones (name, zone_type, area)
    SELECT 'Test Restricted Zone', 'RESTRICTED', '{"type": "Polygon", "coordinates": [[[78.9, 20.5], [79.0, 20.5], [79.0, 20.6], [78.9, 20.6], [78.9, 20.5]]]}'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM surveillance_zones WHERE name = 'Test Restricted Zone');
  `);
  console.log("✅ verified Zone Exists");

  // 2. Test Proximity (Within ~500m of 20.5, 78.95)
  // 0.004 degrees is roughly 440m
  const nearLat = 20.496;
  const nearLng = 78.95;

  console.log(`Testing Coordinate: ${nearLat}, ${nearLng}`);
  await checkZoneBreach("TEST_PROXIMITY_DRONE", nearLat, nearLng);

  console.log("✅ Test Complete. Check console for '⚠️ WARNING' or DB for 'PROXIMITY_ALERT'.");
  process.exit(0);
}

runTest().catch(console.error);
