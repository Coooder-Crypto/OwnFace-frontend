"use client";

import { FormEvent, useState } from "react";
import { postJson } from "@/lib/api";
import { fileToBase64 } from "@/lib/file";
import { ResponsePanel } from "@/components/response-panel";

interface RegisterResponse {
  userId: string;
  commitment: string;
  nonce: string;
  [key: string]: unknown;
}

export default function RegisterPage() {
  const [userId, setUserId] = useState("");
  const [note, setNote] = useState("");
  const [embeddingFile, setEmbeddingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<RegisterResponse | undefined>();
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
        note: note || undefined,
      };

      if (embeddingFile) {
        payload.embedding = await fileToBase64(embeddingFile);
        payload.embeddingName = embeddingFile.name;
        payload.embeddingType = embeddingFile.type;
      }

      const result = await postJson<RegisterResponse>("/register", payload);
      setStatus(result.status);

      if (!result.ok) {
        setError(result.error ?? "Registration failed");
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_55%)]" />
        <div className="relative space-y-3">
          <span className="tag">Step 1 · Registration</span>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Capture embeddings and mint <span className="gradient-text">Pedersen commitments</span>
          </h1>
          <p className="max-w-2xl text-sm text-slate-300/85">
            Upload a quantised biometric vector or let the backend mock one for you. The response
            returns the commitment bundle plus a nonce required for downstream authentication.
          </p>
          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Inputs</div>
              <div className="mt-1 text-sm text-white">User identifier + embedding file</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Backend</div>
              <div className="mt-1 text-sm text-white">Computes commitment vector + nonce</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Output</div>
              <div className="mt-1 text-sm text-white">Persist for chain registration</div>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="glass-card space-y-6 border border-white/12 px-6 py-7"
      >
        <div className="grid gap-4 md:grid-cols-2">
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
            Optional note
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. registration camera #1"
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
              onChange={(event) => {
                setEmbeddingFile(event.target.files?.[0] ?? null);
              }}
              className="rounded-lg border border-dashed border-white/20 bg-white/5 px-3 py-4 text-sm text-slate-200 outline-none transition hover:border-white/40"
            />
          </label>
          <p className="mt-2 text-xs text-slate-400/90">
            Provide a quantised embedding for realistic output. When omitted, the backend produces a
            demo payload using seeded randomness.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !userId}
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/40 transition hover:shadow-violet-500/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Register User"}
        </button>
      </form>

      <ResponsePanel
        title="Backend Response"
        data={response}
        error={error}
        status={status}
        loading={loading}
      />
    </div>
  );
}
