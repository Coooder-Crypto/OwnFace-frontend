"use client";

import { useMemo } from "react";

interface ResponsePanelProps {
  title: string;
  data?: unknown;
  error?: string;
  status?: number;
  loading?: boolean;
}

export function ResponsePanel({
  title,
  data,
  error,
  status,
  loading,
}: ResponsePanelProps) {
  const body = useMemo(() => {
    if (loading) {
      return "Awaiting response...";
    }

    if (error) {
      return error;
    }

    if (data === undefined) {
      return "No response yet.";
    }

    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data, error, loading]);

  return (
    <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>{title}</span>
        {status !== undefined && (
          <span className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300">
            status {status}
          </span>
        )}
      </div>
      <pre className="max-h-60 overflow-auto rounded-lg bg-slate-900/70 p-4 text-xs text-slate-200">
        {body}
      </pre>
    </div>
  );
}
