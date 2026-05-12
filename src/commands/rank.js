import { createClient } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtUsd, fmtChange } from '../output.js'
import chalk from 'chalk'

const RANK_CONFIG = {
  oi:      { path: '/api/instruments/oiRank',          sortBy: 'openInterest',    label: 'OI Change Ranking',       ch1: 'openInterestCh1',   ch24: 'openInterestCh24', pct: true,  oiField: 'openInterest', volField: null, pageSize: true },
  liq:     { path: '/api/instruments/liquidationRank', sortBy: 'liquidationH24',  label: 'Liquidation Ranking',     ch1: 'liquidationH1',     ch24: 'liquidationH24',   pct: false, oiField: null,            volField: null },
  price:   { path: '/api/instruments/priceRank',       sortBy: 'priceChangeH24',  label: 'Price Change Ranking',    ch1: 'priceChangeH1',     ch24: 'priceChangeH24',   pct: true,  oiField: null,            volField: null },
  volume:  { path: '/api/instruments/volumeRank',      sortBy: 'h24Volume',       label: 'Volume Ranking',          ch1: 'turnoverChg1h',     ch24: 'turnoverChg24h',   pct: true,  oiField: null,            volField: 'turnover24h' },
  ls:      { path: '/api/instruments/longShortRank',   sortBy: 'longRatio',       label: 'Long/Short Ranking',      ch1: 'lsPersonChg1h',     ch24: 'lsPersonChg4h',    pct: true,  oiField: null,            volField: null, pageSize: true },
  'oi-mc': { path: '/api/instruments/oiVsMarketCap',   sortBy: 'openInterest',    label: 'OI / Market Cap Ranking', kind: 'oiMc', pageSize: true },
  trades:  { path: '/api/trades/count',                sortBy: 'h1Count',         label: 'Trade Count Ranking',     kind: 'trades', productType: true },
}

export function registerRank(program) {
  const cmd = program
    .command('rank')
    .description('Trending rankings (热门排行) — VIP2')
    .option('-n, --size <n>', 'Number of results per page', '20')
    .option('-p, --page <n>', 'Page number', '1')
    .option('--asc', 'Sort ascending (default: descending)')
    .option('--sort-by <field>', 'Override schema sortBy field')
    .option('--product <type>', 'Product type for trades ranking: SWAP or SPOT', 'SWAP')
    .option('-i, --interval <interval>', 'Interval for visual screener: 15m,1h,4h,24h', '1h')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')

  Object.entries(RANK_CONFIG).forEach(([key, cfg]) => {
    cmd
      .command(key, key === 'oi' ? { isDefault: true } : {})
      .description(cfg.label + (key === 'oi' ? ' (default)' : ''))
      .action(async () => { await rankBy(key, cmd.opts()) })
  })

  cmd
    .command('screener')
    .description('Visual screener')
    .action(async () => { await rankScreener(cmd.opts()) })

  cmd.action(async (opts) => { await rankBy('oi', opts) })
}

