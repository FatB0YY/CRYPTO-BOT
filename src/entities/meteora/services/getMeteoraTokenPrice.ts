import DLMM from '@meteora-ag/dlmm'

/**
 * Получает цену токена из активного бина пула Meteora.
 *
 * @param {DLMM} meteoraPool - Экземпляр пула DLMM из Meteora SDK.
 * @returns {Promise<number>} Цена токена в читаемом числовом формате.
 * @throws {Error} Если не удаётся получить активный бин или цену.
 */
export const getMeteoraTokenPrice = async (
  meteoraPool: DLMM,
): Promise<number> => {
  try {
    const activeBin = await meteoraPool.getActiveBin()

    if (!activeBin || typeof activeBin.price !== 'number') {
      throw new Error(
        '[Meteora SDK] Активный бин отсутствует или содержит некорректную цену.',
      )
    }

    const pricePerToken = Number(
      meteoraPool.fromPricePerLamport(Number(activeBin.price)),
    )

    if (isNaN(pricePerToken) || pricePerToken <= 0) {
      throw new Error(
        '[Meteora SDK] Получена некорректная цена из активного бина.',
      )
    }

    return pricePerToken
  } catch (error) {
    console.error('[Ошибка getMeteoraTokenPrice]', error)
    throw new Error(`[Meteora SDK] Ошибка получения цены токена: ${error}`)
  }
}
