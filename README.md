# coinank-cli

CoinAnk OpenAPI CLI — cryptocurrency derivatives data in your terminal.

## Requirements

- Node.js ≥ 18
- [CoinAnk API key](https://coinank.com) (VIP1+ for most features)

## Installation

```bash
npm install -g coinank-cli
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

### `fr` — Funding Rate

```bash
coinank fr                          # BTC historical funding rates (default)
coinank fr -c ETH                   # ETH historical rates
coinank fr -c BTC --type COIN       # COIN-margined contracts
coinank fr current                  # Current rates snapshot
coinank fr current --period week    # Weekly accumulated rates
coinank fr accumulated --period day # Accumulated rates table by exchange
coinank fr heatmap                  # Funding rate heatmap (raw JSON)
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
```

Options: `-c/--coin`, `-i/--interval` (5m/15m/30m/1h/2h/4h/1d, default: 1h), `-n/--size`

---

### `liq` — Liquidation

```bash
coinank liq                         # BTC liquidation stats by interval (default)
coinank liq -c ETH                  # ETH liquidations
coinank liq orders                  # Recent liquidation orders (VIP3)
coinank liq orders -c BTC -n 50     # More orders
coinank liq hist                    # Historical aggregated data
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

Options: `-e/--exchange` (Binance/OKX/Bybit/Huobi/Bitmex/Bitget/Gate), `-i/--interval` (1m/3m/5m/15m/30m/1h/2h/4h/6h/8h/12h/1d/3d/1w), `-p/--product` (SWAP|SPOT), `-n/--size` (max 500)

---

### `rsi` — RSI Screener

```bash
coinank rsi                         # RSI screener, 1H interval (default)
coinank rsi -i 4H                   # 4H interval
coinank rsi -i 24H -n 50            # Daily, show top 50
coinank rsi -e OKX                  # OKX exchange
```

Color coding: **red** ≥ 70 (overbought), **green** ≤ 30 (oversold)

Options: `-i/--interval` (1H/4H/8H/24H, default: 1H), `-e/--exchange` (default: Binance), `-n/--limit` (default: 30)

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
coinank rank price --asc            # Sort ascending
coinank rank oi -n 50 -p 2          # Page 2, 50 results
```

Options: `-n/--size` (default: 20), `-p/--page` (default: 1), `--asc`

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
coinank hyper actions -n 50         # More results
```

Options: `-c/--coin`, `-n/--size`, `-p/--page`, `--side` (Long|Short)

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
```

Options: `-t/--type` (1=flash/2=news), `-l/--lang` (zh|en), `-n/--size`, `-p/--page`, `--popular`, `--search`

VIP2+

---

### `config` — Configuration

```bash
coinank config set apikey <key>     # Store API key
coinank config get apikey           # Show stored key
coinank config list                 # Show all config
coinank config delete apikey        # Delete a key
```

Config stored at `~/.config/coinank-cli/config.json`

---

## Global Output Options

All commands support:

```bash
--json    # Raw JSON output (for scripting / piping)
--csv     # CSV output (for spreadsheets)
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
