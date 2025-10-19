## BioZero Frontend Console

Next.js app for the BioZero hackathon demo. The console orchestrates the flow between browser, local backend prover, and (soon) on-chain verifier.

### Features
- Overview page summarising the workflow and setup steps.
- Register form for uploading biometric embeddings to the backend.
- Authenticate form for requesting proofs with new embeddings.
- Metrics dashboard pulling aggregated stats from `/metrics`.
- Reusable response panel for inspecting raw backend payloads.

### Requirements
- Node.js 18+.
- Local backend service reachable at `http://localhost:4000` (override with `NEXT_PUBLIC_API_BASE_URL`).

### Getting Started
1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env.local` and adjust `NEXT_PUBLIC_API_BASE_URL` if your backend runs elsewhere.
3. Start the dev server: `npm run dev`.
4. Visit [http://localhost:3000](http://localhost:3000).

### Code Map
- `src/app/page.tsx`: Workflow overview.
- `src/app/register/page.tsx`: Registration UI.
- `src/app/authenticate/page.tsx`: Proof request UI.
- `src/app/metrics/page.tsx`: Metrics dashboard.
- `src/lib/api.ts`: REST helpers with base URL management.
- `src/components/response-panel.tsx`: JSON viewer for API responses.

### Styling & Linting
Tailwind (via `@tailwindcss/postcss`) drives styling. Run `npm run lint` before submitting changes.
