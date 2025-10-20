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
      { name: "vectorHash", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "authenticate",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "userIdHash", type: "bytes32", internalType: "bytes32" },
      { name: "proofHash", type: "bytes32", internalType: "bytes32" },
      { name: "proofA", type: "uint256[2]", internalType: "uint256[2]" },
      { name: "proofB", type: "uint256[2][2]", internalType: "uint256[2][2]" },
      { name: "proofC", type: "uint256[2]", internalType: "uint256[2]" },
      { name: "publicSignals", type: "uint256[6]", internalType: "uint256[6]" },
    ],
    outputs: [],
  },
] as const;
