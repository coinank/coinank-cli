import { createClient } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtUsd, fmtChange } from '../output.js'
import chalk from 'chalk'

const RANK_CONFIG = {
  oi:     { path: '/api/instruments/oiRank',          sortBy: 'openInterestH1',  label: 'OI Change Ranking',       ch1: 'openInterestCh1',   ch24: 'openInterestCh24', pct: true },
  liq:    { path: '/api/instruments/liquidationRank', sortBy: 'liquidationH24',  label: 'Liquidation Ranking',     ch1: 'liquidationH1',     ch24: 'liquidationH24',   pct: false },
  price:  { path: '/api/instruments/priceRank',       sortBy: 'priceChangeH24',  label: 'Price Change Ranking',    ch1: 'priceChangeH1',     ch24: 'priceChangeH24',   pct: true },
  volume: { path: '/api/instruments/volumeRank',      sortBy: 'turnover24h',     label: 'Volume Ranking',          ch1: 'turnoverChg1h',     ch24: 'turnoverChg24h',   pct: true },
  ls:     { path: '/api/instruments/longShortRank',   sortBy: 'longShortPerson', label: 'Long/Short Ranking',      ch1: 'lsPersonChg1h',     ch24: 'lsPersonChg4h',    pct: true },
}

export function registerRank(program) {
  const cmd = program
    .command('rank')
    .description('Trending rankings (热门排行) — VIP2')
    .option('-n, --size <n>', 'Number of results per page', '20')
    .option('-p, --page <n>', 'Page number', '1')
    .option('--asc', 'Sort ascending (default: descending)')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')

  Object.entries(RANK_CONFIG).forEach(([key, cfg]) => {
    cmd
      .command(key, key === 'oi' ? { isDefault: true } : {})
      .description(cfg.label + (key === 'oi' ? ' (default)' : ''))
      .action(async () => { await rankBy(key, cmd.opts()) })
  })

  cmd.action(async (opts) => { await rankBy('oi', opts) })
}

async function rankBy(type, opts) {
  const cfg = RANK_CONFIG[type]
  const client = createClient()
  const raw = await client.get(cfg.path, {
    params: {
      sortBy: cfg.sortBy,
      sortType: opts.asc ? 'asc' : 'desc',
      page: opts.page,
      size: opts.size,
    },
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
    return outputCsv(
      rows.map((r) => [r.symbol || r.baseCoin, r.price, r[cfg.ch1], r[cfg.ch24], r.openInterest, r.turnover24h]),
      ['symbol', 'price', 'change1H', 'change24H', 'OI', 'volume24H']
    )
  }

  const fmtVal = (v, pct) => pct ? fmtChange(v) : fmtUsd(v)
  const h1Label = cfg.pct ? '1H%' : '1H Liq'
  const h24Label = cfg.pct ? '24H%' : '24H Liq'

  console.log(chalk.bold(`\n  ${cfg.label}\n`))
  const table = makeTable(['#', 'Symbol', 'Price', h1Label, h24Label, 'OI (USD)', 'Vol 24H'], [4, 14, 14, 14, 14, 14, 14])
  rows.forEach((r, i) => {
    table.push([
      i + 1,
      r.symbol || r.baseCoin,
      r.price ? '$' + Number(r.price).toFixed(2) : '—',
      fmtVal(r[cfg.ch1], cfg.pct),
      fmtVal(r[cfg.ch24], cfg.pct),
      fmtUsd(r.openInterest),
      fmtUsd(r.turnover24h),
    ])
  })
  console.log(table.toString())
}
