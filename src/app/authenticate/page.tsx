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
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Authenticate Subject
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Upload a fresh embedding or capture data from the device, submit it to the backend,
          and collect the proof package that will later be relayed to the on-chain verifier.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-slate-950/40"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm text-slate-200 sm:col-span-1">
            User ID
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              required
              placeholder="alice@example"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-offset-slate-900 transition focus:border-slate-500 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200 sm:col-span-1">
            Nonce (optional)
            <input
              type="text"
              value={nonce}
              onChange={(event) => setNonce(event.target.value)}
              placeholder="nonce from register"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-offset-slate-900 transition focus:border-slate-500 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200 sm:col-span-1">
            Optional note
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="test run description"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-offset-slate-900 transition focus:border-slate-500 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
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
              className="rounded-md border border-dashed border-slate-700 bg-slate-950 px-3 py-4 text-slate-300 outline-none transition hover:border-slate-500"
            />
          </label>
          <p className="mt-2 text-xs text-slate-400">
            Provide the fresh embedding to compare against the commitment. The backend can
            generate placeholder vectors if omitted.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !userId}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700"
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
