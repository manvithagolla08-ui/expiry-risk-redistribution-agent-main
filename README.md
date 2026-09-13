# SH-204 Expiry Risk & Redistribution Agent

## Overview
The Expiry Risk & Redistribution Agent is a modern web application designed to optimize warehouse inventory, minimize waste, and streamline supply chains. It analyzes inventory batches for expiry risks, forecasts demand, and recommends optimal inter-warehouse redistributions.

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend:** Python, FastAPI, Pydantic, Uvicorn
- **Data/AI:** pandas, NumPy, scikit-learn (planned)
- **Database:** Supabase PostgreSQL
- **Generative AI:** Gemini API (planned)

## Project Structure
- `frontend/`: React Vite application
- `backend/`: FastAPI Python application
- `docs/`: Architecture and SQL Schema documentation

## Database Setup (Phase 2)
1. Create a Supabase project at https://supabase.com.
2. In the Supabase SQL Editor, run the schema defined in `docs/schema.sql`.
3. Add your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the `backend/.env` file.
   - Do **NOT** expose these in the frontend.
4. Run the seed script to populate realistic mock data:
   ```bash
   cd backend
   python seed.py
   ```
5. Verify that tables contain data via the Supabase Dashboard.

## Local Development

### Backend Setup
```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r backend\requirements.txt
cd backend
uvicorn app.main:app --reload
```
The backend will be available at `http://localhost:8000`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.
