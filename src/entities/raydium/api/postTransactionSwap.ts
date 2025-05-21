import { API_URLS } from '@raydium-io/raydium-sdk-v2'
import nFetch from 'node-fetch'

import { TxVersionType } from '../constants'
import { SwapComputeType, SwapTransactionsType } from '../types'

type ComputeType = 'swap-base-in' | 'swap-base-out'

interface PostTransactionSwapProps {
  computeUnitPriceMicroLamports: string
  swapCompute: SwapComputeType
  txVersion: TxVersionType
  computeType: ComputeType
  ownerPublicKey: string
  isInputSol: boolean
  isOutputSol: boolean
  inputAccount?: string
  outputAccount?: string
}

/**
 * Отправляет POST-запрос к Raydium API для получения подписываемых транзакций свапа.
 * Универсальна для обеих моделей: `swap-base-in` (фиксированный input) и `swap-base-out` (фиксированный output).
 *
 * Используется после получения расчётных данных свапа (`swapCompute`) через API `getComputeSwapBase`.
 * Возвращает массив транзакций (обычно 1–2), которые нужно подписать и отправить в сеть Solana.
 *
 * Поддерживает как SOL (нативный токен), так и SPL-токены на входе/выходе. Учитывает необходимость оборачивания (wrap/unwrap) SOL в WSOL и обратно.
 *
 * ---
 * @param {Object} params - Объект параметров вызова.
 * @param {string} params.computeUnitPriceMicroLamports - Приоритетная цена за compute unit (в microLamports). Получается из функции `getPriorityFees`.
 * @param {SwapComputeType} params.swapCompute - Результат расчёта свапа, полученный из `getComputeSwapBase`.
 * @param {TxVersionType} params.txVersion - Версия транзакции: `'V0'` (рекомендуется) или `'LEGACY'`.
 * @param {'swap-base-in' | 'swap-base-out'} params.computeType - Тип операции:
 *   - `'swap-base-in'` — фиксированная сумма на входе
 *   - `'swap-base-out'` — фиксированная сумма на выходе
 * @param {string} params.ownerPublicKey - Публичный ключ кошелька, который выполняет свап.
 * @param {boolean} params.isInputSol - `true`, если входной токен — это нативный SOL.
 * @param {boolean} params.isOutputSol - `true`, если выходной токен — это нативный SOL.
 * @param {string} [params.inputAccount] - Адрес токен-аккаунта (ATA) входного SPL-токена (если не SOL). Необязателен при `isInputSol = true`.
 * @param {string} [params.outputAccount] - Адрес токен-аккаунта (ATA) выходного SPL-токена (если не SOL). Необязателен при `isOutputSol = true`.
 *
 * ---
 * @returns {Promise<SwapTransactionsType>} - Объект, содержащий массив транзакций (`transaction: string[]` в base64), готовых к подписи и отправке.
 *
 * ---
 * @throws {Error} - В случае:
 *   - ошибки сети (не удалось выполнить fetch),
 *   - некорректного ответа от API Raydium (status !== 200),
 *   - логической ошибки (API вернул `{ success: false }`)
 */

export const postTransactionSwap = async ({
  computeUnitPriceMicroLamports,
  swapCompute,
  txVersion,
  computeType,
  ownerPublicKey,
  isInputSol,
  isOutputSol,
  inputAccount,
  outputAccount,
}: PostTransactionSwapProps): Promise<SwapTransactionsType> => {
  try {
    const body = {
      computeUnitPriceMicroLamports,
      txVersion,
      wallet: ownerPublicKey,
      wrapSol: isInputSol,
      unwrapSol: isOutputSol,
      inputAccount,
      outputAccount,
      swapResponse: swapCompute,
    }

    const response = await nFetch(
      `${API_URLS.SWAP_HOST}/transaction/${computeType}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      },
    )

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${computeType} transaction: ${response.status} ${response.statusText}`,
      )
    }

    const result: SwapTransactionsType = await response.json()

    if (!result.success) {
      throw new Error(`API returned success = false: ${JSON.stringify(result)}`)
    }

    return result
  } catch (error) {
    throw new Error(`Error in postTransactionSwap (${computeType}): ${error}`)
  }
}
