import Link from "next/link";

const quickActions = [
  {
    title: "Register Subject",
    description: "Capture an embedding bundle and store the Pedersen commitments.",
    href: "/register",
  },
  {
    title: "Request Proof",
    description: "Generate a Groth16-style payload with the local prover stub.",
    href: "/authenticate",
  },
  {
    title: "Monitor Pipeline",
    description: "Inspect proving latency, totals, and latest outcomes.",
    href: "/metrics",
  },
];

const checklist = [
  "Run the backend service locally (default http://localhost:4000).",
  "Configure NEXT_PUBLIC_API_BASE_URL if tunnelling or changing ports.",
  "Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for RainbowKit wallet support.",
  "Prepare sample embeddings (JSON, CSV, or text) for demo flows.",
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="glass-card relative overflow-hidden px-8 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.25),transparent_55%)]" />
        <div className="relative flex flex-col gap-6">
          <span className="tag w-fit">Own Your Face Before Own Your Data</span>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Launch the <span className="gradient-text">OwnFace</span> authentication flow
            </h1>
            <p className="text-base text-slate-200/80">
              Drive the zero-knowledge biometric login experience with OwnFace. Capture embeddings,
              wrap them in commitments, request proofs from the local worker, and benchmark the
              pipeline before wiring in the on-chain verifier.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/40 transition hover:shadow-violet-500/60"
            >
              Start with Registration
            </Link>
            <Link
              href="/metrics"
              className="inline-flex items-center justify-center rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
            >
              View Pipeline Metrics
            </Link>
          </div>
          <div className="grid gap-4 border-t border-white/10 pt-6 md:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-white/25 hover:bg-white/10"
              >
                <h3 className="text-sm font-semibold text-white group-hover:text-[color:var(--primary-bright)]">
                  {action.title}
                </h3>
                <p className="mt-2 text-xs text-slate-300/90">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <div className="glass-card relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.22),transparent_60%)]" />
          <div className="relative space-y-4">
            <h2 className="text-xl font-semibold text-white">Implementation Stages</h2>
            <p className="text-sm text-slate-300/90">
              The console mirrors the OwnFace workflow so you can demonstrate concepts quickly:
            </p>
            <ol className="space-y-3 text-sm text-slate-200/85">
              <li>
                <span className="font-semibold text-[color:var(--primary-bright)]">Registration</span>: capture
                embeddings, compute Pedersen commitments, and persist commitments via the backend.
              </li>
              <li>
                <span className="font-semibold text-[color:var(--primary-bright)]">Proof Generation</span>: invoke
                the local Groth16 stub, assemble Γ payloads, and prepare calldata for the contract.
              </li>
              <li>
                <span className="font-semibold text-[color:var(--primary-bright)]">Verification &amp; Metrics</span>:
                monitor proving performance while the smart contract implementation is in progress.
              </li>
            </ol>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white">Environment Checklist</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-200/90">
            {checklist.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/5 px-4 py-3"
              >
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[color:var(--primary-bright)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
