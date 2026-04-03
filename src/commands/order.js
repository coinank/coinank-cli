import { createClient, nowMs } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtUsd, fmtTs } from '../output.js'
import chalk from 'chalk'

export function registerOrder(program) {
  const cmd = program
    .command('order')
    .description('Large order data (大额订单) — VIP3')
    .option('-s, --symbol <symbol>', 'Symbol (e.g. BTCUSDT)', 'BTCUSDT')
    .option('-p, --product <type>', 'Product type: SWAP or SPOT', 'SWAP')
    .option('-a, --amount <usd>', 'Minimum order size in USD', '1000000')
    .option('-n, --size <n>', 'Number of records', '20')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')

  cmd
    .command('large', { isDefault: true })
    .description('Large market orders (default)')
    .action(async () => { await orderLarge(cmd.opts()) })

  cmd
    .command('book')
    .description('Large limit orders (order book)')
    .option('-e, --exchange <exchange>', 'Exchange', 'Binance')
    .option('--side <side>', 'Side: ask or bid', 'ask')
    .option('--history', 'Query historical orders')
    .action(async (subOpts) => { await orderBook({ ...cmd.opts(), ...subOpts }) })

  cmd.action(async (opts) => { await orderLarge(opts) })
}

async function orderLarge(opts) {
  const client = createClient()
  const data = await client.get('/api/trades/largeTrades', {
    params: {
      symbol: opts.symbol,
      productType: opts.product,
      amount: opts.amount,
      endTime: nowMs(),
      size: opts.size,
    },
  })
  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : data?.list || []

  if (opts.csv) {
    return outputCsv(
      rows.map((r) => [fmtTs(r.ts), r.symbol, r.exchangeName, r.side, r.price, r.tradeTurnover]),
      ['time', 'symbol', 'exchange', 'side', 'price', 'turnover']
    )
  }
  console.log(chalk.bold(`\n  ${opts.symbol} Large Market Orders (min $${Number(opts.amount).toLocaleString()})\n`))
  const table = makeTable(['Time', 'Symbol', 'Exchange', 'Side', 'Price', 'Turnover'], [22, 14, 12, 8, 14, 14])
  for (const r of rows) {
    const side = r.side === 'Buy' ? chalk.green('Buy') : chalk.red('Sell')
    table.push([fmtTs(r.ts), r.symbol, r.exchangeName, side, r.price ? '$' + r.price : '—', fmtUsd(r.tradeTurnover)])
  }
  console.log(table.toString())
}

async function orderBook(opts) {
  const client = createClient()
  const now = Date.now()
  const params = {
    symbol: opts.symbol,
    exchangeType: opts.product,
    exchange: opts.exchange || 'Binance',
    side: opts.side || 'ask',
    amount: opts.amount,
    size: opts.size,
    isHistory: opts.history ? 'true' : 'false',
    startTime: opts.history ? undefined : String(now - 4 * 3600 * 1000),
  }
  const data = await client.get('/api/bigOrder/queryOrderList', { params })
  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : data?.list || []

  const sideLabel = (opts.side || 'ask') === 'ask' ? 'Ask (Sell Wall)' : 'Bid (Buy Wall)'
  console.log(chalk.bold(`\n  ${opts.symbol} Large Limit Orders — ${sideLabel}\n`))
  const table = makeTable(['Time', 'Exchange', 'Side', 'Price', 'Size (USD)', 'Filled'], [22, 12, 8, 14, 14, 10])
  for (const r of rows) {
    const side = r.side === 'bid' ? chalk.green('Bid') : chalk.red('Ask')
    const filled = r.entrustTurnover > 0
      ? ((r.turnoverAmount / r.entrustTurnover) * 100).toFixed(1) + '%'
      : '—'
    table.push([
      fmtTs(r.openTime),
      r.exchangeName || opts.exchange,
      side,
      r.price ? '$' + Number(r.price).toLocaleString() : '—',
      fmtUsd(r.entrustTurnover),
      filled,
    ])
  }
  console.log(table.toString())
}