async function rankBy(type, opts) {
  const cfg = RANK_CONFIG[type]
  const client = createClient()
  const raw = await client.get(cfg.path, {
    params: buildRankParams(cfg, opts),
  })

  if (opts.json) return outputJson(raw)

  // Handle single or double-nested response: data | data.data.list | data.list
  let rows = []
  if (Array.isArray(raw)) {
    rows = raw
  } else if (raw?.data?.list) {
    rows = raw.data.list
  } else if (raw?.list) {
    rows = raw.list
  } else if (raw?.data && Array.isArray(raw.data)) {
    rows = raw.data
  }

  if (opts.csv) {
    if (cfg.kind === 'oiMc') {
      return outputCsv(
        rows.map((r) => [r.baseCoin, r.oiVsMar, r.volVsMar, r.oiVsVol]),
        ['coin', 'oiVsMarketCap', 'volumeVsMarketCap', 'oiVsVolume']
      )
    }
    if (cfg.kind === 'trades') {
      return outputCsv(
        rows.map((r) => [r.baseCoin, r.m5Count, r.h1Count, r.d1Count, r.d7Count]),
        ['coin', 'count5m', 'count1H', 'count1D', 'count7D']
      )
    }
    return outputCsv(
      rows.map((r) => [r.symbol || r.baseCoin, r.price, r[cfg.ch1], r[cfg.ch24], cfg.oiField ? r[cfg.oiField] : '', cfg.volField ? r[cfg.volField] : '']),
      ['symbol', 'price', 'change1H', 'change24H', 'OI', 'volume24H']
    )
  }

  if (cfg.kind === 'oiMc') return renderOiMc(rows, cfg.label)
  if (cfg.kind === 'trades') return renderTrades(rows, cfg.label)

  const fmtVal = (v, pct) => pct ? fmtChange(v) : fmtUsd(v)
  const h1Label = cfg.pct ? '1H%' : '1H Liq'
  const h24Label = type === 'ls' ? '4H%' : (cfg.pct ? '24H%' : '24H Liq')

  // Build dynamic columns: always show #/Symbol/Price/ch1/ch24, optionally OI and Vol
  const heads = ['#', 'Symbol', 'Price', h1Label, h24Label]
  const widths = [4, 20, 14, 14, 14]
  if (cfg.oiField) { heads.push('OI (USD)'); widths.push(14) }
  if (cfg.volField) { heads.push('Vol 24H'); widths.push(14) }

  console.log(chalk.bold(`\n  ${cfg.label}\n`))
  const table = makeTable(heads, widths)
  rows.forEach((r, i) => {
    const row = [
      i + 1,
      r.symbol || r.baseCoin,
      r.price ? '$' + Number(r.price).toFixed(2) : '—',
      fmtVal(r[cfg.ch1], cfg.pct),
      fmtVal(r[cfg.ch24], cfg.pct),
    ]
    if (cfg.oiField) row.push(fmtUsd(r[cfg.oiField]))
    if (cfg.volField) row.push(fmtUsd(r[cfg.volField]))
    table.push(row)
  })
  console.log(table.toString())
}

function buildRankParams(cfg, opts) {
  const params = {
    sortBy: opts.sortBy || cfg.sortBy,
    sortType: opts.asc ? 'asc' : 'desc',
  }
  if (cfg.pageSize) {
    params.page = opts.page
    params.size = opts.size
  }
  if (cfg.productType) params.productType = opts.product || 'SWAP'
  return params
}

function renderOiMc(rows, label) {
  console.log(chalk.bold(`\n  ${label}\n`))
  const table = makeTable(['#', 'Coin', 'OI/MC', 'Vol/MC', 'OI/Vol'], [4, 12, 12, 12, 12])
  rows.forEach((r, i) => {
    table.push([
      i + 1,
      r.baseCoin || '—',
      r.oiVsMar != null ? Number(r.oiVsMar).toFixed(4) : '—',
      r.volVsMar != null ? Number(r.volVsMar).toFixed(4) : '—',
      r.oiVsVol != null ? Number(r.oiVsVol).toFixed(4) : '—',
    ])
  })
  console.log(table.toString())
}

function renderTrades(rows, label) {
  console.log(chalk.bold(`\n  ${label}\n`))
  const table = makeTable(['#', 'Coin', '5m', '1H', '1D', '7D'], [4, 12, 12, 12, 12, 12])
  rows.forEach((r, i) => {
    table.push([
      i + 1,
      r.baseCoin || '—',
      r.m5Count ?? '—',
      r.h1Count ?? '—',
      r.d1Count ?? '—',
      r.d7Count ?? '—',
    ])
  })
  console.log(table.toString())
}

async function rankScreener(opts) {
  const client = createClient()
  const data = await client.get('/api/instruments/visualScreener', {
    params: { interval: opts.interval || '1h' },
  })

  if (opts.json) return outputJson(data)
  const rows = Array.isArray(data) ? data : data?.list || []
  if (opts.csv) {
    return outputCsv(
      rows.map((r) => [r.baseCoin, r.priceChg, r.oiChg, r.voChg]),
      ['coin', 'priceChg', 'oiChg', 'volumeChg']
    )
  }

  console.log(chalk.bold(`\n  Visual Screener (${opts.interval || '1h'})\n`))
  const table = makeTable(['#', 'Coin', 'Price%', 'OI%', 'Vol%'], [4, 12, 12, 12, 12])
  rows.forEach((r, i) => {
    table.push([i + 1, r.baseCoin || '—', fmtChange(r.priceChg), fmtChange(r.oiChg), fmtChange(r.voChg)])
  })
  console.log(table.toString())
}
