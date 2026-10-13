#!/usr/bin/env python3
"""Regenerate assets/js/dealers.js from the sheets in docs/.

    python3 dealers_from_xlsx.py

Two sources, because neither alone is enough:

  docs/private/exported_users.xlsx   the corporate export. Authoritative for
      which stores exist and for their addresses, phones and ZIPs. Carries
      dealer owners' names, their emails and internal coach assignments, so it
      is gitignored and none of those columns are ever written out.

  docs/BoxDrop_US_Locations.xlsx     the public store locator. Authoritative
      for the name each store actually trades under, which the corporate
      export does not hold in any usable column.

Stores are joined on city and state. A store with no match keeps a name
derived from its city. Three rows are dropped: two with no street address
that are not stores, and one test record.

factor, hoursSet and imgSet are not in either sheet and are derived from the
store id, so a store keeps the same floor price and opening hours across
re-imports rather than being reshuffled.
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
 'NJ':(40.1,-74.7),
}
NAME = {
 'AL':'Alabama','AR':'Arkansas','AZ':'Arizona','CA':'California','CO':'Colorado','CT':'Connecticut',
 'FL':'Florida','GA':'Georgia','IA':'Iowa','ID':'Idaho','IL':'Illinois','IN':'Indiana','KS':'Kansas',
 'KY':'Kentucky','LA':'Louisiana','MA':'Massachusetts','MD':'Maryland','ME':'Maine','MI':'Michigan',
 'MN':'Minnesota','MO':'Missouri','MS':'Mississippi','MT':'Montana','NC':'North Carolina',
 'ND':'North Dakota','NE':'Nebraska','NH':'New Hampshire','NM':'New Mexico','NV':'Nevada',
 'NY':'New York','OH':'Ohio','OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island',
 'SC':'South Carolina','SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VA':'Virginia',
 'WA':'Washington','WI':'Wisconsin','WV':'West Virginia','NJ':'New Jersey',
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


def norm_city(c):
    """Corporate writes some cities in capitals."""
    c = c.strip()
    return c.title() if c.isupper() else c


def join_key(city, state):
    return (re.sub(r'[^a-z]', '', city.lower()), state.strip().upper())


def public_names(path):
    """Trading names from the public locator, keyed by city and state."""
    if not path.exists():
        return {}
    header, data = rows(path)
    c_state = pick(header, 'state')
    c_city = pick(header, 'city')
    c_name = pick(header, 'store name')
    c_url = pick(header, 'website', 'location page')
    out = {}
    for r in data:
        name = r.get(c_name, '').strip()
        if name:
            out.setdefault(join_key(r.get(c_city, ''), r.get(c_state, '')),
                           (name, r.get(c_url, '').strip() if c_url else ''))
    return out


def main():
    corp = ROOT / 'docs' / 'private' / 'exported_users.xlsx'
    if not corp.exists():
        sys.exit(f'No corporate export at {corp}\n'
                 'Drop it there (the folder is gitignored) and run again.')

    names = public_names(ROOT / 'docs' / 'BoxDrop_US_Locations.xlsx')
    header, data = rows(corp)
    col = {k: pick(header, k) for k in ('location', 'address', 'city', 'state', 'zip', 'phone')}
    missing = [k for k, v in col.items() if v is None]
    if missing:
        sys.exit(f'Columns not found: {", ".join(missing)}\nHeaders seen: {list(header)}')

    seen, out = {}, []
    dropped, matched, derived = [], 0, 0
    for r in data:
        city = norm_city(r.get(col['city'], ''))
        st = r.get(col['state'], '').strip().upper()
        street = r.get(col['address'], '').strip()
        loc = r.get(col['location'], '').strip()

        if not street:                       # the two rows that are not stores
            dropped.append(loc or city)
            continue
        if st not in CENTRE:                 # the test record sits in state 'ST'
            dropped.append(f'{loc or city} [state {st!r}]')
            continue

        # Excel drops the leading zero on New England and NJ ZIPs.
        zp = re.sub(r'[^0-9]', '', r.get(col['zip'], ''))
        zp = zp.zfill(5) if 0 < len(zp) <= 5 else zp[:5]

        hit = names.get(join_key(city, st))
        if hit:
            name, url = hit
            matched += 1
        else:
            name, url = f'BoxDrop {city}', ''
            derived += 1

        base = (st + '-' + re.sub(r'[^a-z0-9]+', '-', city.lower())).strip('-')
        seen[base] = seen.get(base, 0) + 1
        did = base if seen[base] == 1 else f'{base}-{seen[base]}'

        addr = ', '.join(x for x in [street, city, st + (' ' + zp if zp else '')] if x)
        out.append(
            "  { id:'%s', name:'%s', city:'%s', state:'%s', zip:%s,\n"
            "    addr:'%s', phone:'%s', url:'%s', factor:%.2f, hoursSet:%d, imgSet:%d }," % (
                esc(did), esc(brand(name)), esc(city), st,
                ("'%s'" % zp) if zp else 'null',
                esc(addr), esc(r.get(col['phone'], '').strip()), esc(url),
                0.81 + (h(did, 'f') % 9) / 100.0, h(did, 'h') % 4, h(did, 'i') % 8))

    states = sorted({l.split("state:'")[1].split("'")[0] for l in out})
    centres = ',\n'.join("    %s:{name:'%s',lat:%s,lng:%s}" % (k, NAME[k], v[0], v[1])
                          for k, v in sorted(CENTRE.items()) if k in states)
    js = """/* BoxDrop store network. GENERATED - do not edit by hand.
   Run: python3 dealers_from_xlsx.py

   %d stores in %d states. Which stores exist, and their addresses, phones
   and ZIPs, come from the corporate export. The name each one trades under
   comes from the public store locator, joined on city and state; %d matched
   and %d fall back to their city. Nothing from the corporate export's Name,
   Email or Coach columns is written here: those are dealer owners and staff.

   Neither sheet holds coordinates, opening hours or pricing, so no per store
   coordinates are invented. factor, hoursSet and imgSet are derived from the
   store id: stable across re-imports, and prototype data. The state centres
   below serve the locator's map, which plots one tile per state. */
(function () {
  'use strict';

  window.BD_STATES = {
%s
  };

  window.BD_DEALERS = [
%s
  ];
})();
""" % (len(out), len(states), matched, derived, centres, '\n'.join(out))

    dest = ROOT / 'assets' / 'js' / 'dealers.js'
    dest.write_text(js)
    print(f'  {dest.relative_to(ROOT)}')
    print(f'    {len(out)} stores, {len(states)} states')
    print(f'    names: {matched} from the public locator, {derived} derived from city')
    if dropped:
        print(f'    dropped {len(dropped)}: ' + '; '.join(dropped))


if __name__ == '__main__':
    main()
