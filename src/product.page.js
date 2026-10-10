/* Product page. Driven by the SKU in the URL hash, defaults to the hero bed. */
(function () {
  'use strict';
  var BD = window.BoxDrop, CAT = window.BD_CATEGORIES, ALL = window.BD_CATALOG;
  var $ = function (s) { return document.querySelector(s); };
  var DEFAULT_SKU = 's2w-reactive-hybrid';
  var FOUNDATION = 8;          // inches, standard BoxDrop foundation
  var HEIGHTS = [
    { label: "5 ft 3 in", inches: 63 },
    { label: "5 ft 7 in", inches: 67 },
    { label: "6 ft 1 in", inches: 73 }
  ];

  var REVIEW_POOL = [
    { who: 'Dana R.', where: 'Delivered by BoxDrop Nitro', stars: 5,
      text: 'Ordered on a Sunday night, the Nitro store called Monday morning and it was in the room Wednesday. They took the old one and the plastic with them. I have bought mattresses from big chains and never had that.' },
    { who: 'Marcus T.', where: 'Delivered by BoxDrop Charleston', stars: 5,
      text: 'My wife sleeps on her side and I sleep on my back, which has been a twenty year argument. This is the first bed neither of us complains about. Ninety days in and it has not developed a trench.' },
    { who: 'Priya N.', where: 'Delivered by BoxDrop Teays Valley', stars: 4,
      text: 'Took about three weeks to stop feeling firm. It is what the salesman said would happen so I waited it out, and he was right. Knocking one star off only because the first fortnight was rough.' },
    { who: 'Bill O.', where: 'Delivered by BoxDrop Huntington', stars: 5,
      text: 'I went into the store first, lay on it, then bought it here because I wanted the delivery slot. Found out afterwards the store would have been cheaper. My own fault, they do say so on the site.' },
    { who: 'Jess K.', where: 'Delivered by BoxDrop Parkersburg', stars: 4,
      text: 'Heavier than I expected and the two of them had to take a door off. Worth it. Edge support is the thing that sold me, I sit on the side to put shoes on and it does not collapse.' },
    { who: 'Ray M.', where: 'Delivered by BoxDrop Nitro', stars: 5,
      text: 'Second one I have bought from this dealer. Same crew turned up, remembered the house. That is the part the website cannot really sell you.' }
  ];

  function pick(sku, n) {
    var h = 0;
    for (var i = 0; i < sku.length; i++) h = (h * 31 + sku.charCodeAt(i)) >>> 0;
    var out = [], used = {};
    for (var j = 0; j < n; j++) {
      var k = (h + j * 7) % REVIEW_POOL.length;
      while (used[k]) k = (k + 1) % REVIEW_POOL.length;
      used[k] = 1; out.push(REVIEW_POOL[k]);
    }
    return out;
  }

  var product = null, option = null, feel = 'Medium firm';

  function readHash() {
    var sku = (location.hash || '').replace('#', '');
    product = BD.bySku(sku) || BD.bySku(DEFAULT_SKU) || ALL[0];
    option = BD.baseOption(product);
  }

  function price() { return product.price + (option ? (option.delta || 0) : 0); }

  /* ---------- diagrams ---------- */
  function layerSVG(layers) {
    var total = layers.reduce(function (a, l) { return a + l.h; }, 0);
    var W = 300, H = 230, pad = 2, y = 0;
    var shades = ['#C9CEEA', '#8E98D4', '#5A67B4', '#2F3C8E', '#111D6B'];
    var parts = layers.map(function (l, i) {
      var h = (l.h / total) * (H - layers.length * pad);
      var r = '<rect x="0" y="' + y.toFixed(1) + '" width="' + W + '" height="' + h.toFixed(1) +
              '" fill="' + shades[i % shades.length] + '" rx="2"></rect>' +
              '<text x="12" y="' + (y + h / 2 + 4).toFixed(1) + '" font-family="IBM Plex Mono, monospace" font-size="11" ' +
              'fill="' + (i < 2 ? '#0E1538' : '#F4F1EA') + '">' + BD.esc(l.name) + '</text>' +
              '<text x="' + (W - 12) + '" y="' + (y + h / 2 + 4).toFixed(1) + '" text-anchor="end" ' +
              'font-family="IBM Plex Mono, monospace" font-size="11" fill="' + (i < 2 ? '#0E1538' : '#F4F1EA') + '">' +
              l.h + ' in</text>';
      y += h + pad;
      return r;
    }).join('');
    return '<svg viewBox="0 0 ' + (W + 2) + ' ' + (H + 2) + '" role="img" aria-label="' +
      BD.esc(product.name + ' shown layer by layer: ' + layers.map(function (l) { return l.name + ' ' + l.h + ' inches'; }).join(', ')) +
      '">' + parts + '</svg>';
  }

  function heightSVG(mattressH) {
    var surface = mattressH + FOUNDATION;
    var maxIn = 76, S = 3.0, floorY = maxIn * S + 10, W = 420;
    var y = function (inches) { return floorY - inches * S; };
    var out = ['<svg viewBox="0 0 ' + W + ' ' + (floorY + 44) + '" role="img" aria-label="' +
      'The sleep surface sits ' + surface + ' inches from the floor, drawn to scale beside people ' +
      HEIGHTS.map(function (h) { return h.label; }).join(', ') + '.">'];

    out.push('<line x1="0" y1="' + floorY + '" x2="' + W + '" y2="' + floorY + '" stroke="#C3BAA7" stroke-width="1.5"/>');
    // the bed stack
    out.push('<rect x="8" y="' + y(FOUNDATION) + '" width="96" height="' + (FOUNDATION * S) + '" fill="#C9CEEA" stroke="#111D6B" stroke-width="1"/>');
    out.push('<rect x="8" y="' + y(surface) + '" width="96" height="' + (mattressH * S) + '" fill="#111D6B"/>');
    out.push('<text x="56" y="' + (y(surface) - 10) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="600" fill="#0E1538">' + surface + ' in</text>');
    out.push('<text x="56" y="' + (floorY + 18) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="#7B8199">BED</text>');
    out.push('<text x="56" y="' + (floorY + 32) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="#7B8199">' + mattressH + ' + ' + FOUNDATION + '</text>');
    // dashed surface line
    out.push('<line x1="8" y1="' + y(surface) + '" x2="' + (W - 6) + '" y2="' + y(surface) +
             '" stroke="#156B2E" stroke-width="1.5" stroke-dasharray="5 4"/>');

    HEIGHTS.forEach(function (p, i) {
      var x = 160 + i * 86, knee = p.inches * 0.285;
      out.push('<rect x="' + x + '" y="' + y(p.inches) + '" width="26" height="' + (p.inches * S) + '" rx="13" fill="#EBE6DB" stroke="#C3BAA7"/>');
      out.push('<rect x="' + x + '" y="' + y(knee) + '" width="26" height="' + (knee * S) + '" rx="13" fill="#DDD6C8"/>');
      out.push('<line x1="' + (x - 5) + '" y1="' + y(knee) + '" x2="' + (x + 31) + '" y2="' + y(knee) + '" stroke="#0E1538" stroke-width="1.5"/>');
      out.push('<text x="' + (x + 13) + '" y="' + (y(p.inches) - 9) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="#0E1538">' + p.label + '</text>');
      out.push('<text x="' + (x + 13) + '" y="' + (floorY + 18) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="#7B8199">knee</text>');
      out.push('<text x="' + (x + 13) + '" y="' + (floorY + 32) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="#7B8199">' + Math.round(knee) + ' in</text>');
    });
    out.push('</svg>');
    return out.join('');
  }

  function heightVerdict(mattressH) {
    var surface = mattressH + FOUNDATION;
    var shortest = Math.round(HEIGHTS[0].inches * 0.285);
    var gap = surface - shortest;
    if (gap <= 1) return 'At ' + surface + ' inches this sits at about knee height for everybody, so feet reach the floor when you sit on the edge.';
    return 'At ' + surface + ' inches the edge is ' + gap + ' inches above the knee of a ' + HEIGHTS[0].label +
           ' adult, so their feet will hang when they sit on it. Drop to a low profile foundation if that matters.';
  }

  /* ---------- render ---------- */
  function renderGallery() {
    var imgs = product.gallery && product.gallery.length ? product.gallery : [product.img];
    var film = product.film;
    var thumbs = imgs.map(function (src, i) {
      return '<button type="button" class="thumb" aria-pressed="' + (!film && i === 0) + '" data-img="' + BD.esc(src) + '">' +
        '<img src="' + BD.esc(src) + '" alt="View ' + (i + 1) + ' of ' + BD.esc(product.name) + '" loading="lazy">' +
        '</button>';
    });
    if (film) {
      thumbs.unshift('<button type="button" class="thumb thumb--film" aria-pressed="true" data-film="1">' +
        '<img src="' + BD.esc(film.poster) + '" alt="Play the film of ' + BD.esc(product.name) + '" loading="lazy">' +
        '<span class="thumb__play" aria-hidden="true"></span></button>');
    }
    $('#thumbs').innerHTML = thumbs.join('');

    var m = $('#main-img'), v = $('#main-film');
    m.alt = product.brand + ' ' + product.name + ', main product view';
    m.src = imgs[0];
    if (film) {
      v.src = film.src; v.poster = film.poster;
      v.setAttribute('aria-label', 'A slow pass across the surface of the ' + product.name + '.');
      showFilm(true);
    } else if (v) {
      v.removeAttribute('src'); v.hidden = true; m.hidden = false;
    }
  }

  /* The long film is a different thing from the gallery loop: 39 seconds
     with sound, so it never autoplays and it gets a block of its own. */
  function renderFeature() {
    var f = product.feature, sec = $('#filmblock');
    if (!sec) return;
    if (!f) { sec.hidden = true; return; }
    sec.hidden = false;
    $('#film-eyebrow').textContent = f.eyebrow;
    $('#film-h').textContent = f.line;
    $('#film-meta').textContent = f.length + ' · sound on';
    var v = $('#feature-film');
    v.poster = f.poster;
    v.setAttribute('aria-label', f.eyebrow + ': ' + f.line);
    if (v.getAttribute('src') !== f.src) { v.removeAttribute('src'); v.dataset.src = f.src; }
  }

  function startFeature() {
    var v = $('#feature-film'), sec = $('#filmblock');
    if (!v) return;
    if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
    v.controls = true;
    sec.classList.add('is-playing');
    var go = v.play();
    if (go && go.catch) go.catch(function () { /* left paused with controls */ });
  }

  /* The film is one more view in the gallery, so it swaps with the stills
     rather than sitting apart from them. */
  function showFilm(on) {
    var m = $('#main-img'), v = $('#main-film');
    if (!v || !v.getAttribute('src')) return;
    v.hidden = !on; m.hidden = on;
    if (!on) { v.pause(); return; }
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var go = v.play(); if (go && go.catch) go.catch(function () {});
    }
  }

  function renderOptions() {
    if (!product.options) { $('#p-options').hidden = true; return; }
    var o = product.options;
    $('#p-options').innerHTML =
      '<div class="optset__label"><span>' + BD.esc(o.label) + '</span><b id="opt-current">' + BD.esc(option.name) + '</b></div>' +
      '<div class="optrows">' + o.values.map(function (v, i) {
        return '<label class="optrow"><input type="radio" name="opt" value="' + i + '"' + (v.name === option.name ? ' checked' : '') + '>' +
          '<span>' + BD.esc(v.name) +
          '<span class="dims">' + BD.esc(v.dims || '') + '</span>' +
          '<span class="delta">' + (v.delta ? (v.delta > 0 ? '+' : '') + BD.money(v.delta) : 'included') + '</span>' +
          '</span></label>';
      }).join('') + '</div>';

    // the swappable comfort top is this bed's whole idea, so it gets its own control
    var swappable = (product.features || []).indexOf('Swappable comfort top') > -1;
    $('#p-feel').hidden = !swappable;
    if (swappable) {
      $('#p-feel').innerHTML =
        '<div class="optset__label"><span>Feel, each side</span><b>' + BD.esc(feel) + '</b></div>' +
        '<div class="optrows">' +
        ['Medium firm', 'Medium plush'].map(function (f) {
          return '<label class="optrow"><input type="radio" name="feel" value="' + BD.esc(f) + '"' + (f === feel ? ' checked' : '') + '>' +
            '<span>' + f + '<span class="dims">' +
            (f === 'Medium firm' ? '1.5 in bamboo foam over micro coils' : '3 in bamboo foam over micro coils') +
            '</span><span class="delta">swap any time</span></span></label>';
        }).join('') + '</div>';
    }
  }

  function renderPrice() {
    var p = price(), d = BD.currentDealer();
    $('#p-ledger').innerHTML = BD.ledgerHTML(p, 'lg');
    $('#p-finance').innerHTML = '<b>' + BD.money(p / 12) + ' a month</b> for 12 months at 0% APR on approved credit, or pay in full.';
    $('#p-add').setAttribute('data-price', p);
    $('#sb-add').setAttribute('data-price', p);
    $('#sb-price').innerHTML = BD.money(p) + ' online · <span class="lo">' + BD.localRange(p) + (d ? ' at ' + BD.esc(d.name) : ' local') + '</span>';

    var local = $('#p-local'), zip = $('#p-zip');
    if (d) {
      local.textContent = d.name + ': ' + BD.money(Math.round(p * d.factor));
      local.setAttribute('aria-label', d.name + ' price, ' + BD.money(Math.round(p * d.factor)) + '. Go to the dealer page.');
      $('#sb-local').textContent = BD.money(Math.round(p * d.factor)) + ' local';
      zip.style.display = 'none';
    } else {
      local.textContent = "Check your dealer's price";
      local.removeAttribute('aria-label');
      $('#sb-local').textContent = 'Dealer price';
      zip.style.display = 'flex';
    }
    BD.paintLedgers();
  }

  function renderDelivery() {
    var d = BD.currentDealer();
    var when = new Date(Date.now() + 5 * 864e5).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    $('#p-delivery').innerHTML = d
      ? '<b>Delivered by ' + BD.esc(d.name) + '</b>' +
        '<p class="when">Earliest ' + when + '</p>' +
        '<p>' + BD.stockLine(product).replace(/<\/?b>/g, '') + '. Their crew brings it in, sets it up in the room you choose and takes the old mattress away.</p>'
      : '<b>Delivered by your local BoxDrop</b>' +
        '<p class="when">Usually 3 to 7 days</p>' +
        '<p>Set your location and this will show the dealer who would bring it, the earliest date they have, and whether it is already on their floor.</p>';
  }

  function renderConstruction() {
    var isMattress = product.cat === 'mattresses' || product.cat === 'outlet';
    var hasLayers = !!(product.layers && product.layers.length);
    $('#layer-card').hidden = !hasLayers;
    if (hasLayers) {
      var total = product.layers.reduce(function (a, l) { return a + l.h; }, 0);
      $('#layer-sub').textContent = Math.round(total) + ' inches, nothing hidden.';
      $('#layer-svg').innerHTML = layerSVG(product.layers);
      $('#layer-rows').innerHTML = product.layers.slice().reverse().map(function (l) {
        return '<div class="layerrow"><div><b>' + BD.esc(l.name) + '</b>' +
          (l.note ? '<small>' + BD.esc(l.note) + '</small>' : '') + '</div>' +
          '<span class="h">' + l.h + ' in</span></div>';
      }).join('');
    }

    var showHeight = isMattress && typeof product.height === 'number';
    $('#height-card').hidden = !showHeight;
    if (showHeight) {
      $('#height-sub').textContent = heightVerdict(product.height);
      $('#height-svg').innerHTML = heightSVG(product.height);
    }

    $('#con-title').textContent = isMattress ? 'What is actually inside it' : 'The measurements that matter';
    $('#spec-rows').innerHTML = (product.specs || []).map(function (r) {
      return '<tr><th scope="row">' + BD.esc(r[0]) + '</th><td>' + BD.esc(r[1]) + '</td></tr>';
    }).join('');
  }

  function renderReviews() {
    var revs = pick(product.sku, 3);
    $('#rev-score').textContent = product.rating.toFixed(1);
    $('#rev-stars').innerHTML = BD.starsHTML(product.rating);
    $('#rev-count').textContent = product.reviews.toLocaleString('en-US') + ' verified owners';
    var dist = [72, 19, 6, 2, 1];
    $('#rev-bars').innerHTML = dist.map(function (pct, i) {
      return '<div class="revbar"><span>' + (5 - i) + ' star</span>' +
        '<span class="track"><span class="fill" style="width:' + pct + '%"></span></span>' +
        '<span>' + pct + '%</span></div>';
    }).join('');
    $('#rev-list').innerHTML = revs.map(function (r) {
      return '<article class="review"><div class="review__head">' +
        BD.starsHTML(r.stars) + '<b>' + BD.esc(r.who) + '</b>' +
        '<span class="verified">Verified delivery</span>' +
        '<span class="where">' + BD.esc(r.where) + '</span></div>' +
        '<p>' + BD.esc(r.text) + '</p></article>';
    }).join('');
  }

  function renderRelated() {
    var rel = ALL.filter(function (p) { return p.cat === product.cat && p.sku !== product.sku; }).slice(0, 4);
    $('#related').innerHTML = rel.map(BD.cardHTML).join('');
    $('#rel-all').setAttribute('href', 'category.html#' + product.cat);
    BD.paintLedgers();
  }

  function renderAll() {
    var c = CAT[product.cat];
    document.title = product.name + ' · BoxDrop';
    $('#crumb-cat').textContent = c.title;
    $('#crumb-cat').setAttribute('href', 'category.html#' + product.cat);
    $('#crumb-name').textContent = product.name;
    $('#p-brand').textContent = product.brand;
    $('#p-name').textContent = product.name;
    $('#p-stars').innerHTML = BD.starsHTML(product.rating);
    $('#p-reviews').textContent = product.rating.toFixed(1) + ' · ' + product.reviews.toLocaleString('en-US') + ' reviews';
    $('#p-sku').textContent = 'SKU ' + product.sku.toUpperCase();
    $('#p-blurb').textContent = product.blurb;
    $('#sb-name').textContent = product.name;

    [['#p-add', 1], ['#sb-add', 1]].forEach(function (pair) {
      var b = $(pair[0]);
      b.setAttribute('data-sku', product.sku);
      b.setAttribute('data-name', product.name);
      b.setAttribute('data-brand', product.brand);
      b.setAttribute('data-img', product.img);
      b.setAttribute('data-size', option ? option.name : '');
    });

    renderGallery(); renderFeature(); renderOptions(); renderPrice(); renderDelivery();
    renderConstruction(); renderReviews(); renderRelated();
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.thumb');
    if (t) {
      document.querySelectorAll('.thumb').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      t.setAttribute('aria-pressed', 'true');
      if (t.hasAttribute('data-film')) { showFilm(true); return; }
      showFilm(false);
      $('#main-img').src = t.getAttribute('data-img');
      return;
    }
    if (e.target.closest && e.target.closest('#film-play')) { startFeature(); return; }
    if (e.target.id === 'copy-specs') {
      var text = product.brand + ' ' + product.name + '\n' +
        (product.specs || []).map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
      var done = function () { BD.toast('Specifications copied'); };
      try {
        navigator.clipboard.writeText(text).then(done, function () { BD.toast('Select the table to copy it'); });
      } catch (err) { BD.toast('Select the table to copy it'); }
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.name === 'opt') {
      option = product.options.values[parseInt(e.target.value, 10)];
      var cur = document.getElementById('opt-current'); if (cur) cur.textContent = option.name;
      [$('#p-add'), $('#sb-add')].forEach(function (b) { b.setAttribute('data-size', option.name); });
      renderPrice(); renderDelivery();
    }
    if (e.target.name === 'feel') {
      feel = e.target.value;
      var lbl = $('#p-feel').querySelector('.optset__label b'); if (lbl) lbl.textContent = feel;
    }
  });

  window.addEventListener('hashchange', function () { readHash(); renderAll(); window.scrollTo({ top: 0 }); });
  document.addEventListener('bd:dealerchange', function () { renderPrice(); renderDelivery(); renderRelated(); });

  readHash();
  renderAll();

  /* sticky buy bar once the real buttons have scrolled away */
  var bar = $('#stickybuy'), row = document.querySelector('.buyrow');
  if ('IntersectionObserver' in window && row) {
    new IntersectionObserver(function (entries) {
      var gone = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
      bar.classList.toggle('is-up', gone);
      bar.setAttribute('aria-hidden', String(!gone));
    }, { threshold: 0 }).observe(row);
  }
})();
