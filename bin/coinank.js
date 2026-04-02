#!/usr/bin/env node
import { Command } from 'commander'
import { registerConfig } from '../src/commands/config.js'
import { registerFr } from '../src/commands/fr.js'
import { registerOi } from '../src/commands/oi.js'
import { registerLiq } from '../src/commands/liq.js'
import { registerLs } from '../src/commands/ls.js'
import { registerKline } from '../src/commands/kline.js'
import { registerRank } from '../src/commands/rank.js'
import { registerRsi } from '../src/commands/rsi.js'
import { registerHyper } from '../src/commands/hyper.js'
import { registerEtf } from '../src/commands/etf.js'
import { registerIndicator } from '../src/commands/indicator.js'
import { registerFund } from '../src/commands/fund.js'
import { registerOrder } from '../src/commands/order.js'
import { registerNews } from '../src/commands/news.js'
import { registerCoins } from '../src/commands/coins.js'

const program = new Command()

program
  .name('coinank')
  .description('CoinAnk OpenAPI CLI — cryptocurrency derivatives data')
  .version('0.1.0')
  .addHelpText('after', `
Environment:
  COINANK_API_KEY    Your CoinAnk API key (alternative to 'coinank config set apikey')

Examples:
  coinank config set apikey <your_key>
  coinank fr                       # Current funding rates (BTC)
  coinank fr -c ETH                # ETH funding rates
  coinank fr hist -c BTC -n 10     # BTC historical funding rates
  coinank oi                       # BTC open interest by exchange
  coinank liq                      # BTC liquidation stats
  coinank ls                       # BTC long/short ratio
  coinank rsi                      # RSI screener (1D)
  coinank rank oi                  # OI change ranking
  coinank kline BTC/USDT           # BTC klines (1h)
  coinank indicator fg             # Fear & Greed index
  coinank etf btc                  # BTC ETF holdings
  coinank hyper positions          # HyperLiquid whale positions
  coinank news                     # Latest news
  coinank fr --json                # Raw JSON output
  coinank kline BTC/USDT --csv     # CSV export
`)

registerConfig(program)
registerFr(program)
registerOi(program)
registerLiq(program)
registerLs(program)
registerKline(program)
registerRank(program)
registerRsi(program)
registerHyper(program)
registerEtf(program)
registerIndicator(program)
registerFund(program)
registerOrder(program)
registerNews(program)
registerCoins(program)

program.parse()
