import { config } from '@/shared/config'

export type TxVersionType = 'V0' | 'LEGACY'

export const getTxVersion = (): TxVersionType => {
  const txVersion = config.txVersion?.toUpperCase()

  if (!txVersion) {
    throw new Error('TX_VERSION is not defined in environment variables.')
  }

  if (txVersion !== 'V0' && txVersion !== 'LEGACY') {
    throw new Error('TX_VERSION must be either V0 or LEGACY.')
  }

  return txVersion
}
