import { createClient, nowMs } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtUsd } from '../output.js'
import chalk from 'chalk'

export function registerKline(program) {
  program
    .command('kline <symbol>')
    .description('K-line OHLCV data (K线) e.g. kline BTCUSDT')
    .option('-e, --exchange <exchange>', 'Exchange: Binance, OKX, Bybit, Huobi, Bitmex, Bitget, Gate', 'Binance')
    .option('-i, --interval <interval>', 'Interval: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w', '1h')
    .option('-p, --product <type>', 'Product type: SWAP or SPOT', 'SWAP')
    .option('-n, --size <n>', 'Number of candles (max 500)', '20')
    .option('--json', 'Output raw JSON')
    .option('--csv', 'Output CSV')
    .action(async (symbol, opts) => {
      const client = createClient()
      const data = await client.get('/api/kline/lists', {
        params: {
          symbol,
          exchange: opts.exchange,
          interval: opts.interval,
          productType: opts.product,
          endTime: nowMs(),
          size: opts.size,
        },
      })
      if (opts.json) return outputJson(data)
      // [startTime, endTime, open, close, high, low, volume, turnover, tradeCount, volumeCoin]
      const rows = Array.isArray(data) ? data : []
      if (opts.csv) {
        return outputCsv(
          rows.map((r) => [r[0], r[2], r[5], r[4], r[3], r[6], r[7]]),
          ['startTime', 'open', 'low', 'high', 'close', 'volume', 'turnover']
        )
      }
      console.log(chalk.bold(`\n  ${symbol} Klines (${opts.exchange}, ${opts.interval}, ${opts.product})\n`))
      const table = makeTable(['Time', 'Open', 'High', 'Low', 'Close', 'Volume', 'Turnover'], [22, 12, 12, 12, 12, 14, 14])
      for (const r of rows) {
        const [startTime, , open, close, high, low, , turnover] = r
        const closeStr = Number(close) >= Number(open) ? chalk.green(Number(close).toFixed(2)) : chalk.red(Number(close).toFixed(2))
        table.push([new Date(Number(startTime)).toLocaleString(), Number(open).toFixed(2), Number(high).toFixed(2), Number(low).toFixed(2), closeStr, fmtUsd(r[6]), fmtUsd(turnover)])
      }
      console.log(table.toString())
    })
}
