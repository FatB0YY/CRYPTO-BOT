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

export async function analyzeMaxPrice(filePath: string) {
  new Promise<Quote[]>((resolve, reject) => {
    const arraySuccessTokens: Quote[] = []

    fs.createReadStream(filePath)
      .pipe(parse({ delimiter: ',', from_line: 2 }))
      .on('data', function (row: string[]) {
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

        arraySuccessTokens.push(quote)
      })
      .on('end', () => {
        resolve(arraySuccessTokens)
      })
      .on('error', (error) => {
        reject(error)
      })
  }).then((res) => {
    const sortedArray = res.sort(
      (a: Quote, b: Quote) => b.netProfitPercent - a.netProfitPercent,
    )

    if (!sortedArray.length) {
      console.log('массив пуст')
    }

    console.log(sortedArray[0])
  })
}
