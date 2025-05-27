import { delay } from '@/shared/lib'

import { startArbitrage } from './startArbitrage'

export const arbitrageLoop = async () => {
  while (true) {
    await startArbitrage()
    await delay(1000)
  }
}
