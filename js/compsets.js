/**
 * Section 4: 4BR+ comp sets (Lake Norman). Reads COMPSETS (generated:
 * js/compsets_data.js) and prose/config from data.js (COMPSET_TEXT,
 * PREMIUM_ROWS, STRONG_TEXT). Renders: core-set cards, a distribution strip
 * chart, the filterable explorer table with listing links, the premium
 * table, the strongest comps and the flag summary.
 */
const CS_METRICS = {
  rev_pot: { label: "Revenue Potential (full-year estimate)", short: "Revenue Potential", fmt: (v) => fmtK(v) },
  revenue: { label: "Trailing-12-month revenue (estimate)", short: "12-month revenue", fmt: (v) => fmtK(v) },
  revpan: { label: "Revenue per available night", short: "RevPAN", fmt: (v) => fmtCurrency(v) },
  adr: { label: "Average daily rate on booked nights", short: "ADR", fmt: (v) => fmtCurrency(v) },
  occ: { label: "Occupancy of available nights", short: "Occupancy", fmt: (v) => (v == null ? "—" : Math.round(v * 100) + "%") },
};
const CS_STATE = { tiers: "A", sets: [], size: "", dock: "", lake: "", heat: "", tub: "", area: "", sleeps: 0, metric: "rev_pot", sort: "rev_pot", dir: -1 };

function csSetColor(name) {
  const s = COMPSETS.sets.find((x) => x.name === name);
  return s ? s.color : "#8b94a3";
}
function csPass(l) {
  const S = CS_STATE;
  if (S.tiers === "A" && l.tier !== "A") return false;
  if (S.tiers === "AB" && l.tier === "C") return false;
  if (S.sets.length && S.sets.indexOf(l.set) === -1) return false;
  if (S.size && l.size !== S.size) return false;
  if (S.dock && l.dockWf !== S.dock) return false;
  if (S.lake && l.lakeRel !== S.lake) return false;
  if (S.heat && l.heat !== S.heat) return false;
  if (S.tub && l.hotTub !== S.tub) return false;
  if (S.area && l.area !== S.area) return false;
  if (S.sleeps && l.sleeps < S.sleeps) return false;
  return true;
}
function csQuant(arr, q) {
  if (!arr.length) return null;
  const a = arr.slice().sort((x, y) => x - y), pos = (a.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return a[lo] + (a[hi] - a[lo]) * (pos - lo);
}
function csHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ((h >>> 0) % 1000) / 1000;
}

// --- core-set cards ---------------------------------------------------------
function renderCoreSets() {
  const host = document.getElementById("cs-cards");
  if (!host) return;
  host.innerHTML = COMPSETS.sets.map((s) => {
    const a = s.summary.A, ab = s.summary.AB, t = s.tierCounts;
    const line = (x, lab) => x.n ? "<p><strong>" + fmtK(x.rev_pot.median) + "</strong> median Revenue Potential · middle half " + fmtK(x.rev_pot.p25) + "–" + fmtK(x.rev_pot.p75) +
      "<br>" + fmtCurrency(x.revpan.median) + " per available night · ADR " + fmtCurrency(x.adr.median) + " · occupancy " + Math.round(x.occ.median * 100) + "%" +
      " <span class=\"cs-card__lab\">" + lab + ", " + x.n + " homes" + (x.n < THIN_N ? fewTag() : "") + "</span></p>" : "<p class=\"muted\">No " + lab + " listings.</p>";
    return '<div class="cs-card" style="--c:' + s.color + '"><h4>' + s.name + "</h4>" +
      '<p class="cs-card__count">' + (t.A + t.B + t.C) + " homes in the data: " + t.A + " reliable · " + t.B + " lower-confidence · " + t.C + " supply only</p>" +
      line(a, "reliable") + line(ab, "reliable + lower-confidence") +
      (s.note ? '<p class="cs-card__note">' + s.note + "</p>" : "") + "</div>";
  }).join("");
}

