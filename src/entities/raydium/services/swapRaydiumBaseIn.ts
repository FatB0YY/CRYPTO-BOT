import { API_URLS, TokenAccount } from '@raydium-io/raydium-sdk-v2'
import { NATIVE_MINT } from '@solana/spl-token'
import web3 from '@solana/web3.js'

import { ensureTokenAccount } from '@/services'
import { owner } from '@/shared/constants'
import { toLamports } from '@/shared/lib'

import {
  fetchDecimals,
  fetchTokenAccountData,
  getComputeSwapBase,
  getPriorityFees,
  postTransactionSwap,
  signAndSendTransactions,
} from '../api'
import { getTxVersion } from '../constants'
import {
  PriorityFeeType,
  SwapComputeType,
  SwapTransactionsType,
} from '../types'

/**
 * Универсальный свап Raydium (base-in), поддерживает любые пары SPL-токенов или SOL.
 *
 * @param {Object} params
 * @param {string} params.inputMint - Адрес входного токена (mint).
 * @param {string} params.outputMint - Адрес выходного токена (mint).
 * @param {number} params.amount - Количество токена в читаемом формате (например, 0.05).
 * @param {number} [params.slippageBps=50] - Проскальзывание в bps (по умолчанию 0.5%).
 */
export const swapRaydiumBaseIn = async ({
  inputMint,
  outputMint,
  amount,
  slippageBps = 50,
}: {
  inputMint: string
  outputMint: string
  amount: number
  slippageBps?: number
}): Promise<{ success: boolean; message?: string }> => {
  try {
    const txVersion = getTxVersion()
    const isV0Tx = txVersion === 'V0'

    const isInputSol = inputMint === NATIVE_MINT.toBase58()
    const isOutputSol = outputMint === NATIVE_MINT.toBase58()

    const decimals = await fetchDecimals(inputMint)
    const amountInLamports = toLamports(amount, decimals)

    const tokenAccountData = await fetchTokenAccountData()

    // ====== INPUT ACCOUNT (если это не SOL) ======
    let inputAccount: string | undefined = undefined
    if (!isInputSol) {
      const inputTokenAcc = tokenAccountData.tokenAccounts.find(
        (token: TokenAccount) => token.mint.toBase58() === inputMint,
      )
      if (inputTokenAcc?.publicKey) {
        inputAccount = inputTokenAcc.publicKey.toBase58()
      } else {
        console.log(`Создание ATA для input токена: ${inputMint}`)
        const createdAta = await ensureTokenAccount(inputMint)
        inputAccount = createdAta.toBase58()
      }
    }

    // ====== OUTPUT ACCOUNT (если это не SOL) ======
    let outputAccount: string | undefined = undefined
    if (!isOutputSol) {
      const outputTokenAcc = tokenAccountData.tokenAccounts.find(
        (token: TokenAccount) => token.mint.toBase58() === outputMint,
      )
      if (outputTokenAcc?.publicKey) {
        outputAccount = outputTokenAcc.publicKey.toBase58()
      } else {
        console.log(`Создание ATA для output токена: ${outputMint}`)
        const createdAta = await ensureTokenAccount(outputMint)
        outputAccount = createdAta.toBase58()
      }
    }

    console.log(`Свап ${amount} ${inputMint} → ${outputMint}`)

    const priorityFees: PriorityFeeType = await getPriorityFees(
      `${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`,
    )

    const swapCompute: SwapComputeType = await getComputeSwapBase({
      computeType: 'swap-base-in',
      inputMint,
      outputMint,
      amount: amountInLamports,
      slippage: slippageBps / 100,
      txVersion,
    })

    const computeUnitPriceMicroLamports = String(priorityFees.data.default.h)

    const swapTransactions: SwapTransactionsType = await postTransactionSwap({
      computeType: 'swap-base-in',
      computeUnitPriceMicroLamports,
      isInputSol,
      isOutputSol,
      ownerPublicKey: owner.publicKey.toBase58(),
      swapCompute,
      txVersion,
      inputAccount,
      outputAccount,
    })

    const allTxBuf = swapTransactions.data.map((tx) =>
      Buffer.from(tx.transaction, 'base64'),
    )

    const allTransactions = allTxBuf.map((txBuf) =>
      isV0Tx
        ? web3.VersionedTransaction.deserialize(txBuf)
        : web3.Transaction.from(txBuf),
    )

    console.log(`Отправка ${allTransactions.length} транзакции(й)...`)
    await signAndSendTransactions({
      allTransactions,
      isV0Tx,
    })

    console.log(`✅ Свап выполнен успешно`)
    return { success: true }
  } catch (error) {
    console.error('❌ Ошибка при свапе:', error)
    return { success: false }
  }
}
