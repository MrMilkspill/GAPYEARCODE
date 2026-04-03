# PreMed Gap Year Predictor

This repo is now split into a frontend and backend:

```text
.
├─ frontend/   Next.js client app
└─ backend/    FastAPI API
```

The frontend keeps the existing UI and page flow. Authentication is handled with Supabase magic links. Profile CRUD, readiness scoring, and Mistral analysis now live in the Python backend.

## Architecture

- `frontend/`
  - Next.js 14 App Router
  - Tailwind CSS and shadcn/ui
  - Supabase browser auth with magic-link login
  - Client-side API calls to the FastAPI backend
- `backend/`
  - FastAPI
  - Supabase Auth token verification
  - Supabase-backed profile storage via a `profiles` table
  - Mistral integration with a prompt file at `backend/app/prompts/system_prompt.txt`

## Frontend setup

1. Copy [frontend/.env.example](/c:/Users/cspn_/OneDrive/Documents/GAPYEARCODE/frontend/.env.example) to `frontend/.env`.
2. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_BACKEND_API_URL`
3. Install dependencies:

```bash
cd frontend
npm install
```

4. Start the frontend:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

## Backend setup

1. Copy [backend/.env.example](/c:/Users/cspn_/OneDrive/Documents/GAPYEARCODE/backend/.env.example) to `backend/.env`.
2. Fill in:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_ORIGINS`
   - `MISTRAL_API_KEY`
   - `MISTRAL_MODEL` if you want a different Mistral model
3. Create a virtual environment and install dependencies:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

4. Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend exposes:

- `GET /health`
- `POST /chat`
- `GET /profiles`
- `POST /profiles`
- `GET /profiles/{id}`
- `PATCH /profiles/{id}`
- `DELETE /profiles/{id}`
- `GET /profiles/{id}/ai-analysis`

## Render deployment

The repo includes a Render Blueprint file at [render.yaml](/c:/Users/cspn_/OneDrive/Documents/GAPYEARCODE/render.yaml) for the FastAPI backend.

1. Push this repo to GitHub.
2. In Render, create a new Blueprint instance or Web Service from the repo.
3. Render will detect the backend service from `render.yaml`.
4. Set these environment variables in Render before deploying:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_ORIGINS`
   - `MISTRAL_API_KEY`
5. Use your frontend URL in `ALLOWED_ORIGINS`.

The backend start command used by Render is:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Supabase setup

1. Create a Supabase project.
2. Enable Email auth and Magic Link sign-in in Supabase Auth.
3. Add your local callback URL in Supabase Auth redirect settings:

```text
http://localhost:3000/auth/callback
```

4. Run the SQL in [backend/app/sql/supabase_profiles.sql](/c:/Users/cspn_/OneDrive/Documents/GAPYEARCODE/backend/app/sql/supabase_profiles.sql) inside the Supabase SQL editor to create the `profiles` table and policies.

The frontend uses the anon key for auth. The backend uses the service role key for profile storage access.

## Mistral prompt

The backend system prompt is stored in:

- [backend/app/prompts/system_prompt.txt](/c:/Users/cspn_/OneDrive/Documents/GAPYEARCODE/backend/app/prompts/system_prompt.txt)

`POST /chat` and the profile analysis route both load this file at runtime so the model behavior stays outside the route definitions.

## Notes

- Prisma has been removed.
- Next.js API routes have been removed.
- The old credentials auth flow has been removed.
- The remaining scoring methodology pages in the frontend still render from the static benchmark/source data files used for the UI.
