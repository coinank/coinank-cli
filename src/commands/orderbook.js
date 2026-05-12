import { createClient, nowMs } from '../client.js'
import { outputJson } from '../output.js'

export function registerOrderbook(program) {
  const cmd = program
    .command('orderbook')
    .description('Order book depth and heatmap data (订单本) — VIP3/VIP4')
    .option('-s, --symbol <symbol>', 'Symbol', 'BTCUSDT')
    .option('-c, --coin <coin>', 'Base coin for aggregate endpoint', 'BTC')
    .option('-e, --exchange <exchange>', 'Exchange', 'Binance')
    .option('--exchanges <list>', 'Comma-separated exchanges for aggregate endpoint', 'Binance')
    .option('-r, --rate <rate>', 'Depth rate: 0.0025,0.005,0.0075,0.01,0.03,0.05,0.1', '0.01')
    .option('-p, --product <type>', 'Product type: SWAP or SPOT', 'SWAP')
    .option('-i, --interval <interval>', 'Interval', '1h')
    .option('-n, --size <n>', 'Number of records (max 500)', '20')
    .option('--json', 'Output raw JSON')

  cmd
    .command('symbol', { isDefault: true })
    .description('Order book depth by symbol')
    .action(async () => { await orderbookBySymbol(cmd.opts()) })

  cmd
    .command('exchange')
    .description('Aggregated order book depth by exchanges')
    .action(async () => { await orderbookByExchange(cmd.opts()) })

  cmd
    .command('heatmap')
    .description('Order book liquidity heatmap')
    .option('-i, --interval <interval>', 'Interval: 1m,3m,5m', '1m')
    .action(async (subOpts) => { await orderbookHeatmap({ ...cmd.opts(), ...subOpts }) })

  cmd.action(async (opts) => { await orderbookBySymbol(opts) })
}

async function orderbookBySymbol(opts) {
  const client = createClient()
  const data = await client.get('/api/orderBook/v2/bySymbol', {
    params: {
      symbol: opts.symbol,
      exchange: opts.exchange,
      rate: opts.rate,
      productType: opts.product,
      interval: opts.interval,
      endTime: nowMs(),
      size: opts.size,
    },
  })
  outputJson(data)
}

async function orderbookByExchange(opts) {
  const client = createClient()
  const data = await client.get('/api/orderBook/v2/byExchange', {
    params: {
      baseCoin: opts.coin,
      productType: opts.product,
      interval: opts.interval,
      endTime: nowMs(),
      size: opts.size,
      exchanges: opts.exchanges,
      type: opts.rate,
    },
  })
  outputJson(data)
}

async function orderbookHeatmap(opts) {
  const client = createClient()
  const data = await client.get('/api/orderBook/getHeatMap', {
    params: {
      exchange: opts.exchange,
      symbol: opts.symbol,
      interval: opts.interval,
      endTime: nowMs(),
      size: opts.size,
    },
  })
  outputJson(data)
}
