import { createClient, nowMs } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtUsd, fmtChange } from '../output.js'
import chalk from 'chalk'

export function registerOi(program) {
  const cmd = program
    .command('oi')
    .description('Open interest data (未平仓合约)')
    .option('-c, --coin <coin>', 'Base coin', 'BTC')
    .option('-i, --interval <interval>', 'Interval: 5m,15m,30m,1h,2h,4h,1d', '1h')
    .option('-n, --size <n>', 'Number of records', '20')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')

  cmd
    .command('all', { isDefault: true })
    .description('OI list by exchange (default)')
    .action(async () => {
      await oiAll(cmd.opts())
    })

  cmd
    .command('chart')
    .description('OI history chart data')
    .action(async () => {
      await oiChart(cmd.opts())
    })

  cmd
    .command('symbol <symbol>')
    .description('OI for a specific symbol (e.g. BTC/USDT)')
    .option('-e, --exchange <exchange>', 'Exchange name')
    .action(async (symbol, symbolOpts) => {
      await oiSymbol(symbol, { ...cmd.opts(), ...symbolOpts })
    })

  cmd.action(async (opts) => {
    await oiAll(opts)
  })
}

async function oiAll(opts) {
  const client = createClient()
  const data = await client.get('/api/openInterest/all', {
    params: { baseCoin: opts.coin },
  })

  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : []

  if (opts.csv) {
    return outputCsv(
      rows.map((r) => [r.exchangeName, r.coinCount, r.coinValue, r.rate, r.change1H, r.change24H]),
      ['exchange', 'coinCount', 'coinValue(USD)', 'rate%', 'change1H%', 'change24H%']
    )
  }

  console.log(chalk.bold(`\n  ${opts.coin} Open Interest by Exchange\n`))
  const table = makeTable(['Exchange', 'OI (Coins)', 'OI (USD)', 'Share%', '1H%', '4H%', '24H%'], [14, 14, 14, 10, 10, 10, 10])
  for (const r of rows) {
    table.push([
      r.exchangeName,
      r.coinCount?.toFixed(0) ?? '—',
      fmtUsd(r.coinValue),
      (r.rate ?? 0).toFixed(1) + '%',
      fmtChange(r.change1H),
      fmtChange(r.change4H),
      fmtChange(r.change24H),
    ])
  }
  console.log(table.toString())
}

async function oiChart(opts) {
  const client = createClient()
  const data = await client.get('/api/openInterest/v2/chart', {
    params: {
      baseCoin: opts.coin,
      interval: opts.interval,
      endTime: nowMs(),
      size: opts.size,
    },
  })

  if (opts.json) return outputJson(data)
  console.log(JSON.stringify(data, null, 2))
}

async function oiSymbol(symbol, opts) {
  const client = createClient()
  const params = { symbol, interval: opts.interval, endTime: nowMs(), size: opts.size }
  if (opts.exchange) params.exchangeName = opts.exchange

  const data = await client.get('/api/openInterest/symbol/Chart', { params })

  if (opts.json) return outputJson(data)
  console.log(JSON.stringify(data, null, 2))
}
