import { AnkrProvider } from '@ankr.com/ankr.js'

import { config } from '@/shared/config'

/**
 * Проверяет баланс заданного EVM-совместимого кошелька на нескольких сетях
 * с использованием Ankr Multichain API.
 *
 * Поддерживаемые блокчейны:
 * - BNB Smart Chain (bsc)
 * - Ethereum (eth)
 * - Polygon (polygon)
 * - Avalanche (avalanche)
 * - и другие
 *
 * Функция выводит список whitelisted токенов (всех обнаруженных активов)
 * и отображает их статус: ✅ (есть баланс), ⚠️ (нулевой баланс), ❌ (ошибка чтения).
 *
 * @param walletAddress Строка с EVM-адресом кошелька, например `0xabc123...`.
 *
 * @returns {Promise<void>} Промис без возвращаемого значения. Вывод осуществляется в консоль.
 *
 * @throws {Error} В случае ошибки при запросе балансов с Ankr API.
 */
export const checkEvmWalletBalance = async (walletAddress: string) => {
  const ankrRpcUrl = config.ankr.rpcUrl
  const ankrApiKey = config.ankr.apiKey

  if (!ankrRpcUrl || !ankrApiKey) {
    throw new Error(
      'ANKR_RPC_URL или ANKR_API_KEY должны быть определены в .env',
    )
  }

  const url = `${ankrRpcUrl}${ankrApiKey}`
  const provider = new AnkrProvider(url)

  try {
    const { assets } = await provider.getAccountBalance({
      blockchain: ['bsc', 'eth', 'polygon', 'avalanche'],
      walletAddress,
    })

    console.log(`\nmetamask | Address: ${walletAddress}`)
    console.log('Whitelisted токены:')
    console.log('Статус | Символ   | Баланс       | Название')

    for (const token of assets) {
      const amount = Number(token.balance)
      let status = '❌'
      if (!isNaN(amount)) {
        status = amount > 0 ? '✅' : '⚠️ '
      }

      console.log(
        `${status}     | ${token.tokenSymbol.padEnd(8)} | ${token.balance.padEnd(12)} | ${token.tokenName}`,
      )
    }
  } catch (error) {
    console.error('Ошибка при получении баланса EVM-кошелька:', error)
  }
}