// --- distribution strip chart -------------------------------------------------
let CS_CHART = null;
function renderCsChart(rows) {
  const cv = document.getElementById("chart-cs-strip");
  if (!cv || typeof Chart === "undefined") return;
  const m = CS_STATE.metric, sets = COMPSETS.sets.map((s) => s.name);
  const ds = sets.map((name, i) => {
    const pts = rows.filter((l) => l.set === name && l[m] != null).map((l) => ({ x: i + (csHash(l.id) - 0.5) * 0.55, y: l[m], l: l }));
    return { label: name, data: pts, backgroundColor: pts.map((p) => p.l.tier === "A" ? csSetColor(name) : "rgba(255,255,255,0.9)"), borderColor: csSetColor(name), borderWidth: 1.2, pointRadius: NARROW_CHARTS ? 3 : 4, pointHoverRadius: 6 };
  });
  const med = sets.map((name, i) => {
    const v = rows.filter((l) => l.set === name && l[m] != null).map((l) => l[m]);
    return v.length ? { x: i, y: csQuant(v, 0.5), n: v.length } : null;
  }).filter(Boolean);
  ds.push({ label: "Median", data: med, pointStyle: "line", pointRadius: 22, pointHoverRadius: 22, borderColor: "#1a2a33", borderWidth: 3, backgroundColor: "#1a2a33", type: "scatter" });
  if (CS_CHART) CS_CHART.destroy();
  CS_CHART = new Chart(cv, {
    type: "scatter",
    data: { datasets: ds },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: CS_METRICS[m].label + " by comp set (filled = reliable, hollow = lower-confidence)", font: { size: NARROW_CHARTS ? 11 : 13 } },
        tooltip: { callbacks: { label: (c) => c.raw.l ? c.raw.l.title.slice(0, 48) + ": " + CS_METRICS[m].fmt(c.raw.y) + " (" + c.raw.l.br + "BR, " + c.raw.l.area + ")" : "Median " + CS_METRICS[m].fmt(c.raw.y) + " (" + c.raw.n + " homes)" } },
      },
      scales: {
        x: { min: -0.6, max: sets.length - 0.4, ticks: { stepSize: 1, autoSkip: false, callback: (v) => (Number.isInteger(v) && sets[v] ? (NARROW_CHARTS ? sets[v].replace("Private pool", "Pool").replace("No private pool", "No pool").replace("non-waterfront", "non-wf").replace("waterfront", "wf") : sets[v]) : "") }, grid: { display: false } },
        y: { type: m === "occ" ? "linear" : "logarithmic", ticks: { callback: (v) => { const f = CS_METRICS[m].fmt(v); return m === "occ" || [1, 2, 5].indexOf(Number(String(v)[0])) !== -1 ? f : ""; } }, title: { display: !NARROW_CHARTS, text: CS_METRICS[m].short + (m === "occ" ? "" : " (log scale)") } },
      },
    },
  });
}

