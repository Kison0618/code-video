"""Narration-only transcript from L_vN.json (bottom / top caption band), as markdown.
usage: WORK=work/ python3 transcript.py v1 v2 ... > 字幕转写.md"""
import os, sys, json
S = os.environ.get("WORK", "work/")
for v in sys.argv[1:]:
    L = json.load(open(f"{S}an/L_{v}.json"))
    rows = [s for s in L["sub"] if len(s["n"]) >= 5 and s["h"] >= 40 and (s["y"] > 860 or 80 < s["y"] < 140)]
    out = []
    for s in rows:
        # drop partial typing states that are prefixes of the next/previous kept line
        if out and (out[-1]["n"] in s["n"] or s["n"] in out[-1]["n"]) and s["start"] - out[-1]["start"] < 4:
            if len(s["n"]) > len(out[-1]["n"]): out[-1] = s
            continue
        out.append(s)
    print(f"## {v}\n")
    for s in out: print(f"- `{s['start']:6.1f}s` {s['text']}")
    print()
