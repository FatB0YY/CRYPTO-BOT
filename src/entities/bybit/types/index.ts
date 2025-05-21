interface KlineData {
  start: number
  end: number
  interval: string
  open: string
  close: string
  high: string
  low: string
  volume: string
  turnover: string
  confirm: boolean
  timestamp: number
}

export interface KlineUpdateMessage {
  type: 'snapshot' | 'delta'
  topic: string
  data: KlineData[]
  ts: number
  wsKey: string
}
