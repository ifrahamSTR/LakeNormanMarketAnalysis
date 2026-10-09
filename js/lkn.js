/**
 * Lake Norman-specific sections: data note, location-factor screens,
 * straight-line vs drive time, acquisition (rules, HOAs, sale data),
 * conclusions and the method/definitions block. Content comes from data.js
 * (DATA_NOTE, FACTOR_TEXT, DRIVE_TEXT, RULES, HOA_TEXT, SALE_TEXT,
 * CONCLUSIONS, METHOD) and numbers from compsets_data.js (FACTORS,
 * DRIVE_TABLE, COMPSETS).
 */
function renderDataNote() {
  const host = document.getElementById("data-note");
  if (host && typeof DATA_NOTE !== "undefined") host.innerHTML = typeof DATA_NOTE === "function" ? DATA_NOTE() : DATA_NOTE;
}

function verdictPill(v) {
  const m = { yes: ["factor-verdict--yes", "relates"], weak: ["factor-verdict--weak", "weak / mixed"], no: ["factor-verdict--no", "no clear link"] };
  const x = m[v] || m.no;
  return '<span class="factor-verdict ' + x[0] + '">' + x[1] + "</span>";
}
function renderFactors() {
  const host = document.getElementById("factor-grid");
  if (!host || typeof FACTORS === "undefined") return;
  const lede = document.getElementById("factor-lede"), note = document.getElementById("factor-note");
  if (lede) lede.innerHTML = FACTOR_TEXT.lede;
  if (note) note.innerHTML = FACTOR_TEXT.note;
  host.innerHTML = FACTOR_TEXT.order.map((name) => {
    const rows = FACTORS[name], meta = FACTOR_TEXT.reads[name] || {};
    if (!rows) return "";
    const body = (rs) => rs.map((r) => "<tr" + (r.n < THIN_N ? ' class="muted"' : "") + "><td>" + r.group + (r.n < THIN_N ? fewTag() : "") + "</td><td>" + r.n + "</td><td><strong>" + fmtX(r.idx) + "</strong></td><td>" + Math.round(r.top_q) + "%</td><td>" + fmtCurrency(r.adr) + "</td><td>" + Math.round(r.occ) + "%</td></tr>").join("");
    const big = (typeof FACTORS_BIG !== "undefined" && FACTORS_BIG[name]) || [];
    return '<div class="factor-card"><h4>' + name + verdictPill(meta.verdict) + "</h4><table><thead><tr><th>Group</th><th>Homes</th><th>vs. typical</th><th>Top quarter</th><th>ADR</th><th>Occ.</th></tr></thead><tbody>" +
      '<tr><th colspan="6" class="factor-sub">' + FACTOR_TEXT.viewA + "</th></tr>" + body(rows) +
      (big.length ? '<tr><th colspan="6" class="factor-sub">' + FACTOR_TEXT.viewB + "</th></tr>" + body(big) : "") +
      "</tbody></table>" + (meta.read ? '<p class="read">' + (typeof meta.read === "function" ? meta.read(rows, big) : meta.read) + "</p>" : "") + "</div>";
  }).join("");
}

function renderDriveTable() {
  const host = document.getElementById("drive-table");
  if (!host || typeof DRIVE_TABLE === "undefined") return;
  host.innerHTML = '<div class="table-scroll"><table class="data-table"><thead><tr><th>Area</th><th>Homes</th><th class="th-note">Straight line to Uptown<span>km, median</span></th><th class="th-note">Drive to Uptown<span>free-flow min, median</span></th><th class="th-note">Drive to CLT airport<span>free-flow min</span></th><th class="th-note">Drive to nearest I-77 exit<span>min</span></th><th class="th-note">Drive to nearest public launch<span>min</span></th><th class="th-note">Main road within 300 m<span>share of homes</span></th></tr></thead><tbody>' +
    DRIVE_TABLE.map((r) => '<tr><th scope="row"><span class="region-dot" style="background:' + r.color + '"></span>' + r.area + "</th><td>" + r.n + "</td><td>" + r.crow + "</td><td><strong>" + r.uptown + "</strong></td><td>" + r.clt + "</td><td>" + r.i77 + "</td><td>" + r.launch + "</td><td>" + r.arterial + "%</td></tr>").join("") +
    "</tbody></table></div>";
  const note = document.getElementById("drive-note");
  if (note) note.innerHTML = typeof DRIVE_TEXT === "function" ? DRIVE_TEXT() : DRIVE_TEXT;
}

function renderAcquisition() {
  const lede = document.getElementById("acq-lede");
  if (lede) lede.innerHTML = ACQ_TEXT.lede;
  const host = document.getElementById("rules-table");
  if (host) {
    host.innerHTML = '<div class="table-scroll"><table class="data-table rules-table"><thead><tr><th>Jurisdiction</th><th>Covers</th><th>Whole-home STR status</th><th>What we verified</th><th>Guest taxes</th></tr></thead><tbody>' +
      RULES.map((r) => '<tr><th scope="row">' + r.name + "</th><td>" + r.covers + '</td><td><span class="status-pill status-pill--' + r.status + '">' + r.statusLabel + "</span></td><td class=\"cell-note\">" + r.detail + "</td><td>" + r.tax + "</td></tr>").join("") +
      "</tbody></table></div>";
  }
  const note = document.getElementById("rules-note");
  if (note) note.innerHTML = ACQ_TEXT.rulesNote;
  const hoa = document.getElementById("hoa-body");
  if (hoa) hoa.innerHTML = ACQ_TEXT.hoa;
  const sale = document.getElementById("sale-body");
  if (sale) sale.innerHTML = ACQ_TEXT.sale;
}

function renderConclusions() {
  const lede = document.getElementById("concl-lede");
  if (lede) lede.innerHTML = CONCLUSIONS.lede();
  const v = document.getElementById("concl-verdicts");
  if (v) v.innerHTML = CONCLUSIONS.verdicts().map((x) => '<div class="verdict verdict--' + x.kind + '"><h4>' + x.title + "</h4><p>" + x.body + "</p>" + (x.points ? listHtml(x.points) : "") + "</div>").join("");
  const c = document.getElementById("concl-comps");
  if (c) c.innerHTML = CONCLUSIONS.comps();
  const e = document.getElementById("concl-evidence");
  if (e) e.innerHTML = CONCLUSIONS.evidence();
}

function renderMethod() {
  const host = document.getElementById("method-body");
  if (host) host.innerHTML = typeof METHOD === "function" ? METHOD() : METHOD;
}

document.addEventListener("DOMContentLoaded", () => {
  renderDataNote();
  renderFactors();
  renderDriveTable();
  if (typeof renderCompsetSection === "function") renderCompsetSection();
  renderAcquisition();
  renderConclusions();
  renderMethod();
});
