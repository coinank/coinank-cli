import { createClient, nowMs } from '../client.js'
import { outputJson } from '../output.js'

const SERIES_ENDPOINTS = {
  cvd: '/api/marketOrder/getCvd',
  'buy-sell-count': '/api/marketOrder/getBuySellCount',
  'buy-sell-value': '/api/marketOrder/getBuySellValue',
  'buy-sell-volume': '/api/marketOrder/getBuySellVolume',
}

const AGG_ENDPOINTS = {
  'agg-cvd': '/api/marketOrder/getAggCvd',
  'agg-buy-sell-count': '/api/marketOrder/getAggBuySellCount',
  'agg-buy-sell-value': '/api/marketOrder/getAggBuySellValue',
  'agg-buy-sell-volume': '/api/marketOrder/getAggBuySellVolume',
}

export function registerMarketOrder(program) {
  const cmd = program
    .command('market-order')
    .description('Market order statistics (市价单统计指标) — VIP3')
    .option('-e, --exchange <exchange>', 'Exchange', 'Binance')
    .option('-s, --symbol <symbol>', 'Symbol', 'BTCUSDT')
    .option('-c, --coin <coin>', 'Base coin for aggregate endpoints', 'BTC')
    .option('-i, --interval <interval>', 'Interval: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d', '1h')
    .option('-p, --product <type>', 'Product type: SWAP or SPOT', 'SWAP')
    .option('-n, --size <n>', 'Number of records (max 500)', '20')
    .option('--exchanges <list>', 'Comma-separated exchanges for aggregate endpoints; empty means all', '')
    .option('--json', 'Output raw JSON')

  Object.entries(SERIES_ENDPOINTS).forEach(([name, path]) => {
    cmd
      .command(name, name === 'cvd' ? { isDefault: true } : {})
      .description(`${name} by exchange and symbol`)
      .action(async () => { await marketSeries(path, cmd.opts()) })
  })

  Object.entries(AGG_ENDPOINTS).forEach(([name, path]) => {
    cmd
      .command(name)
      .description(`${name} by base coin`)
      .action(async () => { await marketAggregate(path, cmd.opts()) })
  })

  cmd.action(async (opts) => { await marketSeries(SERIES_ENDPOINTS.cvd, opts) })
}

async function marketSeries(path, opts) {
  const client = createClient()
  const data = await client.get(path, {
    params: {
      exchange: opts.exchange,
      symbol: opts.symbol,
      interval: opts.interval,
      endTime: nowMs(),
      size: opts.size,
      productType: opts.product,
    },
  })
  outputJson(data)
}

async function marketAggregate(path, opts) {
  const client = createClient()
  const data = await client.get(path, {
    params: {
      baseCoin: opts.coin,
      interval: opts.interval,
      endTime: nowMs(),
      size: opts.size,
      productType: opts.product,
      exchanges: opts.exchanges ?? '',
    },
  })
  outputJson(data)
}
