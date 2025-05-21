import web3, { clusterApiUrl } from '@solana/web3.js'

// const rpcUrl = process.env.RPC_URL
// if (!rpcUrl) {
//   throw new Error('RPC_URL is not defined in environment variables.')
// }

export const connection = new web3.Connection(clusterApiUrl('mainnet-beta')) // <YOUR_RPC_URL>

// export const connection = new web3.Connection(
//   'https://chaotic-blissful-frost.solana-mainnet.quiknode.pro/cde69206a73630a8c02e86da4e6bc31e8595839c/',
// )

// TODO: разобраться во втором параметре подключения

// export const connection = new Connection(clusterApiUrl('devnet'))

/*
    1. <YOUR_RPC_URL> — это Solana RPC (Remote Procedure Call) URL
    Он нужен, чтобы взаимодействовать с блокчейном Solana — отправлять транзакции, получать данные и т.д.

    Где взять RPC URL:
        - Бесплатные публичные RPC:
            - https://api.mainnet-beta.solana.com — основной публичный RPC от Solana.
            - https://solana-mainnet.rpcpool.com — RPCPool (нужно зарегистрироваться).
            - https://api.metaplex.solana.com — от Metaplex.

        - Платные / приватные RPC для повышения скорости и стабильности:
            - QuickNode
            - Alchemy
            - Triton One
            - GenesysGo

    Важно: Публичные RPC могут иметь ограничения по скорости. Если ты планируешь делать много запросов, 
    лучше зарегистрироваться на одном из сервисов и получить приватный URL.  
*/
