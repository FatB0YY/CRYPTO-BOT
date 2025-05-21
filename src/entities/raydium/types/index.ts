export type VersionType = 'V0' | 'V1'
type SwapType = 'BaseIn' | 'BaseOut'

type SwapComputeDataType = {
  swapType: SwapType
  inputMint: string
  inputAmount: string
  outputMint: string
  outputAmount: string
  otherAmountThreshold: string
  slippageBps: number
  priceImpactPct: number
  referrerAmount: string
  routePlan: RoutePlanType[]
}

type RoutePlanType = {
  poolId: string
  inputMint: string
  outputMint: string
  feeMint: string
  feeRate: number
  feeAmount: string
  remainingAccounts: unknown[]
  lastPoolPriceX64: number
}

export type SwapComputeType = {
  id: string
  success: boolean
  version: VersionType
  openTime: undefined
  msg: undefined
  data: SwapComputeDataType
}

export type PriorityFeeType = {
  id: string
  success: boolean
  data: {
    default: {
      vh: number
      h: number
      m: number
    }
  }
}

export type SwapTransactionsType = {
  id: string
  version: string
  success: boolean
  data: { transaction: string }[]
}
