import {
  RestClientOptions,
  RestClientV5,
  WebsocketClient,
  WSClientConfigurableOptions,
} from 'bybit-api'

import { config } from '@/shared/config'

let wsInstance: WebsocketClient | null = null
let restInstance: RestClientV5 | null = null

const wsConfig: WSClientConfigurableOptions = {
  key: config.bybit.apiKey,
  secret: config.bybit.apiSecret,
}

const restConfig: RestClientOptions = {
  key: config.bybit.apiKey,
  secret: config.bybit.apiSecret,
  enable_time_sync: true, // TODO: исправить 100%!!! https://github.com/tiagosiebler/awesome-crypto-examples/wiki/Timestamp-for-this-request-is-outside-of-the-recvWindow
}

export const getBybitWebsocket = (): WebsocketClient => {
  if (!wsInstance) {
    wsInstance = new WebsocketClient(wsConfig)
  }
  return wsInstance
}

export const getBybitRest = (): RestClientV5 => {
  if (!restInstance) {
    restInstance = new RestClientV5(restConfig)
  }
  return restInstance
}
