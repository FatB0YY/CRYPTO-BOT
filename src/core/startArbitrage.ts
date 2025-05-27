import { getTopRaydiumPoolByTokens } from '@/entities/raydium'
import { trackedPairs } from '@/shared/constants'
import { delay, logTrade } from '@/shared/lib'

import { detectArbitrage, priceStore } from './detectArbitrage'

let isArbitrageRunning = false

export const startArbitrage = async () => {
  console.log(
    `\n >--------------------- 🔁 Launching arbitrage check: ${new Date().toLocaleTimeString()}`,
  )
  if (isArbitrageRunning) return
  isArbitrageRunning = true

  for (const pair of trackedPairs) {
    try {
      console.log(`Начало итерации ${pair.name}`)

      const poolRaydium = await getTopRaydiumPoolByTokens(
        pair.inputMint,
        pair.outputMint,
      )

      if (poolRaydium) {
        const entry = {
          price: poolRaydium.price,
          liquidity: poolRaydium.tvl,
          timestamp: new Date().toISOString(), // ISO-строка
        }

        priceStore[pair.name] = {
          ...priceStore[pair.name],
          raydium: entry,
        }

        logTrade({
          stockMarket: 'Raydium',
          pair: pair.name,
          side: 'buy',
          price: entry.price,
          liquidity: entry.liquidity,
        })

        detectArbitrage(pair.name)
      }
    } catch (error) {
      console.error(`[❌ Error for pair ${pair.name}]:`, error)
    }

    await delay(1000)
    console.log(`Конец итерации ${pair.name}`)
  }

  isArbitrageRunning = false
  console.log('---------------------<')
}

/* получаем комиссии за своп */
// // ---------------------

// const txVersion = getTxVersion()
// const slippageBps = 50
// const amountInLamports = 5_000_000
// const swapCompute: SwapComputeType = await getComputeSwapBase({
//   computeType: 'swap-base-in',
//   inputMint: pair.inputMint,
//   outputMint: pair.outputMint,
//   amount: amountInLamports,
//   slippage: slippageBps,
//   txVersion,
// })

// console.dir(swapCompute, { depth: null, colors: true })
// // ---------------------
