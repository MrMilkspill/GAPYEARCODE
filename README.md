# PreMed Gap Year Predictor

PreMed Gap Year Predictor is a full-stack Next.js 14 application that helps a pre-med student compare their academic and extracurricular profile against common U.S. medical school applicant benchmarks and estimate whether they likely need no gap year, one gap year, or a longer runway before applying.

The app is intentionally transparent:

- It shows a weighted score breakdown instead of hiding the logic.
- It explains why a recommendation was made in plain English.
- It treats admissions as holistic and school-dependent.
- It does not claim to predict admission outcomes or guarantee acceptance.

## Tech stack

- Next.js 14 App Router with TypeScript
- Tailwind CSS
- shadcn/ui primitives
- PostgreSQL
- Prisma ORM
- NextAuth credentials auth
- Zod validation
- Recharts visualizations
- Vitest for basic testing

## Features

- Account creation and secure email/password login
- Full saved pre-med profile form with all requested sections
- Transparent readiness scoring engine with adjustable backend benchmark constants
- Gap year recommendation:
  - Likely no gap year needed
  - Likely 1 gap year recommended
  - Likely 2+ gap years recommended
- Plain-English explanation of strengths, weaknesses, and biggest next steps
- Dashboard with saved profile history
- Results page with charts, score breakdown, and improvement plan
- Methodology page that explains the heuristic model and disclaimers
- Seeded benchmark config plus demo profiles
- Print/export-friendly results action via browser print dialog

## Folder structure

```text
.
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ (protected)/
│  │  ├─ about/
│  │  ├─ api/
│  │  ├─ login/
│  │  ├─ globals.css
│  │  └─ layout.tsx
│  ├─ components/
│  │  ├─ auth/
│  │  ├─ dashboard/
│  │  ├─ forms/
│  │  ├─ layout/
│  │  └─ ui/
│  ├─ lib/
│  │  ├─ benchmarks/
│  │  ├─ prediction/
│  │  ├─ profiles/
│  │  ├─ scoring/
│  │  ├─ validation/
│  │  └─ ...
│  └─ types/
├─ docker-compose.yml
├─ prisma.config.ts
└─ .env.example
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

If you already have PostgreSQL locally, use that and set `DATABASE_URL` accordingly.

If not, the repo includes a Docker Compose file:

```bash
docker compose up -d
```

### 3. Create your environment file

Copy `.env.example` to `.env` and update values as needed.

Required variables:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/premed_gap_year_predictor?schema=public"
NEXTAUTH_SECRET="replace-with-a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secret with Node if needed:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run migrations

```bash
npx prisma migrate dev --name init
```

### 5. Seed demo data

```bash
npm run db:seed
```

Seeded demo login:

- Email: `demo@premedgapyearpredictor.com`
- Password: `GapYearDemo123`

### 6. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Core scripts

```bash
npm run dev
npm run lint
npm run test
npm run db:seed
npm run prisma:generate
npm run prisma:migrate
```

## Scoring model summary

Default category weights:

- Academics: 35%
- Clinical exposure: 20%
- Service: 15%
- Research: 10%
- Shadowing: 5%
- Leadership: 5%
- Employment/context: 5%
- Application readiness: 5%

Example benchmark logic baked into the app:

- GPA:
  - 3.80+ excellent
  - 3.65+ strong
  - 3.45+ moderate
- MCAT:
  - 515+ excellent
  - 510+ strong
  - 505+ moderate
- Clinical exposure:
  - 300+ strong
  - 150+ moderate
- Service:
  - 150+ strong
  - 75+ moderate
- Shadowing:
  - 40+ solid baseline
- Research:
  - 300+ stronger baseline
  - higher expectations if the student targets research-heavy schools

Contextual adjustments included in the engine:

- Upward academic trend boosts the academic category slightly
- Working during school adds contextual credit
- Strong service plus leadership can partly offset borderline areas
- Weak academics are capped so extracurricular strength cannot fully hide them
- DO-focused applications get a modest interpretation adjustment
- Research-heavy or service-heavy school preferences shift weights slightly

The source of truth for thresholds and weights lives in:

- `src/lib/benchmarks/defaults.ts`

The app also seeds a `BenchmarkConfig` database record so thresholds can be made editable later.

## Tests

Included tests cover:

- Readiness scoring behavior for stronger and weaker sample profiles
- A submission-path integration-style test that validates input and generates a stored result payload

Run them with:

```bash
npm run test
```

## Deployment to Vercel

1. Push the repository to GitHub.
2. Create a PostgreSQL database for production.
3. Add these environment variables in Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
4. Deploy the project.
5. Run Prisma migrations against the production database:

```bash
npx prisma migrate deploy
```

Notes:

- The app uses Next.js route handlers and Prisma, so it is deployment-ready for Vercel.
- Use a managed Postgres provider in production.
- Set `NEXTAUTH_URL` to your production domain.

## Important disclaimer

This application is a heuristic planning tool only. It does not guarantee medical school admission, and it should not replace direct advising, school-specific research, or broader judgment about school fit and application timing.
