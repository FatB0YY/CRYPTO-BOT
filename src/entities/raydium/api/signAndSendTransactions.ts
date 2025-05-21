import web3 from '@solana/web3.js'

import { connection, owner } from '@/shared/constants'

interface SignAndSendTransactionsProps {
  isV0Tx: boolean
  allTransactions: (web3.Transaction | web3.VersionedTransaction)[]
}

// TODO: 1. Множественные подписанты
// 2. Подписывать не owner, а внешнего пользователя
// 3. Параллельная отправка транзакций

/**
 * Подписывает и отправляет массив транзакций в сеть Solana.
 * Поддерживает как обычные (`LEGACY`), так и версионные (`V0`) транзакции.
 *
 * ---
 * @param {Object} props - Параметры вызова функции.
 * @param {boolean} props.isV0Tx - Указывает, являются ли все транзакции версионными (V0). Если false, используются `Transaction`.
 * @param {(Transaction | VersionedTransaction)[]} props.allTransactions - Массив транзакций, подготовленных к подписи и отправке.
 *
 * ---
 * @returns {Promise<void>} - Ничего не возвращает, но логирует результат каждой транзакции.
 *
 * ---
 * @throws {Error} - Если транзакция не подписана, не отправлена или подтверждение не удалось.
 */
export const signAndSendTransactions = async ({
  isV0Tx,
  allTransactions,
}: SignAndSendTransactionsProps): Promise<void> => {
  let idx = 0

  try {
    if (!isV0Tx) {
      for (const tx of allTransactions) {
        const transaction = tx as web3.Transaction
        console.log(`📝 [${++idx}] Signing LEGACY transaction...`)
        transaction.sign(owner)

        const txId = await web3.sendAndConfirmTransaction(
          connection,
          transaction,
          [owner],
          { skipPreflight: true },
        )

        console.log(`✅ [${idx}] Confirmed LEGACY transaction: ${txId}`)
      }
    } else {
      for (const tx of allTransactions) {
        const transaction = tx as web3.VersionedTransaction
        idx++
        console.log(`📝 [${idx}] Signing V0 transaction...`)

        transaction.sign([owner])

        const txId = await connection.sendTransaction(transaction, {
          skipPreflight: true,
        })

        console.log(`🚀 [${idx}] Sent V0 transaction: ${txId}`)

        const { lastValidBlockHeight, blockhash } =
          await connection.getLatestBlockhash({
            commitment: 'finalized',
          })

        await connection.confirmTransaction(
          {
            blockhash,
            lastValidBlockHeight,
            signature: txId,
          },
          'confirmed',
        )

        console.log(`✅ [${idx}] Confirmed V0 transaction: ${txId}`)
      }
    }
  } catch (error) {
    console.error(`❌ Error sending transaction #${idx}:`, error)
    throw error
  }
}
