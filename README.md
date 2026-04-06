# PreMed Gap Year Predictor

This repo is now split into a frontend and backend:

```text
.
├─ frontend/   Next.js client app
└─ backend/    FastAPI API
```

The frontend keeps the existing UI and page flow. Authentication is handled with direct Supabase email/password sign-in, while account creation is proxied through the FastAPI backend so new accounts are auto-confirmed without an email verification step. Profile CRUD, readiness scoring, and Mistral analysis now live in the Python backend.

## Architecture

- `frontend/`
  - Next.js 14 App Router
  - Tailwind CSS and shadcn/ui
  - Supabase browser auth with direct email/password login
  - Client-side API calls to the FastAPI backend
- `backend/`
  - FastAPI
  - Account creation endpoint that auto-confirms Supabase users
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
   - `ALLOWED_ORIGIN_REGEX` if you want regex-based origin matching
   - `MISTRAL_API_KEY` if you want AI analysis enabled
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
- `POST /auth/register`
- `POST /chat`
- `GET /profiles`
- `POST /profiles`
- `GET /profiles/{id}`
- `PATCH /profiles/{id}`
- `DELETE /profiles/{id}`
- `GET /profiles/{id}/ai-analysis`

## Vercel deployment

This architecture needs two Vercel projects:

- `frontend/` as the Next.js app
- `backend/` as the FastAPI app

The current frontend project is linked under [frontend/.vercel/project.json](/c:/Users/cspn_/OneDrive/Documents/GAPYEARCODE/frontend/.vercel/project.json). The backend is not part of that deployment unless you create a second Vercel project whose root directory is `backend/`.

For the backend Vercel project:

1. Set the root directory to `backend`.
2. Add these env vars:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_ORIGINS`
   - `ALLOWED_ORIGIN_REGEX` if you want preview-domain support
   - `MISTRAL_API_KEY` if you want AI analysis enabled
3. The backend Vercel entrypoint is [backend/api/[...route].py](/c:/Users/cspn_/OneDrive/Documents/GAPYEARCODE/backend/api/[...route].py) with rewrites defined in [backend/vercel.json](/c:/Users/cspn_/OneDrive/Documents/GAPYEARCODE/backend/vercel.json).

For the frontend Vercel project:

1. Set the root directory to `frontend`.
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_BACKEND_API_URL`
3. Set `NEXT_PUBLIC_BACKEND_API_URL` to your deployed backend URL, not `http://localhost:8000`.

## Render deployment

The repo now includes [render.yaml](/c:/Users/cspn_/OneDrive/Documents/GAPYEARCODE/render.yaml) for deploying the FastAPI backend as a Render web service from this monorepo.

If you use Render Blueprints:

1. In Render, choose `New +` -> `Blueprint`.
2. Point it at this repository.
3. Render will create one web service named `gapyearcode-api` using `backend/` as the root directory.
4. Enter values for:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_ORIGINS`
   - `ALLOWED_ORIGIN_REGEX`
   - `MISTRAL_API_KEY` if you want AI analysis enabled
5. Deploy and confirm the health check succeeds at `/health`.

If you create the service manually instead of using the Blueprint:

1. Create a new Render Web Service.
2. Set the root directory to `backend`.
3. Runtime: `Python 3`.
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Health check path: `/health`
7. Add the same environment variables listed above.

## Supabase setup

1. Create a Supabase project.
2. Enable Email auth in Supabase Auth.
3. The app now creates accounts through `POST /auth/register`, which uses the backend service-role key to create and auto-confirm new users. No verification email is required for normal sign-up.
4. Run the SQL in [backend/app/sql/supabase_profiles.sql](/c:/Users/cspn_/OneDrive/Documents/GAPYEARCODE/backend/app/sql/supabase_profiles.sql) inside the Supabase SQL editor to create the `profiles` table and policies.

The frontend uses the anon key for auth. The backend uses the service role key for profile storage access.

## Mistral prompt

The backend system prompt is stored in:

- [backend/app/prompts/system_prompt.txt](/c:/Users/cspn_/OneDrive/Documents/GAPYEARCODE/backend/app/prompts/system_prompt.txt)

`POST /chat` and the profile analysis route both load this file at runtime so the model behavior stays outside the route definitions.

If `MISTRAL_API_KEY` is left blank, the backend still runs for auth, profile CRUD, and scoring. Only the AI analysis endpoints will be unavailable.

## Notes

- Prisma has been removed.
- Next.js API routes have been removed.
- Direct credentials auth is handled with Supabase plus a backend account-creation endpoint.
- The remaining scoring methodology pages in the frontend still render from the static benchmark/source data files used for the UI.
