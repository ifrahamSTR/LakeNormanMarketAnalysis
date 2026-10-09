/**
 * Content/config for the Lake Norman, NC market, location and 4BR+ comp-set
 * page. Numbers are read from js/region_data.js (reliable listings, Sections
 * 1-2, 4-5) and js/compsets_data.js (4BR+ comp sets, factor screens, drive
 * times); prose that quotes a number computes it. Research facts were
 * gathered 2026-10-08 and fact-checked against their sources (see notes in
 * README.md); figures only seen in search snippets are not used.
 */
function photo(relPath, alt, caption) {
  return { file: "assets/" + relPath, alt: alt, caption: caption };
}
const MARKET_NAME = "Lake Norman, NC";
const _lad = (s) => LOCATION.ladder.find((r) => r.size === s);
const _ls = (s, l) => LOCATION.locSize[s][l];
const _area = (n) => LOCATION.areas.find((a) => a.name === n);
const _set = (n) => COMPSETS.sets.find((s) => s.name === n);
const _prem = (t, k) => COMPSETS.premiums[t][k].revpan.combined_ratio;
const _adj = (t, k) => COMPSETS.adjusted[t][k];
const _pct = (x) => (x >= 0 ? "+" : "") + Math.round(x) + "%";
const WFD = "Waterfront + private dock", WFN = "Waterfront, no private dock", LVA = "Lake view or access", INL = "Inland";
const SPW = "Private pool + waterfront", SPN = "Private pool + non-waterfront", SNW = "No private pool + waterfront", SNN = "No private pool + non-waterfront";
const MECK = "Cornelius, Davidson & Huntersville";
// median "vs typical" by area for one comp set (reliable + lower-confidence, no classification doubts)
function setByArea(set, minN) {
  const by = {};
  COMPSETS.listings.filter((l) => l.set === set && l.tier !== "C" && l.flags.indexOf("waterfront unclear") === -1).forEach((l) => (by[l.area] = by[l.area] || []).push(l.idx));
  return Object.keys(by).filter((a) => by[a].length >= (minN || 5)).map((a) => ({ area: a, n: by[a].length, idx: csQuant(by[a], 0.5) })).sort((x, y) => y.idx - x.idx);
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
const HERO = {
  title: "On Lake Norman, the water and a private pool set the rate",
  sub: (() => {
    const a = _adj("AB", "private_pool");
    return "Bedroom count sets the baseline: a typical 5BR earns about " + fmtK(_lad("5BR").median) + " a year against " + fmtK(_lad("3BR").median) + " for a 3BR. Within the same size, homes on the water with their own dock earn " +
      fmtX(_ls("All sizes", WFD).idx) + " typical, while lake-view and inland homes earn " + fmtX(_ls("All sizes", LVA).idx) + " and " + fmtX(_ls("All sizes", INL).idx) + ". Among comparable 4BR+ waterfront homes, a private pool goes with about " +
      fmtX(_prem("AB", "pool_wf")) + " the revenue per available night (" + _pct(a.pct) + " after allowing for capacity, shore and positioning), and a hot tub about " + fmtX(_prem("AB", "hot_tub")) + ". Being closer to Charlotte or I-77 shows no consistent link. " +
      Math.round(100 - COMPSETS.inlandShare4) + "% of the 4BR+ rental supply is waterfront, so inland large homes are rare comps.";
  })(),
};

const DATA_NOTE = () => {
  const Q = COMPSETS.classAgreement, T = COMPSETS.tierCounts;
  return "<h3>About the data</h3><ul>" +
    "<li><strong>Source:</strong> STRSearch market workbook “East Lake Norman - NC” (snapshot " + COMPSETS.snapshot + "). Despite its name it covers every shore: " + (DRIVE_META.n) + " entire homes within 5 km of the lake (8 further away, e.g. Mountain Island Lake cabins, were dropped). The Boone workbook was not used.</li>" +
    "<li><strong>Performance figures are the data provider's estimates</strong> from observed Airbnb calendars and prices over the last 12 months, not booking records. No advertised nightly prices are used. Market-level AirROI figures are third-party models and labelled as such.</li>" +
    "<li><strong>Confidence:</strong> " + MARKET_STATS.n + " homes pass the provider's review-history test (“reliable”, used for Sections 1–2). For 4BR+ comps we also show " + T.B + " lower-confidence homes that clearly operate but fail that test (large lake homes often do, because they book fewer, longer stays) and list " + T.C + " new or barely active homes as supply only.</li>" +
    "<li><strong>Pool, waterfront, dock and hot tub</strong> come from each listing's own text, reviewed twice independently (both reviews agreed on all six fields for " + Math.round((Q.agreed / Q.n) * 100) + "% of homes; " + Q.adjudicated + " were adjudicated). Airbnb's “Waterfront” tick-box is not used on its own, and a pool table never counts as a pool.</li>" +
    "<li><strong>Locations are approximate</strong> (" + DRIVE_META.pinsInLake + " Airbnb pins fall in the lake). Drive times are free-flow estimates with no traffic.</li></ul>";
};

const FOOTER_NOTE = () => "Preliminary analysis, not an underwriting model. Performance figures are the data provider's estimates (snapshot " + COMPSETS.snapshot + "); associations are not proof of cause. Read any cell under 8 homes as directional.";

// ---------------------------------------------------------------------------
// Section 1 — Market
// ---------------------------------------------------------------------------
const DISTRIBUTION_NOTE = () => {
  const t = LOCATION.top10BySize, n = Object.values(t).reduce((a, b) => a + b, 0);
  return "Reliable listings only. Most earn under " + fmtK(REVENUE_DISTRIBUTION.p75) + "; the Top 10% starts at " + fmtCurrency(REVENUE_DISTRIBUTION.p90) + " and is all large homes (" + t["5BR"] + " of the " + n + " are 5BR, " + t["6BR+"] + " are 6BR+).";
};
const LADDER_NOTE = () => "Revenue Potential (the provider's full-year estimate) roughly doubles from 3BR (" + fmtK(_lad("3BR").median) + ") to 5BR (" + fmtK(_lad("5BR").median) + "), driven by the nightly rate (" + fmtCurrency(_lad("3BR").adr) + " vs " + fmtCurrency(_lad("5BR").adr) + "); occupancy stays in the 50s. So every location comparison below is made within the same size.";
const DRIVERS_NOTE = "<strong>Screening signals, not proven uplift.</strong> Each row compares reliable listings with and without a feature: how often they reach the top quarter <em>for their size</em>, and what they earn against a typical home their size. Pool, dock, waterfront and hot tub are the reviewed classes, not host tick-boxes. Section 3 tests the big ones within comparable 4BR+ homes.";
const DRIVER_ROWS = [
  { key: "pool", label: "Private pool", group: "Amenity (reviewed)", note: "The strongest single signal; community pools are counted separately and are not included here." },
  { key: "hot_tub", label: "Hot tub", group: "Amenity (reviewed)", note: "Strong and common." },
  { key: WFD, label: "On the water with its own dock", group: "Lake position", note: "The location that pays." },
  { key: "watercraft", label: "Boats, kayaks or paddle boards for guests", group: "Amenity", note: "A modest signal; supplying powered boats may make the host a regulated boat livery (NCWRC rule, 2025)." },
  { key: LVA, label: "Lake view or access, not waterfront", group: "Lake position", note: "Below typical: a view or a walk to the water does not substitute for frontage." },
  { key: INL, label: "Inland", group: "Lake position", note: "Below typical." },
  { key: "Secluded (20+ min to I-77 and 15+ min to a town)", label: "Secluded setting", group: "Access", note: "Not penalised; a few remote waterfront homes earn well." },
  { key: "Within 40 min of Uptown Charlotte (free-flow)", label: "Within 40 min of Uptown Charlotte", group: "Access", note: "No advantage." },
  { key: "Within 1 km of I-77", label: "Within 1 km of I-77", group: "Access", note: "Below typical: mostly small inland homes, with highway noise and no lake." },
  { key: "Within 300 m of a main road", label: "Within 300 m of a main road", group: "Access", note: "Slightly below typical." },
  { key: "Superhost", label: "Superhost", group: "Operations", note: "A modest signal." },
];

// ---------------------------------------------------------------------------
// Section 2 — Location by bedroom size
// ---------------------------------------------------------------------------
const MAP_CONFIG = {
  lede: "Bedroom count sets the baseline; location decides whether a home beats it. Every comparison is within the same size (<strong>1.00× = a typical Lake Norman home that size</strong>). The location question is <strong>where the home sits on the lake</strong>: on the water with its own dock, on the water without one, with a view or walkable access, or inland. Ten reference areas are clusters drawn within each shore, because homes facing each other across the lake are a long drive apart.",
  marketInterpretation: "In the bottom-left panel (tap “show” on a phone), <strong>untick all but one bedroom size</strong> to see where that size earns. Green = top quarter for its size, gold = middle half, grey = bottom quarter. Click an area for its numbers. The layer control adds boat launches, marinas, I-77 exits and demand points. Pins are approximate and many sit in the water.",
};
const LOC_READS = {
  "1-2BR": "Frontage matters most at small sizes (8 waterfront homes with a dock).",
  "3BR": "On the water with a dock earns about a third above typical; a view or inland location earns a quarter below.",
  "4BR": "Four in five reliable 4BRs are waterfront; the few off the water trail (few homes).",
  "5BR": "All but three reliable 5BRs are on the water, so the comparison is within waterfront homes (Section 3).",
  "6BR+": "Ten reliable homes; read with care.",
  "All sizes": "The × figures are size-adjusted; the dollar figures still mix sizes.",
};
const AREA_GRID_NOTE = () => {
  const t = _area("Terrell & East Sherrills Ford"), n = _area("North End (Monbo & Long Island)"), d = _area("Denver & Westport"), m = _area(MECK);
  return "<strong>Areas matter less than lake position.</strong> The Catawba shore by the NC-150 bridge (Terrell, " + fmtX(t.idx) + ", " + t.n + " homes) and the north end (" + fmtX(n.idx) + ", " + n.n + " homes) lead, both almost all waterfront. Denver & Westport trails (" + fmtX(d.idx) + "), with more inland homes. The Mecklenburg shore (" + fmtX(m.idx) + ") is mostly small inland homes: Cornelius bars whole-home rentals in its residential districts. Grey “few homes” = fewer than 8.";
};
const SIZE_GUIDE = {
  "1-2BR": { head: "Only on the water.", look: "A small waterfront cottage with its own dock.", avoid: "Inland or lake-view units near I-77.", proof: () => "Waterfront + dock " + fmtX(_ls("1-2BR", WFD).idx) + " · inland " + fmtX(_ls("1-2BR", INL).idx) },
  "3BR": { head: "Frontage and a dock.", look: "Waterfront 3BRs with a private dock, any shore.", avoid: "Lake-view or inland 3BRs.", proof: () => "Waterfront + dock " + fmtX(_ls("3BR", WFD).idx) + " (" + _ls("3BR", WFD).n + " homes) · lake view/access " + fmtX(_ls("3BR", LVA).idx) + " · inland " + fmtX(_ls("3BR", INL).idx) },
  "4BR": { head: "Waterfront is table stakes; add a pool or hot tub.", look: "Waterfront with dock plus a hot tub; a private pool if the budget allows.", avoid: "Off-water 4BRs without a pool.", proof: () => "Waterfront + dock " + fmtX(_ls("4BR", WFD).idx) + " (" + _ls("4BR", WFD).n + " homes)" },
  "5BR": { head: "Compete on amenities, not position.", look: "Waterfront 5BRs with a private pool and hot tub.", avoid: "Large homes with no pool or hot tub.", proof: () => "Waterfront + dock " + fmtX(_ls("5BR", WFD).idx) + " (" + _ls("5BR", WFD).n + " homes)" },
  "6BR+": { head: "Estate product; few comps.", look: "Waterfront estates with a pool; underwrite against the Section 3 comps.", avoid: "Assuming a size premium without amenities.", proof: () => _lad("6BR+").n + " reliable homes, median " + fmtK(_lad("6BR+").median) },
};
const FACTOR_TEXT = {
  lede: "Each factor is tested within the same size, first on all reliable homes, then on 4BR+ waterfront homes (reliable + lower-confidence), where most of the supply is. Straight-line distances are shown for noise exposure; drive times (free-flow) for access.",
  note: "“vs. typical” = revenue against a typical home the same size; “Top quarter” = share of homes in the top quarter for their size. Groups of fewer than 8 homes are greyed. These are associations; homes differ in ways the data cannot see.",
  viewA: "All reliable homes", viewB: "4BR+ waterfront homes",
  order: ["Drive to Uptown Charlotte (free-flow)", "Drive to the nearest I-77 interchange", "Distance to I-77 (straight line)", "Distance to a main road (NC-150, NC-16, NC-73, US-21, NC-115)",
          "Drive to the nearest town centre", "Setting", "Drive to the nearest public boat launch (non-waterfront homes only)", "Distance to the nearest marina"],
  reads: {
    "Drive to Uptown Charlotte (free-flow)": { verdict: "no", read: "No steady pattern: the most remote homes do as well as the closest." },
    "Drive to the nearest I-77 interchange": { verdict: "weak", read: "Flat for all homes; large waterfront homes within 20 min of an exit do slightly better." },
    "Distance to I-77 (straight line)": { verdict: "weak", read: "Among all homes, those within 1 km earn least (mostly small inland homes); large waterfront homes show no penalty (few homes)." },
    "Distance to a main road (NC-150, NC-16, NC-73, US-21, NC-115)": { verdict: "weak", read: "Homes within 1 km of a main road earn slightly less." },
    "Drive to the nearest town centre": { verdict: "no", read: "Being close to a town does not help; quieter homes do no worse." },
    "Setting": { verdict: "no", read: "Secluded homes are not penalised." },
    "Drive to the nearest public boat launch (non-waterfront homes only)": { verdict: "no", read: "For off-water homes, a nearby public launch does not lift revenue (few homes)." },
    "Distance to the nearest marina": { verdict: "no", read: "No clear link." },
  },
};
const DRIVE_TEXT = () => {
  const r = DRIVE_TABLE.slice().sort((x, y) => y.uptown / y.crow - x.uptown / x.crow)[0], d = DRIVE_TABLE.find((x) => x.area === "Denver & Westport");
  return "Free-flow drive times (OSRM road network, no traffic) from each listing pin; rush-hour traffic adds time. Coves and peninsulas make map distance a poor guide: " + r.area + " is " + r.crow + " km from Uptown in a straight line (Denver & Westport: " + d.crow + " km) but a " + r.uptown + "-minute drive (Denver: " + d.uptown + "), because the road runs the length of the peninsula.";
};

// ---------------------------------------------------------------------------
// Section 3 — 4BR+ comp sets
// ---------------------------------------------------------------------------
const COMPSET_TEXT = {
  lede: () => "All " + COMPSETS.n4 + " entire homes with 4+ bedrooms fall into four mutually exclusive sets by <strong>private pool</strong> (community pools do not count) and <strong>true waterfront</strong> (lake views and lake access do not count). " +
    COMPSETS.unclear.waterfront + " homes whose waterfront status the listing leaves unclear are kept out of the comparisons. Revenue Potential, revenue per available night (RevPAN), ADR and occupancy are shown as medians with the middle half, never as averages alone.",
  cardsNote: () => "Reliable = the provider's review-history test; lower-confidence = clearly operating (180+ available nights, 8+ months of reviews) but failing that test. The non-waterfront sets are thin: Lake Norman's large rental homes are almost all on the water.",
  explorerNote: "Pick sets, bedrooms, dock, lake view vs inland, pool heat, hot tub, area or capacity. The summary, chart and table update together; every title opens the Airbnb listing.",
  stripNote: "Each dot is a home (filled = reliable, hollow = lower-confidence); the black bar is the median. Log scale for money.",
  premiumNote: () => {
    const A = COMPSETS.adjusted.AB;
    return "Ratios compare medians of homes with and without the feature inside the same bedroom count (4, 5, 6+), combined across counts; comparisons with fewer than 5 homes on a side are not shown (“—”). As a cross-check, one adjusted model (" + A.n + " reliable + lower-confidence homes, allowing for bedrooms, capacity, shore and luxury positioning) gives: private pool " + _pct(A.private_pool.pct) + ", hot tub " + _pct(A.private_hot_tub.pct) +
      ", waterfront " + _pct(A.waterfront_yes.pct) + " (wide range), private dock " + _pct(A.private_dock.pct) + ". These are associations, not proof that adding the feature would lift revenue.";
  },
  strongNote: "Ranked by revenue against a typical home the same size, among full-year operators (240+ available nights) with no classification doubts; reliable homes first. The private-pool non-waterfront set lists every reliable home it has.",
  flagsNote: "Flags appear next to each listing in the explorer (hover the tag).",
};
const PREMIUM_ROWS = [
  { key: "pool_wf", note: () => "The clearest premium: mostly a higher nightly rate (ADR " + fmtX(COMPSETS.premiums.AB.pool_wf.adr.combined_ratio) + "), with slightly better occupancy. Pool homes are also more upscale; the adjusted model still finds about " + _pct(_adj("AB", "private_pool").pct) + "." },
  { key: "pool_nonwf", note: "Too few off-water pool homes to compare; see the private-pool non-waterfront set." },
  { key: "wf_nopool", note: "Waterfront homes out-earn the few comparable inland ones, on thin inland numbers." },
  { key: "dock", note: "Almost every waterfront home has its own dock, so the dock premium cannot be separated from frontage." },
  { key: "hot_tub", note: "A steady premium across sets." },
  { key: "heated", note: "Heated pools go with higher revenue, mainly through rate; few unheated comparisons." },
  { key: "lakeview", note: "A view or walkable access does not lift off-water homes (few homes)." },
];
const FLAG_ROWS = [
  { key: "tierB", label: "Lower-confidence performance data", action: "Shown hollow in charts and tagged in the table; headline set figures are given separately for reliable homes." },
  { key: "tierC", label: "New or barely active (supply only)", action: "Excluded from every performance figure; visible in the explorer under “All listings”." },
  { key: "partyear", label: "Fewer than 180 available nights", action: "Use RevPAN or Revenue Potential, not 12-month revenue, for these." },
  { key: "occhigh", label: "Occupancy 80% or more", action: "Check minimum stays and monthly bookings before using as a comp." },
  { key: "outlier", label: "Revenue more than 3× its set median", action: "Kept, but treat as a ceiling, not a benchmark." },
  { key: "wfunclear", label: "Waterfront status unclear in the listing", action: "Kept out of set comparisons." },
  { key: "lowconf", label: "Low-confidence classification", action: "Open the listing before relying on it." },
  { key: "nosqft", label: "Square footage not stated", action: "Size is judged by bedrooms and capacity instead." },
];

// ---------------------------------------------------------------------------
// Section 1 market card (researched 2026-10-08; primary sources opened)
// ---------------------------------------------------------------------------
const MARKET_OVERVIEW = {
  heroImage: photo("overview/lake-norman-james-st-john.jpg", "Aerial view of Lake Norman's coves and wooded peninsulas lined with lakefront homes",
    'Lake Norman from the air. "Lake Norman (North Carolina, USA) 1" by James St. John, <a href="https://commons.wikimedia.org/wiki/File:Lake_Norman_(North_Carolina,_USA)_1.jpg" target="_blank" rel="noopener">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noopener">CC BY 2.0</a>.'),
  chips: [{ label: "520 Miles of Shoreline" }, { label: "Four Counties, Four Rulebooks" }, { label: "Summer-Peaked Demand" }, { label: "30–60 Min Drive to Uptown Charlotte" }],
  attractions: [
    "<strong>The lake itself</strong>: North Carolina's largest man-made lake (NC Parks), with about ten public boat access areas and several marinas. Docks and lifts need a Duke Energy permit.",
    "<strong>Lake Norman State Park</strong> (Troutman): swim beach, boat ramp, camping; 709,468 visits in 2025 (NC State Parks).",
    "<strong>Motorsports</strong>: Team Penske in Mooresville (“Race City USA”), Joe Gibbs Racing in Huntersville, and Charlotte Motor Speedway race weekends (Coca-Cola 600 on 24 May, Bank of America 400 on 11 Oct 2026).",
    "<strong>Charlotte</strong>: Uptown events and Charlotte Douglas airport (53.6M passengers in 2025); Lowe's HQ in Mooresville brings weekday business travel.",
  ],
  visitorStats: {
    headline: "2025 visitor spending by county (Visit NC / Tourism Economics); STR figures are AirROI's modelled estimates",
    breakdown: [
      { value: "$441M", label: "Iredell County (Mooresville, Troutman), +2.8%" },
      { value: "$363M", label: "Catawba County (Sherrills Ford, Terrell), +3.5%" },
      { value: "$106M", label: "Lincoln County (Denver), +0.7%" },
      { value: "390", label: "Active Mooresville Airbnb listings (AirROI, Aug 2025–Jul 2026)" },
    ],
  },
  watchOuts: [
    "📋 <strong>Rules differ by jurisdiction.</strong> Cornelius bars whole-home rentals in its main residential districts; Iredell County's 2024 rules are on hold by court order; Mooresville, Lincoln and Catawba counties have no STR-specific zoning. See Section 6.",
    "📈 <strong>Supply is growing faster than revenue</strong> (AirROI, modelled): listings up 48% in Denver, 53% in Troutman and 20% in Mooresville in a year, while revenue per listing fell in Denver (−7%) and Cornelius (−25%).",
    "❄️ <strong>Short season.</strong> Modelled Mooresville revenue per available night runs from $127 in January to $362 in August, and Duke Energy's operating guide lowers the lake about 4 ft by February, which matters for docks in shallow coves.",
    "🚧 <strong>Construction on NC-150.</strong> NCDOT began a multi-year widening of NC-150 between Terrell and Mooresville in February 2025, including an additional bridge over the lake.",
  ],
  sources: [
    { label: "Visit NC 2025 county visitor spending", url: "https://www.visitnc.com/industry/research/economic-impact-studies" },
    { label: "NC Parks (Lake Norman State Park)", url: "https://www.ncparks.gov/park-features/lake-norman-state-park" },
    { label: "NC State Parks visitation 2025", url: "https://www.ncparks.gov/state-parks/annual-visitation" },
    { label: "Charlotte Motor Speedway 2026", url: "https://www.charlottemotorspeedway.com/media/news/charlotte-motor-speedway-gears" },
    { label: "CLT 2025 passengers", url: "https://www.cltairport.com/news/press-releases/" },
    { label: "AirROI Mooresville (modelled)", url: "https://www.airroi.com/airbnb-data/united-states/north-carolina/mooresville" },
    { label: "NCDOT NC-150 widening", url: "https://www.ncdot.gov/news/press-releases/Pages/2025/2025-02-07-nc-150-widening-starts.aspx" },
    { label: "Duke Energy lake levels (2021 chart)", url: "https://www.catawbawatereewmg.org/application/files/2216/1702/8457/Duke-Energy-Lake-Levels.pdf" },
    { label: "NCWRC boat-livery rule (2025)", url: "https://www.osbm.nc.gov/documents/files/WRC_2025-05-15/open" },
  ],
};

// ---------------------------------------------------------------------------
// Section 4 — Why location changes the rate (js/destination.js)
// ---------------------------------------------------------------------------
const DEST_LEDE = "Why guests choose each shore, and what that means for revenue. Click a shore.";
const DEST_RESEARCHED = "2026-10-08";
const DEST_KIND = {
  iredell: ["Mooresville & Troutman shore", "#C0473F"], catawba: ["Catawba (west) shore", "#2E7D6B"],
  lincoln: ["Lincoln (south-west) shore", "#3C6E9E"], meck: ["Mecklenburg (east) shore", "#8B5FA7"], north: ["North end", "#7A5C2E"],
};
function DEST_AREAS() {
  const b = _area("Brawley School Peninsula"), w = _area("West Mooresville & NC-150"), t = _area("Terrell & East Sherrills Ford"), s = _area("Sherrills Ford West"),
    d = _area("Denver & Westport"), m = _area(MECK), n = _area("North End (Monbo & Long Island)");
  return [
    { id: "iredell", name: "Mooresville peninsulas & NC-150", kind: "iredell", tags: ["Most of the supply", "Pool homes cluster here"],
      zones: [{ lat: 35.555, lng: -80.885, r: 2600, tip: "Brawley School Peninsula", tipShort: "Brawley", dir: "top" }, { lat: 35.592, lng: -80.925, r: 2200, tip: "West Mooresville & NC-150", tipShort: "NC-150", dir: "right" }],
      why: "Long peninsulas lined with lakefront homes, minutes from I-77 Exits 33–36, Mooresville's restaurants and Lowe's HQ.",
      season: "Summer lake weeks, race weekends, family reunions.",
      matters: "About typical overall (Brawley " + fmtX(b.idx) + ", west Mooresville " + fmtX(w.idx) + "); the Brawley peninsula mixes in many lake-view and inland homes, which pull it down." },
    { id: "catawba", name: "Sherrills Ford & Terrell", kind: "catawba", tags: ["Almost all waterfront", "Longer drive to Charlotte"],
      zones: [{ lat: 35.582, lng: -80.985, r: 2600, tip: "Sherrills Ford & Terrell", tipShort: "Sherrills Ford", dir: "left" }],
      why: "Quieter coves on the Catawba County side, reached over the NC-150 bridge; no county occupancy tax or STR zoning found.",
      season: "Summer and boating season.",
      matters: "Terrell by the bridge leads (" + fmtX(t.idx) + ", few homes); Sherrills Ford west is about typical (" + fmtX(s.idx) + ")." },
    { id: "lincoln", name: "Denver & Westport", kind: "lincoln", tags: ["Closest west-shore drive to Charlotte", "More inland homes"],
      zones: [{ lat: 35.52, lng: -80.99, r: 2400, tip: "Denver & Westport", tipShort: "Denver", dir: "left" }],
      why: "The Lincoln County shore off NC-16 and NC-73, a straight run to Charlotte and the airport.",
      season: "Summer; flatter than the north.",
      matters: "Below typical (" + fmtX(d.idx) + "), with more inland homes; Denver listings grew 48% in a year (AirROI, modelled)." },
    { id: "meck", name: "Cornelius, Davidson & Huntersville", kind: "meck", tags: ["Closest to Charlotte", "Rules restrict whole homes"],
      zones: [{ lat: 35.465, lng: -80.885, r: 2600, tip: "Cornelius & Davidson", tipShort: "Cornelius", dir: "right" }],
      why: "Birkdale Village, Davidson College and the I-77 corridor; about 30 minutes to Uptown (free-flow).",
      season: "Flatter year-round demand (business, college, Charlotte events).",
      matters: "About typical (" + fmtX(m.idx) + ") but mostly small inland homes: Cornelius bars whole-home rentals in its residential districts." },
    { id: "north", name: "North end & State Park", kind: "north", tags: ["Remote", "Waterfront"],
      zones: [{ lat: 35.665, lng: -80.955, r: 2400, tip: "North end & State Park", tipShort: "North end", dir: "top" }],
      why: "The narrow north arms by Lake Norman State Park: beach, trails, camping.",
      season: "Summer.",
      matters: "Above typical (" + fmtX(n.idx) + ", " + n.n + " homes) despite the longest drives to Charlotte." },
  ];
}
const DEST_POINTS = [
  [35.66153, -80.94654, "Lake Norman State Park", "#7A5C2E"], [35.58384, -80.81108, "Downtown Mooresville", "#C0473F"], [35.59518, -80.96301, "NC-150 bridge", "#2E7D6B"],
  [35.44563, -80.8794, "Birkdale Village", "#8B5FA7"], [35.50322, -80.83393, "Davidson College", "#8B5FA7"], [35.62204, -80.79163, "Team Penske", "#C0473F"],
];
// AirROI modelled monthly RevPAR, Mooresville, Aug 2025-Jul 2026: Jan 127, Feb 143, Mar 192, Apr 214, May 254, Jun 352, Jul 283, Aug 362, Sep 220, Oct 203, Nov 206, Dec 189.
const DEST_SEASON = {
  months: ["low", "low", "mid", "mid", "high", "peak", "peak", "peak", "mid", "mid", "mid", "mid"],
  marks: ["", "", "", "", "Coca-Cola 600", "", "July 4th", "", "Labor Day", "Race weekend", "", ""],
  legend: [["peak", "June–August"], ["high", "May"], ["mid", "Spring and fall"], ["low", "January–February"]],
  caption: "Bands from AirROI's modelled monthly revenue per available night for Mooresville (third-party estimates, Aug 2025–Jul 2026): $127 in January to $362 in August. The Mecklenburg shore is much flatter.",
};
const DEST_BRIDGE = [
  ["Guests come for the water: summer weeks on a dock, a boat and a pool.", "Underwrite waterfront homes with a dock, and add a pool and hot tub for 4BR+."],
  ["Charlotte and I-77 are the access, not the draw.", "Don't pay up for proximity to the highway or Uptown; avoid homes next to I-77."],
];
const DEST_SOURCES = [{ label: "AirROI Mooresville (modelled)", url: "https://www.airroi.com/airbnb-data/united-states/north-carolina/mooresville" }, { label: "NC Parks", url: "https://www.ncparks.gov/park-features/lake-norman-state-park" }];

// ---------------------------------------------------------------------------
// Section 5 — Demographics
// ---------------------------------------------------------------------------
const DEMOGRAPHICS_NOTE = () => {
  const b = DEMOGRAPHICS.byBedroom, s = b.find((r) => r.label === "1-2BR"), f = b.find((r) => r.label === "5BR"), M = DEMOGRAPHICS.marketWide;
  return "Review-derived signals, not verified demographics. Lake Norman is a group market: " + Math.round(M.group) + "% of reviews on the average listing come from group trips and " + Math.round(M.kids) + "% from stays with kids. Groups rise with size, from " + Math.round(s.group) + "% at 1–2BR to " + Math.round(f.group) + "% at 5BR, which is why large homes compete on pools, game rooms and docks.";
};

// ---------------------------------------------------------------------------
// Section 6 — Acquisition relevance
// ---------------------------------------------------------------------------
const ACQ_TEXT = {
  lede: "Where a whole-home short-term rental is allowed depends on the town or county, and then on the HOA. Rules below were checked against ordinance text or official pages where possible (2026-10-08); anything not verified is marked.",
  rulesNote: "North Carolina bars local rental registration programs (G.S. 160D-1207(c), Schroeder v. Wilmington, 2022) but allows zoning rules. Guest taxes = occupancy tax plus state and local sales tax (NCDOR, NCRLA 2024 profile).",
  hoa: "<p>No primary source confirmed an STR ban in any named Lake Norman community, so <strong>HOA status is unknown for every home</strong> until its declaration is read. North Carolina courts have struck down bans added by amendment when the original covenants were silent (NC Court of Appeals, 2024), but bans written into the original covenants are enforceable. Read each declaration before offer.</p>",
  sale: "<p><strong>Pending.</strong> Active, pending and sold 4BR+ listings (2,000+ sq ft under $500k; private-pool homes from $700k) were not available for this version: the listing portals block automated access. This section will be filled from an MLS or Redfin export, separating active, pending and sold homes, with HOA and rental eligibility per address.</p>",
};
const RULES = [
  { name: "Town of Mooresville", covers: "Mooresville town limits", status: "open", statusLabel: "No STR rules", detail: "The development ordinance (amended through May 2025) has no short-term or vacation rental use. 4% occupancy tax.", tax: "4% + 6.75% sales" },
  { name: "Iredell County (unincorporated)", covers: "Brawley School, Mount Mourne and peninsula areas outside town limits", status: "limited", statusLabel: "Rules on hold", detail: "2024 rules (zoning permit, 2 guests per bedroom + 2, 1 parking space per bedroom) are not enforced under a court order; a revision dropping the permit was reportedly drafted in January 2026.", tax: "6.75% sales (+ up to 6% district tax, levy unconfirmed)" },
  { name: "Town of Troutman", covers: "Troutman", status: "unknown", statusLabel: "Not verified", detail: "STR zoning not researched.", tax: "3% + 6.75% sales" },
  { name: "Catawba County", covers: "Sherrills Ford, Terrell (unincorporated)", status: "open", statusLabel: "No STR ordinance found", detail: "No county STR ordinance found; no county occupancy tax.", tax: "7% sales" },
  { name: "Lincoln County", covers: "Denver, Westport (unincorporated)", status: "open", statusLabel: "No STR ordinance", detail: "A 2023 STR ordinance was tabled; none adopted that we found.", tax: "3% + 7% sales" },
  { name: "Town of Cornelius", covers: "Cornelius", status: "closed", statusLabel: "Restricted", detail: "Rentals under 90 days need a permit and are allowed only in RP, NMX, TC and VC districts (and apartments in GR/NR); single-family homes in the residential districts are excluded (LDC, June 2025).", tax: "8% + 8.25% sales" },
  { name: "Davidson, Huntersville", covers: "Davidson, Huntersville", status: "unknown", statusLabel: "Likely restricted, unverified", detail: "Reported to exclude whole-home rentals under a month from residential areas; ordinance text not confirmed.", tax: "8% + 8.25% sales" },
];

// ---------------------------------------------------------------------------
// Section 7 — Conclusions
// ---------------------------------------------------------------------------
const CONCLUSIONS = {
  lede: () => "Based on " + MARKET_STATS.n + " reliable listings and " + (COMPSETS.tierCounts.A + COMPSETS.tierCounts.B) + " 4BR+ homes with usable performance data. Rankings are associations within comparable homes; underwrite each target against the named comps.",
  verdicts: () => {
    const pw = _set(SPW), nw = _set(SNW);
    return [
      { kind: "go", title: "Focus: 4–5BR waterfront with a private dock, plus a private pool", body: "The strongest set: median Revenue Potential " + fmtK(pw.summary.AB.rev_pot.median) + " (" + pw.summary.AB.n + " homes, reliable + lower-confidence) against " + fmtK(nw.summary.AB.rev_pot.median) + " for waterfront homes without a pool.",
        points: ["Submarkets, by how pool waterfront homes earn against typical: " + setByArea(SPW, 5).slice(0, 4).map((a) => a.area + " " + fmtX(a.idx) + " (" + a.n + ")").join(", ") + ". All are small groups; The Point is a gated golf community, so check its HOA first.", "Add a hot tub (about " + fmtX(_prem("AB", "hot_tub")) + ") and heat the pool to stretch the season.", "Check cove depth for the winter drawdown and the HOA declaration before offer."] },
      { kind: "watch", title: "Value play: waterfront 4BR without a pool", body: "The deepest comp set (" + nw.summary.AB.n + " homes) and the most likely to fit a lower budget; a pool or hot tub can be added if the lot and HOA allow.",
        points: ["Prefer homes with their own dock; avoid steep or shallow lots.", "Denver & Westport is closest to Charlotte on the west shore but earns below typical."] },
      { kind: "avoid", title: "Avoid: inland, lake-view, I-77 and Cornelius", body: "Off-water homes earn below typical for their size, a view or nearby launch does not close the gap, homes within 1 km of I-77 earn least, and Cornelius bars whole-home rentals in its residential districts.",
        points: ["Inland 4BR+ comps are thin; only buy inland with a strong pool and amenity package."] },
    ];
  },
  comps: () => {
    const ids = (COMPSETS.strong[SPW] || []).slice(0, 3).concat((COMPSETS.strong[SNW] || []).slice(0, 3));
    return "<ul>" + ids.map((id) => COMPSETS.listings.find((l) => l.id === id)).filter(Boolean).map((l) => "<li><a href=\"" + escapeHtml(l.url) + "\" target=\"_blank\" rel=\"noopener\">" + escapeHtml(l.title) + "</a> (" + l.set + ", " + l.br + "BR, " + escapeHtml(l.area) + "): " + fmtK(l.rev_pot) + ", " + fmtCurrency(l.revpan) + " per available night. " + escapeHtml(l.why) + "</li>").join("") +
      "</ul><p class=\"caption\">The full ranked lists by set are in Section 3. The top private-pool waterfront comps are outliers (2–5× typical for their size): treat them as a ceiling, not the base case.</p>";
  },
  evidence: () => "<ul><li>Lake position, within size: " + fmtX(_ls("All sizes", WFD).idx) + " waterfront with dock vs " + fmtX(_ls("All sizes", INL).idx) + " inland (Section 2).</li>" +
    "<li>Private pool among 4BR+ waterfront homes: " + fmtX(_prem("A", "pool_wf")) + " on reliable homes, " + fmtX(_prem("AB", "pool_wf")) + " with lower-confidence homes, " + _pct(_adj("AB", "private_pool").pct) + " after adjustment (Section 3).</li>" +
    "<li>Access factors (Charlotte, I-77, towns, launches, marinas) show no consistent link (Section 2).</li>" +
    "<li>Limits: performance figures are provider estimates; the reliable sample under-represents large, lightly reviewed homes; sale data and HOA status are not yet in hand.</li></ul>",
};

const METHOD = () => {
  const Q = COMPSETS.classAgreement;
  return "<dl class=\"defs\">" +
    "<dt>Revenue Potential</dt><dd>The data provider's estimate of a full year's revenue at the home's observed rate and occupancy (about RevPAN × 365).</dd>" +
    "<dt>12-month revenue</dt><dd>Estimated booked revenue over the last 12 months (ADR × occupancy × available nights). Part-year homes look low on this measure.</dd>" +
    "<dt>ADR / occupancy / RevPAN</dt><dd>Average rate on booked nights; booked ÷ available nights; revenue per available night (ADR × occupancy). All estimated from observed calendars, not booking records.</dd>" +
    "<dt>vs. typical</dt><dd>A home's Revenue Potential ÷ the median for reliable homes with the same bedroom count.</dd>" +
    "<dt>Waterfront, dock, pool, hot tub</dt><dd>From each listing's text, two independent reviews (" + Q.agreed + " of " + Q.n + " agreed on all six fields; " + Q.adjudicated + " adjudicated). Waterfront = the home's own lot is on the Lake Norman shoreline; private dock = for this home only; community pools and pool tables never count.</dd>" +
    "<dt>Areas</dt><dd>Ward clusters of listing coordinates within each county shore, named from reverse-geocoded listings.</dd>" +
    "<dt>Drive times</dt><dd>OSRM public router, free-flow, from approximate pins snapped to the nearest road (all within 315 m).</dd>" +
    "<dt>Sources</dt><dd>STRSearch workbook “East Lake Norman - NC” (snapshot " + COMPSETS.snapshot + "); OpenStreetMap (lake outline, roads, launches, marinas); Visit NC, NC Parks, NCDOT, NCWRC, Duke Energy, town and county ordinances, NCRLA 2024 occupancy-tax profile; AirROI (modelled market figures). Research checked 2026-10-08.</dd></dl>";
};
