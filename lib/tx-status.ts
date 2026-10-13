export const TX_STATUSES = [
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "FAILED",
  "REJECTED",
  "NEEDS_RECONCILIATION",
] as const;

export type TxStatus = (typeof TX_STATUSES)[number];

const ALLOWED: Record<TxStatus, TxStatus[]> = {
  DRAFT: ["PENDING", "REJECTED", "FAILED"],
  PENDING: ["CONFIRMED", "FAILED", "NEEDS_RECONCILIATION"],
  CONFIRMED: ["NEEDS_RECONCILIATION"],
  FAILED: ["PENDING", "DRAFT"],
  REJECTED: ["PENDING", "DRAFT"],
  NEEDS_RECONCILIATION: ["CONFIRMED", "FAILED", "PENDING"],
};

export function isTxStatus(value: string): value is TxStatus {
  return (TX_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: TxStatus, to: TxStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: TxStatus, to: TxStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transaction status change: ${from} → ${to}`);
  }
}

export function isOnChainVerified(status: string): boolean {
  return status === "CONFIRMED";
}
