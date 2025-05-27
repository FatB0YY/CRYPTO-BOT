import { getBybitRest } from '../api'

/**
 * Получает процент комиссии на Bybit (spot) для заданного ордера.
 *
 * @param {string} symbol - Торговая пара, например "SOLUSDT".
 * @param {"Maker" | "Taker"} role - Тип ордера: Maker (лимитный) или Taker (рыночный).
 * @returns {Promise<number>} Возвращает процент комиссии (например, 0.001 = 0.1%).
 */
export const getBybitSpotFeeRate = async (
  symbol: string,
  role: 'Maker' | 'Taker',
): Promise<number> => {
  const rest = getBybitRest()

  const response = await rest.getFeeRate({
    category: 'spot',
    symbol,
  })

  const feeInfo = response.result?.list?.[0]

  if (!feeInfo) {
    throw new Error(`[Bybit Fee] Не удалось получить комиссию для ${symbol}`)
  }

  const feeRateStr =
    role === 'Taker' ? feeInfo.takerFeeRate : feeInfo.makerFeeRate
  const feeRate = parseFloat(feeRateStr)

  if (isNaN(feeRate)) {
    throw new Error(`[Bybit Fee] Некорректная комиссия: ${feeRateStr}`)
  }

  return feeRate
}
