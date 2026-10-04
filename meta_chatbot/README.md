# Gemini Programming Assistant

A complete local programming chatbot using:
- FastAPI backend
- Google Gemini API
- HTML/CSS/JavaScript frontend

## Windows setup

1. Install Python 3.10+.
2. Open PowerShell in this project folder.
3. Create a virtual environment:

   python -m venv venv

4. Activate it:

   .\venv\Scripts\Activate.ps1

5. Install dependencies:

   pip install -r backend\requirements.txt

6. Copy `backend\.env.example` to `backend\.env`.

7. Put your Gemini API key in `backend\.env`:

   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

8. Start the backend:

   cd backend
   uvicorn app:app --reload

9. Open another PowerShell window and start the frontend:

   cd frontend
   python -m http.server 5500

10. Open:

   http://127.0.0.1:5500

Backend API:
http://127.0.0.1:8000

Swagger:
http://127.0.0.1:8000/docs

## Important

Never put your Gemini API key in frontend JavaScript or commit `backend/.env` to GitHub.
