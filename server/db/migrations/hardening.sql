-- 1. Create Audit Logs Table
DROP TABLE IF EXISTS audit_logs CASCADE;
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT, -- Can be UUID or Int converted to text
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT DEFAULT current_user,
    timestamp TIMESTAMP DEFAULT now()
);

-- 2. Create Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION log_audit_event() RETURNS TRIGGER AS $$
DECLARE
    record_id_val TEXT;
    old_val JSONB;
    new_val JSONB;
BEGIN
    -- Determine Record ID (Handle logic for UUID 'id' or Integer 'id')
    -- We assume 'id' column exists. If not, this might fail or need adjustment.
    IF TG_OP = 'DELETE' THEN
        record_id_val := OLD.id::text;
        old_val := row_to_json(OLD)::jsonb;
        new_val := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        record_id_val := NEW.id::text;
        old_val := row_to_json(OLD)::jsonb;
        new_val := row_to_json(NEW)::jsonb;
    ELSIF TG_OP = 'INSERT' THEN
        record_id_val := NEW.id::text;
        old_val := NULL;
        new_val := row_to_json(NEW)::jsonb;
    END IF;

    INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data)
    VALUES (TG_TABLE_NAME, record_id_val, TG_OP, old_val, new_val);

    RETURN NULL; -- Verification trigger, return value ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql;

-- 3. Apply Triggers to Critical Tables
DROP TRIGGER IF EXISTS trigger_audit_drones ON drones;
CREATE TRIGGER trigger_audit_drones
AFTER INSERT OR UPDATE OR DELETE ON drones
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS trigger_audit_system_events ON system_events;
CREATE TRIGGER trigger_audit_system_events
AFTER INSERT OR UPDATE OR DELETE ON system_events
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS trigger_audit_intel_hotspots ON intel_hotspots;
CREATE TRIGGER trigger_audit_intel_hotspots
AFTER INSERT OR UPDATE OR DELETE ON intel_hotspots
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 4. RLS Policies (Example: Drones)
-- Enable RLS
ALTER TABLE drones ENABLE ROW LEVEL SECURITY;

-- Create Policy: Everyone can read
DROP POLICY IF EXISTS "Enable read access for all users" ON drones;
CREATE POLICY "Enable read access for all users" ON drones FOR SELECT USING (true);

-- Create Policy: Only System/Commander can update (Simulated by checking current_user/role)
-- For now, allow all, but this establishes the framework
DROP POLICY IF EXISTS "Enable insert for all users" ON drones;
CREATE POLICY "Enable insert for all users" ON drones FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON drones;
CREATE POLICY "Enable update for all users" ON drones FOR UPDATE USING (true);
