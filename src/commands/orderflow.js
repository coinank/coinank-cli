import { createClient, nowMs } from '../client.js'
import { outputJson } from '../output.js'

export function registerOrderflow(program) {
  program
    .command('orderflow')
    .description('Order flow list (订单流) — VIP3')
    .option('-e, --exchange <exchange>', 'Exchange', 'Binance')
    .option('-s, --symbol <symbol>', 'Symbol', 'BTCUSDT')
    .option('-i, --interval <interval>', 'Interval: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,1d', '1h')
    .option('-p, --product <type>', 'Product type: SWAP or SPOT', 'SWAP')
    .option('-n, --size <n>', 'Number of records (max 500)', '20')
    .option('--tick-count <n>', 'Tick-count step, 1 to 50', '1')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const client = createClient()
      const data = await client.get('/api/orderFlow/lists', {
        params: {
          exchange: opts.exchange,
          symbol: opts.symbol,
          interval: opts.interval,
          endTime: nowMs(),
          size: opts.size,
          productType: opts.product,
          tickCount: opts.tickCount,
        },
      })
      outputJson(data)
    })
}
