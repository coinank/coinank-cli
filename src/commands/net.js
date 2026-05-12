import { createClient, nowMs } from '../client.js'
import { outputJson } from '../output.js'

export function registerNet(program) {
  program
    .command('net')
    .description('Net long and net short positions (净多头和净空头) — VIP3')
    .option('-e, --exchange <exchange>', 'Exchange: Binance, OKX, Bybit, Bitget', 'Binance')
    .option('-s, --symbol <symbol>', 'Symbol', 'BTCUSDT')
    .option('-i, --interval <interval>', 'Interval: 1m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d', '1h')
    .option('-n, --size <n>', 'Number of records (max 500)', '20')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const client = createClient()
      const data = await client.get('/api/netPositions/getNetPositions', {
        params: {
          exchange: opts.exchange,
          symbol: opts.symbol,
          interval: opts.interval,
          endTime: nowMs(),
          size: opts.size,
        },
      })
      outputJson(data)
    })
}
