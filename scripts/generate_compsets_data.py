"""Write js/compsets_data.js (COMPSETS, FACTORS, FACTORS_BIG, DRIVE_TABLE)
from ../notebooks/lkn_analysis.py. Lake Norman only; run after
generate_webpage_data.py. Do not hand-edit the output."""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / "notebooks"))
import lkn_analysis as la  # noqa: E402
import market_common as mc  # noqa: E402

SET_COLORS = {"Private pool + waterfront": "#075646", "Private pool + non-waterfront": "#5f9e8f",
              "No private pool + waterfront": "#3C6E9E", "No private pool + non-waterfront": "#d99132"}


def r0(v):
    return None if v is None or (isinstance(v, float) and np.isnan(v)) else int(round(v))


def why(r):
    bits = []
    if r.waterfront_yes:
        bits.append("waterfront with its own dock" if r.private_dock else "waterfront (dock shared or not stated)")
    elif r.lake_relation in ("lake_view", "lake_access"):
        bits.append({"lake_view": "lake views", "lake_access": "lake access nearby"}[r.lake_relation] + ", not waterfront")
    else:
        bits.append("inland")
    if r.private_pool:
        bits.append("heated private pool" if r.heated_pool else "private pool")
    elif r.community_pool:
        bits.append("community pool only")
    if r.private_hot_tub:
        bits.append("hot tub")
    if r.watercraft:
        bits.append("boats or watercraft for guests")
    if r.positioning in ("luxury_estate", "upscale"):
        bits.append({"luxury_estate": "positioned as a luxury estate", "upscale": "upscale finish"}[r.positioning])
    if not pd.isna(r.sqft):
        bits.append(f"{int(r.sqft):,} sq ft")
    bits.append(f"{int(r.min_launch)} min to a public launch" if not r.waterfront_yes else f"{int(r.min_i77)} min to I-77")
    s = "; ".join(bits)
    return s[0].upper() + s[1:] + "."


