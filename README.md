## OwnFace Frontend Console

OwnFace 的官方演示控制台，Slogan：**Own Your Face Before Own Your Data**。应用负责串联浏览器、后端证明服务和（即将上线的）链上验证器。

### Features
- Overview page summarising the workflow and setup steps.
- Register form可上传文件或使用摄像头捕获图像，发送到后端并可选同步链上。
- Authenticate form 同样支持摄像头捕获，获取 Groth16 证明并提交合约。
- Metrics dashboard pulling aggregated stats from `/metrics`.
- Reusable response panel for inspecting raw backend payloads.

### Requirements
- Node.js 18+.
- Local backend service reachable at `http://localhost:4000` (override with `NEXT_PUBLIC_API_BASE_URL`).
- WalletConnect project ID for RainbowKit (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`).
- Sepolia RPC endpoint if you plan to hit testnet (`NEXT_PUBLIC_SEPOLIA_RPC_URL`).
- OwnFaceRegistry 合约地址 (`NEXT_PUBLIC_REGISTRY_ADDRESS`).

### Getting Started
1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env.local` and adjust `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, and `NEXT_PUBLIC_SEPOLIA_RPC_URL` as needed.
3. Start the dev server: `npm run dev`.
4. Visit [http://localhost:3000](http://localhost:3000).

### Code Map
- `src/app/page.tsx`: Workflow overview.
- `src/app/register/page.tsx`: Registration UI.
- `src/app/authenticate/page.tsx`: Proof request UI.
- `src/app/metrics/page.tsx`: Metrics dashboard.
- `src/lib/api.ts`: REST helpers with base URL management.
- `src/lib/contracts.ts`: ABI 常量，提供链上调用参数。
- `src/components/RainbowKitProvider.tsx`: Wallet configuration (RainbowKit + Wagmi + React Query).
- `src/components/layout/Header.tsx`: Top navigation with RainbowKit connect button.
- `src/components/camera-capture.tsx`: 浏览器摄像头组件，输出 Base64 图像。
- `src/components/response-panel.tsx`: JSON viewer for API responses.

### Styling & Linting
Tailwind (via `@tailwindcss/postcss`) drives styling. Run `npm run lint` before submitting changes.
