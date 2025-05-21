import { parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2'
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'

import { connection, owner } from '@/shared/constants'

/**
 * Получает информацию обо всех токен-аккаунтах (включая SOL, SPL и SPL 2022) пользователя.
 * Используется для определения доступных балансов, ATA (associated token accounts)
 * и для подготовки транзакций (например, проверки `inputAccount`, `outputAccount`).
 *
 * Объединяет:
 * - Нативный SOL-аккаунт (`getAccountInfo`)
 * - Стандартные SPL токен-аккаунты (`programId: TOKEN_PROGRAM_ID`)
 * - Новые SPL-2022 токены (`programId: TOKEN_2022_PROGRAM_ID`)
 *
 * ---
 * @returns {Promise<{ tokenAccounts: TokenAccount[]; tokenAccountRawInfos: TokenAccountRaw[]; }>} - Объект с токен-аккаунтами и SOL балансом, в формате Raydium SDK.
 *
 * ---
 * @throws {Error} - В случае ошибки запроса к Solana RPC.
 *
 * ---
 * @example
 * const tokenAccounts = await fetchTokenAccountData()
 * const usdcAcc = tokenAccounts.tokenAccounts.find(acc => acc.mint.toBase58() === USDC_MINT)
 */
export const fetchTokenAccountData = async (): Promise<
  ReturnType<typeof parseTokenAccountResp>
> => {
  try {
    const [solAccountResp, tokenAccountResp, token2022Resp] = await Promise.all(
      [
        connection.getAccountInfo(owner.publicKey),
        connection.getTokenAccountsByOwner(owner.publicKey, {
          programId: TOKEN_PROGRAM_ID,
        }),
        connection.getTokenAccountsByOwner(owner.publicKey, {
          programId: TOKEN_2022_PROGRAM_ID,
        }),
      ],
    )

    const combinedTokenAccounts = [
      ...tokenAccountResp.value,
      ...token2022Resp.value,
    ]

    const tokenAccountData = parseTokenAccountResp({
      owner: owner.publicKey,
      solAccountResp,
      tokenAccountResp: {
        context: tokenAccountResp.context,
        value: combinedTokenAccounts,
      },
    })

    return tokenAccountData
  } catch (error) {
    console.error('❌ Ошибка при получении токен-аккаунтов:', error)
    throw new Error(`Failed to fetch token account data: ${error}`)
  }
}
