import psycopg2
import json
import os
import uuid
import datetime

# Mock DB Connection (Matches server/db.ts)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5000")
DB_NAME = os.getenv("DB_NAME", "mydb")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "sk12346@")

def simulate_detection():
    print(f"Connecting to DB: {DB_HOST}:{DB_PORT}/{DB_NAME} as {DB_USER}")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()

        # 1. Get an Active Drone ID
        cur.execute("SELECT id FROM drones WHERE status = 'ACTIVE' LIMIT 1;")
        drone_row = cur.fetchone()
        
        if not drone_row:
            print("No ACTIVE drones found. Activating one for simulation...")
            cur.execute("UPDATE drones SET status = 'ACTIVE' WHERE id = (SELECT id FROM drones LIMIT 1) RETURNING id;")
            drone_row = cur.fetchone()
            conn.commit()
            
        drone_id = drone_row[0]
        print(f"Assigning detection to Drone: {drone_id}")

        # 2. Insert Fake Detection
        mock_bbox = json.dumps({"x": 100, "y": 100, "w": 50, "h": 80})
        
        cur.execute("""
            INSERT INTO ai_detections (drone_id, detected_object, confidence, bounding_box, detected_at)
            VALUES (%s, %s, %s, %s, NOW())
            RETURNING id;
        """, (drone_id, "AK-47 (SIMULATED)", 95, mock_bbox))
        
        new_id = cur.fetchone()[0]
        conn.commit()
        
        print(f"SUCCESS: Successfully inserted Simulated Detection. ID: {new_id}")

        # 3. Verify Insertion
        cur.execute("SELECT * FROM ai_detections WHERE id = %s", (new_id,))
        verify_row = cur.fetchone()
        print(f"Verify Row: {verify_row}")

        conn.close()

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    simulate_detection()
