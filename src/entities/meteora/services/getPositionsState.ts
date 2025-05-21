import DLMM from '@meteora-ag/dlmm'

import { owner } from '@/shared/constants'

/**
 * Получает и выводит данные позиции пользователя в DLMM-пуле Meteora.
 *
 * @param {DLMM} dlmmPool - Экземпляр пула DLMM из Meteora SDK.
 * @returns {Promise<void>} Ничего не возвращает, только выводит данные в консоль.
 * @throws {Error} Если не удаётся получить позиции или данные позиции отсутствуют.
 */
export async function getPositionsState(dlmmPool: DLMM): Promise<void> {
  try {
    const result = await dlmmPool.getPositionsByUserAndLbPair(owner.publicKey)

    if (
      !result ||
      !Array.isArray(result.userPositions) ||
      result.userPositions.length === 0
    ) {
      throw new Error(
        '[Meteora SDK] У пользователя нет активных позиций в пуле.',
      )
    }

    const firstPosition = result.userPositions[0]

    if (!firstPosition?.positionData?.positionBinData) {
      throw new Error(
        '[Meteora SDK] Данные позиции пользователя неполные или отсутствуют.',
      )
    }

    const binData = firstPosition.positionData.positionBinData
    console.log('binData', binData)
  } catch (error) {
    console.error('[Ошибка getPositionsState]', error)
    throw new Error(`[Meteora SDK] Ошибка получения данных позиции: ${error}`)
  }
}
