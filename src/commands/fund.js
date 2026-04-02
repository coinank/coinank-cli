import { createClient, nowMs } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtUsd, fmtTs } from '../output.js'
import chalk from 'chalk'

export function registerFund(program) {
  const cmd = program
    .command('fund')
    .description('Fund flow data (资金流) — VIP3')
    .option('-c, --coin <coin>', 'Base coin filter (empty = all)', '')
    .option('-p, --product <type>', 'Product type: SWAP or SPOT', 'SWAP')
    .option('-n, --size <n>', 'Number of records', '20')
    .option('--page <n>', 'Page number', '1')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')

  cmd
    .command('list', { isDefault: true })
    .description('Real-time fund flow list (default)')
    .action(async () => { await fundList(cmd.opts()) })

  cmd
    .command('hist <coin>')
    .description('Historical fund flow for a coin')
    .option('-i, --interval <interval>', 'Interval: 5m,15m,30m,1h,4h,8h,1d', '1h')
    .action(async (coin, subOpts) => { await fundHist(coin, { ...cmd.opts(), ...subOpts }) })

  cmd.action(async (opts) => { await fundList(opts) })
}

async function fundList(opts) {
  const client = createClient()
  const data = await client.get('/api/fund/fundReal', {
    params: {
      productType: opts.product,
      page: opts.page,
      size: opts.size,
      sortBy: 'h1net',
      sortType: 'desc',
      baseCoin: opts.coin || '',
    },
  })
  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : data?.list || []

  if (opts.csv) {
    return outputCsv(
      rows.map((r) => [r.baseCoin, r.h1net, r.h4net, r.h8net, r.d1net]),
      ['coin', 'flow1H(USD)', 'flow4H(USD)', 'flow8H(USD)', 'flow1D(USD)']
    )
  }
  console.log(chalk.bold(`\n  Fund Flow (${opts.product}, sorted by 1H)\n`))
  const table = makeTable(['Coin', 'Price', '1H', '4H', '8H', '1D'], [10, 12, 14, 14, 14, 14])
  for (const r of rows) {
    const fmt = (v) => { const n = Number(v||0); return n >= 0 ? chalk.green(fmtUsd(n)) : chalk.red(fmtUsd(n)) }
    table.push([chalk.bold(r.baseCoin), r.price ? '$'+Number(r.price).toFixed(4) : '—', fmt(r.h1net), fmt(r.h4net), fmt(r.h8net), fmt(r.d1net)])
  }
  console.log(table.toString())
}

async function fundHist(coin, opts) {
  const client = createClient()
  const data = await client.get('/api/fund/getFundHisList', {
    params: {
      baseCoin: coin,
      endTime: nowMs(),
      productType: opts.product,
      size: opts.size,
      interval: opts.interval || '1h',
    },
  })
  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : data?.list || []

  console.log(chalk.bold(`\n  ${coin} Historical Fund Flow\n`))
  const table = makeTable(['Time', '1H', '4H', '24H'], [22, 14, 14, 14])
  const fmt = (v) => { const n = Number(v || 0); return n >= 0 ? chalk.green(fmtUsd(n)) : chalk.red(fmtUsd(n)) }
  for (const r of rows) {
    table.push([fmtTs(r.ts || r.time), fmt(r.h1net), fmt(r.h4net), fmt(r.h24net)])
  }
  console.log(table.toString())
}
