import { createClient, nowMs } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtUsd, fmtTs } from '../output.js'
import chalk from 'chalk'

export function registerHyper(program) {
  const cmd = program
    .command('hyper')
    .description('HyperLiquid whale data (鲸鱼) — VIP2')
    .option('-c, --coin <coin>', 'Coin filter')
    .option('-n, --size <n>', 'Number of records', '20')
    .option('-p, --page <n>', 'Page number', '1')
    .option('--side <side>', 'Long or Short')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')

  cmd
    .command('positions', { isDefault: true })
    .description('Top whale positions (default)')
    .action(async () => { await hyperPositions(cmd.opts()) })

  cmd
    .command('actions')
    .description('Recent whale actions')
    .action(async () => { await hyperActions(cmd.opts()) })

  cmd.action(async (opts) => { await hyperPositions(opts) })
}

async function hyperPositions(opts) {
  const client = createClient()
  const params = {
    sortBy: 'positionValue',
    sortType: 'desc',
    page: opts.page,
    size: opts.size,
  }
  if (opts.coin) params.baseCoin = opts.coin
  if (opts.side) params.side = opts.side

  const data = await client.get('/api/hyper/topPosition', { params })
  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : data?.list || []

  if (opts.csv) {
    return outputCsv(
      rows.map((r) => [r.address, r.coin, r.side, r.positionValue, r.unrealizedPnl, r.leverage]),
      ['address', 'coin', 'side', 'positionValue', 'unrealizedPnl', 'leverage']
    )
  }
  console.log(chalk.bold(`\n  HyperLiquid Top Whale Positions\n`))
  const table = makeTable(['Address', 'Coin', 'Side', 'Position', 'Unrealized PnL', 'Lev'], [44, 8, 8, 14, 16, 6])
  for (const r of rows) {
    const pnl = Number(r.unrealizedPnl || 0)
    const side = (r.side || '').toLowerCase() === 'long' ? chalk.green('Long') : chalk.red('Short')
    table.push([
      r.address || '—',
      r.baseCoin || r.coin || '—',
      side,
      fmtUsd(r.positionValue),
      pnl >= 0 ? chalk.green(fmtUsd(pnl)) : chalk.red(fmtUsd(pnl)),
      r.leverage ? r.leverage + 'x' : '—',
    ])
  }
  console.log(table.toString())
}

async function hyperActions(opts) {
  const client = createClient()
  const data = await client.get('/api/hyper/topAction', {
    params: {
      page: opts.page,
      size: opts.size,
      ...(opts.coin ? { baseCoin: opts.coin } : {}),
      ...(opts.side ? { side: opts.side } : {}),
    },
  })
  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : data?.list || []

  if (opts.csv) {
    return outputCsv(
      rows.map((r) => [fmtTs(r.ts), r.address, r.baseCoin, r.side, r.preSize, r.price]),
      ['time', 'address', 'coin', 'side', 'prevSize', 'price']
    )
  }
  console.log(chalk.bold(`\n  HyperLiquid Recent Whale Actions\n`))
  const table = makeTable(['Time', 'Address', 'Coin', 'Side', 'Prev Size', 'Price', 'PnL'], [22, 44, 8, 8, 14, 12, 14])
  for (const r of rows) {
    const side = (r.side || '').toLowerCase() === 'long' ? chalk.green('Long') : chalk.red('Short')
    const pnl = Number(r.unrealizedPnl || 0)
    table.push([
      fmtTs(r.ts),
      r.address || '—',
      r.baseCoin || '—',
      side,
      fmtUsd(r.preSize),
      r.price ? '$' + Number(r.price).toLocaleString() : '—',
      pnl >= 0 ? chalk.green(fmtUsd(pnl)) : chalk.red(fmtUsd(pnl)),
    ])
  }
  console.log(table.toString())
}
