// Pure odds logic shared by the content script, popup and tests.
(function (root) {
  // Taker fee per $1 contract is coef * p * (1 - p); ProphetX takes 2% of winnings.
  const takerFee = (coef) => (p) => p + coef * p * (1 - p);

  const SITES = [
    { id: "kalshi", label: "Kalshi", host: /(^|\.)kalshi\.com$/, fee: takerFee(0.07), feeNote: "7% × p(1−p) taker fee" },
    { id: "polymarketus", label: "Polymarket US", host: /(^|\.)polymarket\.us$/, fee: takerFee(0.0695), feeNote: "6.95% × p(1−p) taker fee" },
    { id: "prophetx", label: "ProphetX", host: /(^|\.)prophetx\.co$/, fee: (p) => 1 / (1 + 0.98 * (1 / p - 1)), feeNote: "2% of winnings", american: true },
    { id: "novig", label: "Novig", host: /(^|\.)novig\.com$/, fee: null, feeNote: "free pregame; live fees not included", american: true },
    { id: "polymarket", label: "Polymarket", host: /(^|\.)polymarket\.com$/, fee: null, feeNote: "vary by market, not included" },
  ];

  const DEFAULTS = {
    enabled: true,
    american: true,
    decimal: false,
    implied: false,
    fees: true,
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
  function label(parsed, settings, site) {
    const feeFn = settings.fees && site && site.fee;
    const p = feeFn ? feeFn(parsed.p) : parsed.p;
    const changed = p !== parsed.p;
    const out = [];
    if (settings.american && (changed || parsed.src !== "american")) out.push(toAmerican(p));
    if (settings.decimal) out.push(toDecimal(p));
    if (settings.implied && (changed || parsed.src === "american")) out.push(toImplied(p));
    return out.join(" · ");
  }

  const api = { SITES, DEFAULTS, withDefaults, siteFor, parse, label, toAmerican, toDecimal, toImplied };
  if (typeof module !== "undefined") module.exports = api;
  root.Oddsboom = api;
})(globalThis);
