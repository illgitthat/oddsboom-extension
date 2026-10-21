# Oddsboom

A Chrome extension for people who bet on prediction markets and sportsbooks.

- **Odds everywhere.** Shows American (or decimal, or implied %) odds next to every price on
  Kalshi, Polymarket US, ProphetX, Novig and Polymarket. Prices update live with the page.
- **Fees included.** Pick taker, maker or no fees and the odds are what you actually get:
  - Kalshi: taker 7% × p(1−p); maker 1.75% × p(1−p) only on series that charge makers
    (looked up from Kalshi's API once a day per series).
  - Polymarket US: taker 6.95% × p(1−p); makers free.
  - ProphetX: 2% of winnings, taker or maker.
  - Novig: free pregame and for makers; live takers pay 3% × p(1−p), 6% for MLB, NHL and CFB.
    Whether a game is live comes from the event's status line on the page.
- **Sportsbook limits.** Shows your max stake on DraftKings, Caesars and Betway, and on Caesars
  adjusts the betslip to it (never submits).

Click the toolbar icon to pick formats and fees, or turn sites on and off.

Only standalone prices get odds (`55%`, `62¢`, `Yes 41¢`). Text like `3.5% APY`, `(2%)`,
`-5.92%` or `$0.21` is left alone.

## Install

1. [Download oddsboom.zip](https://github.com/illgitthat/oddsboom-extension/releases/download/latest/oddsboom.zip) and unzip it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the unzipped folder (the one with `manifest.json`).

## Develop

```sh
node --test   # parsing and odds math
```

`odds/core.js` holds the parsing, conversions and fee models. `odds/content.js` tags each price's
element with `data-ob`, and `odds/odds.css` draws the badge with `::after`, so no nodes are
added to the page. `limits/` runs in the page to read the sportsbooks' bet responses.

## Examples (sportsbook limits)

https://github.com/illgitthat/oddsboom-extension/assets/2256474/6b718b39-1b65-461f-833d-c7f2353bada6

https://github.com/illgitthat/oddsboom-extension/assets/2256474/65f42bb6-ab9a-460a-b531-377a5ce8dac4