// --- explorer ---------------------------------------------------------------
function csOptions(id, opts, cur) {
  return '<select id="' + id + '">' + opts.map((o) => '<option value="' + escapeHtml(o[0]) + '"' + (o[0] === cur ? " selected" : "") + ">" + escapeHtml(o[1]) + "</option>").join("") + "</select>";
}
function renderCsFilters() {
  const host = document.getElementById("cs-filters");
  if (!host) return;
  const S = CS_STATE, areas = Array.from(new Set(COMPSETS.listings.map((l) => l.area))).sort();
  host.innerHTML =
    '<div class="cs-filter cs-filter--sets"><span class="cs-filter__lab">Comp sets</span>' + COMPSETS.sets.map((s) => '<label class="cs-chip" style="--c:' + s.color + '"><input type="checkbox" class="cs-set" value="' + s.name + '"' + (S.sets.indexOf(s.name) !== -1 ? " checked" : "") + "> " + s.name + "</label>").join("") + "</div>" +
    '<div class="cs-filter-row">' +
    '<label class="cs-filter"><span class="cs-filter__lab">Data</span>' + csOptions("cs-tiers", [["A", "Reliable only"], ["AB", "Reliable + lower-confidence"], ["ALL", "All listings (incl. supply only)"]], S.tiers) + "</label>" +
    '<label class="cs-filter"><span class="cs-filter__lab">Bedrooms</span>' + csOptions("cs-size", [["", "4BR+"], ["4BR", "4BR"], ["5BR", "5BR"], ["6BR+", "6BR+"]], S.size) + "</label>" +
    '<label class="cs-filter"><span class="cs-filter__lab">Dock (waterfront)</span>' + csOptions("cs-dock", [["", "Any"], ["Private dock", "Private dock"], ["No private dock", "No private dock"]], S.dock) + "</label>" +
    '<label class="cs-filter"><span class="cs-filter__lab">Non-waterfront</span>' + csOptions("cs-lake", [["", "Any"], ["Lake view or access", "Lake view or access"], ["Fully inland", "Fully inland"]], S.lake) + "</label>" +
    '<label class="cs-filter"><span class="cs-filter__lab">Pool heat</span>' + csOptions("cs-heat", [["", "Any"], ["Heated pool", "Heated"], ["Unheated / not stated", "Unheated / not stated"]], S.heat) + "</label>" +
    '<label class="cs-filter"><span class="cs-filter__lab">Hot tub</span>' + csOptions("cs-tub", [["", "Any"], ["Hot tub", "Hot tub"], ["No hot tub", "No hot tub"]], S.tub) + "</label>" +
    '<label class="cs-filter"><span class="cs-filter__lab">Area</span>' + csOptions("cs-area", [["", "All areas"]].concat(areas.map((a) => [a, a])), S.area) + "</label>" +
    '<label class="cs-filter"><span class="cs-filter__lab">Sleeps at least</span>' + csOptions("cs-sleeps", [["0", "Any"], ["10", "10"], ["12", "12"], ["14", "14"], ["16", "16"]], String(S.sleeps)) + "</label>" +
    '<label class="cs-filter"><span class="cs-filter__lab">Chart metric</span>' + csOptions("cs-metric", Object.keys(CS_METRICS).map((k) => [k, CS_METRICS[k].short]), S.metric) + "</label>" +
    '<button type="button" class="cs-reset" id="cs-reset">Reset</button></div>';
  host.querySelectorAll(".cs-set").forEach((c) => c.addEventListener("change", () => { S.sets = Array.from(host.querySelectorAll(".cs-set:checked")).map((x) => x.value); updateExplorer(); }));
  [["cs-tiers", "tiers"], ["cs-size", "size"], ["cs-dock", "dock"], ["cs-lake", "lake"], ["cs-heat", "heat"], ["cs-tub", "tub"], ["cs-area", "area"], ["cs-metric", "metric"]].forEach(([id, k]) =>
    document.getElementById(id).addEventListener("change", (e) => { S[k] = e.target.value; if (k === "metric") S.sort = S.metric; updateExplorer(); }));
  document.getElementById("cs-sleeps").addEventListener("change", (e) => { S.sleeps = Number(e.target.value); updateExplorer(); });
  document.getElementById("cs-reset").addEventListener("click", () => { Object.assign(S, { tiers: "A", sets: [], size: "", dock: "", lake: "", heat: "", tub: "", area: "", sleeps: 0, metric: "rev_pot", sort: "rev_pot", dir: -1 }); renderCsFilters(); updateExplorer(); });
}
function renderCsSummary(rows) {
  const host = document.getElementById("cs-summary");
  if (!host) return;
  const m = CS_STATE.metric, cell = (k) => {
    const v = rows.map((l) => l[k]).filter((x) => x != null);
    if (!v.length) return "<td>—</td>";
    return "<td><strong>" + CS_METRICS[k].fmt(csQuant(v, 0.5)) + "</strong><br><span class=\"muted\">" + CS_METRICS[k].fmt(csQuant(v, 0.25)) + "–" + CS_METRICS[k].fmt(csQuant(v, 0.75)) + "</span></td>";
  };
  const n = rows.length, warn = n === 0 ? '<p class="cs-warn">No listings match these filters.</p>' : n < THIN_N ? '<p class="cs-warn">Only ' + n + " homes match: read these figures as directional, not as a benchmark.</p>" : "";
  host.innerHTML = warn + '<div class="table-scroll"><table class="data-table cs-sum"><thead><tr><th>Matching homes</th><th>Revenue Potential</th><th>12-month revenue</th><th>RevPAN</th><th>ADR</th><th>Occupancy</th></tr></thead><tbody><tr><td><strong>' + n + "</strong><br><span class=\"muted\">" +
    rows.filter((l) => l.tier === "A").length + " reliable</span></td>" + ["rev_pot", "revenue", "revpan", "adr", "occ"].map(cell).join("") + "</tr></tbody></table></div>" +
    '<p class="caption">Median, with the middle half of the matching homes underneath. ' + (m ? "" : "") + "</p>";
}
function csRow(l) {
  const water = l.set.indexOf("non-waterfront") !== -1 ? l.lakeRel : l.dockWf;
  const pool = l.set.indexOf("Private pool") === 0 ? (l.heat === "Heated pool" ? "Private, heated" : "Private") : (l.communityPool ? "Community only" : "None");
  return "<tr><td class=\"cs-title\"><a href=\"" + escapeHtml(l.url) + "\" target=\"_blank\" rel=\"noopener\">" + escapeHtml(l.title) + "</a>" +
    (l.flags.length ? '<span class="cs-flag" title="' + escapeHtml(l.flags.join("; ")) + '">' + l.flags.length + " flag" + (l.flags.length > 1 ? "s" : "") + "</span>" : "") + "</td>" +
    "<td>" + escapeHtml(l.area) + "</td><td>" + l.br + " / " + l.sleeps + "</td><td><span class=\"cs-dot\" style=\"background:" + csSetColor(l.set) + "\"></span>" + escapeHtml(water) + "</td><td>" + pool + "</td><td>" + (l.hotTub === "Hot tub" ? "Yes" : "No") + "</td>" +
    "<td>" + (l.tier === "C" ? "—" : fmtK(l.rev_pot)) + "</td><td>" + (l.tier === "C" ? "—" : fmtCurrency(l.revpan)) + "</td><td>" + (l.tier === "C" ? "—" : fmtCurrency(l.adr)) + "</td><td>" + (l.tier === "C" ? "—" : Math.round(l.occ * 100) + "%") + "</td>" +
    "<td>" + (l.tier === "C" ? "—" : l.avail) + "</td><td><span class=\"cs-tier cs-tier--" + l.tier + "\">" + { A: "Reliable", B: "Lower", C: "Supply" }[l.tier] + "</span></td></tr>";
}
const CS_COLS = [["title", "Listing"], ["area", "Area"], ["br", "BR / sleeps"], ["water", "Water"], ["pool", "Pool"], ["hotTub", "Hot tub"], ["rev_pot", "Revenue Potential"], ["revpan", "RevPAN"], ["adr", "ADR"], ["occ", "Occ."], ["avail", "Avail. nights"], ["tier", "Data"]];
function renderCsTable(rows) {
  const host = document.getElementById("cs-table");
  if (!host) return;
  const S = CS_STATE, k = S.sort;
  const sorted = rows.slice().sort((a, b) => {
    const x = a[k], y = b[k];
    if (typeof x === "string") return S.dir * String(x).localeCompare(String(y));
    return S.dir * ((x == null ? -1e12 : x) - (y == null ? -1e12 : y));
  });
  host.innerHTML = '<div class="table-scroll cs-table-wrap"><table class="data-table cs-tbl"><thead><tr>' +
    CS_COLS.map((c) => '<th data-k="' + c[0] + '" class="' + (["title", "area", "water", "pool", "hotTub", "tier"].indexOf(c[0]) === -1 ? "num" : "") + (k === c[0] ? " sorted" : "") + '">' + c[1] + (k === c[0] ? (S.dir < 0 ? " ▾" : " ▴") : "") + "</th>").join("") +
    "</tr></thead><tbody>" + sorted.map(csRow).join("") + "</tbody></table></div>" +
    '<p class="caption">' + sorted.length + " homes. Click a column to sort; hover a flag for details. “—” = no usable performance data (supply only).</p>";
  host.querySelectorAll("th[data-k]").forEach((th) => th.addEventListener("click", () => {
    const key = th.dataset.k, map = { br: "br", water: "set" };
    const kk = map[key] || key;
    if (S.sort === kk) S.dir = -S.dir; else { S.sort = kk; S.dir = ["title", "area", "set", "pool", "hotTub", "tier"].indexOf(kk) === -1 ? -1 : 1; }
    renderCsTable(COMPSETS.listings.filter(csPass));
  }));
}
function updateExplorer() {
  const rows = COMPSETS.listings.filter(csPass);
  renderCsSummary(rows);
  renderCsChart(rows.filter((l) => l.tier !== "C"));
  renderCsTable(rows);
}

