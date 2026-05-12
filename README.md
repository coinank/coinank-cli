# coinank-cli

CoinAnk OpenAPI CLI — cryptocurrency derivatives data in your terminal.

## Requirements

- Node.js ≥ 18
- [CoinAnk API key](https://coinank.com) (VIP1+ for most features)

## Installation

```bash
npm install -g @coinank/coinank-cli
# or run locally
node bin/coinank.js
```

## Authentication

```bash
# Option 1: store key persistently
coinank config set apikey <your_key>

# Option 2: environment variable
export COINANK_API_KEY=<your_key>
```

---

## Commands

The CLI maps the current skill OpenAPI schemas one-to-one: 18 categories and 78 `references/*.openapi.json` paths.

### `fr` — Funding Rate

```bash
coinank fr                          # BTC historical funding rates (default)
coinank fr -c ETH                   # ETH historical rates
coinank fr -c BTC --type COIN       # COIN-margined contracts
coinank fr current                  # Current rates snapshot
coinank fr current --period week    # Weekly accumulated rates
coinank fr accumulated --period day # Accumulated rates table by exchange
coinank fr heatmap                  # Funding rate heatmap (raw JSON)
coinank fr indicator -s BTCUSDT     # Symbol funding-rate indicator history
coinank fr kline -s BTCUSDT         # Symbol funding-rate K-line
coinank fr weighted -c BTC          # Weighted funding rate
```

Options: `-c/--coin` (default: BTC), `-t/--type` (USDT|COIN, default: USDT), `-n/--size`

---

### `oi` — Open Interest

```bash
coinank oi                          # BTC OI by exchange (default)
coinank oi -c ETH                   # ETH OI
coinank oi chart                    # OI history data
coinank oi symbol BTCUSDT           # OI for specific symbol
coinank oi symbol BTCUSDT -e OKX    # OI for symbol on OKX
coinank oi kline BTCUSDT            # OI K-line
coinank oi agg-kline -c BTC         # Aggregated OI K-line
coinank oi top -c BTC               # Real-time OI by exchange
coinank oi vs-mc -c BTC             # Historical OI/market-cap ratio
```

Options: `-c/--coin`, `-i/--interval` (1m/3m/5m/15m/30m/1h/2h/4h/6h/8h/12h/1d, default: 1h), `-n/--size`

---

### `liq` — Liquidation

```bash
coinank liq                         # BTC liquidation stats by interval (default)
coinank liq -c ETH                  # ETH liquidations
coinank liq orders                  # Recent liquidation orders (VIP3)
coinank liq orders -c BTC -e Binance --side long -a 1000000
coinank liq hist                    # Historical aggregated data
coinank liq symbol BTCUSDT          # Symbol liquidation history
coinank liq map BTCUSDT             # Liquidation map (VIP4)
coinank liq agg-map -c BTC          # Aggregated liquidation map (VIP4)
coinank liq heatmap BTCUSDT         # Liquidation heatmap (VIP4)
coinank liq heatmap-symbols         # Supported heatmap symbols
```

Options: `-c/--coin`, `-i/--interval`, `-n/--size`

---

### `ls` — Long/Short Ratio

```bash
coinank ls                          # BTC real-time L/S across exchanges (default)
coinank ls -c ETH                   # ETH ratio
coinank ls buysell                  # Taker buy/sell volume (VIP3)
coinank ls position                 # Top trader position ratio
coinank ls account                  # Top trader account ratio
coinank ls person                   # Long/short person ratio
coinank ls kline --type longShortPerson
```

Options: `-c/--coin` (default: BTC), `-e/--exchange` (default: Binance), `-s/--symbol` (default: BTCUSDT), `-i/--interval` (default: 1h), `-n/--size`

---

### `kline` — K-lines

```bash
coinank kline BTCUSDT               # BTC 1h klines on Binance (default)
coinank kline ETHUSDT -i 4h -n 50   # ETH 4h, 50 candles
coinank kline BTCUSDT -e OKX        # On OKX
coinank kline BTCUSDT -p SPOT       # Spot market
```

Options: `-e/--exchange` (Binance/OKX/Bybit/Huobi/Bitmex/Bitget/Gate), `-i/--interval` (1m/3m/5m/15m/30m/1h/2h/4h/6h/8h/12h/1d), `-p/--product` (SWAP|SPOT), `-n/--size` (max 500)

---

### `rsi` — RSI Screener

```bash
coinank rsi                         # RSI screener, 1H interval (default)
coinank rsi -i 4H                   # 4H interval
coinank rsi -i 1D -n 50             # Daily, show top 50
coinank rsi -e OKX                  # OKX exchange
```

Color coding: **red** ≥ 70 (overbought), **green** ≤ 30 (oversold)

Options: `-i/--interval` (1H/4H/1D, default: 1H), `-e/--exchange` (default: Binance), `-n/--limit` (default: 30)

VIP2+

---

### `rank` — Hot Rankings

```bash
coinank rank                        # OI change ranking (default)
coinank rank oi                     # OI change ranking
coinank rank liq                    # Liquidation ranking
coinank rank price                  # Price change ranking
coinank rank volume                 # Volume ranking
coinank rank ls                     # Long/short ratio ranking
coinank rank oi-mc                  # OI / market-cap ranking
coinank rank trades                 # Trade-count ranking
coinank rank screener -i 1h         # Visual screener
coinank rank price --asc            # Sort ascending
coinank rank oi -n 50 -p 2          # Page 2, 50 results
```

Options: `-n/--size` (default: 20), `-p/--page` (default: 1), `--asc`, `--sort-by`, `--product`, `-i/--interval`

VIP2+

---

### `fund` — Fund Flow

```bash
coinank fund                        # Real-time fund flow, sorted by 1H (default)
coinank fund -c BTC                 # Filter by coin
coinank fund -p SPOT                # Spot market
coinank fund hist BTC               # BTC historical fund flow
coinank fund hist ETH -i 4h         # ETH, 4h interval
```

Options: `-c/--coin`, `-p/--product` (SWAP|SPOT), `-n/--size`, `--page`

VIP3+

---

### `hyper` — HyperLiquid Whales

```bash
coinank hyper                       # Top whale positions (default)
coinank hyper positions             # Top whale positions
coinank hyper positions -c BTC      # BTC positions only
coinank hyper positions --side Long # Long positions only
coinank hyper actions               # Recent whale actions
coinank hyper positions --search <address>
```

Options: `-c/--coin`, `-n/--size`, `-p/--page`, `--side` (Long|Short), `--search`, `--un-pnl`, `--fund`

VIP2+

---

### `order` — Large Orders

```bash
coinank order                       # Large market orders for BTCUSDT (default)
coinank order -s ETHUSDT            # ETH large orders
coinank order -a 5000000            # Min $5M orders
coinank order book                  # Large limit orders (order book)
coinank order book --side bid       # Bid side only
coinank order book --history        # Historical large orders
```

Options: `-s/--symbol` (default: BTCUSDT), `-p/--product`, `-a/--amount` (min USD, default: 1000000), `-n/--size`

VIP3+

---

### `coins` — Coin & Market Data

```bash
coinank coins                       # List all base coins (default)
coinank coins -p SPOT               # Spot market coins
coinank coins price BTCUSDT         # BTC price + stats
coinank coins price ETHUSDT -e OKX  # ETH on OKX
coinank coins symbols               # All Binance symbols
coinank coins symbols -e Bybit      # Bybit symbols
coinank coins cap BTC               # BTC market cap data
```

VIP1+

---

### `etf` — ETF Data

```bash
coinank etf                         # US BTC ETF holdings (default)
coinank etf btc                     # US BTC ETF holdings
coinank etf eth                     # US ETH ETF holdings
coinank etf inflow btc              # BTC ETF daily net inflow
coinank etf inflow eth              # ETH ETF daily net inflow
coinank etf hk                      # HK ETF inflow data
```

VIP1+

---

### `indicator` — On-chain Indicators

```bash
coinank indicator                   # Fear & Greed index (default)
coinank indicator fg                # Fear & Greed index
coinank indicator ahr999            # AHR999 hodl indicator
coinank indicator altseason         # Altcoin season index
coinank indicator pi                # Pi Cycle Top
coinank indicator mvrv              # MVRV Z-Score
coinank indicator puell             # Puell Multiple
coinank indicator market-cap-rank BTC
coinank indicator moving-avg-heatmap
coinank indicator grayscale BTC
coinank indicator chart <type>
```

VIP1+

---

### `news` — News & Flash Alerts

```bash
coinank news                        # Latest flash alerts in Chinese (default)
coinank news -l en                  # English news
coinank news -t 2                   # News articles (not flash)
coinank news --popular              # Popular only
coinank news --search "bitcoin ETF" # Search
coinank news -n 20                  # More items
coinank news detail <id>            # News detail
```

Options: `-t/--type` (1=flash/2=news), `-l/--lang` (zh|en), `-n/--size`, `-p/--page`, `--popular`, `--search`

VIP2+

---

### `market-order` — Market Order Statistics

```bash
coinank market-order cvd
coinank market-order buy-sell-count
coinank market-order buy-sell-value
coinank market-order buy-sell-volume
coinank market-order agg-cvd -c BTC --exchanges ""
coinank market-order agg-buy-sell-count -c BTC --exchanges Binance,OKX
coinank market-order agg-buy-sell-value -c BTC
coinank market-order agg-buy-sell-volume -c BTC
```

Options: `-e/--exchange`, `-s/--symbol`, `-c/--coin`, `-i/--interval`, `-p/--product`, `-n/--size`, `--exchanges`

VIP3+

---

### `orderbook` — Order Book

```bash
coinank orderbook symbol            # Depth difference by symbol
coinank orderbook exchange          # Aggregated depth by exchanges
coinank orderbook heatmap           # Liquidity heatmap (VIP4)
```

Options: `-s/--symbol`, `-c/--coin`, `-e/--exchange`, `--exchanges`, `-r/--rate`, `-p/--product`, `-i/--interval`, `-n/--size`

VIP3+/VIP4+

---

### `orderflow` — Order Flow

```bash
coinank orderflow
coinank orderflow -e OKX -s BTCUSDT -i 5m --tick-count 5
```

Options: `-e/--exchange`, `-s/--symbol`, `-i/--interval`, `-p/--product`, `-n/--size`, `--tick-count`

VIP3+

---

### `net` — Net Long / Short

```bash
coinank net
coinank net -e OKX -s BTCUSDT -i 1h -n 100
```

Options: `-e/--exchange`, `-s/--symbol`, `-i/--interval`, `-n/--size`

VIP3+

---

### `config` — Configuration

```bash
coinank config set apikey <key>     # Store API key
coinank config get apikey           # Show stored key
coinank config list                 # Show all config
coinank config delete apikey        # Delete a key
```

Use `coinank config path` to show the platform-specific config file location.

---

## Output Options

Most commands support:

```bash
--json    # Raw JSON output (for scripting / piping)
--csv     # CSV output where a table export is implemented
```

Examples:

```bash
coinank fr --json | jq '.[:5]'
coinank kline BTCUSDT --csv > btc_1h.csv
coinank rank oi --json | jq 'map({symbol, openInterestCh24})'
```

---

## VIP Levels

| Level | Features |
|-------|----------|
| VIP1  | Coins, ETF, Indicators |
| VIP2  | Rank, RSI, HyperLiquid, News |
| VIP3  | Fund Flow, Large Orders, Liq Orders |
| VIP4  | All features |

Apply for an API key at [coinank.com](https://coinank.com).
