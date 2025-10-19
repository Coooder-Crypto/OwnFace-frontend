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
    <div className="glass-card space-y-3 border border-white/10 p-4">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-300/80">
        <span>{title}</span>
        {status !== undefined && (
          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-slate-200">
            status {status}
          </span>
        )}
      </div>
      <pre className="max-h-60 overflow-auto rounded-lg border border-white/5 bg-black/60 p-4 text-xs text-lime-200/90 shadow-inner">
        {body}
      </pre>
    </div>
  );
}
