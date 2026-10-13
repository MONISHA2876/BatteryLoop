export function describeChainError(error: unknown): {
  code: string;
  message: string;
  permissionRelated: boolean;
} {
  const raw =
    error && typeof error === "object"
      ? (error as { shortMessage?: string; message?: string; code?: string; reason?: string })
      : {};
  const text = [raw.shortMessage, raw.reason, raw.message, String(error)]
    .filter(Boolean)
    .join(" | ");

  if (/user rejected|ACTION_REJECTED|4001/i.test(text)) {
    return {
      code: "REJECTED",
      message: "The wallet rejected the signature or transaction.",
      permissionRelated: false,
    };
  }

  if (/insufficient funds/i.test(text)) {
    return {
      code: "INSUFFICIENT_FUNDS",
      message: "The connected account does not have enough FLOW to pay for this transaction.",
      permissionRelated: false,
    };
  }

  if (/insufficient pool/i.test(text)) {
    return {
      code: "INSUFFICIENT_POOL",
      message: "The CircularityRewards pool does not hold enough FLOW for the configured payouts.",
      permissionRelated: false,
    };
  }

  if (/already registered/i.test(text)) {
    return {
      code: "ALREADY_REGISTERED",
      message: "This battery ID is already registered on-chain.",
      permissionRelated: false,
    };
  }

  if (/already recycled/i.test(text)) {
    return {
      code: "ALREADY_RECYCLED",
      message: "This battery has already been verified as recycled on-chain.",
      permissionRelated: false,
    };
  }

  const permissionRelated =
    /AccessControlUnauthorizedAccount|is missing role|not authorized|onlyRole|AccessControl/i.test(
      text,
    );

  if (permissionRelated) {
    return {
      code: "MISSING_ROLE",
      message:
        "The connected account is missing the required on-chain role. Registration needs REGISTRAR_ROLE, lifecycle writes need RECORDER_ROLE, and recycling verification needs VERIFIER_ROLE. See SETUP.md.",
      permissionRelated: true,
    };
  }

  return {
    code: raw.code || "CHAIN_ERROR",
    message: raw.shortMessage || raw.message || "The blockchain request failed.",
    permissionRelated: false,
  };
}
