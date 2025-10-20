"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { keccak256, stringToBytes, isHex } from "viem";
import { postJson } from "@/lib/api";
import { fileToBase64 } from "@/lib/file";
import { ResponsePanel } from "@/components/response-panel";
import { CameraCapture } from "@/components/camera-capture";
import { registryAbi } from "@/lib/contracts";

interface AuthResponse {
  userId: string;
  status: "accepted" | "rejected" | string;
  distance: number;
  threshold: number;
  transcriptDigest: string;
  transcriptHash?: string;
  referenceHash?: string;
  candidateHash?: string;
  commitmentHash: string;
  commitmentPoint: string;
  proofHash: string;
  proof: unknown;
  publicSignals: string[];
  [key: string]: unknown;
}

function parseGroth16Proof(proof: unknown) {
  if (!proof || typeof proof !== "object") {
    throw new Error("Missing Groth16 proof payload");
  }

  const payload = proof as {
    pi_a: [string, string, string?];
    pi_b: [[string, string], [string, string], [string, string]?];
    pi_c: [string, string, string?];
  };

  if (!Array.isArray(payload.pi_a) || !Array.isArray(payload.pi_b) || !Array.isArray(payload.pi_c)) {
    throw new Error("Invalid Groth16 proof format");
  }

  const proofA: [bigint, bigint] = [BigInt(payload.pi_a[0]), BigInt(payload.pi_a[1])];
  const proofB: [[bigint, bigint], [bigint, bigint]] = [
    [BigInt(payload.pi_b[0][0]), BigInt(payload.pi_b[0][1])],
    [BigInt(payload.pi_b[1][0]), BigInt(payload.pi_b[1][1])],
  ];
  const proofC: [bigint, bigint] = [BigInt(payload.pi_c[0]), BigInt(payload.pi_c[1])];

  return { proofA, proofB, proofC };
}

export default function AuthenticatePage() {
  const [userId, setUserId] = useState("");
  const [nonce, setNonce] = useState("");
  const [note, setNote] = useState("");
  const [embeddingFile, setEmbeddingFile] = useState<File | null>(null);
  const [cameraData, setCameraData] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "camera">("upload");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AuthResponse | undefined>();
  const [status, setStatus] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [txError, setTxError] = useState<string | undefined>(undefined);

  const registryAddress = useMemo(() => {
    const value = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
    if (!value || !isHex(value)) {
      return undefined;
    }
    return value as `0x${string}`;
  }, []);

  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { status: txStatus, data: txReceipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    setResponse(undefined);
    setStatus(undefined);
    setTxError(undefined);
    setTxHash(undefined);
    try {
      const payload: Record<string, unknown> = {
        userId,
        nonce: nonce || undefined,
        note: note || undefined,
      };

      if (mode === "camera") {
        if (!cameraData) {
          setError("请先使用摄像头捕获图像。");
          setLoading(false);
          return;
        }
        payload.embedding = cameraData;
        payload.embeddingType = "camera/jpeg";
      } else if (embeddingFile) {
        payload.embedding = await fileToBase64(embeddingFile);
        payload.embeddingName = embeddingFile.name;
        payload.embeddingType = embeddingFile.type;
      } else {
        setError("请提供 embedding 文件或使用摄像头捕获。");
        setLoading(false);
        return;
      }

      const result = await postJson<AuthResponse>("/authenticate", payload);
      setStatus(result.status);

      if (!result.ok) {
        setError(result.error ?? "Authentication failed");
        return;
      }

      setResponse(result.data);

      if (
        registryAddress &&
        isConnected &&
        result.data.proof &&
        result.data.proofHash &&
        Array.isArray(result.data.publicSignals) &&
        result.data.publicSignals.length === 6
      ) {
        try {
          const { proofA, proofB, proofC } = parseGroth16Proof(result.data.proof);
          const publicInputs: [bigint, bigint, bigint, bigint, bigint, bigint] = [
            BigInt(result.data.publicSignals[0]),
            BigInt(result.data.publicSignals[1]),
            BigInt(result.data.publicSignals[2]),
            BigInt(result.data.publicSignals[3]),
            BigInt(result.data.publicSignals[4]),
            BigInt(result.data.publicSignals[5]),
          ];

          const tx = await writeContractAsync({
            address: registryAddress,
            abi: registryAbi,
            functionName: "authenticate",
            args: [
              keccak256(stringToBytes(userId)),
              result.data.proofHash as `0x${string}`,
              proofA,
              proofB,
              proofC,
              publicInputs,
            ],
          });
          setTxHash(tx);
        } catch (chainErr) {
          const message =
            chainErr instanceof Error ? chainErr.message : "合约调用失败";
          setTxError(message);
        }
      }
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
            package that will later be relayed to the verifier contract.
          </p>
        </div>
      </section>

      <section className="glass-card space-y-4 border border-white/12 px-6 py-6">
        <div className="flex items-center gap-3 text-sm text-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode("upload");
              setCameraData(null);
            }}
            className={`rounded-lg px-3 py-1.5 transition ${
              mode === "upload"
                ? "bg-white/15 text-white shadow shadow-sky-500/30"
                : "border border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            上传文件
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("camera");
              setEmbeddingFile(null);
            }}
            className={`rounded-lg px-3 py-1.5 transition ${
              mode === "camera"
                ? "bg-white/15 text-white shadow shadow-sky-500/30"
                : "border border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            摄像头捕获
          </button>
        </div>
        {mode === "camera" ? (
          <CameraCapture
            onCapture={(base64) => setCameraData(base64)}
            onClear={() => setCameraData(null)}
          />
        ) : (
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Embedding 文件
            <input
              type="file"
              accept=".json,.txt,.bin,.csv"
              onChange={(event) => setEmbeddingFile(event.target.files?.[0] ?? null)}
              className="rounded-lg border border-dashed border-white/20 bg-white/5 px-3 py-4 text-sm text-slate-200 outline-none transition hover:border-white/40"
            />
            <span className="text-xs text-slate-400/90">
              可上传量化后的 embedding；或切换到摄像头模式自动捕获图像。
            </span>
          </label>
        )}
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

        <button
          type="submit"
          disabled={loading || !userId}
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#6366f1] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/40 transition hover:shadow-sky-500/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Request Proof"}
        </button>
      </form>

      {registryAddress && (
        <div className="glass-card space-y-3 border border-white/12 px-6 py-5">
          <div className="text-sm font-semibold text-white">链上同步状态</div>
          {!isConnected && (
            <p className="text-xs text-slate-400">
              请连接钱包以调用合约：<code className="text-[10px]">{registryAddress}</code>
            </p>
          )}
          {txError && <p className="text-xs text-rose-400">合约调用失败：{txError}</p>}
          {txHash && (
            <div className="text-xs text-slate-300">
              交易 <code className="break-all text-[10px]">{txHash}</code>{" "}
              {txStatus === "pending" && <span className="text-amber-300">确认中…</span>}
              {txStatus === "success" && (
                <span className="text-emerald-400">
                  已确认（区块 {txReceipt?.blockNumber?.toString()})
                </span>
              )}
            </div>
          )}
        </div>
      )}

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
