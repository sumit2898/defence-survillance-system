# Autonomous Shield - Release Notes v1.0.0

## 🚀 Key Features
- **Real-time AI Detection**: Integrated YOLOv8 simulation with WebSocket broadcasting.
- **Live Dashboard**: React-based tactical map with heatmap and threat overlays.
- **Fleet Command**: Role-based access to "Emergency Recall" functionality.
- **Database Hardening**: Native PostgreSQL audit logging and triggers.
- **Docker Ready**: Full containerization support via `docker-compose`.

## 🛠️ Deployment
### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 16
- Docker (Optional)

### Quick Start (Local)
1.  **Install Dependencies**:
    ```bash
    npm install
    cd ai-service && pip install -r requirements.txt
    ```
2.  **Run Application**:
    ```bash
    npm run dev
    # In parallel terminal:
    python ai-service/continuous_simulation.py
    ```

### Quick Start (Docker)
```bash
docker-compose up --build
```

## 🧪 Testing
Run the full test suite:
```bash
npm test
```

## 🔒 Security
- **Audit Logs**: All critical data changes are logged to `audit_logs`.
- **Role-Based Access**: Commander/Analyst roles enforced at API layer.
