import { createClient } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtNum, fmtUsd, fmtTs } from '../output.js'
import chalk from 'chalk'

export function registerIndicator(program) {
  const cmd = program
    .command('indicator')
    .description('On-chain indicators (指标数据) — VIP1')
    .option('--json', 'Output raw JSON')

  cmd
    .command('fg', { isDefault: true })
    .description('Fear & Greed index (default)')
    .action(async () => {
      await indicatorFg(cmd.opts())
    })

  cmd
    .command('ahr999')
    .description('AHR999 hodl indicator')
    .action(async () => {
      await indicatorSimple('/api/indicator/getAhr999', 'AHR999', cmd.opts())
    })

  cmd
    .command('altseason')
    .description('Altcoin season index')
    .action(async () => {
      await indicatorSimple('/api/indicator/getAltcoinSeason', 'Altcoin Season Index', cmd.opts())
    })

  cmd
    .command('pi')
    .description('Pi Cycle Top indicator')
    .action(async () => {
      await indicatorSimple('/api/indicator/getBtcPi', 'Pi Cycle Top', cmd.opts())
    })

  cmd
    .command('mvrv')
    .description('MVRV Z-Score')
    .action(async () => {
      await indicatorSimple('/api/indicator/getBtcMultiplier', 'MVRV Z-Score', cmd.opts())
    })

  cmd
    .command('puell')
    .description('Puell Multiple')
    .action(async () => {
      await indicatorSimple('/api/indicator/getPuellMultiple', 'Puell Multiple', cmd.opts())
    })

  cmd.action(async (opts) => {
    await indicatorFg(opts)
  })
}

async function indicatorFg(opts) {
  const client = createClient()
  const data = await client.get('/api/indicator/getCnnEntity')

  if (opts.json) return outputJson(data)

  // data = { timeList, cnnValueList, priceList } or similar
  const vals = data?.cnnValueList || data?.valueList || []
  const times = data?.timeList || []
  const prices = data?.priceList || []
  const latest = vals[vals.length - 1]
  const latestTime = times[times.length - 1]
  const latestPrice = prices[prices.length - 1]

  let label, color
  if (latest >= 75) { label = 'Extreme Greed'; color = chalk.red }
  else if (latest >= 55) { label = 'Greed'; color = chalk.yellow }
  else if (latest >= 45) { label = 'Neutral'; color = chalk.white }
  else if (latest >= 25) { label = 'Fear'; color = chalk.cyan }
  else { label = 'Extreme Fear'; color = chalk.blue }

  console.log(chalk.bold('\n  Fear & Greed Index\n'))
  console.log('  Value:   ' + color(chalk.bold(fmtNum(latest, 0))) + ' — ' + color(label))
  if (latestPrice) console.log('  BTC:     $' + Number(latestPrice).toLocaleString())
  if (latestTime) console.log('  Updated: ' + fmtTs(latestTime))
  console.log()

  // Show last 7 days
  const table = makeTable(['Date', 'F&G Value', 'Signal', 'BTC Price'], [14, 12, 18, 14])
  const recent = Math.min(7, vals.length)
  for (let i = vals.length - recent; i < vals.length; i++) {
    const v = vals[i]
    let sig, c
    if (v >= 75) { sig = 'Extreme Greed'; c = chalk.red }
    else if (v >= 55) { sig = 'Greed'; c = chalk.yellow }
    else if (v >= 45) { sig = 'Neutral'; c = chalk.white }
    else if (v >= 25) { sig = 'Fear'; c = chalk.cyan }
    else { sig = 'Extreme Fear'; c = chalk.blue }
    table.push([fmtTs(times[i]), c(fmtNum(v, 0)), c(sig), prices[i] ? '$' + Number(prices[i]).toLocaleString() : '—'])
  }
  console.log(table.toString())
}

async function indicatorSimple(endpoint, label, opts) {
  const client = createClient()
  const data = await client.get(endpoint)
  if (opts.json) return outputJson(data)

  console.log(chalk.bold(`\n  ${label}\n`))
  console.log(JSON.stringify(data, null, 2))
}
