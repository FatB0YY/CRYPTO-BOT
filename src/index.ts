import 'module-alias/register'

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Express, json } from 'express'
import http from 'http'

import { config } from '@/shared/config'

import { arbitrageLoop } from './core'
import { getBybitRest, initializeBybitWebSocket } from './entities/bybit'

const app: Express = express()
app.use(cors({ credentials: true, origin: '*' }))
app.use(json())
app.use(cookieParser())

const rest = getBybitRest()

const PORT = config.port

const main = async () => {
  try {
    const server = http.createServer(app)
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`)
    })

    initializeBybitWebSocket()
    arbitrageLoop()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()

// TODO: проскальзывание и лампорты проверить везде правильно передаются ? ( / 100 и так далее)

/* берем данные пола на Meteora */
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

/* анализируем .log файл */
// const filePath = path.resolve(process.cwd(), 'logs', `SOL_USDT.csv`)
// analyzeSpread(filePath)
