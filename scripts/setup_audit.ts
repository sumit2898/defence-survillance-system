import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";


import { fileURLToPath } from "url";

export async function runSetupAudit() {
  console.log("Setting up Security Roles & Audit Triggers...");

  // 0. Create Roles (Idempotent-ish)
  try {
    await db.execute(sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'analyst') THEN
        CREATE ROLE analyst;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'commander') THEN
        CREATE ROLE commander;
      END IF;
      -- Grant access to tables for these roles
      GRANT ALL ON ALL TABLES IN SCHEMA public TO analyst;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO commander;
       -- Also grant on sequences for serial IDs if any (UUIDs don't need this usually but good practice)
       GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO analyst;
       GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO commander;
    END $$;`);
    console.log("Roles 'analyst' and 'commander' configured.");
  } catch (e) {
    console.warn("Role creation warning (might already exist or lack permissions):", e);
  }

  // 1. Create the Function
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION process_audit_log() RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO audit_logs (table_name, action, old_data, new_data, changed_by, created_at)
        VALUES (
            TG_TABLE_NAME,
            TG_OP,
            to_jsonb(OLD),
            to_jsonb(NEW),
            current_setting('app.current_user_id', true)::uuid,
            NOW()
        );
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 2. Create Triggers (Drones)
  await db.execute(sql`
    DROP TRIGGER IF EXISTS audit_drones ON drones;
    CREATE TRIGGER audit_drones
    AFTER INSERT OR UPDATE OR DELETE ON drones
    FOR EACH ROW EXECUTE FUNCTION process_audit_log();
  `);

  // 3. Create Triggers (Threat Assessments)
  await db.execute(sql`
    DROP TRIGGER IF EXISTS audit_threat_assessments ON threat_assessments;
    CREATE TRIGGER audit_threat_assessments
    AFTER INSERT OR UPDATE OR DELETE ON threat_assessments
    FOR EACH ROW EXECUTE FUNCTION process_audit_log();
  `);

  console.log("Audit Triggers Setup Complete.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSetupAudit()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Setup Failed:", err);
      process.exit(1);
    });
}
