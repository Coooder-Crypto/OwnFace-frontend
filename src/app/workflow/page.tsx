"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { keccak256, stringToBytes, isHex } from "viem";
import { postJson } from "@/lib/api";
import { fileToBase64 } from "@/lib/file";
import { ResponsePanel } from "@/components/response-panel";
import { CameraCapture } from "@/components/camera-capture";
import { registryAbi } from "@/lib/contracts";

interface RegisterResponse {
  userId: string;
  commitmentHash: string;
  commitmentPoint: string;
  blinding: string;
  nonce: string;
  nonceHash: string;
  vectorLength: number;
  vectorChecksum: string;
  vectorHash?: string;
  vectorHashDecimal?: string;
  [key: string]: unknown;
}

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

export default function WorkflowPage() {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const registryAddress = useMemo(() => {
    const value = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
    if (!value || !isHex(value)) {
      return undefined;
    }
    return value as `0x${string}`;
  }, []);

  // Register states
  const [regUserId, setRegUserId] = useState("");
  const [regNote, setRegNote] = useState("");
  const [regEmbeddingFile, setRegEmbeddingFile] = useState<File | null>(null);
  const [regCameraData, setRegCameraData] = useState<string | null>(null);
  const [regMode, setRegMode] = useState<"upload" | "camera">("upload");
  const [regLoading, setRegLoading] = useState(false);
  const [regResponse, setRegResponse] = useState<RegisterResponse | undefined>();
  const [regStatus, setRegStatus] = useState<number | undefined>();
  const [regError, setRegError] = useState<string | undefined>();
  const [regTxHash, setRegTxHash] = useState<`0x${string}` | undefined>();
  const [regTxError, setRegTxError] = useState<string | undefined>();
  const {
    data: regTxReceipt,
    status: regTxStatus,
  } = useWaitForTransactionReceipt({
    hash: regTxHash,
  });

  // Auth states
  const [authUserId, setAuthUserId] = useState("");
  const [authNonce, setAuthNonce] = useState("");
  const [authNote, setAuthNote] = useState("");
  const [authEmbeddingFile, setAuthEmbeddingFile] = useState<File | null>(null);
  const [authCameraData, setAuthCameraData] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"upload" | "camera">("upload");
  const [authLoading, setAuthLoading] = useState(false);
  const [authResponse, setAuthResponse] = useState<AuthResponse | undefined>();
  const [authStatus, setAuthStatus] = useState<number | undefined>();
  const [authError, setAuthError] = useState<string | undefined>();
  const [authTxHash, setAuthTxHash] = useState<`0x${string}` | undefined>();
  const [authTxError, setAuthTxError] = useState<string | undefined>();
  const {
    data: authTxReceipt,
    status: authTxStatus,
  } = useWaitForTransactionReceipt({
    hash: authTxHash,
  });

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegLoading(true);
    setRegError(undefined);
    setRegResponse(undefined);
    setRegStatus(undefined);
    setRegTxError(undefined);
    setRegTxHash(undefined);

    try {
      const payload: Record<string, unknown> = {
        userId: regUserId,
        note: regNote || undefined,
      };

      if (regMode === "camera") {
        if (!regCameraData) {
          setRegError("Capture an image with the camera first.");
          setRegLoading(false);
          return;
        }
        payload.embedding = regCameraData;
        payload.embeddingType = "camera/jpeg";
      } else if (regEmbeddingFile) {
        payload.embedding = await fileToBase64(regEmbeddingFile);
        payload.embeddingName = regEmbeddingFile.name;
        payload.embeddingType = regEmbeddingFile.type;
      } else {
        setRegError("Provide an embedding file or capture a new sample.");
        setRegLoading(false);
        return;
      }

      const result = await postJson<RegisterResponse>("/register", payload);
      setRegStatus(result.status);

      if (!result.ok) {
        setRegError(result.error ?? "Registration failed");
        return;
      }

      setRegResponse(result.data);

      if (
        registryAddress &&
        isConnected &&
        result.data.commitmentHash &&
        result.data.nonceHash &&
        result.data.commitmentPoint &&
        result.data.blinding &&
        result.data.vectorHash
      ) {
        try {
          const tx = await writeContractAsync({
            address: registryAddress,
            abi: registryAbi,
            functionName: "register",
            args: [
              keccak256(stringToBytes(regUserId)),
              result.data.commitmentHash as `0x${string}`,
              result.data.nonceHash as `0x${string}`,
              result.data.commitmentPoint as `0x${string}`,
              result.data.blinding as `0x${string}`,
              BigInt(result.data.vectorHash as string),
            ],
          });
          setRegTxHash(tx);
        } catch (chainErr) {
          const message =
            chainErr instanceof Error ? chainErr.message : "Contract call failed";
          setRegTxError(message);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setRegError(message);
    } finally {
      setRegLoading(false);
    }
  };

  const handleAuthenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(undefined);
    setAuthResponse(undefined);
    setAuthStatus(undefined);
    setAuthTxError(undefined);
    setAuthTxHash(undefined);

    try {
      const payload: Record<string, unknown> = {
        userId: authUserId,
        nonce: authNonce || undefined,
        note: authNote || undefined,
      };

      if (authMode === "camera") {
        if (!authCameraData) {
          setAuthError("Capture an image with the camera first.");
          setAuthLoading(false);
          return;
        }
        payload.embedding = authCameraData;
        payload.embeddingType = "camera/jpeg";
      } else if (authEmbeddingFile) {
        payload.embedding = await fileToBase64(authEmbeddingFile);
        payload.embeddingName = authEmbeddingFile.name;
        payload.embeddingType = authEmbeddingFile.type;
      } else {
        setAuthError("Provide an embedding file or capture a new sample.");
        setAuthLoading(false);
        return;
      }

      const result = await postJson<AuthResponse>("/authenticate", payload);
      setAuthStatus(result.status);

      if (!result.ok) {
        setAuthError(result.error ?? "Authentication failed");
        return;
      }

      setAuthResponse(result.data);

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
              keccak256(stringToBytes(authUserId)),
              result.data.proofHash as `0x${string}`,
              proofA,
              proofB,
              proofC,
              publicInputs,
            ],
          });
          setAuthTxHash(tx);
        } catch (chainErr) {
          const message =
            chainErr instanceof Error ? chainErr.message : "Contract call failed";
          setAuthTxError(message);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <section className="glass-card relative overflow-hidden px-6 py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.2),transparent_60%)]" />
        <div className="relative space-y-3">
          <span className="tag">Auth Workflow</span>
          <h1 className="text-3xl font-semibold md:text-4xl">Register &amp; Prove</h1>
          <p className="max-w-2xl text-sm text-slate-300/85">
            Complete the two steps below to register a face embedding and submit a Groth16 proof on-chain.
            Each step accepts a file upload or a live capture, and returns all calldata required by the smart contract.
          </p>
        </div>
      </section>

      <section className="space-y-12">
        <div className="glass-card space-y-6 border border-white/12 px-6 py-7">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Step 1 · Register Embedding</h2>
              <p className="text-sm text-slate-300/80">
                Upload an embedding or capture a frame to derive a quantised vector, Pedersen commitment, and Poseidon hash.
                Optionally push the record to `OwnFaceRegistry`.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <button
                type="button"
                onClick={() => {
                  setRegMode("upload");
                  setRegCameraData(null);
                }}
                className={`rounded-lg px-3 py-1.5 transition ${
                  regMode === "upload"
                    ? "bg-white/15 text-white shadow shadow-violet-500/30"
                    : "border border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegMode("camera");
                  setRegEmbeddingFile(null);
                }}
                className={`rounded-lg px-3 py-1.5 transition ${
                  regMode === "camera"
                    ? "bg-white/15 text-white shadow shadow-violet-500/30"
                    : "border border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                Use Camera
              </button>
            </div>
          </div>

          {regMode === "camera" ? (
            <CameraCapture
              onCapture={(base64) => setRegCameraData(base64)}
              onClear={() => setRegCameraData(null)}
            />
          ) : (
            <label className="flex flex-col gap-2 text-sm text-slate-200">
              Embedding File
              <input
                type="file"
                accept=".json,.txt,.bin,.csv"
                onChange={(event) => setRegEmbeddingFile(event.target.files?.[0] ?? null)}
                className="rounded-lg border border-dashed border-white/20 bg-white/5 px-3 py-4 text-sm text-slate-200 outline-none transition hover:border-white/40"
              />
              <span className="text-xs text-slate-400/90">
                JSON / text / CSV are supported. The backend will normalise and pad to 16 values automatically.
              </span>
            </label>
          )}

          <form onSubmit={handleRegister} className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-200">
              User ID
              <input
                type="text"
                value={regUserId}
                onChange={(event) => setRegUserId(event.target.value)}
                required
                placeholder="alice@example"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/40"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-slate-200">
              Note (optional)
              <input
                type="text"
                value={regNote}
                onChange={(event) => setRegNote(event.target.value)}
                placeholder="camera #1"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/40"
              />
            </label>

            <button
              type="submit"
              disabled={regLoading || !regUserId}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/40 transition hover:shadow-violet-500/60 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
            >
              {regLoading ? "Submitting..." : "Submit Registration"}
            </button>
          </form>

          {registryAddress && (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
              <div className="font-semibold text-white">On-chain status</div>
              {!isConnected && (
                <p className="mt-1">
                  Connect a wallet to write to
                  <code className="ml-1 text-[10px]">{registryAddress}</code>
                </p>
              )}
              {regTxError && <p className="mt-2 text-rose-400">Contract call failed: {regTxError}</p>}
              {regTxHash && (
                <p className="mt-2">
                  Tx <code className="break-all text-[10px]">{regTxHash}</code>{" "}
                  {regTxStatus === "pending" && <span className="text-amber-300">waiting for confirmations…</span>}
                  {regTxStatus === "success" && (
                    <span className="text-emerald-400">
                      confirmed (block {regTxReceipt?.blockNumber?.toString()})
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          <ResponsePanel
            title="Registration Response"
            data={regResponse}
            error={regError}
            status={regStatus}
            loading={regLoading}
          />
        </div>

        <div className="glass-card space-y-6 border border-white/12 px-6 py-7">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Step 2 · Authenticate &amp; Prove</h2>
              <p className="text-sm text-slate-300/80">
                Use the same user ID to capture a fresh sample. The backend returns a Groth16 proof plus calldata you can submit to the registry.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("upload");
                  setAuthCameraData(null);
                }}
                className={`rounded-lg px-3 py-1.5 transition ${
                  authMode === "upload"
                    ? "bg-white/15 text-white shadow shadow-sky-500/30"
                    : "border border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("camera");
                  setAuthEmbeddingFile(null);
                }}
                className={`rounded-lg px-3 py-1.5 transition ${
                  authMode === "camera"
                    ? "bg-white/15 text-white shadow shadow-sky-500/30"
                    : "border border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                Use Camera
              </button>
            </div>
          </div>

          {authMode === "camera" ? (
            <CameraCapture
              onCapture={(base64) => setAuthCameraData(base64)}
              onClear={() => setAuthCameraData(null)}
            />
          ) : (
            <label className="flex flex-col gap-2 text-sm text-slate-200">
              Embedding File
              <input
                type="file"
                accept=".json,.txt,.bin,.csv"
                onChange={(event) => setAuthEmbeddingFile(event.target.files?.[0] ?? null)}
                className="rounded-lg border border-dashed border-white/20 bg-white/5 px-3 py-4 text-sm text-slate-200 outline-none transition hover:border-white/40"
              />
              <span className="text-xs text-slate-400/90">
                Using the same source as registration makes it easier to stay within the distance threshold.
              </span>
            </label>
          )}

          <form onSubmit={handleAuthenticate} className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm text-slate-200">
              User ID
              <input
                type="text"
                value={authUserId}
                onChange={(event) => setAuthUserId(event.target.value)}
                required
                placeholder="alice@example"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/40"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-slate-200">
              Nonce (optional)
              <input
                type="text"
                value={authNonce}
                onChange={(event) => setAuthNonce(event.target.value)}
                placeholder="nonce returned by /register"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/40"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-slate-200">
              Note (optional)
              <input
                type="text"
                value={authNote}
                onChange={(event) => setAuthNote(event.target.value)}
                placeholder="reason for this attempt"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/40"
              />
            </label>

            <button
              type="submit"
              disabled={authLoading || !authUserId}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#6366f1] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/40 transition hover:shadow-sky-500/60 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3"
            >
              {authLoading ? "Submitting..." : "Request Proof"}
            </button>
          </form>

          {registryAddress && (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
              <div className="font-semibold text-white">On-chain status</div>
              {!isConnected && (
                <p className="mt-1">
                  Connect a wallet to call the contract:
                  <code className="ml-1 text-[10px]">{registryAddress}</code>
                </p>
              )}
              {authTxError && <p className="mt-2 text-rose-400">Contract call failed: {authTxError}</p>}
              {authTxHash && (
                <p className="mt-2">
                  Tx <code className="break-all text-[10px]">{authTxHash}</code>{" "}
                  {authTxStatus === "pending" && <span className="text-amber-300">waiting for confirmations…</span>}
                  {authTxStatus === "success" && (
                    <span className="text-emerald-400">
                      confirmed (block {authTxReceipt?.blockNumber?.toString()})
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          <ResponsePanel
            title="Authentication Response"
            data={authResponse}
            error={authError}
            status={authStatus}
            loading={authLoading}
          />
        </div>
      </section>
    </div>
  );
}
