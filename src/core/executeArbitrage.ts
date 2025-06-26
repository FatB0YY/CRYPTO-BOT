import { NATIVE_MINT } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'

import { _swapUsdcToSolByBit, getBybitRest } from '@/entities/bybit'
import { swapRaydiumBaseIn } from '@/entities/raydium'
import { fetchDecimals } from '@/entities/raydium/api'
import { getWalletsFromEnv } from '@/services/balances/getWalletsFromEnv'
import { connection } from '@/shared/constants'
import { delay } from '@/shared/lib'

const WAIT_FOR_TRANSFER_MS = 60_000 // Максимум 60 секунд
const POLL_INTERVAL_MS = 5_000
const MIN_EXPECTED_SOL = 0.01 // минимальное количество SOL, чтобы считать перевод успешным

type ExecuteArbitrageProps = {
  amountUsdc: number
  raydiumOutputMint: string
}

/**
 * Исполняет арбитражную сделку: покупка на Bybit → продажа на Raydium.
 *
 * @param {Object} params
 * @param {number} params.amountUsdc - Сумма USDC для покупки SOL на Bybit
 * @param {string} params.raydiumOutputMint - Адрес токена, в который будем продавать SOL (например, USDC)
 */
export const executeArbitrage = async ({
  amountUsdc,
  raydiumOutputMint,
}: ExecuteArbitrageProps): Promise<void> => {
  try {
    console.log(
      `\n🔁 [START] Арбитраж на ${amountUsdc} USDC\n----------------------------`,
    )

    // --- Получаем Keypair
    const wallets = getWalletsFromEnv()
    const keygen = wallets.find((w) => w.type === 'solana-keygen')
    if (!keygen) throw new Error('❌ [Wallet] Не найден keygen-кошелёк')

    const owner = Keypair.fromSecretKey(keygen.value)
    const ownerAddress = owner.publicKey.toBase58()

    console.log(`🔑 [Wallet] Используем Solana-кошелёк: ${ownerAddress}`)

    // --- Покупаем SOL на Bybit
    const fixedAmount = Math.floor(amountUsdc * 100) / 100
    console.log(`💱 [Bybit] Покупаем SOL за ${fixedAmount} USDC...`)
    await _swapUsdcToSolByBit(fixedAmount.toString())
    console.log('✅ [Bybit] Покупка SOL успешно выполнена')

    // --- Вывод SOL на Solana
    console.log(`🚚 [Bybit] Отправка ${fixedAmount} SOL на ${ownerAddress}...`)
    await withdrawSolFromBybit({
      amount: fixedAmount,
      toAddress: ownerAddress,
    })
    console.log('✅ [Bybit] Запрос на вывод SOL отправлен успешно')

    // --- Ожидаем поступления SOL
    console.log('⏳ [Solana] Ожидаем поступления SOL на кошелёк...')
    const received = await waitForSolTransfer(owner.publicKey)
    if (!received) {
      throw new Error('⛔ [Solana] Не дождались SOL на кошельке')
    }

    console.log(`✅ [Solana] Получено ${received.toFixed(6)} SOL на кошелёк`)

    // --- Своп на Raydium
    console.log(
      `🔄 [Raydium] Свап ${received.toFixed(6)} SOL → ${raydiumOutputMint}...`,
    )
    const result = await swapRaydiumBaseIn({
      inputMint: NATIVE_MINT.toBase58(),
      outputMint: raydiumOutputMint,
      amount: received,
    })

    if (!result.success) {
      throw new Error('❌ [Raydium] Ошибка при выполнении свапа')
    }

    console.log(
      `🎉 [SUCCESS] Арбитраж завершён успешно: ${received.toFixed(6)} SOL → ${raydiumOutputMint}`,
    )
  } catch (error) {
    console.error('\n[❌ ERROR] executeArbitrage:', error)
  }
}

/**
 * Ждёт поступления SOL на кошелёк и возвращает баланс, если он ≥ MIN_EXPECTED_SOL.
 *
 * @param pubkey Публичный ключ кошелька
 * @returns {Promise<number | null>} Баланс в SOL или null, если не пришло
 */
const waitForSolTransfer = async (
  pubkey: PublicKey,
): Promise<number | null> => {
  const deadline = Date.now() + WAIT_FOR_TRANSFER_MS
  let attempts = 0

  while (Date.now() < deadline) {
    attempts++
    const lamports = await connection.getBalance(pubkey)
    const sol = await lamportsToUnits(lamports, NATIVE_MINT.toBase58())

    console.log(
      `🔎 [Solana] Попытка ${attempts}: баланс = ${sol.toFixed(6)} SOL`,
    )

    if (sol >= MIN_EXPECTED_SOL) {
      return sol
    }

    await delay(POLL_INTERVAL_MS)
  }

  console.warn(
    `⚠️ [Solana] Баланс не достиг ${MIN_EXPECTED_SOL} SOL за ${WAIT_FOR_TRANSFER_MS / 1000} секунд`,
  )
  return null
}

export const lamportsToUnits = async (
  amountLamports: number,
  mint: string,
): Promise<number> => {
  const decimals = await fetchDecimals(mint)
  return amountLamports / Math.pow(10, decimals)
}

export const withdrawSolFromBybit = async ({
  amount,
  toAddress,
}: {
  amount: number
  toAddress: string
}): Promise<void> => {
  try {
    const rest = getBybitRest()

    console.log(`📤 [Bybit] Отправляем запрос на вывод:`)
    console.log(`     coin       = SOL`)
    console.log(`     chain      = SOL`)
    console.log(`     toAddress  = ${toAddress}`)
    console.log(`     amount     = ${amount}`)
    console.log(`     account    = SPOT`)
    console.log(`     timestamp  = ${Date.now()}`)

    console.warn(
      `⚠️ [Bybit] ВНИМАНИЕ: если этот адрес был добавлен менее 24 часов назад,\n` +
        `   вывод невозможен. Bybit блокирует новые адреса в течение суток.`,
    )

    const res = await rest.submitWithdrawal({
      coin: 'SOL',
      chain: 'SOL',
      address: toAddress,
      amount: amount.toFixed(6),
      timestamp: Date.now(),
      forceChain: 1,
      accountType: 'SPOT',
    })

    if (res.retCode !== 0) {
      console.error(
        `❌ [Bybit] Ошибка вывода SOL: ${JSON.stringify(res, null, 2)}`,
      )
      throw new Error(`Ошибка вывода: ${JSON.stringify(res)}`)
    }

    console.log(
      `✅ [Bybit] Вывод инициирован. Withdrawal ID: ${res.result?.id}`,
    )
  } catch (error) {
    console.error('[❌ ERROR] withdrawSolFromBybit:', error)
    throw error
  }
}