// --- premiums -----------------------------------------------------------------
function renderPremiums() {
  const host = document.getElementById("cs-premiums");
  if (!host) return;
  const P = COMPSETS.premiums, ratio = (p) => (p && p.combined_ratio != null ? fmtX(p.combined_ratio) : "—");
  const nn = (p) => p ? p.n_with + " vs " + p.n_without : "";
  host.innerHTML = '<div class="table-scroll"><table class="data-table cs-prem"><thead><tr><th>Comparison (4BR+, within the same bedroom count)</th>' +
    '<th class="th-note">Reliable<span>RevPAN with ÷ without · homes</span></th><th class="th-note">Reliable + lower-confidence<span>RevPAN with ÷ without · homes</span></th>' +
    '<th class="th-note">Same, by nightly rate<span>ADR ratio</span></th><th class="th-note">and by occupancy<span>occupancy ratio</span></th><th>What it means</th></tr></thead><tbody>' +
    PREMIUM_ROWS.map((r) => {
      const a = P.A[r.key], ab = P.AB[r.key];
      return "<tr><th scope=\"row\">" + a.label + "</th><td><strong>" + ratio(a.revpan) + "</strong><br><span class=\"muted\">" + nn(a.revpan) + "</span></td><td><strong>" + ratio(ab.revpan) + "</strong><br><span class=\"muted\">" + nn(ab.revpan) + "</span></td>" +
        "<td>" + ratio(ab.adr) + "</td><td>" + ratio(ab.occ) + "</td><td class=\"cell-note\">" + (typeof r.note === "function" ? r.note() : r.note) + "</td></tr>";
    }).join("") + "</tbody></table></div>";
}

