"use client";

import { useCallback, useEffect, useState } from "react";
import { getJson } from "@/lib/api";
import { ResponsePanel } from "@/components/response-panel";

interface MetricsResponse {
  totalRegistered?: number;
  totalAuthentications?: number;
  averageProofMs?: number;
  lastProof?: Record<string, unknown>;
  [key: string]: unknown;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | undefined>();
  const [status, setStatus] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    const result = await getJson<MetricsResponse>("/metrics");
    setStatus(result.status);

    if (!result.ok) {
      setError(result.error ?? "Failed to fetch metrics");
      setMetrics(undefined);
      setLoading(false);
      return;
    }

    setMetrics(result.data);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics().catch((err) => {
      const message =
        err instanceof Error ? err.message : "Failed to fetch metrics.";
      setError(message);
      setLoading(false);
    });
  }, [fetchMetrics]);

  return (
    <div className="space-y-10">
      <section className="glass-card relative overflow-hidden px-6 py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_55%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <span className="tag">Step 3 · Observability</span>
            <h1 className="text-3xl font-semibold md:text-4xl">
              Monitor proving health and <span className="gradient-text">demo readiness</span>
            </h1>
            <p className="max-w-2xl text-sm text-slate-300/85">
              Track how many registrations and authentications have been processed, keep an eye on
              proof latency, and verify that the backend is delivering payloads before wiring the
              on-chain verifier.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchMetrics}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#6366f1] to-[#7c3aed] px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:shadow-indigo-500/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh metrics"}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Registered Subjects"
          value={
            metrics?.totalRegistered !== undefined
              ? metrics.totalRegistered
              : "—"
          }
        />
        <MetricCard
          label="Auth Attempts"
          value={
            metrics?.totalAuthentications !== undefined
              ? metrics.totalAuthentications
              : "—"
          }
        />
        <MetricCard
          label="Avg Proof Time (ms)"
          value={
            metrics?.averageProofMs !== undefined
              ? metrics.averageProofMs
              : "—"
          }
        />
      </section>

      <div className="glass-card border border-white/10 px-6 py-5 text-xs text-slate-300/90">
        {lastUpdated
          ? `Last updated ${lastUpdated.toLocaleTimeString()}`
          : "No metrics fetched yet"}
      </div>

      <ResponsePanel
        title="Raw Metrics Payload"
        data={metrics}
        error={error}
        status={status}
        loading={loading}
      />
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="glass-card border border-white/12 p-5">
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
