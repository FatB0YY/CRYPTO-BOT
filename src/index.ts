import 'module-alias/register'

import { ApiV3PoolInfoItem } from '@raydium-io/raydium-sdk-v2'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Express, json } from 'express'
import http from 'http'
import path from 'path'

import { config } from '@/shared/config'
import { trackedPairs } from '@/shared/constants'
import { delay, logTrade } from '@/shared/lib'

import { getTopRaydiumPoolByTokens } from './entities/raydium'
import { analyzeSpread } from './shared/lib/analyze/analyzeArbitrage'

let poolTopRaydium: ApiV3PoolInfoItem | undefined

const app: Express = express()
app.use(cors({ credentials: true, origin: '*' }))
app.use(json())
app.use(cookieParser())

const PORT = config.port
let isArbitrageRunning = false

const startArbitrage = async () => {
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

      // if (poolRaydium) {
      //   const txVersion = getTxVersion()

      //   const priorityFees: PriorityFeeType = await getPriorityFees(
      //     `${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`,
      //   )
      //   console.log('priorityFees', priorityFees.data.default)

      //   const swapCompute: SwapComputeType = await getComputeSwapBase({
      //     computeType: 'swap-base-in',
      //     inputMint: pair.inputMint,
      //     outputMint: pair.outputMint,
      //     amount: 5_000_000,
      //     slippage: 50 / 100,
      //     txVersion,
      //   })

      //   const string = JSON.stringify(swapCompute)
      //   console.log(string)
      // }

      if (poolRaydium) {
        logTrade({
          stockMarket: 'Raydium',
          pair: pair.name,
          side: 'buy',
          price: poolRaydium.price,
          liquidity: poolRaydium.tvl,
        })
      }

      // const meteoraPool = await initializeDLMMinstance(pair.meteoraPool)

      // if (meteoraPool) {
      //   await meteoraPool.refetchStates()

      //   const pricePerToken = await getMeteoraTokenPrice(meteoraPool)

      //   logTrade({
      //     stockMarket: 'Meteora',
      //     pair: pair.name,
      //     side: 'buy',
      //     price: pricePerToken,
      //     liquidity: -1,
      //   })
      // }
    } catch (error) {
      console.error(`[❌ Error for pair ${pair.name}]:`, error)
    }

    await delay(1000)
    console.log(`Конец итерации ${pair.name}`)
  }

  isArbitrageRunning = false
  console.log('---------------------<')
}

const arbitrageLoop = async () => {
  while (true) {
    await startArbitrage()
    await delay(1000)
  }
}

const main = () => {
  try {
    const server = http.createServer(app)
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`)
    })

    // initializeBybitWebSocket()
    // arbitrageLoop()
    const filePath = path.resolve(process.cwd(), 'logs', `SOL_USDT.csv`)
    analyzeSpread(filePath)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()

// TODO: проскальзывание и лампорты проверить везде правильно передаются ? ( / 100 и так далее)
