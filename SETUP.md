# BatteryLoop setup

The landing page is unchanged in purpose. The rest of the app reads **your** deployed Flow EVM Testnet contracts and a local database. No new contracts are deployed by this project.

## 1. Environment variables

Copy `.env.example` to `.env.local` (never commit secrets). Fill:

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_BATTERY_PASSPORT_ADDRESS` | `.env.local` | Deployed `BatteryPassport` |
| `NEXT_PUBLIC_BATTERY_LIFECYCLE_ADDRESS` | `.env.local` | Deployed `BatteryLifecycle` |
| `NEXT_PUBLIC_CIRCULARITY_REWARDS_ADDRESS` | `.env.local` | Deployed `CircularityRewards` |
| `NEXT_PUBLIC_FLOW_EVM_CHAIN_ID` | `.env.local` | Default `545` (Flow EVM Testnet) |
| `GEMINI_API_KEY` | `.env.local` **server only** | Gemini. Never prefix with `NEXT_PUBLIC_` |
| `GEMINI_MODEL` | `.env.local` | Optional. Default `gemini-2.0-flash` |
| `DATABASE_URL` | `.env.local` | Prisma SQLite, e.g. `file:./dev.db` |
| `AUTH_SECRET` | `.env.local` | 32+ character secret for signed-in sessions |
| `APP_ADMIN_WALLETS` | `.env.local` | Optional comma-separated wallets that receive the **application** ADMIN role on first sign-in |
| `APP_RECYCLER_WALLETS` | `.env.local` | Optional application RECYCLER bootstrap |

You should not need to edit source files to insert addresses.

Contract ABIs live in `lib/blockchain/abis.ts`. Chain settings live in `lib/blockchain/config.ts`.

## 2. Flow EVM Testnet (official)

From [Flow network information](https://developers.flow.com/build/evm/networks):

- Network name: Flow EVM Testnet
- Chain ID: **545** (`0x221`)
- RPC: `https://testnet.evm.nodes.onflow.org`
- Currency: FLOW
- Explorer: `https://evm-testnet.flowscan.io`

Add the network in MetaMask, fund a testnet account from the Flow faucet, and switch to chain 545 before sending transactions. Public reads work without a wallet.

## 3. Database

This project uses **Prisma + SQLite** so a local file is enough.

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
```

If migrate is unused in your environment, `npx prisma db push` creates the schema from `prisma/schema.prisma`.

PostgreSQL can replace SQLite later by changing `provider` in `prisma/schema.prisma` and pointing `DATABASE_URL` at Postgres. The application code does not hardcode a host.

## 4. Run locally

```bash
npm run dev
```

Open `http://localhost:3000` (landing) and `http://localhost:3000/dashboard`.

Other scripts:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 5. Wallet sign-in vs contract roles

Signing a BatteryLoop message proves control of a wallet and creates an httpOnly session. **It does not grant Solidity roles.**

Application roles (`USER`, `RECYCLER`, `ADMIN`) are stored in the database and gate app features such as the admin UI.

On-chain OpenZeppelin roles are checked with `hasRole` on the deployed contracts.

## 6. Granting contract roles

Constructors grant `DEFAULT_ADMIN_ROLE` plus the operational role to the admin address you passed at deploy time. Other wallets do not receive permissions automatically.

Role IDs (keccak256 of the role name, except default admin which is `bytes32(0)`):

| Contract | Role | Needed for |
| --- | --- | --- |
| BatteryPassport | `REGISTRAR_ROLE` | `registerBattery` |
| BatteryPassport | `MANUFACTURER_ROLE` | Classification only |
| BatteryLifecycle | `RECORDER_ROLE` | `recordEvent`, `recordOwnership` |
| CircularityRewards | `VERIFIER_ROLE` | `verifyRecycling` (pays recycler + consumer) |
| CircularityRewards | `DEFAULT_ADMIN_ROLE` | `setRewards` |

Compute IDs with ethers:

