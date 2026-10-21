// Pure odds logic shared by the content script, popup and tests.
(function (root) {
  // Exchange fee per $1 contract is coef * p * (1 - p).
  const quad = (p, coef) => p + coef * p * (1 - p);

  // fee(p, ctx) returns the all-in price. ctx.mode is "taker" or "maker"; content.js adds
  // ctx.makerFees (Kalshi series charges makers) and ctx.live / ctx.highFee (Novig event).
  const SITES = [
    {
      id: "kalshi",
      label: "Kalshi",
      host: /(^|\.)kalshi\.com$/,
      fee: (p, x) => quad(p, x.mode === "maker" ? (x.makerFees ? 0.0175 : 0) : 0.07),
      feeNote: "taker 7%·p(1−p); maker 1.75% on some series",
    },
    {
      id: "polymarketus",
      label: "Polymarket US",
      host: /(^|\.)polymarket\.us$/,
      fee: (p, x) => quad(p, x.mode === "maker" ? 0 : 0.0695),
      feeNote: "taker 6.95%·p(1−p); maker free",
    },
    {
      id: "prophetx",
      label: "ProphetX",
      host: /(^|\.)prophetx\.co$/,
      fee: (p) => 1 / (1 + 0.98 * (1 / p - 1)),
      feeNote: "2% of winnings",
      american: true,
    },
    {
      id: "novig",
      label: "Novig",
      host: /(^|\.)novig\.com$/,
      fee: (p, x) => quad(p, x.mode === "maker" || !x.live ? 0 : x.highFee ? 0.06 : 0.03),
      feeNote: "live taker 3% (6% MLB, NHL, CFB); pregame free",
      american: true,
    },
    { id: "polymarket", label: "Polymarket", host: /(^|\.)polymarket\.com$/, fee: null, feeNote: "not included" },
  ];

  const DEFAULTS = {
    enabled: true,
    american: true,
    decimal: false,
    implied: false,
    fees: "taker", // "taker" | "maker" | "off"
    sites: Object.fromEntries(SITES.map((s) => [s.id, true])),
  };

  const withDefaults = (stored) => ({ ...DEFAULTS, ...stored, sites: { ...DEFAULTS.sites, ...stored.sites } });

  const siteFor = (hostname) => SITES.find((s) => s.host.test(hostname)) || null;

  // A price must be the whole text of its element (optionally "Yes 55¢" or "55% chance"),
  // so "3.5% APY", "(2%)" and "-5.92%" never match.
  const PRICE_RE = /^(?:(?:yes|no)\s*)?(\d{1,2}(?:\.\d+)?)\s?([%¢])(?:\s+chance)?$/i;
  const AMERICAN_RE = /^([+-])(\d{3,5})$/;

  function parse(text, allowAmerican) {
    const s = text.replace(/[   ]/g, " ").replace(/−/g, "-").trim();
    if (s.length > 20) return null;
    let m = PRICE_RE.exec(s);
    if (m) {
      const p = parseFloat(m[1]) / 100;
      return p > 0 && p < 1 ? { p, src: m[2] === "%" ? "pct" : "cents" } : null;
    }
    if (allowAmerican && (m = AMERICAN_RE.exec(s))) {
      const n = parseInt(m[2], 10);
      if (n < 100) return null;
      return { p: m[1] === "-" ? n / (n + 100) : 100 / (n + 100), src: "american" };
    }
    return null;
  }

  function toAmerican(p) {
    const a = p > 0.5 ? -Math.round((100 * p) / (1 - p)) : Math.round((100 * (1 - p)) / p);
    return a > 0 ? `+${a}` : `−${-a}`;
  }
  const toDecimal = (p) => (1 / p).toFixed(2);
  const toImplied = (p) => `${+(p * 100).toFixed(1)}%`;

  // Badge text for a parsed price, or "" when nothing differs from what the site shows.
  function label(parsed, settings, site, ctx = {}) {
    const useFee = settings.fees !== "off" && site && site.fee;
    const p = useFee ? site.fee(parsed.p, { ...ctx, mode: settings.fees }) : parsed.p;
    const changed = p !== parsed.p;
    const out = [];
    if (settings.american && (changed || parsed.src !== "american")) out.push(toAmerican(p));
    if (settings.decimal) out.push(toDecimal(p));
    if (settings.implied && (changed || parsed.src === "american")) out.push(toImplied(p));
    return out.join(" · ");
  }

  // Kalshi series ticker from a market link or path, e.g. /markets/kxnflgame/... -> KXNFLGAME.
  const kalshiSeries = (href) => (/\/markets\/([a-z0-9-]+)/i.exec(href) || [])[1]?.toUpperCase() || null;

  // Novig shows one status line per event: "LiveQ2 08:57", "Live37'", "Today8:00 PM", "Starts in 45m".
  // Chart axes ("7:05 PM") have no day word, so they don't count.
  const NOVIG_LIVE = /Live\s*(?:\d|Q\d|OT|H\d|HT|Half|Top|Bot|Mid|End|Set|Break|P\d)/g;
  const NOVIG_PRE = /(?:Today|Tomorrow|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*\s*\d{1,2}:\d{2}\s?[AP]M|Starts in/g;
  const NOVIG_HIGH_FEE = /\b(?:CFB|Pro BSB|Hockey)\b/;

  // Status of the one event in `text`: null if it has no status line, "many" if several events.
  function novigStatus(text) {
    const live = (text.match(NOVIG_LIVE) || []).length;
    const markers = live + (text.match(NOVIG_PRE) || []).length;
    if (markers === 0) return null;
    if (markers > 1) return "many";
    return { live: live === 1, highFee: NOVIG_HIGH_FEE.test(text) };
  }

  const api = { SITES, DEFAULTS, withDefaults, siteFor, parse, label, toAmerican, toDecimal, toImplied, kalshiSeries, novigStatus };
  if (typeof module !== "undefined") module.exports = api;
  root.Oddsboom = api;
})(globalThis);
