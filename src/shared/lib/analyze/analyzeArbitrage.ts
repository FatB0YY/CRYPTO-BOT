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

        for (const bybitQuote of bybitQuotes) {
          const timeDiff = Math.abs(
            bybitQuote.timestamp.getTime() - quote.timestamp.getTime(),
          )
          if (timeDiff <= TIME_DIFF_THRESHOLD_MS) {
            let priceDiff: number | null = null

            if (quote.price > bybitQuote.price) {
              priceDiff = quote.price - bybitQuote.price
            } else {
              priceDiff = bybitQuote.price - quote.price
            }

            const priceDiffPercent = (priceDiff / bybitQuote.price) * 100
            console.log(
              `[${quote.timestamp.toISOString()}] Raydium=${quote.price} Bybit=${bybitQuote.price} Δ=${priceDiff} (${priceDiffPercent}%)`,
            )
          }
        }
      }

      if (quote.market === 'Bybit') {
        bybitQuotes.push(quote)

        for (const raydiumQuote of raydiumQuotes) {
          const timeDiff = Math.abs(
            raydiumQuote.timestamp.getTime() - quote.timestamp.getTime(),
          )
          if (timeDiff <= TIME_DIFF_THRESHOLD_MS) {
            let priceDiff: number | null = null

            if (raydiumQuote.price > quote.price) {
              priceDiff = raydiumQuote.price - quote.price
            } else {
              priceDiff = quote.price - raydiumQuote.price
            }

            const priceDiffPercent = (priceDiff / quote.price) * 100
            console.log(
              `[${quote.timestamp.toISOString()}] Raydium=${raydiumQuote.price} Bybit=${quote.price} Δ=${priceDiff} (${priceDiffPercent}%)`,
            )
          }
        }
      }
    })
    .on('end', function () {
      console.log('✅ Анализ завершён')
    })
    .on('error', function (error: Error) {
      console.error('❌ Ошибка при анализе:', error.message)
    })
}
