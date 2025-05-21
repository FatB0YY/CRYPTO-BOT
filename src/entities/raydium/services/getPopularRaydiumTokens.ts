import { FetchPoolParams, PoolFetchType } from '@raydium-io/raydium-sdk-v2'

import { initializeRaydiumSdk } from './initializeRaydiumSdk'

interface ITopToken {
  name: string
  symbol: string
  value: string
}

/**
 * Получает список уникальных популярных токенов из топ-50 пулов Raydium,
 * отсортированных по 24-часовому объему торгов (по умолчанию).
 *
 * Используется для формирования списка ликвидных токенов, подходящих для арбитража
 * или отображения в UI (например, в выпадающем списке).
 *
 * @async
 * @function
 * @param
 * FetchPoolParams['sort']
 * @returns {Promise<Array<{ name: string, symbol: string, value: string }>>}
 * Массив уникальных токенов с названием, символом и адресом.
 *
 * @throws {Error} В случае проблем с инициализацией SDK или получением списка пулов.
 */
export const getPopularRaydiumTokens = async (
  sort: FetchPoolParams['sort'] = 'volume24h',
) => {
  try {
    const raydium = await initializeRaydiumSdk()
    const topTokensMap = new Map<string, ITopToken>()

    const result = await raydium.api.getPoolList({
      page: 1,
      pageSize: 50,
      order: 'desc',
      sort,
      type: PoolFetchType.All,
    })

    for (const pool of result.data) {
      const tokens = [pool.mintA, pool.mintB]
      for (const token of tokens) {
        if (!topTokensMap.has(token.address)) {
          topTokensMap.set(token.address, {
            name: token.name,
            symbol: token.symbol,
            value: token.address,
          })
        }
      }
    }

    const topTokens = Array.from(topTokensMap.values()).slice(0, 50)
    return topTokens
  } catch (error) {
    console.error('Ошибка при получении популярных токенов Raydium:', error)
    throw new Error('Не удалось получить список популярных токенов с Raydium')
  }
}
