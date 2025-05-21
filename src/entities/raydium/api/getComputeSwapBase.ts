import { API_URLS } from '@raydium-io/raydium-sdk-v2'
import nFetch from 'node-fetch'

import { TxVersionType } from '../constants'
import { SwapComputeType } from '../types'

type ComputeType = 'swap-base-in' | 'swap-base-out'

interface GetComputeSwapBaseProps {
  inputMint: string
  outputMint: string
  amount: number | string
  slippage: number
  txVersion: TxVersionType
  computeType: ComputeType
}

/**
 * Функция для получения информации о расчёте обмена на основе входных или выходных данных,
 * позволяет рассчитать параметры будущего свапа, не совершая саму транзакцию.
 *
 * @param {GetComputeSwapBaseProps} props - Параметры для запроса API.
 * @param {string} props.inputMint - Адрес токена, который обменивается.
 * @param {string} props.outputMint - Адрес токена, который получает.
 * @param {number | string} props.amount - Сумма обмена.
 * @param {number} props.slippage - Прогнозируемое проскальзывание в процентах.
 * @param {TxVersionType} props.txVersion - Версия транзакции.
 * @param {'swap-base-in' | 'swap-base-out'} params.computeType - Тип операции:
 *   - `'swap-base-in'` — фиксированная сумма на входе
 *   - `'swap-base-out'` — фиксированная сумма на выходе
 * @returns {Promise<SwapComputeType>} - Результат расчёта обмена.
 * @throws {Error} - Если запрос не успешен или API возвращает ошибку.
 */
export const getComputeSwapBase = async ({
  inputMint,
  outputMint,
  amount,
  slippage,
  txVersion,
  computeType,
}: GetComputeSwapBaseProps): Promise<SwapComputeType> => {
  try {
    const response = await nFetch(
      `${API_URLS.SWAP_HOST}/compute/${computeType}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${
        slippage * 100
      }&txVersion=${txVersion}`,
      {
        method: 'GET',
      },
    )

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${computeType}: ${response.status} ${response.statusText}`,
      )
    }

    const result: SwapComputeType = await response.json()

    if (!result.success) {
      throw new Error(`API returned success = false: ${JSON.stringify(result)}`)
    }

    return result
  } catch (error) {
    throw new Error(`Error occurred during ${computeType} request: ${error}`)
  }
}
