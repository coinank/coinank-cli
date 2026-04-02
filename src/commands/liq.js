import { createClient, nowMs } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtUsd, fmtTs } from '../output.js'
import chalk from 'chalk'

export function registerLiq(program) {
  const cmd = program
    .command('liq')
    .description('Liquidation data (爆仓数据)')
    .option('-c, --coin <coin>', 'Base coin', 'BTC')
    .option('-i, --interval <interval>', 'Interval: 5m,15m,30m,1h,2h,4h,12h,1d', '1h')
    .option('-n, --size <n>', 'Number of records', '20')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')

  cmd
    .command('stats', { isDefault: true })
    .description('Liquidation stats per coin (default)')
    .action(async () => {
      await liqStats(cmd.opts())
    })

  cmd
    .command('orders')
    .description('Liquidation order list (VIP3)')
    .action(async () => {
      await liqOrders(cmd.opts())
    })

  cmd
    .command('hist')
    .description('Historical aggregated liquidation data')
    .action(async () => {
      await liqHist(cmd.opts())
    })

  cmd.action(async (opts) => {
    await liqStats(opts)
  })
}

async function liqStats(opts) {
  const client = createClient()
  const data = await client.get('/api/liquidation/allExchange/intervals', {
    params: { baseCoin: opts.coin },
  })

  if (opts.json) return outputJson(data)

  // data = { topOrder, total, "1h": {...}, "24h": {...} }
  const top = data?.topOrder
  const intervals = ['5m', '15m', '30m', '1h', '4h', '12h', '24h']
  const rows = intervals
    .map((k) => data?.[k])
    .filter(Boolean)

  if (top) {
    console.log(chalk.bold(`\n  Largest Liquidation:`), chalk.yellow(`${top.symbol} ${top.posSide} ${fmtUsd(top.tradeTurnover)} @ ${top.exchangeName} ${fmtTs(top.ts)}`))
  }

  if (opts.csv) {
    return outputCsv(
      rows.map((r) => [r.interval, r.longTurnover, r.shortTurnover, r.totalTurnover]),
      ['interval', 'longLiq(USD)', 'shortLiq(USD)', 'total(USD)']
    )
  }

  console.log(chalk.bold(`\n  ${opts.coin} Liquidations by Interval\n`))
  const table = makeTable(['Interval', 'Long Liq', 'Short Liq', 'Total'], [12, 16, 16, 16])
  for (const r of rows) {
    table.push([
      r.interval,
      chalk.green(fmtUsd(r.longTurnover)),
      chalk.red(fmtUsd(r.shortTurnover)),
      fmtUsd(r.totalTurnover),
    ])
  }
  console.log(table.toString())
}

async function liqOrders(opts) {
  const client = createClient()
  const data = await client.get('/api/liquidation/orders', {
    params: {
      baseCoin: opts.coin,
      interval: opts.interval,
      endTime: nowMs(),
      size: opts.size,
    },
  })

  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : data?.list || []

  if (opts.csv) {
    return outputCsv(
      rows.map((r) => [fmtTs(r.ts), r.symbol, r.exchangeName, r.posSide, r.tradeTurnover, r.price]),
      ['time', 'symbol', 'exchange', 'side', 'turnover(USD)', 'price']
    )
  }

  console.log(chalk.bold(`\n  ${opts.coin} Liquidation Orders\n`))
  const table = makeTable(['Time', 'Contract', 'Exchange', 'Side', 'Price', 'Turnover'], [22, 18, 12, 8, 14, 14])
  for (const r of rows) {
    const side = (r.posSide || r.side || '') === 'long' ? chalk.green('Long') : chalk.red('Short')
    table.push([fmtTs(r.ts), r.contractCode || r.symbol || '—', r.exchangeName, side, r.price ? '$' + Number(r.price).toFixed(1) : '—', fmtUsd(r.tradeTurnover)])
  }
  console.log(table.toString())
}

async function liqHist(opts) {
  const client = createClient()
  const data = await client.get('/api/liquidation/aggregated-history', {
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