def main():
    df = la.prep()
    big = df[df["bedrooms"] >= 4].copy()
    setmed = big[big["tier"].isin(["A", "B"])].groupby("core_set")["rev_pot"].median().to_dict()
    big["flags"] = [la.flags(r, setmed) for r in big.itertuples()]

    sets = []
    for s in mc.CORE_SETS:
        d = big[big["core_set"].eq(s) & big["class_flag"].ne("waterfront unclear")]
        sets.append({"name": s, "color": SET_COLORS[s],
                     "tierCounts": {t: int((d["tier"] == t).sum()) for t in "ABC"},
                     "summary": {"A": la.summary(d[d["tier"] == "A"]), "AB": la.summary(d[d["tier"].isin(["A", "B"])])}})

    listings = []
    for r in big.itertuples():
        listings.append({
            "id": r.pid, "title": str(r.title), "url": r.url, "area": r.Area, "areaId": mc.AREA_SHORT[r.Area], "side": r.side,
            "br": int(r.bedrooms), "size": r.size, "sleeps": int(r.sleeps), "baths": float(r.baths), "sqft": r0(r.sqft),
            "set": r.core_set, "waterfront": r.waterfront, "dockWf": r.dock_wf, "lakeRel": r.lake_rel_nonwf, "heat": r.heat,
            "hotTub": r.hot_tub_label, "communityPool": bool(r.community_pool), "watercraft": bool(r.watercraft), "positioning": r.positioning,
            "tier": r.tier, "rev_pot": r0(r.rev_pot), "revenue": r0(r.revenue), "adr": r0(r.adr), "occ": round(float(r.occ), 3),
            "revpan": r0(r.revpan), "avail": r0(r.avail), "idx": round(float(r.idx), 2),
            "minUptown": r0(r.min_uptown), "minI77": r0(r.min_i77), "minLaunch": r0(r.min_launch), "shoreKm": round(float(r.shore_km), 2),
            "pinInLake": bool(r.pin_in_lake), "lat": round(float(r.Lat), 5), "lng": round(float(r.Long), 5),
            "flags": r.flags, "why": why(r), "classSource": r.source, "confidence": r.confidence,
            "waterEvidence": str(r.water_evidence)[:220], "poolEvidence": str(r.pool_evidence)[:220],
        })

    # strongest comps: reliable first, full-year operators, no classification doubts
    strong = {}
    for s in mc.CORE_SETS:
        d = big[big["core_set"].eq(s) & big["class_flag"].eq("") & big["avail"].ge(240)]
        pick = d[d["tier"] == "A"].sort_values("idx", ascending=False).head(5)
        if len(pick) < 3:
            pick = pd.concat([pick, d[d["tier"] == "B"].sort_values("idx", ascending=False).head(5 - len(pick))])
        strong[s] = list(pick["pid"])

    flag_keys = {
        "tierB": lambda f: any(x.startswith("lower-confidence") for x in f),
        "tierC": lambda f: any(x.startswith("new or barely") for x in f),
        "partyear": lambda f: any(x.startswith("part-year") for x in f),
        "occhigh": lambda f: any(x.startswith("very high occupancy") for x in f),
        "occlow": lambda f: any(x.startswith("very low occupancy") for x in f),
        "outlier": lambda f: any(x.startswith("revenue more than 3x") for x in f),
        "pinfar": lambda f: any(x.startswith("called waterfront but pin") for x in f),
        "pinshore": lambda f: any(x.startswith("pin on the shoreline") for x in f),
        "wfunclear": lambda f: "waterfront unclear" in f,
        "poolunclear": lambda f: "pool unclear" in f,
        "lowconf": lambda f: "low-confidence classification" in f,
        "nosqft": lambda f: "square footage not stated" in f,
    }
    flag_counts = {k: int(sum(fn(f) for f in big["flags"])) for k, fn in flag_keys.items()}

    payload = {
        "snapshot": mc.SNAPSHOT,
        "n4": int(len(big)), "tierCounts": {t: int((big["tier"] == t).sum()) for t in "ABC"},
        "sets": sets, "listings": listings, "strong": strong, "flagCounts": flag_counts,
        "premiums": {"A": la.premiums(big, ["A"]), "AB": la.premiums(big, ["A", "B"])},
        "adjusted": {"A": la.adjusted_premiums(big, ["A"]), "AB": la.adjusted_premiums(big, ["A", "B"])},
        "classAgreement": json.loads((ROOT.parent / "notebooks" / "classification_qa.json").read_text()) if (ROOT.parent / "notebooks" / "classification_qa.json").exists() else None,
        "unclear": {"waterfront": int(big["class_flag"].eq("waterfront unclear").sum()), "pool": int(big["class_flag"].eq("pool unclear").sum())},
        "communityPool4": int(big["community_pool"].sum()), "inlandShare4": round(float((~big["waterfront_yes"]).mean() * 100), 1),
    }

    rel = df[df["reliable"]]
    factors = la.factor_screens(rel)
    # second view: 4BR+ waterfront homes (reliable + lower-confidence), where most of the supply is
    factors_big = la.factor_screens(big[big["tier"].isin(["A", "B"]) & big["waterfront_yes"]])
    drive = []
    for a in mc.AREA_ORDER:
        d = df[df["Area"] == a]
        drive.append({"area": a, "color": mc.AREA_COLORS[a], "n": int(len(d)), "crow": round(float(d["crow_uptown_km"].median()), 1),
                      "uptown": int(round(d["min_uptown"].median())), "clt": int(round(d["min_clt"].median())),
                      "i77": int(round(d["min_i77"].median())), "launch": int(round(d["min_launch"].median())),
                      "arterial": int(round(d["arterial_km"].lt(0.3).mean() * 100))})
    ratio = (df["min_uptown"] / df["crow_uptown_km"])
    drive_meta = {"minPerKmMedian": round(float(ratio.median()), 2), "nSnapOver300": int((df["snap_m"] > 300).sum()),
                  "pinsInLake": int(df["pin_in_lake"].sum()), "n": int(len(df))}

    out = ["/**", " * AUTO-GENERATED by scripts/generate_compsets_data.py from ../notebooks/lkn_analysis.py. Do not hand-edit.", " */",
           f"const COMPSETS = {json.dumps(payload, ensure_ascii=False)};",
           f"const FACTORS = {json.dumps(factors, ensure_ascii=False)};",
           f"const FACTORS_BIG = {json.dumps(factors_big, ensure_ascii=False)};",
           f"const DRIVE_TABLE = {json.dumps(drive, ensure_ascii=False)};",
           f"const DRIVE_META = {json.dumps(drive_meta)};"]
    (ROOT / "js" / "compsets_data.js").write_text("\n".join(out) + "\n")
    print(f"wrote js/compsets_data.js ({len(listings)} 4BR+ listings)")


if __name__ == "__main__":
    main()
