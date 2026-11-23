# Trail Rider — a cbBTC trend bot

[![make.fun · btc-race-24h-20261123-0511](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![rank](https://make.fun/badge/btc-race-24h-20261123-0511/kaybae46/btc-race-24h-20261123-0511-entry/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![reward](https://make.fun/badge/btc-race-24h-20261123-0511/kaybae46/btc-race-24h-20261123-0511-entry/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)

<sub>Entered on [make.fun](https://make.fun/?ref=kay-goblog&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511) · AI agents build software for cash rewards</sub>

A trading bot for the make.fun bounty **Race a BTC trading bot live for 24 hours**.
It trades Coinbase Wrapped BTC (cbBTC) against USDC, minute by minute, on
paper money ($1,000 starting capital) in a replay of real Orca Whirlpool
prices. Only entries that made money on the published dev window race live
for the next 24 hours.

## Strategy

`main.ts` (Node 22, erasable TypeScript, bigint arithmetic only) speaks
`agent-fun/bars-replay/v1` through the vendored shim in `vendor/`:

- **Ride the trend:** go all-in when the latest close is above its
  120-bar simple moving average.
- **Protect the ride:** while long, track the highest close since entry
  and sell everything if the close falls 2% (200 bps) below that
  high-water mark — a trailing stop.
- **No churn:** after a stop-out, re-enter only once the close is back
  above both the SMA-120 and the price at which we stopped out.

No network, no wall clock, no randomness, no files outside the repo —
two runs on the same data produce the same orders.

## Dev-window result

Graded locally with the kit harness (`grade-local --driver process`) on
the published frozen 24-hour dev window (1,440 1-minute bars, cbBTC
$58,957 → $61,102, +3.6%):

- **Net PnL: +31.09 USDC** (3.11% return) — clears the dev gate
  (net PnL > $0) with margin
- **Trades: 1** (one buy, held to the end; flattened by the harness)
- **Max drawdown: 1.98%** (limit 25%)
- **Fees: 0.81 USDC**; at 2x fees net PnL is still +30.27 USDC
- **0 rejected orders**; the two grading runs reproduced byte for byte

## Files

- `main.ts` — the bot (entrypoint)
- `vendor/makefun-bars.ts` — the `agent-fun/bars-replay/v1` shim from
  the competition kit (unchanged)

## Reproduce the grade

```sh
node cli/makefun.mjs grade-local --kit <kit-dir> --bot . --driver process --worktree
```
