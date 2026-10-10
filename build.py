#!/usr/bin/env python3
"""
Assembles the BoxDrop prototype pages from shared parts.

  src/_sprite.html   icon sprite
  src/_chrome.html   utility bar, masthead, nav, mobile drawer
  src/_footer.html   footer
  src/<page>.body.html   the <main> for that page
  src/<page>.page.js     optional page script, inlined after boxdrop.js

index.html is emitted WITHOUT a document skeleton because the Artifact
platform wraps it. Every other page carries its own.

    python3 build.py
"""
import sys
import pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'

FONTS = (
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
  'family=Schibsted+Grotesk:wght@400;500;600;700;800&'
  'family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;1,7..72,400&'
  'family=IBM+Plex+Mono:wght@400;500;600&display=swap">\n'
  '<link rel="stylesheet" href="__CSS__">'
)

SAFE_AREA = ('<style>:root{padding-top:env(safe-area-inset-top,0px);'
             'padding-bottom:env(safe-area-inset-bottom,0px)}</style>')

# Mirrors the wrapper the Artifact platform puts around index.html, so the local
# preview and the published homepage render identically.
SKELETON_HEAD = (
  '<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n'
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  '<style>:root{color-scheme:light;box-sizing:border-box;'
  'padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
  'body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;'
  'background:#faf9f5;color:#141413}img{max-width:100%}'
  '[hidden]:not([hidden=until-found i]){display:none!important}</style>\n'
  '</head>\n<body>\n'
)

PAGES = [
  # out file,        src stem,   <title>,                              nav key
  ('index.html',    'home',     'BoxDrop Mattress and Furniture',      None),
  ('category.html', 'category', 'Shop BoxDrop',                        'category'),
  ('product.html',  'product',  'Sleep2Win Reactive Hybrid',           'category'),
  ('dealers.html',  'dealers',  'Find your BoxDrop dealer',            'dealers'),
  ('dealer.html',   'dealer',   'BoxDrop store',                       'dealers'),
  ('cart.html',     'cart',     'Your BoxDrop cart',                   None),
]

EXTRA_SCRIPTS = {
  'home':     ['assets/js/catalog.js'],
  'category': ['assets/js/catalog.js'],
  'dealers':  ['assets/js/catalog.js'],
  'dealer':   ['assets/js/catalog.js'],
  'product':  ['assets/js/catalog.js'],
  'cart':     ['assets/js/catalog.js'],
}


def read(name):
    return (SRC / name).read_text()


def mark_active(chrome, key):
    """Flag the current section in the primary nav and the mobile drawer."""
    if key == 'dealers':
        return chrome.replace('class="nav__find" href="dealers.html"',
                              'class="nav__find" href="dealers.html" aria-current="page"')
    return chrome


def check_css():
    """A + or - inside clamp()/calc() must have whitespace around it, or the
    browser drops the whole declaration without warning. Five font sizes
    shipped broken this way before this check existed."""
    import re
    css = (ROOT / 'assets' / 'css' / 'boxdrop.css').read_text()
    bad = []
    for i, line in enumerate(css.splitlines(), 1):
        if re.search(r'(?:clamp|calc|min|max)\([^;]*[0-9a-z%\)][+\-][0-9.]', line):
            bad.append(f'    line {i}: {line.strip()[:100]}')
    if bad:
        print('  CSS math needs whitespace around + and -:')
        print('\n'.join(bad))
        raise SystemExit(1)


DEV = '--dev' in sys.argv


def stamp(path):
    """Append the file's mtime so a browser cannot serve a stale asset.

    Local only. The published build keeps bare paths, because the artifact
    host serves files by exact published path and a query string there is
    not worth the risk. Stale assets in the preview pane cost three
    debugging detours before this existed."""
    if not DEV:
        return path
    f = ROOT / path
    return f'{path}?v={int(f.stat().st_mtime)}' if f.exists() else path


def build():
    check_css()
    sprite, chrome, footer = read('_sprite.html'), read('_chrome.html'), read('_footer.html')
    for out, stem, title, nav in PAGES:
        body = read(f'{stem}.body.html')
        scripts = ''.join(
            f'<script src="{stamp(s)}"></script>\n' for s in EXTRA_SCRIPTS.get(stem, []))
        scripts = f'<script src="{stamp("assets/js/dealers.js")}"></script>\n' + scripts
        scripts += f'<script src="{stamp("assets/js/boxdrop.js")}"></script>\n'
        page_js = SRC / f'{stem}.page.js'
        if page_js.exists():
            scripts += '<script>\n' + page_js.read_text().rstrip() + '\n</script>\n'

        head = f'<title>{title}</title>\n' + FONTS.replace('__CSS__', stamp('assets/css/boxdrop.css'))
        content = (f'{sprite}\n\n{mark_active(chrome, nav)}\n\n{body}\n\n{footer}\n\n{scripts}')

        if out == 'index.html':          # the Artifact platform supplies the skeleton
            doc = f'{head}\n\n{content}'
        else:
            doc = ('<!doctype html>\n<html lang="en">\n<head>\n'
                   '<meta charset="utf-8">\n'
                   '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
                   f'{head}\n{SAFE_AREA}\n'
                   '</head>\n<body>\n'
                   f'{content}'
                   '</body>\n</html>\n')
        (ROOT / out).write_text(doc)
        print(f'  {out:<16} {len(doc):>7,} bytes')

        if out == 'index.html':
            # Local preview only. index.html ships without a skeleton because the
            # Artifact platform adds one, so opening it raw puts the browser in
            # quirks mode. This wraps it exactly the way the platform does.
            prev = (SKELETON_HEAD + doc + '</body>\n</html>\n')
            (ROOT / '_preview.html').write_text(prev)
            print(f'  {"_preview.html":<16} {len(prev):>7,} bytes  (local preview of the homepage)')


if __name__ == '__main__':
    print('BoxDrop build')
    build()
