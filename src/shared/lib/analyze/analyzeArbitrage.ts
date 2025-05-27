import { parse } from 'csv-parse'
import fs from 'fs'

const TIME_DIFF_THRESHOLD_MS = 3000 // ±3 секунды
const MIN_LIQUIDITY = 10000

interface Quote {
  timestamp: Date
  market: string
  pair: string
  side: string
  price: number
  liquidity: number
}

const raydiumQuotes: Quote[] = []
const bybitQuotes: Quote[] = []

export function analyzeSpread(filePath: string) {
  fs.createReadStream(filePath)
    .pipe(parse({ delimiter: ',', from_line: 2 }))
    .on('data', function (row: string[]) {
      const quote: Quote = {
        timestamp: new Date(row[0]),
        market: row[1],
        pair: row[2],
        side: row[3],
        price: parseFloat(row[4]),
        liquidity: parseFloat(row[5]),
      }

      if (quote.liquidity < MIN_LIQUIDITY) return

      if (quote.market === 'Raydium') {
        raydiumQuotes.push(quote)
        compareQuotes(quote, bybitQuotes, true)
      }

      if (quote.market === 'Bybit') {
        bybitQuotes.push(quote)
        compareQuotes(quote, raydiumQuotes, false)
      }
    })
    .on('end', function () {
      console.log('✅ Анализ завершён')
    })
    .on('error', function (error: Error) {
      console.error('❌ Ошибка при анализе:', error.message)
    })
}

function compareQuotes(
  quote: Quote,
  referenceQuotes: Quote[],
  isRaydium: boolean,
) {
  for (const ref of referenceQuotes) {
    const timeDiff = Math.abs(
      quote.timestamp.getTime() - ref.timestamp.getTime(),
    )
    if (timeDiff <= TIME_DIFF_THRESHOLD_MS) {
      const buyPrice = Math.min(quote.price, ref.price)
      const sellPrice = Math.max(quote.price, ref.price)
      const spread = sellPrice - buyPrice
      const spreadPercent = (spread / buyPrice) * 100

      const raydiumPrice = isRaydium ? quote.price : ref.price
      const bybitPrice = isRaydium ? ref.price : quote.price

      console.log(
        `[${quote.timestamp.toISOString()}] Raydium=${raydiumPrice.toFixed(4)} Bybit=${bybitPrice.toFixed(4)} Δ=${spread.toFixed(4)} (${spreadPercent.toFixed(2)}%)`,
      )
    }
  }
}
