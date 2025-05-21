import { FetchPoolParams, PoolFetchType } from '@raydium-io/raydium-sdk-v2'

import { initializeRaydiumSdk } from './initializeRaydiumSdk'

/**
 * Получает лучший (наиболее ликвидный или с максимальным объемом) пул Raydium для заданной пары токенов.
 *
 * Используется для оценки арбитражных возможностей между Raydium и другими платформами (например, Bybit).
 *
 * @async
 * @function
 * @param {string} tokenMintAddress - Адрес mint первого токена.
 * @param {string} pairedTokenMintAddress - Адрес mint второго токена.
 * @returns {Promise<object>} Объект пула с максимальным объемом торгов за 24ч (по умолчанию) среди доступных пулов для пары токенов.
 * @throws {Error} Если SDK не инициализировался или пул не найден.
 */
export const getTopRaydiumPoolByTokens = async (
  tokenMintAddress: string,
  pairedTokenMintAddress: string,
  sort: FetchPoolParams['sort'] = 'volume24h',
) => {
  try {
    const raydium = await initializeRaydiumSdk()

    const pools = await raydium.api.fetchPoolByMints({
      mint1: tokenMintAddress,
      mint2: pairedTokenMintAddress,
      order: 'desc',
      // | "liquidity"    // Общая ликвидность в пуле
      // | "volume24h"    // Объём торгов за 24 часа
      // | "volume7d"     // Объём торгов за 7 дней
      // | "volume30d"    // Объём торгов за 30 дней
      // | "fee24h"       // Сумма комиссий за 24 часа
      // | "fee7d"        // Сумма комиссий за 7 дней
      // | "fee30d"       // Сумма комиссий за 30 дней
      // | "apr24h"       // Доходность пула за 24 часа
      // | "apr7d"        // Доходность пула за 7 дней
      // | "apr30d"       // Доходность пула за 30 дней
      sort,
      // declare enum PoolFetchType {
      //   All = "all",                      // все пулы (и стандартные, и концентрированные)
      //   Standard = "standard",           // стандартные пулы (обычные AMM пулы)
      //   Concentrated = "concentrated",   // концентрированные пулы (аналог UniV3: ликвидность по диапазонам цен)
      //   AllFarm = "allFarm",             // все фермы (на основе всех типов пулов)
      //   StandardFarm = "standardFarm",   // фермы на стандартных пулах
      //   ConcentratedFarm = "concentratedFarm" // фермы на концентрированных пулах
      // }
      type: PoolFetchType.All,
    })

    if (!pools.data || pools.data.length === 0) {
      throw new Error(
        `Пулы не найдены для пары токенов: ${tokenMintAddress}/${pairedTokenMintAddress}.`,
      )
    }

    // Посмотреть список всех пулов "tokenMintAddress/pairedTokenMintAddress"
    // const prices = pools.data.map((p) => ({
    //   poolId: p.id,
    //   type: p.type,
    //   price: p.price,
    //   liquidity: p.tvl,
    //   mintA: p.mintA.symbol,
    //   mintAmountA: p.mintAmountA,
    //   mintB: p.mintB.symbol,
    //   mintAmountB: p.mintAmountB,
    // }))
    // console.log('prices', prices)

    const topPool = pools.data[0]
    return topPool
  } catch (error) {
    console.error(`Ошибка при получении пулов Raydium:`, error)
    throw new Error(
      `Не удалось получить топовый пул для пары: ${tokenMintAddress}/${pairedTokenMintAddress}`,
    )
  }
}
