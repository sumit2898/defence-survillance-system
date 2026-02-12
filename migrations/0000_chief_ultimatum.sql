CREATE ROLE "analyst";--> statement-breakpoint
CREATE ROLE "commander";--> statement-breakpoint
CREATE TABLE "ai_detections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drone_id" uuid,
	"detected_object" varchar(100) NOT NULL,
	"confidence" integer,
	"bounding_box" jsonb,
	"detected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(50) NOT NULL,
	"action" varchar(20) NOT NULL,
	"old_data" jsonb,
	"new_data" jsonb,
	"changed_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_name" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'IDLE',
	"battery_level" integer DEFAULT 100,
	"last_known_location" jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "intel_hotspots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(100) NOT NULL,
	"location" jsonb NOT NULL,
	"severity" varchar(20),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "surveillance_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"zone_type" varchar(20) NOT NULL,
	"area" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'INFO',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threat_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"threat_level" varchar(50),
	"decision" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "threat_assessments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_detections" ADD CONSTRAINT "ai_detections_drone_id_drones_id_fk" FOREIGN KEY ("drone_id") REFERENCES "public"."drones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "analyst_view_limit" ON "threat_assessments" AS PERMISSIVE FOR SELECT TO "analyst" USING ("threat_assessments"."threat_level" != 'CRITICAL');--> statement-breakpoint
CREATE POLICY "commander_full_access" ON "threat_assessments" AS PERMISSIVE FOR SELECT TO "commander" USING (true);