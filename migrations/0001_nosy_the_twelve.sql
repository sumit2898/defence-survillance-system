CREATE TABLE "drone_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drone_id" uuid NOT NULL,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "drone_paths" ADD CONSTRAINT "drone_paths_drone_id_drones_id_fk" FOREIGN KEY ("drone_id") REFERENCES "public"."drones"("id") ON DELETE no action ON UPDATE no action;