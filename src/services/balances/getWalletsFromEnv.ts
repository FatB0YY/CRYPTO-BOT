import { config } from '@/shared/config'
import { ValueOf } from '@/shared/types'

/**
 * Карта допустимых источников кошельков.
 */
const WalletSourceMap = {
  keygen: 'solana-keygen',
  solflare: 'solflare',
  metamask: 'metamask',
} as const

/**
 * Тип кортежа, содержащего все три кошелька: keygen, solflare и metamask.
 * - Keygen и Solflare представлены в виде `Uint8Array` (секретные ключи).
 * - Metamask содержит публичный ключ в виде строки.
 */
type WalletEntryTuple = [
  { type: typeof WalletSourceMap.keygen; value: Uint8Array },
  { type: typeof WalletSourceMap.solflare; value: Uint8Array },
  { type: typeof WalletSourceMap.metamask; value: string },
]

/**
 * Тип, представляющий возможные значения источников кошельков.
 */
export type WalletSource = ValueOf<typeof WalletSourceMap>

/**
 * Функция извлекает закрытые ключи (Solana-Keygen, Solflare) и публичные адреса (Metamask) криптовалютных кошельков из переменных окружения .env,
 * валидирует их наличие и преобразует в подходящие форматы (два ключа — в Uint8Array, один — в строку).
 * Если какие-либо значения отсутствуют или имеют неверный формат, выбрасываются ошибки.
 *
 * Требуются следующие переменные окружения:
 * - `WALLET_SOLANA_KEYGEN_SECRET_KEY`: строка, содержащая JSON-массив байтов `Uint8Array`
 * - `WALLET_SOLFLARE_SECRET_KEY`: строка, содержащая JSON-массив байтов `Uint8Array`
 * - `WALLET_METAMASK_PUBLIC_KEY`: публичный ключ Metamask в виде строки
 *
 * @throws {Error} Если хотя бы одна из переменных окружения не определена.
 * @throws {Error} Если парсинг JSON в `Uint8Array` завершается с ошибкой.
 *
 * @returns {WalletEntryTuple} Кортеж объектов, описывающих каждый из кошельков.
 */
export function getWalletsFromEnv(): WalletEntryTuple {
  const keygenKey = config.wallets.solanaKeygen
  const solflareKey = config.wallets.solflare
  const metamaskKey = config.wallets.metamask

  if (!keygenKey || !solflareKey || !metamaskKey) {
    throw new Error(
      'Все секретные ключи кошелька должны быть определены в .env',
    )
  }

  try {
    const keygenArray: Uint8Array = Uint8Array.from(JSON.parse(keygenKey))
    const solflareArray: Uint8Array = Uint8Array.from(JSON.parse(solflareKey))

    return [
      { type: 'solana-keygen', value: keygenArray },
      { type: 'solflare', value: solflareArray },
      { type: 'metamask', value: metamaskKey },
    ]
  } catch (err) {
    throw new Error('Не удалось преобразовать секретные ключи в Uint8Array')
  }
}
