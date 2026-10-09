# Lake Norman, NC — STR Market, Location & 4BR+ Comp-Set Analysis

Static site (no build step), extending the Galveston / Bend / Gulf Shores / Boone template with a 4BR+ comp-set explorer, location-factor screens, acquisition notes and conclusions.

## Pipeline

1. `../notebooks/market_common.py`: loads `../East Lake Norman - NC.xlsx` (snapshot 2026-10-07; covers every shore despite its name), keeps entire homes within 5 km of the Lake Norman shoreline (OSM relation 299512, `lake_norman_osm.json`), assigns 10 Ward-clustered areas within each county shore, adds location variables (OSRM free-flow drive times cached in `drive_times.json`, OSM major roads in `major_roads_osm.json`) and the reviewed classes in `listing_classification.csv`.
2. `listing_classification.csv`: pool (private / community / none), heated pool, true waterfront, dock (private / shared), lake view or access, hot tub, square footage, positioning, watercraft, from each listing's own text. Two independent reviews of all 831 listings plus adjudication of the 41 disagreements (`classification_qa.json`).
3. `python ../notebooks/build_overview_notebook.py` + `jupyter nbconvert --execute` (shared builder, reliable listings) → `region_stats.json` and the folium map; then `python scripts/generate_webpage_data.py` → `js/region_data.js`.
4. `python scripts/generate_compsets_data.py` (uses `../notebooks/lkn_analysis.py`) → `js/compsets_data.js`: 4BR+ comp sets, premiums within comparable homes, adjusted cross-check, factor screens, drive-time table, flags, strongest comps.

## Data tiers

- **Reliable** (205): the provider's Good / Possibly Good review-history test.
- **Lower-confidence** (186 4BR+): failed that test but clearly operating (180+ available nights, 8+ months of reviews, 5+ reviews). Many large lake homes land here.
- **Supply only** (182 4BR+): new or barely active; never used for performance.

All performance figures are the data provider's estimates from observed calendars; no advertised prices are used. AirROI figures are third-party models.

## Not yet included

Sale data (active / pending / sold 4BR+ homes, the under-$500k and $700k+ private-pool searches) needs an MLS or Redfin export; HOA status is unknown per home.
