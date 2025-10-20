export default function Home() {
  return (
    <div className="space-y-10">
      <section className="glass-card relative overflow-hidden px-8 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.25),transparent_55%)]" />
        <div className="relative max-w-3xl space-y-6">
          <span className="tag w-fit">Own Your Face Before Own Your Data</span>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            OwnFace: Zero-Knowledge Face Auth
          </h1>
          <p className="text-base text-slate-200/80">
            OwnFace turns face embeddings into Pedersen commitments and Groth16 proofs.
            Proofs are generated off-chain and verified on Ethereum, so users can prove they
            match a registered face without revealing raw data.
          </p>
          <p className="text-sm text-slate-300/80">
            Before you start, run the backend at{" "}
            <span className="mx-1 inline-block rounded bg-black/40 px-1.5 py-0.5 text-xs text-slate-100">
              http://localhost:4000
            </span>
            and set <code className="ml-1 text-xs">NEXT_PUBLIC_API_BASE_URL</code>,
            <code className="ml-1 text-xs">NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</code>, and
            <code className="ml-1 text-xs">NEXT_PUBLIC_REGISTRY_ADDRESS</code> in `.env.local`.
          </p>
          <p className="text-sm text-slate-300/80">
            The workflow has two steps: register an embedding to obtain commitments,
            then request a Groth16 proof and push it on-chain. Use the navigation bar to
            open the Auth Workflow page when you are ready to demo.
          </p>
        </div>
      </section>
    </div>
  );
}
