import { getBybitRest } from '../api'

/**
 * Выполняет рыночную сделку на Bybit: продаёт USDC за SOL (пара SOL/USDC). !как Taker!
 *
 * @param {string} amount - Сумма в USDC, которую нужно продать (quote-валюта).
 * @returns {Promise<void>} Ничего не возвращает, но логирует результат ордера в консоль.
 * @throws {Error} Если не удалось выполнить ордер или произошла ошибка API.
 */
export const _swapUsdcToSolByBit = async (amount: string): Promise<void> => {
  try {
    const rest = getBybitRest()

    console.log(`[Bybit API] Готовим рыночный ордер: ${amount} USDC → SOL`)

    const response = await rest.submitOrder({
      category: 'spot',
      symbol: 'SOLUSDT',
      side: 'Sell',
      orderType: 'Market',
      qty: amount, // сумма, которую тратим (в USDC)
      marketUnit: 'quoteCoin', // уточнение, что qty — это quote валюта
    })

    if (!response || response.retCode !== 0) {
      throw new Error(
        `[Bybit API] Ордер не выполнен. Ответ: ${JSON.stringify(response)}`,
      )
    }

    console.log('✅ Ордер выполнен успешно:', response)
  } catch (error) {
    console.error('[Ошибка _swapUsdcToSolByBit]', error)
    throw new Error(
      `[Bybit API] Ошибка при выполнении рыночного ордера: ${error}`,
    )
  }
}
