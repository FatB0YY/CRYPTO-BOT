import { CategoryV5 } from 'bybit-api'
import { stringify } from 'csv-stringify'
import fs from 'fs'
import path from 'path'

const writerMap = new Map<CategoryV5, ReturnType<typeof stringify>>()

function ensureLogDirExists(): void {
  const dir = path.resolve(process.cwd(), 'logs', 'tokens-bybit')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function getCsvWriter(category: CategoryV5): ReturnType<typeof stringify> {
  if (writerMap.has(category)) return writerMap.get(category)!

  const logPath = path.resolve(
    process.cwd(),
    'logs',
    'tokens-bybit',
    `${category}.csv`,
  )
  const isNew = !fs.existsSync(logPath)

  const writable = fs.createWriteStream(logPath, { flags: 'a' })
  writable.on('error', (error) => {
    console.error(
      `[logByBitTokensWriter] Ошибка записи в файл ${logPath}:`,
      error,
    )
  })

  const stringifier = stringify({
    header: isNew,
    columns: ['timestamp', 'stockMarket', 'category', 'pair', 'price'],
  })

  stringifier.on('error', (error) => {
    console.error(`[logByBitTokensWriter] Ошибка stringify:`, error)
  })

  stringifier.pipe(writable)
  writerMap.set(category, stringifier)

  return stringifier
}

type Entry = {
  category: CategoryV5
  pairName: string
  price?: string | number
}

export function logByBitToken(entry: Entry): void {
  try {
    ensureLogDirExists()
    const writer = getCsvWriter(entry.category)

    writer.write({
      timestamp: new Date().toISOString(),
      stockMarket: 'Bybit',
      category: entry.category,
      pair: entry.pairName,
      price: entry.price ?? '',
    })
  } catch (error) {
    console.error(
      `[ConsoleCsvLogger] Ошибка при логировании ${entry.pairName}:`,
      error,
    )
  }
}
