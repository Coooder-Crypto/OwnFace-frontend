export const registryAbi = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "userIdHash", type: "bytes32", internalType: "bytes32" },
      { name: "commitmentHash", type: "bytes32", internalType: "bytes32" },
      { name: "nonceHash", type: "bytes32", internalType: "bytes32" },
      { name: "commitmentPoint", type: "bytes", internalType: "bytes" },
      { name: "blinding", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "authenticate",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "userIdHash", type: "bytes32", internalType: "bytes32" },
      { name: "accepted", type: "bool", internalType: "bool" },
      { name: "distance", type: "uint256", internalType: "uint256" },
      { name: "threshold", type: "uint256", internalType: "uint256" },
      { name: "transcriptDigest", type: "bytes32", internalType: "bytes32" },
      { name: "proofHash", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [],
  },
] as const;
