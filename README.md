# Naro — AI-Native Bluechip Asset Vault UI

Frontend reference implementation for Naro, VishwaLab's mandate-bound vault coordination experience.

Naro continuously compares risk-adjusted yield opportunities across approved DeFi venues, proposes reallocations inside a curator-defined mandate, and presents the Veta verification trace before execution. Bitcoin is the first live product surface; the interface is designed to expand to other bluechip assets.

## Status

This repository is a UI and interaction reference. It contains production-quality responsive layouts and simulated interactions, but the market data, wallet connection, vault transactions, AI decisions, and policy results are currently mocked in the client.

Live reference: https://naro-ai-vault.davidtheevanoob.chatgpt.site

## Product surfaces

| Route | Purpose |
| --- | --- |
| `/` | Landing page, AI opportunity ranking, mandate flow and execution trace |
| `/vaults` | Vault directory and architecture comparison |
| `/btcvp` | BTCvp vault detail, performance, mint/redeem and FAQ |
| `/btcvc` | BTCvc institutional vault detail, performance, mint/redeem and FAQ |

## Run locally

Requirements: Node.js `>=22.13.0`.

```bash
npm ci
npm run dev
```

Production build:

```bash
npm run build
```

The committed `.openai/hosting.json` is a non-secret local placeholder. A deployment platform should replace or ignore it rather than reusing the reference project's hosting identity.

## Important files

- `app/components/NaroSite.tsx` — all current page components, interactions and mock product data
- `app/globals.css` — complete responsive design system and visual treatment
- `app/page.tsx` — landing route
- `app/vaults/page.tsx` — vault directory route
- `app/btcvp/page.tsx` and `app/btcvc/page.tsx` — vault detail routes
- `public/favicon.svg` — Naro mark in Vishwa green
- `BACKEND_HANDOFF.md` — integration map, suggested contracts and security boundaries

## Brand palette

- Vishwa green: `#15915E`
- Bright accent: `#66D6A3`
- Secondary green: `#4BBF8A`
- Ink: `#07090C`
- Panel: `#11151A`
- Paper: `#F4F2EB`

## Architecture note

The current implementation intentionally keeps the presentation layer concentrated in `NaroSite.tsx` so product and backend teams can review the entire experience in one place. During integration, split data access into server-side modules or API clients while preserving the component contracts described in `BACKEND_HANDOFF.md`.

## Security note

The frontend must never be treated as the authority for mandate checks, APY calculations, eligibility, balances, custody status, transaction construction or Veta verification. Those values must come from trusted backend, indexer, custody and execution services.
