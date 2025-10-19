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
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pipeline Metrics</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Observability view for the local backend. Use this dashboard to monitor proof
            latency, throughput, and recent outcomes during the hackathon demo.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMetrics}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

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

      <div className="text-xs text-slate-400">
        {lastUpdated
          ? `Last updated ${lastUpdated.toLocaleTimeString()}`
          : "No data fetched yet"}
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow shadow-slate-950/40">
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-100">{value}</div>
    </div>
  );
}
