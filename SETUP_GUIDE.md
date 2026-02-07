# Autonomous Shield - Setup Guide

Follow these steps to run the project on a new machine.

## Prerequisites
1.  **Node.js** (v18 or higher)
2.  **Python** (v3.10 or higher)
3.  **Git**

## 1. Clone the Repository
```bash
git clone <your-repo-url>
cd autonomous-shield
```

## 2. Setup AI Service (Backend)
Open a terminal in the `ai-service` folder:
```bash
cd ai-service
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Run the Service
```bash
python main.py
```
*The service will start on http://localhost:8000*

## 3. Setup Client (Frontend)
Open a **new** terminal in the `client` folder:
```bash
cd client
```

### Install Dependencies
```bash
npm install
```

### Run the Client
```bash
npm run dev
```
*The dashboard will open at http://localhost:5173 (or similar)*

## Troubleshooting
-   **Camera Issue:** If the camera doesn't start, check `ai-service/main.py` and set `VIDEO_SOURCE = 0`.
-   **Missing C++ Tools:** If `dlib` or `face_recognition` fails to install, you may need "Visual Studio C++ Build Tools".
