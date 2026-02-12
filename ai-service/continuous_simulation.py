import psycopg2
import json
import os
import time
import random
import uuid

# Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5000")
DB_NAME = os.getenv("DB_NAME", "mydb")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "sk12346@")

def get_db_connection():
    try:
        return psycopg2.connect(
            host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS
        )
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        return None

def main():
    print("Starting Continuous AI Simulation...")
    print("Press Ctrl+C to stop.")

    while True:
        conn = get_db_connection()
        if not conn:
            time.sleep(5)
            continue
            
        try:
            cur = conn.cursor()
            
            # 1. Get Active Drones
            cur.execute("SELECT id, code_name, last_known_location FROM drones WHERE status = 'ACTIVE'")
            drones = cur.fetchall()
            
            if not drones:
                print("No ACTIVE drones. activating one...")
                cur.execute("UPDATE drones SET status='ACTIVE' WHERE id = (SELECT id FROM drones LIMIT 1)")
                conn.commit()
                time.sleep(1)
                continue

            # 2. Simulate Drone Movement & Detection
            for drone in drones:
                drone_id, name, location = drone
                # Move drone slightly
                if location:
                    lat = float(location.get('lat', 20)) + random.uniform(-0.001, 0.001)
                    lng = float(location.get('lng', 78)) + random.uniform(-0.001, 0.001)
                    new_loc = json.dumps({"lat": lat, "lng": lng})
                    
                    cur.execute("UPDATE drones SET last_known_location = %s, updated_at = NOW() WHERE id = %s", (new_loc, drone_id))
                
                # Random Detection (10% chance per tick)
                if random.random() < 0.1:
                    obj = random.choice(["AK-47", "RPG-7", "Unknown Individual", "Armored Vehicle"])
                    conf = random.randint(70, 99)
                    
                    # Insert Detection
                    bbox = json.dumps({"x": 100, "y": 100, "w": 50, "h": 50})
                    cur.execute("""
                        INSERT INTO ai_detections (drone_id, detected_object, confidence, bounding_box, detected_at)
                        VALUES (%s, %s, %s, %s, NOW())
                        RETURNING id
                    """, (drone_id, obj, conf, bbox))
                    new_id = cur.fetchone()[0]
                    print(f"New Detection: {obj} ({conf}%) by {name}")

            conn.commit()
            cur.close()
            conn.close()

        except Exception as e:
            print(f"Simulation Error: {e}")

        # Tick rate
        time.sleep(2)

if __name__ == "__main__":
    main()
