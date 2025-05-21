import { CategoryV5 } from 'bybit-api'

import { trackedPairs } from '@/shared/constants'
import { logTrade } from '@/shared/lib'

import { getBybitRest, getBybitWebsocket } from '../api'
import { KlineUpdateMessage } from '../types'

const categories: CategoryV5[] = ['spot', 'linear', 'inverse', 'option']

/**
 * Инициализирует WebSocket-соединение с Bybit и подписывается на пары из `trackedPairs`.
 * Автоматически определяет категорию (spot, linear и т.д.) для каждого символа.
 *
 * @returns {Promise<void>} Ничего не возвращает, подписки и логирование выполняются в фоне.
 */
export const initializeBybitWebSocket = async (): Promise<void> => {
  const ws = getBybitWebsocket()
  const rest = getBybitRest()

  const symbolSets: Record<string, Set<string>> = {}

  // Получение доступных символов по каждой категории
  for (const category of categories) {
    try {
      const res = await rest.getInstrumentsInfo({ category })
      const list = res.result?.list ?? []
      symbolSets[category] = new Set(list.map((s) => s.symbol))
    } catch (err) {
      console.warn(
        `[Bybit] Ошибка получения инструментов для категории ${category}:`,
        err,
      )
      symbolSets[category] = new Set()
    }
  }

  // Подписка на пары
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

  // Обработка событий WebSocket
  ws.on('open', ({ wsKey }) => {
    console.log('WebSocket открыт:', wsKey)
  })

  ws.on('update', (message: KlineUpdateMessage) => {
    try {
      const { topic, data: klineData } = message
      if (!topic || !klineData.length) return

      const symbol = topic.replace(/^kline\.5\./, '')
      const pair = trackedPairs.find((p) => p.name.replace('/', '') === symbol)
      if (!pair) {
        console.warn(`[Bybit] Пара не найдена в trackedPairs: ${symbol}`)
        return
      }

      const info = klineData[0]
      const price = Number(info.close)
      const turnover = Number(info.turnover)

      if (!price || !turnover || isNaN(price) || isNaN(turnover)) {
        console.warn(
          `[Bybit] Неверные данные: price=${price}, turnover=${turnover}`,
        )
        return
      }

      logTrade({
        stockMarket: 'Bybit',
        pair: pair.name,
        side: 'buy',
        price,
        liquidity: turnover,
      })
    } catch (err) {
      console.error('[❌ Bybit] Ошибка в обработчике update:', err)
    }
  })

  ws.on('response', (response) => {
    console.log('WebSocket ответ:', response)
  })

  ws.on('exception', (err) => {
    console.error('❌ WebSocket исключение:', err)
  })

  ws.on('close', () => {
    console.log('WebSocket закрыт')
  })

  ws.on('reconnect', ({ wsKey }) => {
    console.log('Переподключение WebSocket:', wsKey)
  })

  ws.on('reconnected', (data) => {
    console.log('✅ WebSocket переподключён:', data?.wsKey)
  })
}
