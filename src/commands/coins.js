import { createClient } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtUsd, fmtChange } from '../output.js'
import chalk from 'chalk'

export function registerCoins(program) {
  const cmd = program
    .command('coins')
    .description('Coin and trading pair data (币种和交易对) — VIP1')
    .option('-p, --product <type>', 'Product type: SWAP or SPOT', 'SWAP')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')

  cmd
    .command('list', { isDefault: true })
    .description('List all base coins (default)')
    .action(async () => { await coinsList(cmd.opts()) })

  cmd
    .command('price <symbol>')
    .description('Latest price for a symbol (e.g. BTCUSDT)')
    .option('-e, --exchange <exchange>', 'Exchange', 'Binance')
    .action(async (symbol, subOpts) => { await coinsPrice(symbol, { ...cmd.opts(), ...subOpts }) })

  cmd
    .command('cap <coin>')
    .description('Market cap data for a coin (e.g. BTC)')
    .action(async (coin) => { await coinsCap(coin, cmd.opts()) })

  cmd
    .command('symbols')
    .description('List all symbols for an exchange')
    .option('-e, --exchange <exchange>', 'Exchange', 'Binance')
    .action(async (subOpts) => { await coinsSymbols({ ...cmd.opts(), ...subOpts }) })

  cmd.action(async (opts) => { await coinsList(opts) })
}

async function coinsList(opts) {
  const client = createClient()
  const data = await client.get('/api/baseCoin/list', {
    params: { productType: opts.product },
  })
  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : data?.list || []
  const limited = rows.slice(0, 60)

  if (opts.csv) return outputCsv(limited.map((r) => [r.baseCoin || r, r.fullName || '']), ['baseCoin', 'fullName'])

  console.log(chalk.bold(`\n  Available Base Coins (${opts.product})\n`))
  const cols = 8
  const lines = []
  for (let i = 0; i < limited.length; i += cols) {
    lines.push('  ' + limited.slice(i, i + cols).map((r) => (r.baseCoin || r).padEnd(10)).join(''))
  }
  console.log(lines.join('\n'))
  if (rows.length > 60) console.log(chalk.grey(`\n  ... and ${rows.length - 60} more.\n`))
  else console.log()
}

async function coinsPrice(symbol, opts) {
  const client = createClient()
  const data = await client.get('/api/instruments/getLastPrice', {
    params: { symbol, exchange: opts.exchange || 'Binance', productType: opts.product },
  })
  if (opts.json) return outputJson(data)

  const d = Array.isArray(data) ? data[0] : data
  if (!d) return console.log('No data.')

  const chg = Number(d.priceChange24h || 0)
  const chgStr = chg >= 0 ? chalk.green('+' + chg.toFixed(3) + '%') : chalk.red(chg.toFixed(3) + '%')
  console.log(chalk.bold(`\n  ${d.symbol} @ ${d.exchangeName}\n`))
  console.log(`  Price:       ${chalk.bold('$' + Number(d.lastPrice).toLocaleString())}  (${chgStr} 24H)`)
  console.log(`  High/Low:    $${Number(d.high24h).toLocaleString()} / $${Number(d.low24h).toLocaleString()}`)
  console.log(`  Volume 24H:  ${fmtUsd(d.turnover24h)}`)
  console.log(`  OI:          ${fmtUsd(d.oiUSD)}  (${fmtChange(d.oiChg24h)} 24H)`)
  console.log(`  Funding:     ${(Number(d.fundingRate || 0) * 100).toFixed(4)}%`)
  console.log(`  Liq 24H:     Long ${fmtUsd(d.liqLong24h)}  Short ${fmtUsd(d.liqShort24h)}`)
  console.log()
}

async function coinsCap(coin, opts) {
  const client = createClient()
  const data = await client.get('/api/instruments/getCoinMarketCap', {
    params: { baseCoin: coin },
  })
  if (opts.json) return outputJson(data)
  console.log(chalk.bold(`\n  ${coin} Market Cap\n`))
  console.log(JSON.stringify(data, null, 2))
}

async function coinsSymbols(opts) {
  const client = createClient()
  const data = await client.get('/api/baseCoin/symbols', {
    params: { exchange: opts.exchange || 'Binance', productType: opts.product },
  })
  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : []
  console.log(chalk.bold(`\n  Symbols on ${opts.exchange || 'Binance'} (${opts.product})\n`))
  const cols = 5
  for (let i = 0; i < Math.min(rows.length, 50); i += cols) {
    console.log('  ' + rows.slice(i, i + cols).map((r) => (r.symbol || r).padEnd(16)).join(''))
  }
  if (rows.length > 50) console.log(chalk.grey(`\n  ... and ${rows.length - 50} more. Use --json to see all.\n`))
}
