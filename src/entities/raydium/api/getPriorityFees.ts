import nFetch from 'node-fetch'

import { PriorityFeeType } from '../types'

/**
 * Получает приоритетные комиссии (priority fees) с API Raydium для расчёта compute unit price.
 * Используется при создании транзакций, чтобы выставить адекватную цену за compute unit
 * и повысить вероятность быстрой обработки в сети Solana.
 *
 * @param {string} apiUrl - Полный URL к API, предоставляющий приоритетные комиссии.
 *                          Обычно: `${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`
 *
 * @returns {Promise<PriorityFeeType>} - Объект с уровнями приоритетных комиссий (vh, h, m).
 *
 * @throws {Error} - Если запрос завершился неуспешно, или API вернул `success = false`.
 *
 * @example
 * const fees = await getPriorityFees("https://api.raydium.io/priority-fee");
 * const computePrice = fees.data.default.vh; // very high приоритет
 */
export async function getPriorityFees(
  apiUrl: string,
): Promise<PriorityFeeType> {
  try {
    const response = await nFetch(apiUrl, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch priority fees: ${response.status} ${response.statusText}`,
      )
    }

    const result: PriorityFeeType = await response.json()

    if (!result.success) {
      throw new Error(`API returned success = false: ${JSON.stringify(result)}`)
    }

    return result
  } catch (error) {
    throw new Error(`Error while fetching priority fees: ${error}`)
  }
}
