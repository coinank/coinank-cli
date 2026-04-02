import { createClient, nowMs } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtPct, fmtTs } from '../output.js'
import chalk from 'chalk'

export function registerFr(program) {
  const cmd = program
    .command('fr')
    .description('Funding rate data (资金费率)')
    .option('-c, --coin <coin>', 'Base coin', 'BTC')
    .option('-t, --type <usdt|coin>', 'Contract type: USDT or COIN', 'USDT')
    .option('-n, --size <n>', 'Number of records', '20')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')

  cmd
    .command('hist', { isDefault: true })
    .description('Historical settlement funding rates (default)')
    .action(async () => { await frHist(cmd.opts()) })

  cmd
    .command('current')
    .description('Current funding rates snapshot (type: current/day/week/month/year)')
    .option('--period <period>', 'Period: current, day, week, month, year', 'current')
    .action(async (subOpts) => { await frCurrent({ ...cmd.opts(), ...subOpts }) })

  cmd
    .command('accumulated')
    .description('Accumulated funding rates (type: day/week/month/year)')
    .option('--period <period>', 'Period: day, week, month, year', 'day')
    .action(async (subOpts) => { await frAccumulated({ ...cmd.opts(), ...subOpts }) })

  cmd
    .command('heatmap')
    .description('Funding rate heatmap')
    .option('--weight <weight>', 'Weight: openInterest or marketCap', 'openInterest')
    .option('-i, --interval <interval>', 'Interval: 1D, 1W, 1M, 6M', '1D')
    .action(async (subOpts) => { await frHeatmap({ ...cmd.opts(), ...subOpts }) })

  cmd.action(async (opts) => { await frHist(opts) })
}

async function frHist(opts) {
  const client = createClient()
  const data = await client.get('/api/fundingRate/hist', {
    params: {
      baseCoin: opts.coin,
      exchangeType: opts.type,
      endTime: nowMs(),
      size: opts.size,
    },
  })
  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : []
  if (!rows.length) return console.log('No data.')

  const exchanges = Object.keys(rows[0]?.details || {})
  if (opts.csv) {
    return outputCsv(
      rows.map((r) => [fmtTs(r.ts), ...exchanges.map((ex) => r.details?.[ex]?.fundingRate ?? '')]),
      ['time', ...exchanges]
    )
  }
  console.log(chalk.bold(`\n  ${opts.coin} Historical Funding Rates (${opts.type})\n`))
  const table = makeTable(['Time', ...exchanges], [22, ...exchanges.map(() => 14)])
  for (const r of rows) {
    table.push([fmtTs(r.ts), ...exchanges.map((ex) => fmtPct(r.details?.[ex]?.fundingRate, 4))])
  }
  console.log(table.toString())
}

async function frCurrent(opts) {
  const client = createClient()
  const data = await client.get('/api/fundingRate/current', {
    params: { type: opts.period || 'current' },
  })
  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : data?.list || []

  if (opts.csv) {
    return outputCsv(
      rows.map((r) => [r.baseCoin || r.symbol, r.exchangeName, r.fundingRate]),
      ['coin', 'exchange', 'fundingRate']
    )
  }
  console.log(chalk.bold(`\n  Current Funding Rates (${opts.period || 'current'})\n`))
  const table = makeTable(['Coin', 'Exchange', 'Funding Rate'], [12, 14, 16])
  for (const r of rows) {
    table.push([r.baseCoin || r.symbol || '—', r.exchangeName || '—', fmtPct(r.fundingRate, 4)])
  }
  console.log(table.toString())
}

async function frAccumulated(opts) {
  const client = createClient()
  const data = await client.get('/api/fundingRate/accumulated', {
    params: { type: opts.period || 'day' },
  })
  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : []
  if (!rows.length) return console.log('No data.')

  // Each row: { symbol, umap: {exchange: {fundingRate}}, cmap: {...} }
  const mapType = opts.type === 'COIN' ? 'cmap' : 'umap'
  const exchanges = rows[0] ? Object.keys(rows[0][mapType] || {}) : []

  console.log(chalk.bold(`\n  Accumulated Funding Rates (${opts.period || 'day'}, ${opts.type || 'USDT'})\n`))
  const table = makeTable(['Coin', ...exchanges], [8, ...exchanges.map(() => 12)])
  for (const r of rows.slice(0, 20)) {
    table.push([r.symbol, ...exchanges.map((ex) => fmtPct(r[mapType]?.[ex]?.fundingRate, 4))])
  }
  console.log(table.toString())
}

async function frHeatmap(opts) {
  const client = createClient()
  const data = await client.get('/api/fundingRate/frHeatmap', {
    params: { type: opts.weight || 'openInterest', interval: opts.interval || '1D' },
  })
  if (opts.json) return outputJson(data)
  console.log(JSON.stringify(data, null, 2))
}
