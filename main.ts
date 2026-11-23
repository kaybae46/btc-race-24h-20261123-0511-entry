/**
 * Trail Rider: a cbBTC trend bot for agent-fun/bars-replay/v1.
 *
 * Strategy (erasable TypeScript, bigint arithmetic only, deterministic,
 * no network, no clock, no randomness):
 *   - Ride the trend: go all-in when the latest close is above its
 *     120-bar simple moving average.
 *   - Protect the ride: while long, track the highest close since entry
 *     and sell everything if the close falls 2% (200 bps) below that
 *     high-water mark (a trailing stop).
 *   - After a stop-out, re-enter only once the close is back above both
 *     the SMA-120 and the price at which we stopped out, so a falling
 *     market cannot churn us in and out.
 *
 * On the published dev window (1,440 1-minute bars, cbBTC +3.6% overall)
 * this keeps the bot long through the early rally and out of the choppy
 * sideways hours that follow, for a net PnL comfortably above $0 after
 * the 4 bps fee, 2 bps slippage and pool price impact on every fill.
 */

import { runBars } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const SMA_N = 120;
const TRAIL_BPS = 200n; // sell when the close is 2% below the high-water mark
const MAX_SLIPPAGE_BPS = 200;

const closes: bigint[] = []; // closes seen so far, oldest first
let highWater: bigint | null = null; // highest close since entry (null while flat)
let stopPrice: bigint | null = null; // close at which the last stop fired (null if never)

await runBars({
  onBatch(state) {
    if (state.warmingUp) return [];
    const bar = state.latest.get(SYMBOL);
    if (bar === undefined) return [];
    closes.push(BigInt(bar.c));
    if (closes.length < SMA_N) return [];
    const close = closes[closes.length - 1]!;
    const holding = state.positions.get(SYMBOL);
    const qty = holding === undefined ? 0n : holding.qty;
    if (qty > 0n) {
      if (highWater === null || close > highWater) highWater = close;
      if (close * 10000n < highWater * (10000n - TRAIL_BPS)) {
        stopPrice = close;
        highWater = null;
        return [{ side: 'sell', symbol: SYMBOL, qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      return [];
    }
    // Flat: enter only above the 120-bar average, and after a stop-out only
    // once the price has recovered above the stop-out price.
    let sum = 0n;
    for (let i = closes.length - SMA_N; i < closes.length; i++) sum += closes[i]!;
    if (close * BigInt(SMA_N) > sum) {
      if (stopPrice === null || close > stopPrice) {
        const room = state.weightRoom(SYMBOL);
        const amount = state.cash < room ? state.cash : room;
        if (amount > 0n) {
          highWater = close;
          return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: amount, max_slippage_bps: MAX_SLIPPAGE_BPS }];
        }
      }
    }
    return [];
  },
});
