import { parse } from 'csv-parse'
import fs from 'fs'

interface Quote {
  timestamp: Date
  pair: string
  direction: string
  priceRaydium: number
  priceBybit: number
  spread: number
  grossProfitPercent: number
  netProfitPercent: number
}

function roundToInterval(date: Date, seconds: number): string {
  const ts = Math.floor(date.getTime() / 1000)
  const rounded = ts - (ts % seconds)
  return new Date(rounded * 1000).toISOString()
}

export async function analyzeMaxPrice(
  filePath: string,
  topN: number = 30,
  timeGroupSeconds: number = 600,
): Promise<void> {
  const quotes: Quote[] = await new Promise((resolve, reject) => {
    const result: Quote[] = []

    fs.createReadStream(filePath)
      .pipe(parse({ delimiter: ',', from_line: 2 }))
      .on('data', (row: string[]) => {
        const quote: Quote = {
          timestamp: new Date(row[0]),
          pair: row[1],
          direction: row[2],
          priceRaydium: parseFloat(row[3]),
          priceBybit: parseFloat(row[4]),
          spread: parseFloat(row[5]),
          grossProfitPercent: parseFloat(row[6]),
          netProfitPercent: parseFloat(row[7]),
        }
        result.push(quote)
      })
      .on('end', () => resolve(result))
      .on('error', reject)
  })

  // Группировка по округлённому времени
  const bestByTime = new Map<string, Quote>()

  for (const quote of quotes) {
    const timeKey = roundToInterval(quote.timestamp, timeGroupSeconds)
    const existing = bestByTime.get(timeKey)

    if (!existing || quote.netProfitPercent > existing.netProfitPercent) {
      bestByTime.set(timeKey, quote)
    }
  }

  const sorted = Array.from(bestByTime.values()).sort(
    (a, b) => b.netProfitPercent - a.netProfitPercent,
  )

  const top = sorted.slice(0, topN)

  console.log(
    `🕒 Top ${topN} profitable trades (grouped by ${timeGroupSeconds}s):`,
  )
  top.forEach((quote, index) => {
    console.log(
      `${index + 1}. ${quote.timestamp.toISOString()} | ${quote.direction} | netProfit: ${quote.netProfitPercent.toFixed(4)}% | Raydium: ${quote.priceRaydium} | Bybit: ${quote.priceBybit}`,
    )
  })
}
