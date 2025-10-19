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
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Register Subject</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Capture or upload a biometric embedding and send it to the backend. The service
          responds with the Pedersen commitment bundle and a nonce for future proofs.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-slate-950/40"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
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

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Optional note
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g., Registration camera 1"
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
              onChange={(event) => {
                setEmbeddingFile(event.target.files?.[0] ?? null);
              }}
              className="rounded-md border border-dashed border-slate-700 bg-slate-950 px-3 py-4 text-slate-300 outline-none transition hover:border-slate-500"
            />
          </label>
          <p className="mt-2 text-xs text-slate-400">
            Provide a quantized embedding file if available. When omitted, the backend will
            generate a demo vector.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !userId}
          className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
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
