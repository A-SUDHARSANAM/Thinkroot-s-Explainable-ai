# Explainable Document Forensics AI

Full-stack web application for explainable document forgery detection.

## Stack
- Frontend: React + Tailwind CSS
- Backend: Flask (Python)
- ML Processing: OpenCV, EasyOCR, NumPy

## Features
- Dark dashboard UI with sidebar navigation
- Document upload with drag-and-drop and file validation (max 10MB)
- Explainable forgery analysis with suspicious-region overlays
- Document comparison using pixel diff and OCR text similarity
- History tracking with search and clear actions
- PDF report generation for analysis results
- Demo mode support through backend/demo_samples

## API Endpoints
- POST /api/upload
- POST /api/analyze
- POST /api/compare
- GET /api/history
- DELETE /api/history

## Backend Setup
1. Open a terminal in backend folder.
2. Create and activate a Python environment.
3. Install dependencies:
   pip install -r requirements.txt
4. Run:
   python run.py

Backend runs on http://localhost:5000

## Frontend Setup
1. Open a terminal in frontend folder.
2. Install dependencies:
   npm install
3. Run development server:
   npm run dev

Frontend runs on http://localhost:5173

## Notes
- Uploads are stored temporarily in backend/uploads.
- Generated reports are saved in backend/reports.
- Add demo files to backend/demo_samples for demo mode.
- For heavy OCR workloads, first model initialization can take extra time.
