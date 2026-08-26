# Backend Handoff

This document maps the current Naro UI to the backend, indexer, wallet and Veta services required for a production implementation.

## 1. Current implementation boundary

The repository is a complete responsive frontend reference. The following behaviors are intentionally simulated:

- Protocol APY opportunity ranking
- AI confidence, route simulation and rebalance proposal
- Ciara mandate status and policy limits
- Veta verification results and execution trace
- Vault metrics, supply, APY and performance history
- Wallet connection, balances and receiving addresses
- Mint and redeem preparation
- Wallet activity and transaction history

The UI should remain a renderer of signed or trusted backend state. It must not calculate authoritative yield, determine policy compliance or construct unrestricted capital movements in the browser.

## 2. Existing component-to-service map

| UI surface | Current source | Production replacement |
| --- | --- | --- |
| Landing protocol metrics | Hardcoded in `LandingPage` | Aggregated vault metrics/indexer endpoint |
| Opportunity ranking | `venues` inside `AgentCore` | Yield intelligence service with risk-adjusted ranking |
| AI rebalance decision | `AgentCore` | Naro coordinator decision/trace endpoint |
| Policy gates | `AgentCore`, control matrix | Ciara mandate service plus Veta verification result |
| Vault directory | `VaultCard`, `VaultsIndex` | Vault registry endpoint |
| Vault detail | `vaultData` | Vault configuration and live state endpoint |
| Historical APY | `YieldChart` mock points | Timeseries/indexer endpoint |
| Wallet state | Local React booleans | Wallet adapter and session state |
| Mint/redeem | `TransactionPanel` simulation | Quote, eligibility, prepare and submit services |
| Wallet activity | Static empty state | Address activity/indexer endpoint |
| FAQ | `vaultData.faq` | Static config or CMS, depending on ownership |

## 3. Recommended API surface

The transport can be REST, GraphQL or an internal SDK. The field contracts matter more than the transport.

```text
GET  /api/v1/protocol/summary
GET  /api/v1/vaults
GET  /api/v1/vaults/:symbol
GET  /api/v1/vaults/:symbol/performance?period=7D|30D|1Y
GET  /api/v1/vaults/:symbol/agent-state
GET  /api/v1/opportunities?asset=BTC
GET  /api/v1/wallets/:address/activity
POST /api/v1/transactions/quote
POST /api/v1/transactions/prepare
GET  /api/v1/transactions/:id/status
```

### Vault summary

```json
{
  "symbol": "BTCvp",
  "name": "BTC Proof-of-Asset Vault",
  "asset": "BTC",
  "status": "live",
  "access": "open",
  "targetApy": "6.55",
  "totalSupply": "410.00186448",
  "totalValueUsd": "32510000.00",
  "backingRatio": "1.00000000",
  "network": { "name": "Pharos Pacific", "chainId": 1672 },
  "strategy": "market-neutral",
  "rewardMechanic": "redemption-nav",
  "verifiedBy": "Veta"
}
```

Use decimal strings for financial quantities. Do not transmit balances, prices or ratios as JavaScript floating-point numbers.

### Yield opportunity

```json
{
  "id": "opp_01J...",
  "asset": "BTC",
  "protocol": "Solv",
  "instrument": "solvBTC",
  "grossApy": "6.31",
  "netApy": "6.16",
  "riskScore": 94,
  "liquidityUsd": "48000000.00",
  "capacityAsset": "250.00000000",
  "status": "selected",
  "observedAt": "2026-08-26T00:00:00Z"
}
```

Recommended statuses: `selected`, `current`, `standby`, `rejected`, `unavailable`.

### Agent decision and policy trace

```json
{
  "decisionId": "dec_08F4",
  "vaultSymbol": "BTCvp",
  "asset": "BTC",
  "action": "reallocate",
  "amount": "12.50000000",
  "from": "Lombard:LBTC",
  "to": "Solv:solvBTC",
  "expectedNetApyLiftBps": 132,
  "confidence": 0.94,
  "pathsSimulated": 16240,
  "status": "verified",
  "policyChecks": [
    { "name": "asset", "result": "pass" },
    { "name": "venue", "result": "pass" },
    { "name": "liquidity", "result": "pass" },
    { "name": "slippage", "result": "pass" }
  ],
  "vetaProof": "0x...",
  "createdAt": "2026-08-26T00:00:00Z"
}
```

Recommended decision statuses: `observing`, `proposed`, `blocked`, `verified`, `executing`, `settled`, `failed`.

### Performance point

```json
{
  "timestamp": "2026-08-26T00:00:00Z",
  "netApy": "6.55",
  "navBtc": "1.00412000",
  "tvlUsd": "32510000.00"
}
```

### Transaction quote

```json
{
  "quoteId": "quo_01J...",
  "mode": "mint",
  "vaultSymbol": "BTCvp",
  "inputAsset": "BTC",
  "inputAmount": "1.00000000",
  "estimatedOutputAmount": "0.99870000",
  "fees": [
    { "type": "network", "asset": "BTC", "amount": "0.00010000" },
    { "type": "operational", "asset": "BTC", "amount": "0.00120000" }
  ],
  "expiresAt": "2026-08-26T00:05:00Z",
  "eligibility": { "result": "pass", "reasons": [] }
}
```

## 4. Mint and redeem state machine

```text
idle
→ wallet_connected
→ amount_entered
→ quoting
→ quote_ready
→ eligibility_check
→ user_confirmation
→ wallet_signature
→ submitted
→ confirming
→ minted | redeemed | failed
```

The UI needs explicit states for expired quotes, rejected eligibility, wallet/network mismatch, rejected signatures, insufficient fees, pending Bitcoin confirmations, Veta blocks, custody delays and recoverable submission failures.

## 5. Trust and security boundaries

- Ciara mandate rules must be stored and evaluated outside the client.
- Veta verification must run before any executable transaction or custody instruction is returned.
- A `pass` label in the UI is display-only; the executable payload must be cryptographically or server-side bound to the verified decision.
- Revalidate quotes, limits, venue eligibility, slippage, chain, destination and user permissions at submission time.
- Never expose custody credentials, signing keys, provider secrets or unrestricted transaction templates to the client.
- Treat protocol APY as timestamped market data. Return source, observation time and staleness metadata.
- Preserve an immutable decision, policy and execution audit trail keyed by `decisionId`, `quoteId`, transaction hash and Veta proof.
- Separate estimated APY from realized vault performance in both data models and UI labels.

## 6. Suggested integration sequence

1. Replace `vaultData` with a typed vault registry client.
2. Connect protocol summary, live vault metrics and performance timeseries.
3. Connect wallet adapters and network/account state.
4. Implement read-only Naro opportunity and decision traces.
5. Implement quote and eligibility services.
6. Add Veta-bound transaction preparation and submission.
7. Connect wallet activity, transaction status and error recovery.
8. Replace static FAQ/config only if a CMS is required.

## 7. Frontend conventions to preserve

- Keep all financial values as decimal strings until formatting.
- Keep raw values separate from formatted display values.
- Use ISO 8601 UTC timestamps from the backend.
- Return machine-readable error codes alongside user-facing messages.
- Do not infer authorization from a connected wallet alone.
- Preserve responsive layouts and reduced-motion behavior from `app/globals.css`.
- Keep Vishwa green `#15915E` as the primary brand accent; use red and amber only for semantic block/warning states.

## 8. Platform-specific files

This repository retains the current Vinext/Cloudflare Sites build setup so the reference can run unchanged. `app/chatgpt-auth.ts`, D1 examples and Sites build helpers are not required for the Naro product architecture and may be replaced or removed when the production hosting stack is chosen.

