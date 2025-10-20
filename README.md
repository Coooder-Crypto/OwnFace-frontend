## OwnFace Frontend

OwnFace lets users prove facial similarity with zero-knowledge proofs. The frontend coordinates camera/file capture, backend APIs, and smart-contract calls while keeping raw embeddings off-chain. Slogan: **Own Your Face Before Own Your Data**.

### Features
- Project overview page summarising the protocol, environment variables, and prerequisites.
- Auth workflow page combining registration and authentication in one place (file upload or camera capture plus one-click contract calls).
- Reusable utilities such as `CameraCapture` and `ResponsePanel` for inspecting backend payloads.

### Requirements
- Node.js 18+.
- Backend reachable at `http://localhost:4000` (override via `NEXT_PUBLIC_API_BASE_URL`).
- WalletConnect project ID (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`).
- Sepolia RPC endpoint (`NEXT_PUBLIC_SEPOLIA_RPC_URL`) if publishing to testnet.
- `OwnFaceRegistry` contract address (`NEXT_PUBLIC_REGISTRY_ADDRESS`).

### Getting Started
1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the environment variables above.
3. Start the dev server: `npm run dev`.
4. Open [http://localhost:3000](http://localhost:3000).

### Code Map
- `src/app/page.tsx`: project overview.
- `src/app/workflow/page.tsx`: combined registration + authentication workflow.
- `src/lib/api.ts`: REST helpers with base URL management.
- `src/lib/contracts.ts`: contract ABI constants.
- `src/components/RainbowKitProvider.tsx`: RainbowKit + Wagmi + React Query wiring.
- `src/components/layout/Header.tsx`: top navigation with wallet connect button.
- `src/components/camera-capture.tsx`: browser camera capture component.
- `src/components/response-panel.tsx`: JSON viewer for API responses.

### Styling & Linting
Tailwind (via `@tailwindcss/postcss`) drives styling. Run `npm run lint` before submitting changes.
