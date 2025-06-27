import { CategoryV5 } from 'bybit-api'

import { getBybitRest } from '@/entities/bybit'
import { logConsoleCsv } from '@/shared/lib'

import { executeArbitrage } from './executeArbitrage'

type PriceEntry = {
  raydium?: { price: number; liquidity: number; timestamp: string }
  bybit?: {
    price: number
    liquidity: number
    timestamp: string
    category?: CategoryV5
  }
}

export const priceStore: Record<string, PriceEntry> = {}

const RAYDIUM_FEE_PERCENT = 0.25
const FEE_CACHE_TTL = 30_000 // 30 сек

// Кеш комиссий: ключ = "symbol|category", значение = { value, updatedAt }
const bybitFeeCache = new Map<string, { value: number; updatedAt: number }>()

const getBybitTakerFee = async (symbol: string, category: CategoryV5) => {
  const key = `${symbol}|${category}`
  const now = Date.now()

  const cached = bybitFeeCache.get(key)
  if (cached && now - cached.updatedAt < FEE_CACHE_TTL) {
    return cached.value
  }

  try {
    const rest = getBybitRest()
    const res = await rest.getFeeRate({ category, symbol })
    const feeStr = res.result?.list?.[0]?.takerFeeRate
    const fee = feeStr ? parseFloat(feeStr) * 100 : 0.2

    // if (!fee || !feeStr) {
    //   throw new Error('Не удалось получить fee')
    // }

    bybitFeeCache.set(key, { value: fee, updatedAt: now })
    return fee
  } catch (error) {
    console.warn(`[Bybit] Ошибка при получении комиссии для ${symbol}:`, error)
  }
}

type DirectionType =
  | 'Buy on Raydium → Sell on Bybit'
  | 'Buy on Bybit → Sell on Raydium'
  | null

export const detectArbitrage = async (pairName: string) => {
  try {
    const entry = priceStore[pairName]
    if (!entry?.bybit || !entry?.raydium) return

    const now = Date.now()
    const maxAge = 3000

    const raydiumTimestamp = Date.parse(entry.raydium.timestamp)
    const bybitTimestamp = Date.parse(entry.bybit.timestamp)

    const isFresh =
      now - raydiumTimestamp < maxAge && now - bybitTimestamp < maxAge

    if (!isFresh) return

    const priceRaydium = entry.raydium.price
    const priceBybit = entry.bybit.price
    const bybitCategory: CategoryV5 = entry.bybit.category || 'spot'

    // Получаем комиссию с кешированием
    const symbolRaw = pairName.replace('/', '')
    const bybitTakerFee = await getBybitTakerFee(symbolRaw, bybitCategory)

    if (!bybitTakerFee) {
      throw new Error('Не удалось получить fee')
    }

    let spread = 0
    let grossProfitPercent = 0
    let netProfitPercent = 0
    let direction: DirectionType = null

    if (priceRaydium < priceBybit) {
      spread = priceBybit - priceRaydium
      grossProfitPercent = (spread / priceRaydium) * 100
      direction = 'Buy on Raydium → Sell on Bybit'
      netProfitPercent =
        grossProfitPercent - RAYDIUM_FEE_PERCENT - bybitTakerFee
    } else if (priceBybit < priceRaydium) {
      spread = priceRaydium - priceBybit
      grossProfitPercent = (spread / priceBybit) * 100
      direction = 'Buy on Bybit → Sell on Raydium'
      netProfitPercent =
        grossProfitPercent - RAYDIUM_FEE_PERCENT - bybitTakerFee
    } else {
      return
    }

    // TODO: пока что хардкод на direction
    if (
      netProfitPercent > 2 &&
      direction === 'Buy on Bybit → Sell on Raydium'
    ) {
      console.log(
        `${pairName} | pairName[${new Date().toISOString()}] ${direction}\n` +
          `Raydium=${priceRaydium.toFixed(4)} | Bybit=${priceBybit.toFixed(4)} | Δ=${spread.toFixed(4)}\n` +
          `Gross=${grossProfitPercent.toFixed(2)}% | Net=${netProfitPercent.toFixed(2)}%`,
      )

      logConsoleCsv({
        direction,
        grossProfitPercent,
        netProfitPercent,
        pairName,
        priceBybit,
        priceRaydium,
        spread,
      })

      // 💰 Арбитражная сделка: покупаем на Bybit → продаём на Raydium
      const amountUsdc = 17.6 // ❗ Тут можно сделать динамическим, но пока фиксируем
      const raydiumOutputMint = 'Es9vMFrzaCERCLgLWLZKjQwBPiKRdzzZ1zX8FzpuFxrP' // 🔁 Укажи здесь нужный адрес токена (например, USDC)

      console.log(
        `🚀 [ARBITRAGE] Обнаружена возможность! Запускаем сделку на ${amountUsdc} USDC...`,
      )
      await executeArbitrage({ amountUsdc, raydiumOutputMint })

      console.log('🛑 Арбитраж завершён, приложение завершается')
      process.exit(0)
    }
  } catch (error) {
    console.error('[❌ ERROR] detectArbitrage:', error)
  }
}
