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
  recvWindow: 10000,
}

const restConfig: RestClientOptions = {
  key: config.bybit.apiKey,
  secret: config.bybit.apiSecret,
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
