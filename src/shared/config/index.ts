export const config = {
  port: parseInt(process.env.PORT || '8001'),
  txVersion: process.env.TX_VERSION,
  bybit: {
    apiKey: process.env.API_KEY_BYBIT,
    apiSecret: process.env.API_SECRET_BYBIT,
  },
  ankr: {
    apiKey: process.env.ANKR_API_KEY,
    rpcUrl: process.env.ANKR_RPC_URL,
  },
  wallets: {
    solanaKeygen: process.env.WALLET_SOLANA_KEYGEN_SECRET_KEY, // DO NOT LOG
    solflare: process.env.WALLET_SOLFLARE_SECRET_KEY, // DO NOT LOG
    metamask: process.env.WALLET_METAMASK_PUBLIC_KEY,
  },
}
