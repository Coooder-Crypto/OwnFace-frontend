"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { keccak256, stringToBytes, isHex, zeroAddress } from "viem";
import { postJson } from "@/lib/api";
import { fileToBase64 } from "@/lib/file";
import { CameraCapture } from "@/components/camera-capture";
import { registryAbi } from "@/lib/contracts";

type SummaryItem = { label: string; value: ReactNode };

const explorerBase =
  process.env.NEXT_PUBLIC_BLOCK_EXPLORER_BASE?.replace(/\/+$/, "") ||
  "https://sepolia.etherscan.io";

const verifierAddressEnv = process.env.NEXT_PUBLIC_VERIFIER_ADDRESS;

function shorten(value: string | undefined, chars = 4): string {
  if (!value) return "";
  return `${value.slice(0, 2 + chars)}…${value.slice(-chars)}`;
}

function toHex(value: bigint): `0x${string}` {
  return `0x${value.toString(16).padStart(64, "0")}`;
}

function SummaryCard({
  title,
  items,
  placeholder,
}: {
  title: string;
  items?: SummaryItem[] | null;
  placeholder?: string;
}) {
  const hasItems = Boolean(items && items.length > 0);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
      <div className="text-sm font-semibold text-white">{title}</div>
      {hasItems ? (
        <dl className="mt-3 space-y-2">
          {items!.map((item, index) => (
            <div key={`${title}-${index}`} className="flex items-center justify-between gap-3">
              <dt className="uppercase tracking-wide text-slate-400">{item.label}</dt>
              <dd className="text-right text-white">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-slate-400">{placeholder ?? "No data yet."}</p>
      )}
    </div>
  );
}

function DebugBlock({ title, data }: { title: string; data: unknown }) {
  if (!data) {
    return null;
  }
  return (
    <div className="rounded-lg border border-white/10 bg-black/60 p-4 text-xs text-lime-200">
      <div className="mb-2 text-slate-200">{title}</div>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

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

  const verifierAddress = useMemo(() => {
    if (!verifierAddressEnv || !isHex(verifierAddressEnv)) {
      return undefined;
    }
    return verifierAddressEnv as `0x${string}`;
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
  const [showDebug, setShowDebug] = useState(false);
  const {
    data: authTxReceipt,
    status: authTxStatus,
  } = useWaitForTransactionReceipt({
    hash: authTxHash,
  });

  const regUserIdHash = useMemo(
    () =>
      regUserId
        ? (keccak256(stringToBytes(regUserId)) as `0x${string}`)
        : undefined,
    [regUserId],
  );

  const authUserIdHash = useMemo(
    () =>
      authUserId
        ? (keccak256(stringToBytes(authUserId)) as `0x${string}`)
        : undefined,
    [authUserId],
  );

  const readAddress = registryAddress ?? zeroAddress;

  const regCommitmentQuery = useReadContract({
    abi: registryAbi,
    address: readAddress,
    functionName: "getCommitment",
    args: regUserIdHash ? [regUserIdHash] : undefined,
    query: {
      enabled: Boolean(
        registryAddress && regUserIdHash && regTxStatus === "success",
      ),
    },
  });

  const authVerificationQuery = useReadContract({
    abi: registryAbi,
    address: readAddress,
    functionName: "getVerification",
    args: authUserIdHash ? [authUserIdHash] : undefined,
    query: {
      enabled: Boolean(
        registryAddress && authUserIdHash && authTxStatus === "success",
      ),
    },
  });

  const { refetch: refetchCommitment } = regCommitmentQuery;
  const { refetch: refetchVerification } = authVerificationQuery;

  useEffect(() => {
    if (
      regTxStatus === "success" &&
      refetchCommitment &&
      regUserIdHash &&
      registryAddress
    ) {
      refetchCommitment();
    }
  }, [regTxStatus, refetchCommitment, regUserIdHash, registryAddress]);

  useEffect(() => {
    if (
      authTxStatus === "success" &&
      refetchVerification &&
      authUserIdHash &&
      registryAddress
    ) {
      refetchVerification();
    }
  }, [
    authTxStatus,
    refetchVerification,
    authUserIdHash,
    registryAddress,
  ]);

  const normalizedCommitment = useMemo(() => {
    const value = regCommitmentQuery.data;
    if (!value) {
      return undefined;
    }
    const [
      commitmentHash,
      commitmentPoint,
      blinding,
      nonceHash,
      vectorHash,
      registeredAt,
      registered,
    ] = value as [
      `0x${string}`,
      `0x${string}`,
      `0x${string}`,
      `0x${string}`,
      bigint,
      bigint,
      boolean,
    ];
    return {
      commitmentHash,
      commitmentPoint,
      blinding,
      nonceHash,
      vectorHashDecimal: vectorHash.toString(),
      vectorHashHex: toHex(vectorHash),
      registeredAt: new Date(Number(registeredAt) * 1000).toISOString(),
      registered,
    };
  }, [regCommitmentQuery.data]);

  const normalizedVerification = useMemo(() => {
    const value = authVerificationQuery.data;
    if (!value) {
      return undefined;
    }
    const [
      accepted,
      distance,
      threshold,
      referenceHash,
      candidateHash,
      transcriptHash,
      proofHash,
      timestamp,
    ] = value as [
      boolean,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      `0x${string}`,
      bigint,
    ];
    return {
      accepted,
      distance: distance.toString(),
      threshold: threshold.toString(),
      referenceHash: toHex(referenceHash),
      candidateHash: toHex(candidateHash),
      transcriptHash: toHex(transcriptHash),
      proofHash,
      timestamp: new Date(Number(timestamp) * 1000).toISOString(),
      timestampRaw: timestamp.toString(),
    };
  }, [authVerificationQuery.data]);

  const registrationSummary = useMemo<SummaryItem[] | null>(() => {
    if (!regResponse) {
      return null;
    }
    const vectorHashSource =
      regResponse.vectorHash ?? normalizedCommitment?.vectorHashHex ?? "";
    return [
      { label: "Nonce", value: regResponse.nonce || "—" },
      { label: "Commitment hash", value: shorten(regResponse.commitmentHash, 8) },
      { label: "Nonce hash", value: shorten(regResponse.nonceHash, 8) },
      { label: "Vector hash", value: vectorHashSource ? shorten(vectorHashSource, 8) : "—" },
      { label: "Vector length", value: regResponse.vectorLength.toString() },
    ];
  }, [regResponse, normalizedCommitment]);

  const onchainCommitmentSummary = useMemo<SummaryItem[] | null>(() => {
    if (!normalizedCommitment) {
      return null;
    }
    return [
      { label: "Registered", value: normalizedCommitment.registered ? "Yes" : "No" },
      { label: "Vector hash", value: shorten(normalizedCommitment.vectorHashHex, 8) },
      { label: "Recorded at", value: normalizedCommitment.registeredAt },
    ];
  }, [normalizedCommitment]);

  const authenticationSummary = useMemo<SummaryItem[] | null>(() => {
    if (!authResponse) {
      return null;
    }
    return [
      { label: "Status", value: authResponse.status },
      { label: "Distance", value: authResponse.distance.toString() },
      { label: "Threshold", value: authResponse.threshold.toString() },
      { label: "Transcript hash", value: authResponse.transcriptHash ? shorten(authResponse.transcriptHash, 8) : "—" },
      { label: "Proof hash", value: shorten(authResponse.proofHash, 8) },
    ];
  }, [authResponse]);

  const onchainVerificationSummary = useMemo<SummaryItem[] | null>(() => {
    if (!normalizedVerification) {
      return null;
    }
    return [
      { label: "Accepted", value: normalizedVerification.accepted ? "Yes" : "No" },
      { label: "Distance", value: normalizedVerification.distance },
      { label: "Threshold", value: normalizedVerification.threshold },
      { label: "Transcript hash", value: shorten(normalizedVerification.transcriptHash, 8) },
      { label: "Proof hash", value: shorten(normalizedVerification.proofHash, 8) },
      { label: "Updated at", value: normalizedVerification.timestamp },
    ];
  }, [normalizedVerification]);

  const debugAvailable =
    regResponse ||
    authResponse ||
    normalizedCommitment ||
    normalizedVerification;

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

  

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card space-y-6 border border-white/12 px-6 py-7">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Register</h2>
              <p className="text-sm text-slate-300/80">
                Upload or capture an embedding, then register it on-chain with one click.
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
                  Connect a wallet to write to{" "}
                  <code className="ml-1 text-[10px]">{registryAddress}</code>
                </p>
              )}
              {regTxError && <p className="mt-2 text-rose-400">Contract call failed: {regTxError}</p>}
              {regTxHash && (
                <p className="mt-2">
                  Tx{" "}
                  <a
                    href={`${explorerBase}/tx/${regTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all underline decoration-dotted underline-offset-4"
                  >
                    {regTxHash}
                  </a>{" "}
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

        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard
            title="Registration Summary"
            items={registrationSummary}
            placeholder={regError || "Submit a registration to see details."}
          />
          {registryAddress ? (
            <SummaryCard
              title="On-chain Commitment"
              items={onchainCommitmentSummary}
              placeholder={
                regCommitmentQuery.error
                  ? `Failed to read commitment: ${regCommitmentQuery.error.message}`
                  : "No commitment fetched yet."
              }
            />
          ) : (
            <SummaryCard
              title="On-chain Commitment"
              items={null}
              placeholder="Set NEXT_PUBLIC_REGISTRY_ADDRESS to display on-chain data."
            />
          )}
        </div>
      </div>

        <div className="glass-card space-y-6 border border-white/12 px-6 py-7">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Authenticate</h2>
              <p className="text-sm text-slate-300/80">
                Capture a fresh sample, generate the proof, and push the result on-chain.
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
                  Connect a wallet to call the contract:{" "}
                  <code className="ml-1 text-[10px]">{registryAddress}</code>
                </p>
              )}
              {authTxError && <p className="mt-2 text-rose-400">Contract call failed: {authTxError}</p>}
              {authTxHash && (
                <p className="mt-2">
                  Tx{" "}
                  <a
                    href={`${explorerBase}/tx/${authTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all underline decoration-dotted underline-offset-4"
                  >
                    {authTxHash}
                  </a>{" "}
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

          <div className="grid gap-4 md:grid-cols-2">
            <SummaryCard
              title="Authentication Summary"
              items={authenticationSummary}
              placeholder={authError || "Request a proof to see details."}
            />
            {registryAddress ? (
              <SummaryCard
                title="On-chain Verification"
                items={onchainVerificationSummary}
                placeholder={
                  authVerificationQuery.error
                    ? `Failed to read verification: ${authVerificationQuery.error.message}`
                    : "No verification fetched yet."
                }
              />
            ) : (
              <SummaryCard
                title="On-chain Verification"
                items={null}
                placeholder="Set NEXT_PUBLIC_REGISTRY_ADDRESS to display on-chain data."
              />
            )}
          </div>
        </div>
      </section>

      {showDebug && (
        <section className="space-y-4 rounded-xl border border-white/10 bg-black/40 px-6 py-6">
          <DebugBlock title="Registration Response" data={regResponse} />
          <DebugBlock title="Authentication Response" data={authResponse} />
          <DebugBlock title="On-chain Commitment" data={normalizedCommitment} />
          <DebugBlock title="On-chain Verification" data={normalizedVerification} />
        </section>
      )}
    </div>
  );
}
