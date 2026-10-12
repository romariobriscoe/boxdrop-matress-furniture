#!/usr/bin/env python3
"""Regenerate assets/js/dealers.js from the spreadsheet in docs/.

    python3 dealers_from_xlsx.py          # uses docs/BoxDrop_US_Locations.xlsx
    python3 dealers_from_xlsx.py other.xlsx

Drop a newer export over the file in docs/, run this, then run build.py.

Expected columns, by header name on the first row of the first sheet:
    State · City · Store Name · Street Address · ZIP · Phone · Website / Location Page

Three fields are NOT in the sheet and are derived from the store id instead:
factor (the dealer's floor price multiplier), hoursSet and imgSet. Deriving
them from the id rather than at random means a store keeps the same price and
the same opening pattern across re-imports, so swapping the sheet does not
quietly reshuffle every price on the site.
"""
import hashlib
import pathlib
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

ROOT = pathlib.Path(__file__).parent
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

# Approximate geographic centre of each state, for the locator's map. Not in
# the sheet, and not per store: the map plots one tile per state.
CENTRE = {
 'AL':(32.8,-86.8),'AR':(34.9,-92.4),'AZ':(34.3,-111.7),'CA':(37.2,-119.3),'CO':(39.0,-105.5),
 'CT':(41.6,-72.7),'FL':(28.6,-82.4),'GA':(32.6,-83.4),'IA':(42.0,-93.5),'ID':(44.4,-114.6),
 'IL':(40.0,-89.2),'IN':(39.9,-86.3),'KS':(38.5,-98.4),'KY':(37.5,-85.3),'LA':(31.1,-92.0),
 'MA':(42.3,-71.8),'MD':(39.0,-76.8),'ME':(45.4,-69.2),'MI':(44.3,-85.4),'MN':(46.3,-94.3),
 'MO':(38.4,-92.5),'MS':(32.7,-89.7),'MT':(47.0,-109.6),'NC':(35.5,-79.4),'ND':(47.4,-100.5),
 'NE':(41.5,-99.8),'NH':(43.7,-71.6),'NM':(34.4,-106.1),'NV':(39.3,-116.6),'NY':(42.9,-75.5),
 'OH':(40.3,-82.8),'OK':(35.6,-97.5),'OR':(43.9,-120.6),'PA':(40.9,-77.8),'RI':(41.7,-71.6),
 'SC':(33.9,-80.9),'SD':(44.4,-100.2),'TN':(35.8,-86.4),'TX':(31.5,-99.3),'UT':(39.3,-111.7),
 'VA':(37.5,-78.9),'WA':(47.4,-120.5),'WI':(44.6,-89.7),'WV':(38.6,-80.6),
}
NAME = {
 'AL':'Alabama','AR':'Arkansas','AZ':'Arizona','CA':'California','CO':'Colorado','CT':'Connecticut',
 'FL':'Florida','GA':'Georgia','IA':'Iowa','ID':'Idaho','IL':'Illinois','IN':'Indiana','KS':'Kansas',
 'KY':'Kentucky','LA':'Louisiana','MA':'Massachusetts','MD':'Maryland','ME':'Maine','MI':'Michigan',
 'MN':'Minnesota','MO':'Missouri','MS':'Mississippi','MT':'Montana','NC':'North Carolina',
 'ND':'North Dakota','NE':'Nebraska','NH':'New Hampshire','NM':'New Mexico','NV':'Nevada',
 'NY':'New York','OH':'Ohio','OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island',
 'SC':'South Carolina','SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VA':'Virginia',
 'WA':'Washington','WI':'Wisconsin','WV':'West Virginia',
}


def rows(path):
    """First worksheet as a list of dicts keyed by the header row."""
    z = zipfile.ZipFile(path)
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(NS + 'si'):
            shared.append(''.join(t.text or '' for t in si.iter(NS + 't')))
    sheets = sorted(n for n in z.namelist() if re.match(r'xl/worksheets/sheet\d+\.xml$', n))
    grid = []
    for row in ET.fromstring(z.read(sheets[0])).iter(NS + 'row'):
        cells = {}
        for c in row.findall(NS + 'c'):
            col = re.match(r'[A-Z]+', c.get('r')).group(0)
            v, t = c.find(NS + 'v'), c.get('t')
            if t == 'inlineStr':
                cells[col] = ''.join(x.text or '' for x in c.iter(NS + 't')).strip()
            elif v is None:
                cells[col] = ''
            elif t == 's':
                cells[col] = shared[int(v.text)].strip()
            else:
                cells[col] = (v.text or '').strip()
        grid.append(cells)
    if not grid:
        sys.exit('No rows found in the first worksheet.')
    header = {v.lower(): k for k, v in grid[0].items() if v}
    return header, grid[1:]


