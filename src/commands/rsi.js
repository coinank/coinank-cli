import { createClient, nowMs } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtNum, fmtTs } from '../output.js'
import chalk from 'chalk'

export function registerRsi(program) {
  program
    .command('rsi')
    .description('RSI coin screener (RSI选币器) — VIP2')
    .option('-i, --interval <interval>', 'Interval: 1H, 4H, 8H, 24H', '1H')
    .option('-e, --exchange <exchange>', 'Exchange', 'Binance')
    .option('-n, --limit <n>', 'Show top N results', '30')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')
    .action(async (opts) => {
      const client = createClient()
      const data = await client.get('/api/rsiMap/list', {
        params: { interval: opts.interval, exchange: opts.exchange },
      })
      if (opts.json) return outputJson(data)
      // rsiMap: [[symbol, rsi, prevRsi, prevClose, close, ...], ...]
      const rsiMap = data?.rsiMap || []
      const pairs = rsiMap.map((r) => ({ symbol: r[0], rsi: r[1], close: r[4] }))
      pairs.sort((a, b) => b.rsi - a.rsi)
      const limit = Number(opts.limit)
      if (opts.csv) return outputCsv(pairs.map((r) => [r.symbol, r.rsi, r.close]), ['symbol', 'rsi', 'price'])

      console.log(chalk.bold(`\n  RSI Screener (${opts.exchange}, ${opts.interval}) — Top ${limit}\n`))
      const table = makeTable(['#', 'Symbol', 'Price', 'RSI', 'Signal'], [4, 16, 12, 10, 14])
      pairs.slice(0, limit).forEach((r, i) => {
        let signal, rsiStr
        if (r.rsi >= 70) { signal = chalk.red('Overbought'); rsiStr = chalk.red(fmtNum(r.rsi, 1)) }
        else if (r.rsi <= 30) { signal = chalk.green('Oversold'); rsiStr = chalk.green(fmtNum(r.rsi, 1)) }
        else { signal = chalk.grey('Neutral'); rsiStr = fmtNum(r.rsi, 1) }
        table.push([i + 1, r.symbol, r.close ? '$' + Number(r.close).toFixed(2) : '—', rsiStr, signal])
      })
      console.log(table.toString())
    })
}
