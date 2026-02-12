
import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { fileURLToPath } from "url";

export async function runSetupRealtime() {
    console.log("Setting up Real-time Notifications...");

    // 1. Create the Notification Function
    await db.execute(sql`
    CREATE OR REPLACE FUNCTION notify_detection() RETURNS TRIGGER AS $$
    DECLARE
        drone_loc json;
    BEGIN
        -- Only notify if confidence is above 80%
        IF (NEW.confidence > 80) THEN
            -- Fetch the drone's location as GeoJSON
            SELECT ST_AsGeoJSON(last_known_location)::json INTO drone_loc 
            FROM drones WHERE id = NEW.drone_id;

            -- Construct payload with location
            PERFORM pg_notify('high_threat_alert', json_build_object(
                'id', NEW.id,
                'drone_id', NEW.drone_id,
                'detected_object', NEW.detected_object,
                'confidence', NEW.confidence,
                'detected_at', NEW.detected_at,
                'location', drone_loc
            )::text);
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

    // 2. Create Trigger
    await db.execute(sql`
    DROP TRIGGER IF EXISTS notify_new_detection ON ai_detections;
    CREATE TRIGGER notify_new_detection
    AFTER INSERT ON ai_detections
    FOR EACH ROW EXECUTE FUNCTION notify_detection();
  `);

    console.log("Real-time Triggers Setup Complete.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runSetupRealtime()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error("Setup Failed:", err);
            process.exit(1);
        });
}