```js
import { id } from "ethers";
id("REGISTRAR_ROLE");
id("RECORDER_ROLE");
id("VERIFIER_ROLE");
id("MANUFACTURER_ROLE");
```

Example, using Foundry `cast` from an account that already holds `DEFAULT_ADMIN_ROLE` (the deploy admin). Replace addresses.

```bash
cast send $PASSPORT "grantRole(bytes32,address)" \
  $(cast keccak REGISTER_PLACEHOLDER) $REGISTRAR
```

Use the **exact** role string, not a placeholder:

```bash
# REGISTRAR_ROLE
cast send $BATTERY_PASSPORT_ADDRESS "grantRole(bytes32,address)" \
  $(cast keccak-256 "REGISTRAR_ROLE") $YOUR_REGISTRAR_WALLET \
  --rpc-url https://testnet.evm.nodes.onflow.org --account admin

# RECORDER_ROLE
cast send $BATTERY_LIFECYCLE_ADDRESS "grantRole(bytes32,address)" \
  $(cast keccak-256 "RECORDER_ROLE") $YOUR_RECORDER_WALLET \
  --rpc-url https://testnet.evm.nodes.onflow.org --account admin

# VERIFIER_ROLE
cast send $CIRCULARITY_REWARDS_ADDRESS "grantRole(bytes32,address)" \
  $(cast keccak-256 "VERIFIER_ROLE") $YOUR_VERIFIER_WALLET \
  --rpc-url https://testnet.evm.nodes.onflow.org --account admin
```

Equivalent ethers snippet (run from a trusted admin machine, never put the admin key in the Next.js app):

```js
const tx = await passport.grantRole(id("REGISTRAR_ROLE"), registrarWallet);
await tx.wait();
```

The frontend never holds an admin private key and never calls `grantRole` for you.

## 7. Lifecycle event types (application mapping)

The contract accepts `uint8` `0`–`10`. This app maps:

| Type | Meaning |
| --- | --- |
| 0 | Collected / intake |
| 1 | Inspection |
| 2 | Ownership / custody (`recordOwnership`) |
| 3 | Maintenance |
| 4 | Usage checkpoint |
| 5 | Second-life evaluation |
| 6 | Second-life deployment |
| 7 | Recycling collection |
| 8 | Recycling processing |
| 9 | Material recovery |
| 10 | End of life |

Payloads are stored off-chain. Only the hash is anchored.

## 8. Transaction status

`DRAFT → PENDING → CONFIRMED`, plus `FAILED`, `REJECTED`, `NEEDS_RECONCILIATION`.

A passport is not treated as blockchain-registered until `getBattery` returns `exists = true` after a receipt.

## 9. Gemini

Set `GEMINI_API_KEY` on the server. Routes:

- `POST /api/ai/health`
- `POST /api/ai/pcb`
- `POST /api/ai/valuation`

If the key is missing, the UI shows a configuration message. PCB uploads are still stored so you can retry.

## 10. Verify integrations

1. `/api/config` — chain, address validity, Gemini/db/auth flags (never the API key).
2. Connect MetaMask on chain 545. Wrong network shows a switch action.
3. Sign in. Session cookie is httpOnly.
4. Register a battery from a `REGISTRAR_ROLE` wallet. Confirm explorer link and `getBattery` hash match.
5. Record a lifecycle event from a `RECORDER_ROLE` wallet.
6. Deposit a **small** testnet FLOW amount into CircularityRewards after the in-app confirm dialog.
7. Submit a recycling job, then `verifyRecycling` from a `VERIFIER_ROLE` wallet.
8. Run a health assessment and a PCB upload after setting Gemini.

## 11. What still depends on you

- The three deployed contract addresses
- Gemini key
- Database file/migrations
- Granting Solidity roles from the original admin account
- Testnet FLOW for gas and optional reward deposits

Live contract calls cannot be claimed as tested until those addresses are present in `.env.local`.
