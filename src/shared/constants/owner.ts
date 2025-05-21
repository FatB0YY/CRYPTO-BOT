import web3 from '@solana/web3.js'
import base58 from 'bs58'

import { config } from '../config'

function createOwnerKeypair(): web3.Keypair {
  try {
    const rawKey = config.wallets.solanaKeygen

    if (!rawKey) {
      throw new Error(
        'WALLET_SOLFLARE_SECRET_KEY is not defined in environment variables.',
      )
    }

    let secretKey: Uint8Array

    if (rawKey.startsWith('[')) {
      // Похоже на JSON-массив
      const parsed = JSON.parse(rawKey)
      if (!Array.isArray(parsed) || parsed.length !== 64) {
        throw new Error('ERROR: Parsed JSON is not a valid 64-byte secret key.')
      }
      secretKey = Uint8Array.from(parsed)
    } else {
      // Предполагаем, что это base58-строка
      const decoded = base58.decode(rawKey)
      if (decoded.length !== 64) {
        throw new Error(
          'ERROR: Base58 string is not a valid 64-byte secret key.',
        )
      }
      secretKey = decoded
    }

    return web3.Keypair.fromSecretKey(secretKey)
  } catch (error) {
    console.error('Failed to create owner Keypair:', error)
    throw error
  }
}

const owner: web3.Keypair = createOwnerKeypair()
export { owner }

/*
  2. <YOUR_WALLET_SECRET_KEY> — это приватный ключ (секрет) от твоего Solana кошелька

  Это очень чувствительная информация — если кто-то получит твой приватный ключ, 
  он сможет управлять твоими средствами!

  Как получить секретный ключ:
  1. Если у тебя есть файл кошелька (JSON) от solana-keygen, например: [174, 25, 38, 203, 94, 129, ...]
  Это и есть secret key, просто вставляешь его в код.

  2. Если ты используешь Phantom или другой кошелек, тебе нужно:
    2.1. Создать новый кошелек через solana-keygen:
      `solana-keygen new`
    2.2. Получить secret key:
      `cat ~/my-wallet.json


  Или в коде можно использовать библиотеку вроде @solana/web3.js (если ты пишешь на JavaScript) 
  и импортировать секретный ключ оттуда.

  !Никогда не делись своим приватным ключом. Храни его в .env или защищённом vault.
*/

/*  
  Что генерирует solana-keygen new?
  - в диапазоне от 0 до 255
  - представляет собой байт (Uint8)
  - это сериализованный приватный ключ
  
  Это байтовое представление приватного ключа, 
  соответствующее Uint8Array из 64 байт.
  - Это не base58, не hex, не строка — это буквально массив байтов.

  поэтому я на всякий случай написал универсальный метод. Я так понял, сюда не только приватный ключ можно вставлять
  // поэтому TODO: проверить, только ли массив, но и приватный ключ можно вставлять? 
*/
