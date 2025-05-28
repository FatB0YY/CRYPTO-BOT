import { CategoryV5 } from 'bybit-api'

import { detectArbitrage, priceStore } from '@/core'
import { trackedPairs } from '@/shared/constants'
import { logByBitToken, logTrade } from '@/shared/lib'

import { getBybitRest, getBybitWebsocket } from '../api'
import { KlineUpdateMessage } from '../types'

export const initializeBybitWebSocket = async (): Promise<void> => {
  const ws = getBybitWebsocket()
  const rest = getBybitRest()

  const categories: CategoryV5[] = ['spot', 'linear', 'inverse', 'option']

  const symbolSets: Record<string, Set<string>> = {}

  for (const category of categories) {
    try {
      const res = await rest.getInstrumentsInfo({ category })
      const list = res.result?.list ?? []

      for (const token of list) {
        logByBitToken({
          category,
          pairName: token.symbol,
          price: 'null',
        })
      }

      symbolSets[category] = new Set(list.map((s) => s.symbol))
    } catch (error) {
      console.warn(
        `[Bybit] Ошибка получения инструментов для категории ${category}:`,
        error,
      )
      symbolSets[category] = new Set()
    }
  }

  for (const pair of trackedPairs) {
    const rawSymbol = pair.name.replace('/', '')
    let found = false

    for (const category of categories) {
      if (symbolSets[category]?.has(rawSymbol)) {
        ws.subscribeV5(`kline.5.${rawSymbol}`, category)
        console.log(`[✅ Bybit] Подписка на ${rawSymbol} (${category})`)
        found = true
        break
      }
    }

    if (!found) {
      console.warn(
        `[⛔ Bybit] Пропущено: ${rawSymbol} — не найдено ни в одной категории`,
      )
    }
  }

  ws.on('update', (message: KlineUpdateMessage) => {
    try {
      const { topic, data: klineData } = message
      if (!topic || !klineData.length) return

      const symbol = topic.replace(/^kline\.5\./, '')
      const pair = trackedPairs.find((p) => p.name.replace('/', '') === symbol)
      if (!pair) return

      const info = klineData[0]
      const price = Number(info.close)
      const turnover = Number(info.turnover)

      if (!price || !turnover || isNaN(price) || isNaN(turnover)) return

      const entry = {
        price,
        liquidity: turnover,
        timestamp: new Date().toISOString(), // ISO-строка
      }

      priceStore[pair.name] = {
        ...priceStore[pair.name],
        bybit: entry,
      }

      logTrade({
        stockMarket: 'Bybit',
        pair: pair.name,
        side: 'buy',
        price: entry.price,
        liquidity: entry.liquidity,
      })

      detectArbitrage(pair.name)
    } catch (error) {
      console.error('[❌ Bybit] Ошибка в обработчике update:', error)
    }
  })

  ws.on('open', ({ wsKey }) => console.log('WebSocket открыт:', wsKey))
  ws.on('response', (response) => console.log('WebSocket ответ:', response))
  ws.on('exception', (error) =>
    console.error('❌ WebSocket исключение:', error),
  )
  ws.on('close', () => console.log('WebSocket закрыт'))
  ws.on('reconnect', ({ wsKey }) =>
    console.log('Переподключение WebSocket:', wsKey),
  )
  ws.on('reconnected', (data) =>
    console.log('✅ WebSocket переподключён:', data?.wsKey),
  )
}
