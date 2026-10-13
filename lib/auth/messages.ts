export function buildSiweMessage(input: {
  address: string;
  nonce: string;
  issuedAt: string;
  chainId: number;
}): string {
  return [
    "BatteryLoop wants you to sign in.",
    "",
    "This signature proves you control the wallet. It does not send a transaction or expose your private key.",
    "",
    `Address: ${input.address}`,
    `Chain ID: ${input.chainId}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${input.issuedAt}`,
  ].join("\n");
}
