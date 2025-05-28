import { stringify } from 'csv-stringify'
import fs from 'fs'
import path from 'path'

const consoleWritersMap: Record<string, ReturnType<typeof stringify>> = {}

function ensureLogDirExists(): void {
  const dir = path.resolve(process.cwd(), 'logs', 'success')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function getCsvWriter(pair: string): ReturnType<typeof stringify> {
  const safePairName = pair.replace('/', '_')
  const logPath = path.resolve(
    process.cwd(),
    'logs',
    'success',
    `${safePairName}.csv`,
  )
  const isNew = !fs.existsSync(logPath)
  const writable = fs.createWriteStream(logPath, { flags: 'a' })

  writable.on('error', (error) => {
    console.error(`[ConsoleCsvLogger] Ошибка записи в файл ${logPath}:`, error)
  })

  const stringifier = stringify({
    header: isNew,
    columns: [
      'timestamp',
      'pair',
      'direction',
      'priceRaydium',
      'priceBybit',
      'spread',
      'grossProfitPercent',
      'netProfitPercent',
    ],
  })

  stringifier.on('error', (error) => {
    console.error(`[ConsoleCsvLogger] Ошибка stringify для ${pair}:`, error)
  })

  stringifier.pipe(writable)
  consoleWritersMap[pair] = stringifier
  return stringifier
}

type Entry = {
  pairName: string
  direction: string
  priceRaydium: number
  priceBybit: number
  spread: number
  grossProfitPercent: number
  netProfitPercent: number
}

export function logConsoleCsv(entry: Entry): void {
  const {
    direction,
    grossProfitPercent,
    netProfitPercent,
    pairName,
    priceBybit,
    priceRaydium,
    spread,
  } = entry

  try {
    ensureLogDirExists()
    const writer = consoleWritersMap[pairName] || getCsvWriter(pairName)

    writer.write({
      timestamp: new Date().toISOString(),
      pair: pairName,
      direction,
      priceRaydium,
      priceBybit,
      spread,
      grossProfitPercent,
      netProfitPercent,
    })
  } catch (error) {
    console.error(
      `[ConsoleCsvLogger] Ошибка при записи данных ${pairName}:`,
      error,
    )
  }
}
