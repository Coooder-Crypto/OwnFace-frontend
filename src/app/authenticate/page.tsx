"use client";

import { FormEvent, useState } from "react";
import { postJson } from "@/lib/api";
import { fileToBase64 } from "@/lib/file";
import { ResponsePanel } from "@/components/response-panel";

interface AuthResponse {
  userId: string;
  status: "accepted" | "rejected" | "pending" | string;
  distance?: number;
  [key: string]: unknown;
}

export default function AuthenticatePage() {
  const [userId, setUserId] = useState("");
  const [nonce, setNonce] = useState("");
  const [note, setNote] = useState("");
  const [embeddingFile, setEmbeddingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AuthResponse | undefined>();
  const [status, setStatus] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    setResponse(undefined);
    setStatus(undefined);
    try {
      const payload: Record<string, unknown> = {
        userId,
        nonce: nonce || undefined,
        note: note || undefined,
      };

      if (embeddingFile) {
        payload.embedding = await fileToBase64(embeddingFile);
        payload.embeddingName = embeddingFile.name;
        payload.embeddingType = embeddingFile.type;
      }

      const result = await postJson<AuthResponse>("/authenticate", payload);
      setStatus(result.status);

      if (!result.ok) {
        setError(result.error ?? "Authentication failed");
        return;
      }

      setResponse(result.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <section className="glass-card relative overflow-hidden px-6 py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.2),transparent_60%)]" />
        <div className="relative space-y-3">
          <span className="tag">Step 2 · Authentication</span>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Request a <span className="gradient-text">proof of proximity</span> to the enrolled vector
          </h1>
          <p className="max-w-2xl text-sm text-slate-300/85">
            Submit a fresh embedding, optionally provide the stored nonce, and receive the proof
            package that will later be relayed to the BioZero verifier contract.
          </p>
          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Challenge</div>
              <div className="mt-1 text-sm text-white">Fiat–Shamir nonce + embedding payload</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Prover</div>
              <div className="mt-1 text-sm text-white">Generates Γ fields + mock Groth16 proof</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Next</div>
              <div className="mt-1 text-sm text-white">Forward package to the contract runner</div>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="glass-card space-y-6 border border-white/12 px-6 py-7"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            User ID
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              required
              placeholder="alice@example"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/40"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Nonce (optional)
            <input
              type="text"
              value={nonce}
              onChange={(event) => setNonce(event.target.value)}
              placeholder="nonce from register"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/40"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Optional note
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="test run description"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/40"
            />
          </label>
        </div>

        <div>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Embedding file
            <input
              type="file"
              accept=".json,.txt,.bin,.csv"
              onChange={(event) => setEmbeddingFile(event.target.files?.[0] ?? null)}
              className="rounded-lg border border-dashed border-white/20 bg-white/5 px-3 py-4 text-sm text-slate-200 outline-none transition hover:border-white/40"
            />
          </label>
          <p className="mt-2 text-xs text-slate-400/90">
            Supply a fresh embedding for the comparison. Leave blank to let the backend seed a demo
            vector for faster iterations.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !userId}
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#6366f1] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/40 transition hover:shadow-sky-500/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Request Proof"}
        </button>
      </form>

      <ResponsePanel
        title="Prover Response"
        data={response}
        error={error}
        status={status}
        loading={loading}
      />
    </div>
  );
}
