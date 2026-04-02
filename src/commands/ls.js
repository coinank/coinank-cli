import { createClient, nowMs } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtNum, fmtUsd, fmtTs } from '../output.js'
import chalk from 'chalk'

export function registerLs(program) {
  const cmd = program
    .command('ls')
    .description('Long/short ratio data (多空比)')
    .option('-c, --coin <coin>', 'Base coin', 'BTC')
    .option('-e, --exchange <exchange>', 'Exchange (for symbol-level endpoints)', 'Binance')
    .option('-s, --symbol <symbol>', 'Symbol (e.g. BTCUSDT)', 'BTCUSDT')
    .option('-i, --interval <interval>', 'Interval: 5m,15m,30m,1h,2h,4h,6h,8h,12h,1d', '1h')
    .option('-n, --size <n>', 'Number of records', '20')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')

  cmd
    .command('realtime', { isDefault: true })
    .description('Real-time long/short ratio across exchanges (default)')
    .action(async () => { await lsRealtime(cmd.opts()) })

  cmd
    .command('buysell')
    .description('Taker buy/sell ratio by coin (VIP3)')
    .action(async () => { await lsBuySell(cmd.opts()) })

  cmd
    .command('position')
    .description('Top trader position ratio (by exchange+symbol)')
    .action(async () => { await lsPosition(cmd.opts()) })

  cmd
    .command('account')
    .description('Top trader account ratio (by exchange+symbol)')
    .action(async () => { await lsAccount(cmd.opts()) })

  cmd
    .command('person')
    .description('Long/short person ratio (by exchange+symbol)')
    .action(async () => { await lsPerson(cmd.opts()) })

  cmd.action(async (opts) => { await lsRealtime(opts) })
}

async function lsRealtime(opts) {
  const client = createClient()
  const data = await client.get('/api/longshort/realtimeAll', {
    params: { baseCoin: opts.coin, interval: opts.interval },
  })
  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : []

  if (opts.csv) {
    return outputCsv(
      rows.map((r) => [r.exchangeName, r.longRatio, r.shortRatio]),
      ['exchange', 'longRatio', 'shortRatio']
    )
  }
  console.log(chalk.bold(`\n  ${opts.coin} Long/Short Ratio — Real-time (${opts.interval})\n`))
  const table = makeTable(['Exchange', 'Long %', 'Short %'], [16, 14, 14])
  for (const r of rows) {
    const long = Number(r.longRatio || 0)
    const short = Number(r.shortRatio || 0)
    table.push([r.exchangeName, chalk.green(long.toFixed(2) + '%'), chalk.red(short.toFixed(2) + '%')])
  }
  console.log(table.toString())
}

async function lsBuySell(opts) {
  const client = createClient()
  const data = await client.get('/api/longshort/buySell', {
    params: { baseCoin: opts.coin, interval: opts.interval, endTime: nowMs(), size: opts.size },
  })
  if (opts.json) return outputJson(data)
  // longRatios/shortRatios are USD buy/sell amounts, not percentages
  const { longRatios = [], shortRatios = [], tss = [] } = data || {}
  const rows = tss.map((ts, i) => {
    const l = Number(longRatios[i] || 0), s = Number(shortRatios[i] || 0)
    const total = l + s
    const lPct = total > 0 ? ((l / total) * 100).toFixed(1) + '%' : '—'
    const sPct = total > 0 ? ((s / total) * 100).toFixed(1) + '%' : '—'
    return [fmtTs(ts), fmtUsd(l), fmtUsd(s), lPct, sPct]
  })

  if (opts.csv) return outputCsv(rows, ['time', 'buyVolume', 'sellVolume', 'buyPct', 'sellPct'])
  console.log(chalk.bold(`\n  ${opts.coin} Taker Buy/Sell (${opts.interval})\n`))
  const table = makeTable(['Time', 'Buy Vol', 'Sell Vol', 'Buy%', 'Sell%'], [22, 14, 14, 10, 10])
  for (const row of rows.slice(-20).reverse()) {
    table.push([row[0], chalk.green(row[1]), chalk.red(row[2]), chalk.green(row[3]), chalk.red(row[4])])
  }
  console.log(table.toString())
}

async function lsPosition(opts) {
  const client = createClient()
  const data = await client.get('/api/longshort/position', {
    params: { exchange: opts.exchange, symbol: opts.symbol, interval: opts.interval, endTime: nowMs(), size: opts.size },
  })
  if (opts.json) return outputJson(data)
  const { longRatios = [], shortRatios = [], tss = [] } = data || {}
  console.log(chalk.bold(`\n  ${opts.symbol} Top Trader Position Ratio (${opts.exchange}, ${opts.interval})\n`))
  const table = makeTable(['Time', 'Long', 'Short'], [22, 14, 14])
  tss.slice(-20).reverse().forEach((ts, i) => {
    table.push([fmtTs(ts), chalk.green(fmtNum(longRatios[tss.length - 1 - i], 4)), chalk.red(fmtNum(shortRatios[tss.length - 1 - i], 4))])
  })
  console.log(table.toString())
}

async function lsAccount(opts) {
  const client = createClient()
  const data = await client.get('/api/longshort/account', {
    params: { exchange: opts.exchange, symbol: opts.symbol, interval: opts.interval, endTime: nowMs(), size: opts.size },
  })
  if (opts.json) return outputJson(data)
  const { longRatios = [], shortRatios = [], tss = [] } = data || {}
  console.log(chalk.bold(`\n  ${opts.symbol} Top Trader Account Ratio (${opts.exchange}, ${opts.interval})\n`))
  const table = makeTable(['Time', 'Long', 'Short'], [22, 14, 14])
  tss.slice(-20).reverse().forEach((ts, i) => {
    table.push([fmtTs(ts), chalk.green(fmtNum(longRatios[tss.length - 1 - i], 4)), chalk.red(fmtNum(shortRatios[tss.length - 1 - i], 4))])
  })
  console.log(table.toString())
}

async function lsPerson(opts) {
  const client = createClient()
  const data = await client.get('/api/longshort/person', {
    params: { exchange: opts.exchange, symbol: opts.symbol, interval: opts.interval, endTime: nowMs(), size: opts.size },
  })
  if (opts.json) return outputJson(data)
  const { longRatios = [], shortRatios = [], tss = [] } = data || {}
  console.log(chalk.bold(`\n  ${opts.symbol} Long/Short Person Ratio (${opts.exchange}, ${opts.interval})\n`))
  const table = makeTable(['Time', 'Long', 'Short'], [22, 14, 14])
  tss.slice(-20).reverse().forEach((ts, i) => {
    table.push([fmtTs(ts), chalk.green(fmtNum(longRatios[tss.length - 1 - i], 4)), chalk.red(fmtNum(shortRatios[tss.length - 1 - i], 4))])
  })
  console.log(table.toString())
}
