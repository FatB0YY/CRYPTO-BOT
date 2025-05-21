import DLMM from '@meteora-ag/dlmm'
import { PublicKey } from '@solana/web3.js'

import { connection } from '@/shared/constants'

/**
 * Инициализирует экземпляр DLMM для заданного пула Meteora.
 *
 * @param {string} poolAddress - Строковое представление адреса пула.
 * @returns {Promise<DLMM>} Экземпляр DLMM, если инициализация прошла успешно.
 * @throws {Error} Если адрес некорректен или инициализация не удалась.
 */
export const initializeDLMMinstance = async (
  poolAddress: string,
): Promise<DLMM> => {
  try {
    const publicKey = new PublicKey(poolAddress)
    const dlmmInstance = await DLMM.create(connection, publicKey)

    if (!dlmmInstance) {
      throw new Error('[Meteora SDK] DLMM.create вернул null или undefined.')
    }

    return dlmmInstance
  } catch (error) {
    console.error('[Ошибка initializeDLMMinstance]', error)
    throw new Error(`[Meteora SDK] Не удалось инициализировать DLMM: ${error}`)
  }
}
