import { stringify } from 'csv-stringify'
import fs from 'fs'
import path from 'path'

import { TradeLogEntry } from './types'

/**
 * Словарь, хранящий csv-stringify стримы для каждой торговой пары.
 * Используется для избежания повторного открытия файлов.
 */
const writersMap: Record<string, ReturnType<typeof stringify>> = {}

/**
 * Проверяет существование директории logs и создаёт её при необходимости.
 * Гарантирует, что путь к файлам логов доступен перед записью.
 */
function ensureLogDirExists(): void {
  const dir = path.resolve(process.cwd(), 'logs')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/**
 * Создаёт и возвращает CSV-писатель (csv-stringify stream) для заданной торговой пары.
 * Если файл не существует, добавляет заголовок в CSV.
 *
 * @param {string} pair - Торговая пара, например "SOL/USDC"
 * @returns {ReturnType<typeof stringify>} - CSV трансформ-стрим для записи логов
 */
function getCsvWriter(pair: string): ReturnType<typeof stringify> {
  try {
    const safePairName = pair.replace('/', '_')
    const logPath = path.resolve(process.cwd(), 'logs', `${safePairName}.csv`)
    const isNew = !fs.existsSync(logPath)
    const writable = fs.createWriteStream(logPath, { flags: 'a' })

    writable.on('error', (err) => {
      console.error(`[LogWriter] Ошибка записи в файл ${logPath}:`, err)
    })

    const stringifier = stringify({
      header: isNew,
      columns: [
        'timestamp',
        'stockMarket',
        'pair',
        'side',
        'price',
        'liquidity',
      ],
    })

    stringifier.on('error', (err) => {
      console.error(`[LogWriter] Ошибка stringify для пары ${pair}:`, err)
    })

    stringifier.pipe(writable)
    writersMap[pair] = stringifier
    return stringifier
  } catch (err) {
    console.error(
      `[LogWriter] Не удалось создать логгер для пары ${pair}:`,
      err,
    )
    throw err
  }
}

/**
 * Записывает торговую сделку в CSV-файл, соответствующий паре.
 * Создаёт файл и директорию при необходимости.
 *
 * @param {TradeLogEntry} entry - Объект, описывающий торговую сделку
 * @example
 * logTrade({
 *   stockMarket: 'Raydium',
 *   pair: 'SOL/USDC',
 *   side: 'buy',
 *   price: 143.23,
 *   liquidity: 50000,
 *   route: ['USDC', 'SOL']
 * })
 */
export function logTrade(entry: TradeLogEntry): void {
  try {
    ensureLogDirExists()
    const writer = writersMap[entry.pair] || getCsvWriter(entry.pair)

    writer.write({
      timestamp: new Date().toISOString(),
      stockMarket: entry.stockMarket,
      pair: entry.pair,
      side: entry.side,
      price: entry.price,
      liquidity: entry.liquidity,
    })
  } catch (err) {
    console.error(`[LogWriter] Ошибка при записи трейда ${entry.pair}:`, err)
  }
}
