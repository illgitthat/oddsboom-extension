const OB = globalThis.Oddsboom;
const $ = (sel) => document.querySelector(sel);
let settings = OB.DEFAULTS;

function save() {
  chrome.storage.sync.set(settings);
  render();
}

function render() {
  $("#enabled").checked = settings.enabled;
  $("#main").classList.toggle("off", !settings.enabled);
  $("#fees").checked = settings.fees;
  for (const input of document.querySelectorAll("[data-format]")) input.checked = settings[input.dataset.format];
  for (const input of document.querySelectorAll("[data-site]")) input.checked = settings.sites[input.dataset.site] !== false;

  const kalshi = OB.SITES[0];
  const odds = OB.label({ p: 0.6, src: "cents" }, settings, kalshi);
  $("#example").textContent = odds ? `60¢ on Kalshi → ${odds}` : "Pick a format to show odds.";
}

function buildSites() {
  const root = $("#sites");
  for (const site of OB.SITES) {
    const row = document.createElement("label");
    row.className = "row";
    row.innerHTML = `<span><b></b><small></small></span><span class="switch"><input type="checkbox" data-site="${site.id}" /><span></span></span>`;
    row.querySelector("b").textContent = site.label;
    row.querySelector("small").textContent = `Fees: ${site.feeNote}`;
    root.append(row);
  }
}

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.id === "enabled" || t.id === "fees") settings[t.id] = t.checked;
  else if (t.dataset.format) settings[t.dataset.format] = t.checked;
  else if (t.dataset.site) settings.sites = { ...settings.sites, [t.dataset.site]: t.checked };
  else return;
  save();
});

buildSites();
chrome.storage.sync.get(null, (stored) => {
  settings = OB.withDefaults(stored);
  render();
});
