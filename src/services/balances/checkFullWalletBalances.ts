import { Keypair, PublicKey } from '@solana/web3.js'

import { initializeRaydiumSdk } from '@/entities/raydium'
import { connection } from '@/shared/constants'

import { checkByBitWalletBalance } from './checkByBitWalletBalance'
import { checkEvmWalletBalance } from './checkEvmWalletBalance'
import { getWalletsFromEnv } from './getWalletsFromEnv'

/**
 * Проверяет балансы всех поддерживаемых кошельков:
 * - Metamask (через Ankr API)
 * - Solana (keygen, solflare) — баланс SOL и whitelisted SPL-токенов
 *
 * Использует SDK Raydium для получения whitelisted токенов.
 *
 * Выводит информацию в консоль в формате:
 * - Адрес кошелька
 * - Баланс SOL
 * - Балансы whitelisted токенов
 *
 * @returns {Promise<void>}
 *
 * @throws {Error} При ошибке инициализации SDK, чтения ключей или запроса баланса.
 *
 */
export const checkFullWalletBalances = async (): Promise<void> => {
  try {
    const raydium = await initializeRaydiumSdk()
    const wallets = getWalletsFromEnv()

    for (const wallet of wallets) {
      try {
        if (wallet.type === 'metamask') {
          await checkEvmWalletBalance(wallet.value)
          continue
        }

        const keypair = Keypair.fromSecretKey(wallet.value)
        const pubkey = keypair.publicKey

        console.log(`\n${wallet.type} | Public Key: ${pubkey.toBase58()}`)

        const sol = await connection.getBalance(pubkey)
        console.log(`SOL: ${(sol / 1e9).toFixed(4)} SOL`)

        const allTokens = await connection.getParsedTokenAccountsByOwner(
          pubkey,
          {
            programId: new PublicKey(
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            ),
          },
        )

        const userTokenMap = new Map<string, number>()
        allTokens.value.forEach(({ account }) => {
          const mint = account.data.parsed.info.mint
          const amount = account.data.parsed.info.tokenAmount.uiAmount
          userTokenMap.set(mint, amount)
        })

        const tokenList = await raydium.api.getTokenList()

        console.log('Whitelisted токены:')
        console.log('Статус | Символ   | Баланс       | Название')

        for (const token of tokenList.mintList) {
          const mint = token.address
          const amount = userTokenMap.get(mint)
          let status = '❌'
          if (amount !== undefined) {
            status = amount > 0 ? '✅' : '⚠️ '
          }
          console.log(
            `${status}     | ${token.symbol.padEnd(8)} | ${String(amount ?? 0).padEnd(12)} | ${token.name}`,
          )
        }
      } catch (walletError) {
        console.error(
          `Ошибка при обработке кошелька ${wallet.type}:`,
          walletError,
        )
      }
    }

    await checkByBitWalletBalance()
  } catch (error) {
    console.error('Ошибка при выполнении полной проверки баланса:', error)
    throw error
  }
}
