import { Raydium, RaydiumLoadParams } from '@raydium-io/raydium-sdk-v2'
import web3 from '@solana/web3.js'

import { cluster, connection, owner } from '@/shared/constants'

// TODO: есть ли возможность переделать под grpc?
const grpcUrl = '<YOUR_GRPC_URL>'
const grpcToken = '<YOUR_GRPC_TOKEN>'

let raydiumInstance: Raydium | undefined

/**
 * Инициализирует экземпляр Raydium SDK с текущим соединением, владельцем и кластером.
 *
 * Повторные вызовы функции вернут уже созданный экземпляр (Singleton).
 * Позволяет настроить поведение SDK, включая загрузку токенов и отключение фич.
 *
 * @async
 * @function
 * @param {Object} [params] - Дополнительные параметры конфигурации.
 * @param {boolean} [params.skipTokenLoad=false] - Не загружать токен-лист при инициализации.
 * @returns {Promise<Raydium>} Инициализированный экземпляр Raydium SDK.
 * @throws {Error} Если SDK не удалось инициализировать.
 */
export const initializeRaydiumSdk = async (params?: {
  skipTokenLoad?: boolean
}): Promise<Raydium> => {
  if (raydiumInstance) {
    return raydiumInstance
  }

  try {
    // Предупреждение при использовании публичного RPC
    if (connection.rpcEndpoint === web3.clusterApiUrl('mainnet-beta')) {
      console.warn(
        '[⚠️  Внимание] Вы используете общедоступный RPC-узел. Это может привести к задержкам и ограничению запросов. Рекомендуется использовать платный RPC.',
      )
    }

    const disableLoadToken = !!params?.skipTokenLoad

    const config: RaydiumLoadParams = {
      owner,
      connection,
      cluster,
      disableFeatureCheck: true,
      disableLoadToken,
      blockhashCommitment: 'finalized',
      apiCacheTime: 1,
      // apiRequestInterval: 0, // по желанию: можно убрать throttle
      // urlConfigs: { BASE_HOST: '<CUSTOM_API>' }, // если требуется кастомный API
    }

    raydiumInstance = await Raydium.load(config)

    /**
     * By default: sdk will automatically fetch token account data when need it or any sol balace changed.
     * if you want to handle token account by yourself, set token account data after init sdk
     * code below shows how to do it.
     * note: after call raydium.account.updateTokenAccount, raydium will not automatically fetch token account
     */

    // Optional manual token account management example:
    // const tokenAccountData = await fetchTokenAccountData()
    // raydiumInstance.account.updateTokenAccount(tokenAccountData)
    // connection.onAccountChange(owner.publicKey, async () => {
    //   const updatedTokenAccountData = await fetchTokenAccountData()
    //   raydiumInstance?.account.updateTokenAccount(updatedTokenAccountData)
    // })

    // const tokenAccountData = await fetchTokenAccountData()
    // console.log('tokenAccountData:', tokenAccountData)

    return raydiumInstance
  } catch (error) {
    console.error('[❌ Ошибка] Не удалось инициализировать Raydium SDK:', error)
    throw new Error('Инициализация Raydium SDK завершилась с ошибкой.')
  }
}
