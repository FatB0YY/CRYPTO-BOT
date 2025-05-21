import { getMint } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

import { connection } from '@/shared/constants'

/**
 * Получает количество десятичных знаков (decimals) для токена по его mint адресу.
 *
 * @param {string} mint - Адрес mint токена (в виде строки base58).
 * @returns {Promise<number>} Количество десятичных знаков у токена.
 * @throws Ошибка, если mint некорректен или запрос к сети не удался.
 */
export const fetchDecimals = async (mint: string): Promise<number> => {
  try {
    const publicKey = new PublicKey(mint)
    const mintInfo = await getMint(connection, publicKey)
    return mintInfo.decimals
  } catch (error) {
    console.error(`Ошибка при получении decimals для mint ${mint}:`, error)
    throw new Error(`Не удалось получить decimals для mint ${mint}`)
  }
}
