// Tags each price's element with data-ob="<converted odds>"; odds.css draws it via ::after.
// No nodes are inserted, so React stays happy and our writes never re-trigger the observer.
(() => {
  const OB = globalThis.Oddsboom;
  const site = OB.siteFor(location.hostname);
  if (!site) return;
  document.documentElement.dataset.obSite = site.id;

  const ATTR = "data-ob";
  const STACK = "data-ob-stack";
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION", "TITLE"]);
  // Labels that make a lone percentage something other than a price.
  const CONTEXT_RE = /\b(apy|interest|return|change|fees?|rewards?|vol|volume|24h)\b|in 24 hours/i;
  // Cheap pre-filter before touching the element.
  const MAYBE = site.american ? /[%¢]|^\s*[+\-−]\d{3}/ : /[%¢]/;

  let settings = OB.DEFAULTS;
  let observer = null;

  function evaluate(el) {
    if (!el || SKIP_TAGS.has(el.tagName)) return;
    const parsed = OB.parse(el.textContent, site.american);
    let text = "";
    if (parsed && !inExcludedContext(el)) text = OB.label(parsed, settings, site);
    if (text) {
      const prev = el.getAttribute(ATTR);
      if (prev === text) return;
      el.setAttribute(ATTR, text);
      if (prev === null) queueFitCheck(el);
    } else if (el.hasAttribute(ATTR)) {
      el.removeAttribute(ATTR);
    }
  }

  // Badges that overflow a fixed-width cell go under the price instead. One batched layout read.
  let fitQueue = [];
  function queueFitCheck(el) {
    if (fitQueue.push(el) === 1) setTimeout(checkFit, 50);
  }
  function checkFit() {
    const overflowing = fitQueue.filter((el) => el.isConnected && overflowsCell(el));
    fitQueue = [];
    for (const el of overflowing) el.setAttribute(STACK, "");
  }
  function overflowsCell(el) {
    for (let i = 0; i < 4 && el; i++, el = el.parentElement) {
      if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) {
        return !/auto|scroll/.test(getComputedStyle(el).overflowX);
      }
    }
    return false;
  }

  function inExcludedContext(el) {
    const parent = el.parentElement;
    if (!parent) return false;
    const ctx = parent.childElementCount < 8 ? parent.textContent : "";
    return ctx.length < 120 && CONTEXT_RE.test(ctx);
  }

  function onText(node) {
    const v = node.nodeValue;
    const el = node.parentElement;
    if ((v.length <= 20 && MAYBE.test(v)) || el?.hasAttribute(ATTR)) evaluate(el);
  }

  function scan(root) {
    if (root.nodeType === Node.TEXT_NODE) return onText(root);
    if (root.nodeType !== Node.ELEMENT_NODE || SKIP_TAGS.has(root.tagName)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) onText(n);
  }

  function onMutations(mutations) {
    for (const m of mutations) {
      if (m.type === "characterData") {
        onText(m.target);
        continue;
      }
      for (const n of m.addedNodes) scan(n);
      // A price element whose text node was swapped out or removed.
      if (m.removedNodes.length && m.target.hasAttribute?.(ATTR)) evaluate(m.target);
    }
  }

  function clear() {
    for (const el of document.querySelectorAll(`[${ATTR}]`)) el.removeAttribute(ATTR);
    for (const el of document.querySelectorAll(`[${STACK}]`)) el.removeAttribute(STACK);
  }

  function apply(next) {
    settings = next;
    const on = settings.enabled && settings.sites[site.id] !== false;
    observer?.disconnect();
    observer = null;
    clear();
    if (!on) return;
    scan(document.body);
    observer = new MutationObserver(onMutations);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  const load = () => chrome.storage.sync.get(null, (stored) => apply(OB.withDefaults(stored)));
  load();
  chrome.storage.onChanged.addListener((_, area) => {
    if (area === "sync") load();
  });
})();
