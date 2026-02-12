
import psycopg2
import json
import os
import time

# Connection to Autonomous Shield DB
# Defaulting to the connection string used in Node.js .env, but adapted for Python if needed
# The user provided: "dbname=shield user=operator password=xxxx host=localhost"
# We will use os.getenv to make it configurable, with a fallback that matches our local dev environment.
# Note: In our current dev setup, the DB url is postgresql://postgres:sk12346%40@localhost:5000/mydb
# We need to parse this or pass params. For simplicity in this script, we'll parse a standard Postgres URL or use individual env vars.

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432") # Standard PG port, but wait, our docker/dev setup might be different. 
# In the previous turn, we saw DATABASE_URL=postgresql://postgres:sk12346%40@localhost:5000/mydb
# So the port is 5000 (which we know is actually Postgres, and we moved Node to 3000).

DB_NAME = os.getenv("DB_NAME", "mydb")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "sk12346@")

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        return conn
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        return None

def save_detection(drone_id, results):
    """
    Ingests YOLOv8 results into the database.
    """
    conn = get_db_connection()
    if not conn:
        return

    try:
        cur = conn.cursor()
        
        # results is a list of Results objects from YOLOv8
        for result in results:
            # result.boxes is a Boxes object
            # We iterate through each box
            for box in result.boxes:
                # xywh: [x_center, y_center, width, height]
                xywh = box.xywh.tolist()[0] 
                
                # Class index and name
                cls_id = int(box.cls[0].item())
                label = result.names[cls_id]
                
                # Confidence score
                conf = float(box.conf[0].item())

                # Filter low confidence
                if conf > 0.5:
                    # Insert into DB
                    # We store bbox as a straight JSON array or object. 
                    # Schema says: boundingBox jsonb
                    bbox_json = json.dumps({
                        "x": xywh[0], 
                        "y": xywh[1], 
                        "w": xywh[2], 
                        "h": xywh[3]
                    })
                    
                    cur.execute("""
                        INSERT INTO ai_detections (drone_id, detected_object, confidence, bounding_box)
                        VALUES (%s, %s, %s, %s)
                    """, (drone_id, label, int(conf * 100), bbox_json))
        
        conn.commit()
        cur.close()
        conn.close()
        print(f"Ingested detections for drone {drone_id}")

    except Exception as e:
        print(f"Error saving detection: {e}")
        if conn:
            conn.rollback()
            conn.close()

# Example usage (Mocking YOLOv8 result structure for testing)
if __name__ == "__main__":
    # Mock class to simulate YOLOv8 Result object
    class MockBox:
        def __init__(self, xywh, cls, conf):
            self.xywh = xywh # tensor-like object
            self.cls = cls
            self.conf = conf

    class MockResult:
        def __init__(self, boxes, names):
            self.boxes = boxes
            self.names = names

    # Mock Tensor-like behavior
    import collections
    Tensor = collections.namedtuple('Tensor', ['tolist', 'item'])
    
    # Create a dummy detection
    # Drone ID should be a valid UUID from the DB. 
    # For testing, we might fail foreign key constraint if we don't use a real one.
    # We will just print usage here.
    print("Ingestion script ready. Import 'save_detection' to use.")
