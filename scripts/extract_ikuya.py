#!/usr/bin/env python3
"""Extract one phase of Ikuya Mitty's mitigation sheet into data/mitigation/p<N>.ikuya.json.

Usage: python3 -I scripts/extract_ikuya.py <phase>

Reads docs/source/ikuya-mitty-v*.xlsx (stdlib only) and the hand-authored overlay
data/mitigation/p<N>.overlay.json (sheet/column map, typo aliases). Output is generated:
do not edit it by hand. Rules:
  - Times are taken from cells only (stored as h:mm, meaning m:ss); nothing is interpolated.
  - A line starting with ➔ is a carry-over, never a press. Its origin is the earlier event in
    the same sheet and slot where that ability was pressed (chains are followed to the origin).
  - Superscript footnote markers stay attached to the ability (or event name) they follow.
  - "(GNB/DRK)"-style suffixes become a job variant on that ability.
Exits non-zero if any carry-over has no origin or any footnote marker has no definition.
"""
import glob, json, re, sys, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹"
ARROW = "➔"

phase = int(sys.argv[1])
overlay = json.loads((ROOT / f"data/mitigation/p{phase}.overlay.json").read_text(encoding="utf-8"))
aliases = overlay.get("aliases", {})
xlsx = sorted(glob.glob(str(ROOT / "docs/source/ikuya-mitty-v*.xlsx")))[-1]
version = re.search(r"v([\d.]+)\.xlsx$", xlsx).group(1)
z = zipfile.ZipFile(xlsx)
strings = ["".join(t.text or "" for t in si.iter("{%s}t" % NS["m"]))
           for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)]

def cells(sheet_file):
    root = ET.fromstring(z.read(f"xl/worksheets/{sheet_file}.xml"))
    out = {}
    for c in root.iter("{%s}c" % NS["m"]):
        v = c.find("m:v", NS)
        if v is None:
            continue
        out[c.get("r")] = strings[int(v.text)] if c.get("t") == "s" else v.text
    return out

def mmss(raw):
    total = round(float(raw) * 24 * 60)  # h:mm cell value read as m:ss
    return f"{total // 60}:{total % 60:02d}"

def split_markers(token):
    token = token.strip()
    markers = []
    while token and token[-1] in SUP:
        markers.insert(0, token[-1]); token = token[:-1].rstrip()
    return token, markers

def parse_ability(token):
    token = token.strip()
    for bad, good in aliases.items():
        token = token.replace(bad, good)
    name, markers = split_markers(token)
    variant = None
    m = re.search(r"\s*\(((?:[A-Z]{3}/)*[A-Z]{3})\)$", name)
    if m:
        variant = m.group(1).split("/"); name = name[: m.start()].strip()
    name, more = split_markers(name)
    return {"ability": name, "jobVariant": variant, "footnotes": more + markers}

def footnote_table(text):
    table, general = {}, []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line[0] in SUP:
            table[line[0]] = line[1:].strip()
        else:
            general.append(line)
    return table, general

result = {"generatedBy": "scripts/extract_ikuya.py", "source": Path(xlsx).name, "sheetVersion": version,
          "phase": phase, "sheets": {}, "events": [], "entries": []}
errors = []

for key, sh in overlay["sheets"].items():
    c = cells(sh["file"])
    fn, general = footnote_table(c.get(sh["notesCell"], ""))
    result["sheets"][key] = {"name": sh["name"], "footnotes": fn, "notes": general}
    cols = overlay["columns"][key]
    prefix = "ik-p" if key == "phase" else "ik-ot-p"
    pressed = {}  # (slot, ability, variant) -> origin event id
    for row in range(sh["firstRow"], sh["lastRow"] + 1):
        name_raw = c.get(f"B{row}")
        if not name_raw or name_raw.strip() == "Notes":
            continue
        name, ev_markers = split_markers(name_raw)
        tc = sh["timeColumns"]
        t_abs = mmss(c[f"{tc['absolute']}{row}"])
        t_rel = mmss(c[f"{tc['phaseRelative']}{row}"]) if "phaseRelative" in tc else None
        eid = f"{prefix}{phase}-{t_abs.replace(':', '').zfill(4)}"
        result["events"].append({"id": eid, "sheet": key, "row": row, "name": name, "footnotes": ev_markers,
                                 "time": {"absolute": t_abs, "phaseRelative": t_rel, "cells": [f"{v}{row}" for v in tc.values()]}})
        for marker in ev_markers:
            if marker not in fn: errors.append(f"{sh['name']}!B{row}: footnote {marker} has no definition")
        for col, slot in cols.items():
            raw = c.get(f"{col}{row}")
            if not raw or not raw.strip():
                continue
            for line in raw.split("\n"):
                line = line.strip()
                if not line:
                    continue
                if slot == "Extras":  # meaning not defined by the sheet; keep as a raw flag
                    result["entries"].append({"eventId": eid, "slot": slot, "action": "flag", "ability": line,
                                              "jobVariant": None, "footnotes": [], "cell": f"{sh['name']}!{col}{row}", "raw": raw})
                    continue
                carry = line.startswith(ARROW)
                body = line[1:].strip() if carry else line
                for tok in body.split(" + "):
                    a = parse_ability(tok)
                    entry = {"eventId": eid, "slot": slot, "action": "carry-over" if carry else "press", **a,
                             "cell": f"{sh['name']}!{col}{row}", "raw": raw}
                    k = (slot, a["ability"], tuple(a["jobVariant"] or ()))
                    if carry:
                        origin = pressed.get(k)
                        if origin is None:
                            errors.append(f"{entry['cell']}: carry-over of '{a['ability']}' has no earlier press in slot {slot}")
                        entry["carriedFromEventId"] = origin
                    else:
                        pressed[k] = eid
                    for marker in a["footnotes"]:
                        if marker not in fn: errors.append(f"{entry['cell']}: footnote {marker} has no definition")
                    result["entries"].append(entry)

out = ROOT / f"data/mitigation/p{phase}.ikuya.json"
out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
if errors:
    print("\n".join(errors), file=sys.stderr); sys.exit(1)
print(f"Wrote {out.relative_to(ROOT)}: {len(result['events'])} events, {len(result['entries'])} entries (sheet v{version})")