def pick(header, *names):
    for n in names:
        for key, col in header.items():
            if n in key:
                return col
    return None


def esc(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")


def brand(s):
    """The sheet spells the brand four ways; the site spells it one."""
    return re.sub(r'\bBox\s?Drop\b', 'BoxDrop', s, flags=re.I)


def h(*parts):
    return int(hashlib.sha256('|'.join(parts).encode()).hexdigest()[:8], 16)


def main():
    src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'docs' / 'BoxDrop_US_Locations.xlsx'
    if not src.exists():
        sys.exit(f'No spreadsheet at {src}')

    header, data = rows(src)
    col = {k: pick(header, k) for k in ('state', 'city', 'store name', 'street', 'zip', 'phone', 'website')}
    missing = [k for k, v in col.items() if v is None]
    if missing:
        sys.exit(f'Columns not found in {src.name}: {", ".join(missing)}\nHeaders seen: {list(header)}')

    seen, out, skipped = {}, [], 0
    for r in data:
        name = r.get(col['store name'], '')
        st = r.get(col['state'], '')
        city = r.get(col['city'], '')
        if not name or not st or not city:
            skipped += 1
            continue
        street = r.get(col['street'], '')
        zp = re.sub(r'[^0-9]', '', r.get(col['zip'], ''))[:5]
        phone = r.get(col['phone'], '')
        url = r.get(col['website'], '')

        base = (st + '-' + re.sub(r'[^a-z0-9]+', '-', city.lower())).strip('-')
        seen[base] = seen.get(base, 0) + 1
        did = base if seen[base] == 1 else f'{base}-{seen[base]}'

        addr = ', '.join(x for x in [street, city, st + (' ' + zp if zp else '')] if x)
        out.append(
            "  { id:'%s', name:'%s', city:'%s', state:'%s', zip:%s,\n"
            "    addr:'%s', phone:'%s', url:'%s', factor:%.2f, hoursSet:%d, imgSet:%d }," % (
                esc(did), esc(brand(name)), esc(city), st,
                ("'%s'" % zp) if zp else 'null',
                esc(addr), esc(phone), esc(url),
                0.81 + (h(did, 'f') % 9) / 100.0, h(did, 'h') % 4, h(did, 'i') % 8))

    states = sorted({l.split("state:'")[1].split("'")[0] for l in out})
    unknown = [s for s in states if s not in CENTRE]
    if unknown:
        print(f'  ! no map centre for: {", ".join(unknown)} — add them to CENTRE in this script')

    centres = ',\n'.join("    %s:{name:'%s',lat:%s,lng:%s}" % (k, NAME[k], v[0], v[1])
                         for k, v in sorted(CENTRE.items()))
    js = """/* BoxDrop store network. GENERATED — do not edit by hand.
   Run: python3 dealers_from_xlsx.py   (source: %s)

   %d stores in %d states. Store name, city, state, street address, ZIP,
   phone and location page come from that sheet. The one edit: the brand
   token inside a store name is normalised to BoxDrop, because the sheet
   spells it several ways. Names with no brand token are left as supplied.

   The sheet carries no coordinates, no opening hours and no pricing, so this
   file invents no per store coordinates. factor, hoursSet and imgSet are
   derived from the store id: stable across re-imports, and prototype data.
   The state centres below are for the locator's map, which plots one tile
   per state rather than a pin per store. */
(function () {
  'use strict';

  window.BD_STATES = {
%s
  };

  window.BD_DEALERS = [
%s
  ];
})();
""" % (src.name, len(out), len(states), centres, '\n'.join(out))

    dest = ROOT / 'assets' / 'js' / 'dealers.js'
    dest.write_text(js)
    print(f'  {dest.relative_to(ROOT)}  {len(out)} stores, {len(states)} states'
          + (f', {skipped} rows skipped' if skipped else ''))


if __name__ == '__main__':
    main()
