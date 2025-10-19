export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-slate-950/50">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to BioZero</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          This console drives the BioZero hackathon demo. Use it to register users,
          request authentication proofs, and inspect telemetry from the local proving
          service. The current build prioritizes end-to-end flow; zk verification and
          biometric models are simplified but the interfaces mirror the paper.
        </p>
        <dl className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              1. Capture &amp; Register
            </dt>
            <dd className="mt-2 text-sm text-slate-200">
              Use the Register flow to send an embedding payload to the backend. The response
              returns commitment metadata and a fresh nonce stored on-chain.
            </dd>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              2. Generate Proof
            </dt>
            <dd className="mt-2 text-sm text-slate-200">
              The Authenticate page calls the local prover, receives a structured proof package,
              and relays it to the contract runner (coming next).
            </dd>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              3. Inspect Metrics
            </dt>
            <dd className="mt-2 text-sm text-slate-200">
              Metrics aggregates latency, proof counts, and latest outcomes so we can benchmark
              the pipeline during the demo.
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-lg shadow-slate-950/40">
        <h2 className="text-xl font-semibold text-slate-100">Before You Start</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
          <li>Ensure the backend service is running locally (default base URL: <code className="rounded bg-slate-800 px-2 py-1 text-xs">http://localhost:4000</code>).</li>
          <li>Set <code className="rounded bg-slate-800 px-2 py-1 text-xs">NEXT_PUBLIC_API_BASE_URL</code> if you use a different port or tunnel.</li>
          <li>Keep your wallet connected in the browser; contract interactions will attach in the next milestone.</li>
          <li>Use small sample files for embeddings—JSON or plain text is sufficient for the mock prover.</li>
        </ul>
      </section>
    </div>
  );
}
