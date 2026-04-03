import { createClient } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtUsd, fmtTs } from '../output.js'
import chalk from 'chalk'

export function registerEtf(program) {
  const cmd = program
    .command('etf')
    .description('ETF holdings and inflow data — VIP1')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')

  cmd
    .command('btc', { isDefault: true })
    .description('US BTC ETF holdings list (default)')
    .action(async () => {
      await etfList('btc', cmd.opts())
    })

  cmd
    .command('eth')
    .description('US ETH ETF holdings list')
    .action(async () => {
      await etfList('eth', cmd.opts())
    })

  cmd
    .command('inflow <btc|eth>')
    .description('ETF daily net inflow data')
    .action(async (type) => {
      await etfInflow(type, cmd.opts())
    })

  cmd
    .command('hk')
    .description('HK ETF inflow data')
    .action(async () => {
      await etfHk(cmd.opts())
    })

  cmd.action(async (opts) => {
    await etfList('btc', opts)
  })
}

async function etfList(type, opts) {
  const client = createClient()
  const endpoint = type === 'eth' ? '/api/etf/getUsEthEtf' : '/api/etf/getUsBtcEtf'
  const data = await client.get(endpoint)

  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : []

  if (opts.csv) {
    return outputCsv(
      rows.map((r) => [r.ticker, r.price, r.netInflow, r.cumNet, r.totalNav]),
      ['ticker', 'price', 'netInflow', 'cumNet', 'totalNav']
    )
  }

  const label = type === 'eth' ? 'ETH' : 'BTC'
  console.log(chalk.bold(`\n  US ${label} ETF Holdings\n`))
  const table = makeTable(['Ticker', 'Price', 'Net Inflow', 'Cum. Net', 'Total NAV'], [10, 12, 14, 14, 14])
  for (const r of rows) {
    const inflow = Number(r.netInflow || 0)
    table.push([
      r.ticker,
      r.price ? '$' + Number(r.price).toFixed(2) : '—',
      inflow >= 0 ? chalk.green(fmtUsd(inflow)) : chalk.red(fmtUsd(inflow)),
      fmtUsd(r.cumNet),
      fmtUsd(r.totalNav),
    ])
  }
  console.log(table.toString())
}

async function etfInflow(type, opts) {
  const client = createClient()
  const endpoint = type === 'eth' ? '/api/etf/usEthInflow' : '/api/etf/usBtcInflow'
  const data = await client.get(endpoint)

  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : []

  console.log(chalk.bold(`\n  US ${type.toUpperCase()} ETF Daily Net Inflow\n`))
  const table = makeTable(['Date', 'Net (Coins)', 'Net (USD)', 'Top Ticker'], [14, 14, 16, 12])
  for (const r of rows.slice(-20).reverse()) {
    const val = Number(r.change || 0)
    const valUsd = Number(r.changeUsd || 0)
    const coinStr = val >= 0 ? chalk.green('+' + val.toLocaleString()) : chalk.red(val.toLocaleString())
    table.push([
      r.date ? new Date(Number(r.date)).toLocaleDateString() : '—',
      coinStr,
      valUsd >= 0 ? chalk.green(fmtUsd(valUsd)) : chalk.red(fmtUsd(valUsd)),
      r.list?.[0]?.change != null ? (r.list[0].change >= 0 ? chalk.green : chalk.red)(String(r.list[0].change)) : '—',
    ])
  }
  console.log(table.toString())
}

async function etfHk(opts) {
  const client = createClient()
  const data = await client.get('/api/etf/hkEtfInflow')
  if (opts.json) return outputJson(data)
  console.log(JSON.stringify(data, null, 2))
}
