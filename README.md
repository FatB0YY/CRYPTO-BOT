**English** | [Русский](./README.ru.md)

# DEXONIR

An arbitrage bot that tracks price differences for the same token pairs across decentralised exchanges on Solana and a centralised exchange, and executes trades when the spread covers its own costs.

## The problem

The same pair trades at slightly different prices on different venues. Capturing that difference sounds simple and mostly isn't: by the time an order lands, the spread may have moved, and what looked profitable on paper is often consumed entirely by fees.

The bot therefore separates two numbers explicitly:

- **Gross** — the raw profit implied by the price difference between Raydium and Bybit, ignoring costs
- **Net** — what remains after every fee on both sides: the Raydium pool fee, Solana priority fees, and Bybit's trading fee

Only net matters. A large gross spread on an illiquid pool with a high fee tier is a losing trade, and the bot is built around that distinction rather than around spotting spreads.

## Venues

| Venue | Type | Role |
| --- | --- | --- |
| **Raydium** | DEX on Solana | Pool discovery, swap quoting and execution |
| **Meteora** | DEX on Solana (DLMM) | Pricing from active bins, position state |
| **Bybit** | Centralised exchange | Live prices over WebSocket, market orders |

## How it works

**Pool selection.** `getPopularRaydiumTokens` pulls unique tokens from Raydium's top 50 pools ranked by 24-hour volume; `getTopRaydiumPoolByTokens` then picks the most liquid pool for a given pair. Liquidity is the constraint that decides whether a spread is actually tradeable, so pool choice comes before price comparison.

**Price feeds.** Bybit prices arrive over a WebSocket subscription to the tracked pairs, with the instrument category (spot, linear) resolved per symbol. Meteora prices are read from the active bin of a DLMM pool.

**Quoting before committing.** `getComputeSwapBase` calculates the parameters of a prospective swap without submitting anything on chain, so the trade is evaluated against real expected output rather than a mid-price estimate. `getRaydiumSwapFeePercent` supplies the pool's fee tier and `getPriorityFees` the current Solana priority fee, both feeding the net calculation.

**Execution.** `postTransactionSwap` requests signable transactions from the Raydium API, `signAndSendTransactions` signs and submits them to the network. `ensureTokenAccount` creates the Associated Token Account for a mint when the wallet does not yet have one — a step that otherwise fails the transaction outright.

**Wallets and balances.** `getWalletsFromEnv` reads Solana, Solflare and Metamask credentials from the environment, validates them and converts each to the format its SDK expects. Balances are checked across Solana, EVM networks and the Bybit account before a cycle runs.

## Environment variables

### Wallets

| Variable | Description |
| --- | --- |
| `WALLET_SOLANA_KEYGEN_SECRET_KEY` | Solana secret key produced by `solana-keygen`, as a JSON byte array |
| `WALLET_SOLFLARE_SECRET_KEY` | Solflare wallet secret key, as a JSON byte array |
| `WALLET_METAMASK_PUBLIC_KEY` | Metamask public key, for EVM networks |

### Exchange and RPC

| Variable | Description |
| --- | --- |
| `API_KEY_BYBIT` | Bybit API key |
| `API_SECRET_BYBIT` | Bybit API secret |
| `ANKR_RPC_URL` | Ankr RPC endpoint |
| `ANKR_API_KEY` | Ankr API key, when authenticated requests are used |
| `TX_VERSION` | Transaction version — `V0` or `LEGACY` |

Two of these are private keys with direct control over funds. Keep `.env` out of version control.

## Stack

TypeScript, Node.js, Raydium SDK v2, Meteora DLMM SDK, Bybit API and WebSocket, Ankr RPC, Jest, ESLint, Prettier.

## Running locally

    git clone https://github.com/FatB0YY/CRYPTO-BOT.git
    cd CRYPTO-BOT
    npm install

Create a `.env` from `.env.example` and fill in the variables above, then:

    npm run start

Tests:

    npm run test

## Disclaimer

This is a personal research project, not financial advice and not a product. Running it executes real transactions with real funds on live exchanges. Arbitrage strategies can and do lose money — to fee drift, slippage, failed transactions and latency. Use at your own risk.

## Author

Rodion Ramazanov — [GitHub](https://github.com/FatB0YY) · [Telegram](https://t.me/iamrodionn)
