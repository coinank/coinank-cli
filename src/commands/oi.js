import { createClient, nowMs } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtUsd, fmtChange } from '../output.js'
import chalk from 'chalk'

export function registerOi(program) {
  const cmd = program
    .command('oi')
    .description('Open interest data (未平仓合约)')
    .option('-c, --coin <coin>', 'Base coin', 'BTC')
    .option('-i, --interval <interval>', 'Interval: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d', '1h')
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
    .option('-e, --exchange <exchange>', 'Exchange', 'Binance')
    .option('-t, --type <type>', 'USD or coin name (e.g. BTC)', 'USD')
    .action(async (subOpts) => {
      await oiChart({ ...cmd.opts(), ...subOpts })
    })

  cmd
    .command('symbol <symbol>')
    .description('OI for a specific symbol (e.g. BTC/USDT)')
    .option('-e, --exchange <exchange>', 'Exchange name')
    .action(async (symbol, symbolOpts) => {
      await oiSymbol(symbol, { ...cmd.opts(), ...symbolOpts })
    })

  cmd
    .command('kline <symbol>')
    .description('OI K-line for a specific symbol')
    .option('-e, --exchange <exchange>', 'Exchange name', 'Binance')
    .action(async (symbol, subOpts) => {
      await oiKline(symbol, { ...cmd.opts(), ...subOpts })
    })

  cmd
    .command('agg-kline')
    .description('Aggregated OI K-line by base coin')
    .action(async () => {
      await oiAggKline(cmd.opts())
    })

  cmd
    .command('top')
    .description('Real-time OI by exchange for base coin')
    .action(async () => {
      await oiTopByExchange(cmd.opts())
    })

  cmd
    .command('vs-mc')
    .description('Historical OI vs market-cap ratio')
    .action(async () => {
      await oiVsMarketCap(cmd.opts())
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
      exchange: opts.exchange || 'Binance',
      interval: opts.interval,
      size: opts.size,
      type: opts.type || 'USD',
    },
  })

  if (opts.json) return outputJson(data)
  console.log(JSON.stringify(data, null, 2))
}

async function oiSymbol(symbol, opts) {
  const client = createClient()
  const params = {
    symbol,
    exchange: opts.exchange || 'Binance',
    interval: opts.interval,
    endTime: nowMs(),
    size: opts.size,
  }

  const data = await client.get('/api/openInterest/symbol/Chart', { params })

  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : []
  if (!rows.length) return console.log('No data.')

  console.log(chalk.bold(`\n  ${symbol} Open Interest (${params.exchange}, ${opts.interval})\n`))
  const table = makeTable(['Time', 'OI (Coins)', 'OI (USD)', 'Volume'], [22, 14, 14, 14])
  for (const r of rows) {
    table.push([
      new Date(Number(r.ts)).toLocaleString(),
      r.coinCount?.toFixed(0) ?? '—',
      fmtUsd(r.coinValue),
      fmtUsd(r.volume),
    ])
  }
  console.log(table.toString())
}

async function oiKline(symbol, opts) {
  const client = createClient()
  const data = await client.get('/api/openInterest/kline', {
    params: {
      exchange: opts.exchange || 'Binance',
      symbol,
      interval: opts.interval,
      endTime: nowMs(),
      size: opts.size,
    },
  })

  if (opts.json) return outputJson(data)
  console.log(JSON.stringify(data, null, 2))
}

async function oiAggKline(opts) {
  const client = createClient()
  const data = await client.get('/api/openInterest/aggKline', {
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

async function oiTopByExchange(opts) {
  const client = createClient()
  const data = await client.get('/api/tickers/topOIByEx', {
    params: { baseCoin: opts.coin },
  })

  if (opts.json) return outputJson(data)
  console.log(JSON.stringify(data, null, 2))
}

async function oiVsMarketCap(opts) {
  const client = createClient()
  const data = await client.get('/api/instruments/oiVsMc', {
    params: {
      baseCoin: opts.coin,
      endTime: nowMs(),
      size: opts.size,
      interval: opts.interval,
    },
  })

  if (opts.json) return outputJson(data)
  console.log(JSON.stringify(data, null, 2))
}
