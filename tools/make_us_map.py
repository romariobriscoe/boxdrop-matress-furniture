#!/usr/bin/env python3
"""Turn US Census state boundaries into projected SVG paths for the locator.

    python3 tools/make_us_map.py [states-10m.json]

Source: the us-atlas build of the Census Bureau's cartographic boundary files,
which are public domain. Run once; the outline does not change. The output,
assets/js/usmap.js, is committed so the site has no runtime dependency and
nothing is fetched from another origin.

Albers conic equal-area, the standard projection for the contiguous states.
Alaska and Hawaii are left out: the network has no stores in either, and
splicing them in as insets would be geography the map does not need.
"""
import json
import math
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H, PAD = 960.0, 600.0, 8.0

ABBR = {
 'Alabama':'AL','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO',
 'Connecticut':'CT','Delaware':'DE','District of Columbia':'DC','Florida':'FL','Georgia':'GA',
 'Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY',
 'Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI',
 'Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE',
 'Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY',
 'North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR',
 'Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',
 'Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA',
 'West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
}

# Albers conic equal-area, the USGS parameters for the lower 48.
LON0, LAT0, LAT1, LAT2 = -96.0, 37.5, 29.5, 45.5
R = math.radians
_n = (math.sin(R(LAT1)) + math.sin(R(LAT2))) / 2
_C = math.cos(R(LAT1)) ** 2 + 2 * _n * math.sin(R(LAT1))
_rho0 = math.sqrt(_C - 2 * _n * math.sin(R(LAT0))) / _n


def albers(lon, lat):
    """Returns SVG coordinates: y is negated because the projection's y grows
    northward while an SVG's grows downward. Without that the map comes out
    upside down, with Seattle below Miami."""
    theta = _n * R(lon - LON0)
    rho = math.sqrt(max(0.0, _C - 2 * _n * math.sin(R(lat)))) / _n
    return rho * math.sin(theta), -(_rho0 - rho * math.cos(theta))


def decode(topo):
    """TopoJSON arcs are delta encoded against a shared quantisation grid."""
    sx, sy = topo['transform']['scale']
    tx, ty = topo['transform']['translate']
    out = []
    for arc in topo['arcs']:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        out.append(pts)
    return out


def ring(arcs, idxs):
    pts = []
    for i in idxs:
        a = arcs[~i][::-1] if i < 0 else arcs[i]
        pts.extend(a[1:] if pts else a)
    return pts


def area(pts):
    a = 0.0
    for i in range(len(pts)):
        x0, y0 = pts[i - 1]
        x1, y1 = pts[i]
        a += x0 * y1 - x1 * y0
    return a / 2


def centroid(pts):
    """Area centroid of a ring, which sits inside concave states where a
    bounding box centre would not."""
    a = area(pts)
    if abs(a) < 1e-9:
        n = len(pts)
        return sum(p[0] for p in pts) / n, sum(p[1] for p in pts) / n
    cx = cy = 0.0
    for i in range(len(pts)):
        x0, y0 = pts[i - 1]
        x1, y1 = pts[i]
        f = x0 * y1 - x1 * y0
        cx += (x0 + x1) * f
        cy += (y0 + y1) * f
    return cx / (6 * a), cy / (6 * a)


def thin(pts, eps):
    """Drop points the display cannot resolve. Keeps the first and last."""
    if len(pts) < 3:
        return pts
    kept = [pts[0]]
    for p in pts[1:-1]:
        qx, qy = kept[-1]
        if (p[0] - qx) ** 2 + (p[1] - qy) ** 2 >= eps * eps:
            kept.append(p)
    kept.append(pts[-1])
    return kept


def main():
    src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'states-10m.json'
    if not src.exists():
        sys.exit(f'No boundary file at {src}\n'
                 'Fetch it with:\n'
                 '  curl -o states-10m.json https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')

    topo = json.loads(src.read_text())
    arcs = decode(topo)

    # Project every ring first, so the fit is measured on real output.
    shapes = {}
    for geom in topo['objects']['states']['geometries']:
        code = ABBR.get((geom.get('properties') or {}).get('name', ''))
        if not code:
            continue                      # Alaska, Hawaii, territories
        polys = geom['arcs'] if geom['type'] == 'MultiPolygon' else [geom['arcs']]
        rings = []
        for poly in polys:
            for r in poly:
                pts = [albers(lon, lat) for lon, lat in ring(arcs, r)]
                if len(pts) > 3:
                    rings.append(pts)
        if rings:
            shapes[code] = rings

    xs = [p[0] for rs in shapes.values() for r in rs for p in r]
    ys = [p[1] for rs in shapes.values() for r in rs for p in r]
    k = min((W - PAD * 2) / (max(xs) - min(xs)), (H - PAD * 2) / (max(ys) - min(ys)))
    ox = (W - (max(xs) + min(xs)) * k) / 2
    oy = (H - (max(ys) + min(ys)) * k) / 2

    paths, anchors, pts_in, pts_out = {}, {}, 0, 0
    for code, rings in sorted(shapes.items()):
        d, biggest, biggest_area = [], None, 0.0
        for r in rings:
            pts_in += len(r)
            scaled = [(x * k + ox, y * k + oy) for x, y in r]
            a = abs(area(scaled))
            if a > biggest_area:
                biggest_area, biggest = a, scaled
            s = thin(scaled, 1.1)
            pts_out += len(s)
            if len(s) < 3:
                continue
            d.append('M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in s) + 'Z')
        if d:
            paths[code] = ''.join(d)
            cx, cy = centroid(biggest)
            # area travels with the anchor so the caller can decide whether a
            # label fits inside the state or has to sit outside it
            anchors[code] = (round(cx, 1), round(cy, 1), round(biggest_area))

    js = ('/* Outlines of the contiguous United States, by state. GENERATED.\n'
          '   Run: python3 tools/make_us_map.py\n\n'
          '   Source: us-atlas, built from the Census Bureau cartographic boundary\n'
          '   files, which are public domain. Albers conic equal area, the standard\n'
          '   projection for the lower 48. Points the map cannot resolve at display\n'
          f'   size are dropped: {pts_in:,} down to {pts_out:,}.\n\n'
          '   Alaska and Hawaii are absent because the network has no stores there. */\n'
          '(function () {\n'
          "  'use strict';\n"
          f"  window.BD_US_VIEWBOX = '0 0 {W:.0f} {H:.0f}';\n"
          '  window.BD_US_PATHS = {\n'
          + ',\n'.join(f"    {c}: '{d}'" for c, d in paths.items())
          + '\n  };\n\n'
          '  /* [x, y, area] of each state\'s largest ring, for label placement. */\n'
          '  window.BD_US_ANCHORS = {\n'
          + ',\n'.join(f"    {c}: [{a[0]}, {a[1]}, {a[2]}]" for c, a in anchors.items())
          + '\n  };\n})();\n')

    dest = ROOT / 'assets' / 'js' / 'usmap.js'
    dest.write_text(js)
    print(f'  {dest.relative_to(ROOT)}  {len(paths)} states, '
          f'{pts_in:,} points thinned to {pts_out:,}, {len(js)/1024:.0f} KB')


if __name__ == '__main__':
    main()
