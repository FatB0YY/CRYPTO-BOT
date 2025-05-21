type StockMarketType = 'Raydium' | 'Bybit' | 'Meteora'

export interface TradeLogEntry {
  stockMarket: StockMarketType
  pair: string
  side: 'buy' | 'sell'
  price: number
  liquidity: number
}

// {
//   exchange: 'Raydium',                  // название DEX-а
//   pair: 'SOL/USDC',                     // торговая пара
//   side: 'buy',                          // 'buy' или 'sell'
//   price: 143.23,                        // цена 1 SOL в USDC
//   liquidity: 50000,                    // общая ликвидность в пуле (в quote-токене, т.е. USDC)
// }
