import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { PublicKey, Transaction } from '@solana/web3.js'

import { connection, owner } from '@/shared/constants'

/**
 * Создаёт Associated Token Account (ATA) для указанного токена,
 * если он ещё не существует для владельца (`owner`).
 *
 * ATA нужен для хранения токенов SPL стандарта. Если такой аккаунт уже существует,
 * возвращает его адрес. Если нет — создаёт новый, подписывает и отправляет транзакцию.
 *
 * Предполагается, что `owner` — это одновременно и владелец, и плательщик за создание аккаунта.
 *
 * @param mintAddress Строка-адрес токена (mint), для которого необходимо создать ATA.
 *
 * @returns {Promise<PublicKey>} Адрес (PublicKey) существующего или только что созданного ATA.
 *
 * @throws {Error} Если отправка или подтверждение транзакции завершились с ошибкой.
 */
export const ensureTokenAccount = async (
  mintAddress: string,
): Promise<PublicKey> => {
  const mint = new PublicKey(mintAddress)
  const ata = await getAssociatedTokenAddress(mint, owner.publicKey)

  const accountInfo = await connection.getAccountInfo(ata)

  if (accountInfo) {
    console.log(`Токен-аккаунт уже существует: ${ata.toBase58()}`)
    return ata
  }

  console.log(`Создается токен-аккаунт для ${mint.toBase58()}...`)

  const ix = createAssociatedTokenAccountInstruction(
    owner.publicKey, // from (payer)
    ata, // associated token account
    owner.publicKey, // owner
    mint, // token mint
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )

  const tx = new Transaction().add(ix)
  const blockhash = await connection.getLatestBlockhash()
  tx.recentBlockhash = blockhash.blockhash
  tx.feePayer = owner.publicKey

  tx.sign(owner)

  const rawTx = tx.serialize()
  const sig = await connection.sendRawTransaction(rawTx)

  await connection.confirmTransaction(
    {
      signature: sig,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    },
    'confirmed',
  )

  console.log(`Токен-аккаунт создан: ${ata.toBase58()}`)
  return ata
}
