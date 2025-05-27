import { getBybitRest } from './initApi'

let timeDelta = 0

export const syncBybitTime = async () => {
  const raw = await getBybitRest().getServerTime()
  const serverTime = raw.time // серверное время в миллисекундах
  const localTime = Date.now()
  timeDelta = serverTime - localTime
}
