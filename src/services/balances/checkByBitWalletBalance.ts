import { getBybitRest } from '@/entities/bybit'

/**
 * Получает баланс кошелька пользователя на бирже Bybit через REST API.
 * Работает с аккаунтом типа `UNIFIED`.
 *
 * Выводит в консоль:
 * - Общую информацию о балансе: equity, margin, UPL и т.п.
 * - Список всех токенов, если они есть, с их балансом и статусом (✅/⚠️/❌).
 *
 * @returns {Promise<void>} Промис без возвращаемого значения.
 */
export const checkByBitWalletBalance = async (): Promise<void> => {
  try {
    const rest = getBybitRest()
    const response = await rest.getWalletBalance({
      accountType: 'UNIFIED',
    })

    const data = response.result?.list?.[0]

    if (!data) {
      console.warn('❌ Данные баланса отсутствуют в ответе Bybit')
      return
    }

    const {
      totalEquity,
      totalMarginBalance,
      totalWalletBalance,
      totalAvailableBalance,
      totalPerpUPL,
      accountType,
      coin,
    } = data

    console.log(`\nBybit Wallet Balance [Account Type: ${accountType}]`)
    console.log(`Total Equity:            ${totalEquity}`)
    console.log(`Total Wallet Balance:    ${totalWalletBalance}`)
    console.log(`Available Balance:       ${totalAvailableBalance}`)
    console.log(`Margin Balance:          ${totalMarginBalance}`)
    console.log(`Unrealized PnL (Perps):  ${totalPerpUPL}\n`)

    if (!coin || coin.length === 0) {
      console.log('⚠️  Нет монет на балансе ByBit')
      return
    }

    console.log('Whitelisted токены:')
    console.log('Статус | Символ   | Баланс       | Заморожено')

    for (const token of coin) {
      const amount = Number(token.walletBalance)
      const frozen = token.locked || '0'
      let status = '❌'

      if (!isNaN(amount)) {
        status = amount > 0 ? '✅' : '⚠️ '
      }

      console.log(
        `${status}     | ${token.coin.padEnd(8)} | ${String(token.walletBalance).padEnd(12)} | ${frozen}`,
      )
    }
  } catch (error) {
    console.error(`Ошибка при получении баланса Bybit: ${error}`)
    throw error
  }
}