// --- strongest comps ----------------------------------------------------------
function renderStrong() {
  const host = document.getElementById("cs-strong");
  if (!host) return;
  host.innerHTML = COMPSETS.sets.map((s) => {
    const ids = COMPSETS.strong[s.name] || [];
    const ls = ids.map((id) => COMPSETS.listings.find((l) => l.id === id)).filter(Boolean);
    if (!ls.length) return "";
    return '<div class="cs-strong" style="--c:' + s.color + '"><h4>' + s.name + "</h4><ol>" + ls.map((l) =>
      "<li><a href=\"" + escapeHtml(l.url) + "\" target=\"_blank\" rel=\"noopener\">" + escapeHtml(l.title) + "</a> <span class=\"cs-tier cs-tier--" + l.tier + "\">" + { A: "Reliable", B: "Lower" }[l.tier] + "</span><br>" +
      "<span class=\"cs-strong__facts\">" + fmtK(l.rev_pot) + " · " + fmtCurrency(l.revpan) + "/available night · " + fmtX(l.idx) + " typical for " + l.size + " · " + l.br + "BR sleeps " + l.sleeps + " · " + escapeHtml(l.area) + " · " + l.minUptown + " min to Uptown</span><br>" +
      "<span class=\"cs-strong__why\">" + escapeHtml(l.why) + "</span></li>").join("") + "</ol></div>";
  }).join("");
}

function renderFlags() {
  const host = document.getElementById("cs-flags");
  if (!host) return;
  const F = COMPSETS.flagCounts;
  host.innerHTML = '<div class="table-scroll"><table class="data-table"><thead><tr><th>Flag</th><th>4BR+ homes</th><th>What we did</th></tr></thead><tbody>' +
    FLAG_ROWS.map((r) => "<tr><th scope=\"row\">" + r.label + "</th><td>" + (F[r.key] || 0) + "</td><td class=\"cell-note\">" + r.action + "</td></tr>").join("") + "</tbody></table></div>";
}

function renderCompsetSection() {
  if (typeof COMPSETS === "undefined") return;
  const lede = document.getElementById("cs-lede");
  if (lede) lede.innerHTML = COMPSET_TEXT.lede();
  ["cs-cards-note", "cs-strip-note", "cs-explorer-note", "cs-premium-note", "cs-strong-note", "cs-flags-note"].forEach((id) => {
    const n = document.getElementById(id), k = id.replace("cs-", "").replace(/-([a-z])/g, (m, c) => c.toUpperCase());
    if (n && COMPSET_TEXT[k]) n.innerHTML = typeof COMPSET_TEXT[k] === "function" ? COMPSET_TEXT[k]() : COMPSET_TEXT[k];
  });
  renderCoreSets();
  renderCsFilters();
  updateExplorer();
  renderPremiums();
  renderStrong();
  renderFlags();
}
