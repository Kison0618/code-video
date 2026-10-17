"""From o_vN.json build narration-line timeline + big-text timeline; join with SFX events and BGM grid.
usage: lines.py vN  -> prints report, writes an/L_vN.json"""
import sys, json, re, difflib
import os
S = os.environ.get("WORK", "work/")  # 中间结果目录（an/、sfx/）
v = sys.argv[1]
O = json.load(open(f"{S}an/o_{v}.json"))
def norm(s): return re.sub(r"[\s·\.。，,、；;：:！!？?“”\"「」『』—\-…]", "", s)

def track(pred):
    """collect items matching pred into spans; typing-in (prefix growth) merges into one line"""
    spans = []
    for fr in O:
        t = fr["t"]
        for it in fr["items"]:
            if not pred(it): continue
            n = norm(it["text"])
            if len(n) < 2: continue
            hit = None
            for s in reversed(spans[-12:]):
                if t - s["end"] > 1.6: continue
                a, b = s["n"], n
                if a == b or a.startswith(b) or b.startswith(a) or difflib.SequenceMatcher(None, a, b).ratio() > 0.8:
                    hit = s; break
            if hit:
                hit["end"] = t
                if len(n) >= len(hit["n"]): hit["n"], hit["text"] = n, it["text"]
            else:
                spans.append(dict(start=t, end=t, n=n, text=it["text"], y=it["y"], h=it["h"]))
    return [s for s in spans if s["end"] - s["start"] >= 0.5 or len(s["n"]) > 6]

sub = track(lambda it: 30 <= it["h"] <= 62 and len(it["text"]) >= 4)
big = track(lambda it: it["h"] > 62)
for s in sub + big: s["end"] += 0.5
sub.sort(key=lambda s: s["start"]); big.sort(key=lambda s: s["start"])
json.dump(dict(sub=sub, big=big), open(f"{S}an/L_{v}.json", "w"), ensure_ascii=False, indent=1)
for s in sub: print(f"{s['start']:6.1f}-{s['end']:6.1f} y{s['y']:4d} h{s['h']:3d} {s['text']}")
print("--- big text")
for s in big: print(f"{s['start']:6.1f}-{s['end']:6.1f} y{s['y']:4d} h{s['h']:3d} {s['text']}")
