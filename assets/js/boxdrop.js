/* BoxDrop prototype behaviour.
   One idea runs through all of it: the shopper picks a dealer once, and
   every price on the site resolves from a range to that dealer's number. */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- storage that never throws ---------- */
  var store = {
    get: function (k, fallback) {
      try { var v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- sample dealer network ----------
     factor = how the dealer's floor price compares to the online price.
     Real dealers set their own; these are plausible stand-ins. */
  var DEALERS = window.BD_DEALERS || [];
  var STATES = window.BD_STATES || {};

  var RANGE_LOW = 0.82, RANGE_HIGH = 0.88;

  function money(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  /* ---------- dealer state ---------- */
  /* ---------- geography and opening hours ----------------------------- */

  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /* The USPS allocates ZIP prefixes to states in blocks. That mapping is real,
     unlike a coordinate we would have to invent, so it is what places a
     shopper on the map and picks their state. */
  var ZIP_BLOCKS = [
    [10,27,'MA'],[28,29,'RI'],[30,38,'NH'],[39,49,'ME'],[50,59,'VT'],[60,69,'CT'],
    [70,89,'NJ'],[100,149,'NY'],[150,196,'PA'],[197,199,'DE'],[200,219,'MD'],
    [220,246,'VA'],[247,268,'WV'],[270,289,'NC'],[290,299,'SC'],[300,319,'GA'],
    [320,349,'FL'],[350,369,'AL'],[370,385,'TN'],[386,397,'MS'],[398,399,'GA'],
    [400,427,'KY'],[430,459,'OH'],[460,479,'IN'],[480,499,'MI'],[500,528,'IA'],
    [530,549,'WI'],[550,567,'MN'],[570,577,'SD'],[580,588,'ND'],[590,599,'MT'],
    [600,629,'IL'],[630,658,'MO'],[660,679,'KS'],[680,693,'NE'],[700,714,'LA'],
    [716,729,'AR'],[730,749,'OK'],[750,799,'TX'],[800,816,'CO'],[820,831,'WY'],
    [832,838,'ID'],[840,847,'UT'],[850,865,'AZ'],[870,884,'NM'],[885,885,'TX'],
    [889,898,'NV'],[900,961,'CA'],[967,968,'HI'],[970,979,'OR'],[980,994,'WA'],
    [995,999,'AK']
  ];

  function stateForZip(zip) {
    var z = String(zip || '').replace(/[^0-9]/g, '');
    if (z.length < 5) return null;
    var pre = parseInt(z.slice(0, 3), 10);
    for (var i = 0; i < ZIP_BLOCKS.length; i++) {
      if (pre >= ZIP_BLOCKS[i][0] && pre <= ZIP_BLOCKS[i][1]) return ZIP_BLOCKS[i][2];
    }
    return null;
  }

  /* Rough separation between two ZIPs, used only to order a list. It is a
     sort key, not miles, and nothing is ever labelled as miles.

     The first three digits are a real postal region, so they carry far more
     geography than the last two and are weighted to dominate. Straight
     numeric distance got this wrong in a way you can see: from 37663
     Kingsport it put 37716 Clinton (gap 53, about 90 miles) ahead of 37604
     Johnson City (gap 59, about 25 miles). Same region first fixes it. */
  function zipGap(a, b) {
    var x = parseInt(String(a || '').slice(0, 5), 10);
    var y = parseInt(String(b || '').slice(0, 5), 10);
    if (isNaN(x) || isNaN(y)) return Infinity;
    var region = Math.abs(Math.floor(x / 100) - Math.floor(y / 100));
    return region * 100000 + Math.abs(x - y);
  }

  /* Distance between two state centres, which are real coordinates, used to
     order states once the shopper's own state is exhausted. */
  function stateMiles(a, b) {
    var A = STATES[a], B = STATES[b];
    if (!A || !B) return 9999;
    var R = 3958.8, rad = Math.PI / 180;
    var dLat = (B.lat - A.lat) * rad, dLng = (B.lng - A.lng) * rad;
    var la = A.lat * rad, lb = B.lat * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(la) * Math.cos(lb);
    return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))));
  }

  /* How near a store is to a ZIP, as a sortable list, best first.

     ZIP arithmetic alone cannot answer this. Weighting the postal region
     fixed 37663, where plain distance put Clinton ahead of Johnson City, but
     broke 90210, where it put Sparks, Nevada ahead of El Cajon. So the
     shopper's own state comes first, decided by the USPS prefix blocks; then
     other states in order of how far their centres are; then ZIP within a
     state, region first. Every part of that is real data. */
  function zipRank(dealer, zip) {
    var home = stateForZip(zip);
    var same = home && dealer.state === home;
    return [
      same ? 0 : 1,
      same ? 0 : (home ? stateMiles(home, dealer.state) : 0),
      zipGap(dealer.zip, zip)
    ];
  }

  function compareRank(a, b) {
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
    return 0;
  }

  function clockLabel(h) {
    var ampm = h >= 12 ? 'PM' : 'AM', n = h % 12; if (n === 0) n = 12;
    return n + ' ' + ampm;
  }

  /* The sheet has no trading hours, so these are four prototype patterns
     keyed off the store id. Open or shut is still worked out from the week
     rather than stored as a sentence. */
  var HOUR_SETS = [
    [[12,17],[10,19],[10,19],[10,19],[10,19],[10,19],[10,19]],
    [null,   [10,18],[10,18],[10,18],[10,18],[10,18],[10,18]],
    [[12,17],[10,18],[10,18],[10,18],[10,20],[10,20],[10,18]],
    [[13,17],[11,19],[11,19],[11,19],[11,19],[11,19],[10,19]]
  ];
  function weekOf(d) { return HOUR_SETS[(d && d.hoursSet) || 0]; }

  function openState(d, now) {
    now = now || new Date();
    var oh = weekOf(d);
    var day = now.getDay(), hour = now.getHours() + now.getMinutes() / 60;
    var today = oh[day];
    if (today && hour >= today[0] && hour < today[1]) {
      return { open: true, text: 'Open until ' + clockLabel(today[1]) };
    }
    if (today && hour < today[0]) {
      return { open: false, text: 'Opens ' + clockLabel(today[0]) + ' today' };
    }
    for (var i = 1; i <= 7; i++) {
      var nd = (day + i) % 7, slot = oh[nd];
      if (slot) {
        return { open: false, text: 'Opens ' + clockLabel(slot[0]) +
          (i === 1 ? ' tomorrow' : ' ' + DAYS[nd]) };
      }
    }
    return { open: false, text: 'Call for hours' };
  }

  function hoursLine(d) {
    var oh = weekOf(d), out = [], i = 0;
    function key(s) { return s ? s[0] + '-' + s[1] : 'x'; }
    var order = [1, 2, 3, 4, 5, 6, 0];
    function bare(h) { return clockLabel(h).replace(' AM', '').replace(' PM', ''); }
    while (i < order.length) {
      var j = i;
      while (j + 1 < order.length && key(oh[order[j + 1]]) === key(oh[order[i]])) j++;
      var slot = oh[order[i]];
      out.push((i === j ? DAYS[order[i]].slice(0, 3)
                        : DAYS[order[i]].slice(0, 3) + ' to ' + DAYS[order[j]].slice(0, 3)) +
        ' ' + (slot ? bare(slot[0]) + ' to ' + bare(slot[1]) : 'closed'));
      i = j + 1;
    }
    return out.join(' \u00b7 ');
  }

  /* Showroom photographs we hold, cycled so neighbouring cards differ. */
  var SHOTS = ['s-showroom-1.jpg','s-showroom-2.jpg','s-bedroom-wide.jpg','b-mornington.jpg',
               'l-sectional-top.jpg','s-rest.jpg','b-adjroom.jpg','l-recliner-hero.jpg'];
  function dealerImg(d) { return 'assets/img/' + SHOTS[(d && d.imgSet) || 0]; }

  /* What a store calls itself is the only floor information the sheet gives. */
  function dealerTier(d) {
    var n = (d.name || '').toLowerCase();
    if (/clearance|closeout|outlet/.test(n)) return { key:'outlet',   label:'Clearance floor' };
    if (/furniture/.test(n))                 return { key:'full',     label:'Mattresses and furniture' };
    if (/mattress|bed|sleep/.test(n))        return { key:'mattress', label:'Mattress specialist' };
    return { key:'full', label:'BoxDrop dealer' };
  }

  /* No inventory feed exists, so whether a store holds a line is derived from
     the two ids. Stable between loads, and never claimed as live stock. */
  function hashInt(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h;
  }
  function holdsLine(dealerId, sku) {
    var t = dealerTier({ name: dealerNameById(dealerId) || '' });
    var r = hashInt(dealerId + '|' + sku) % 100;
    if (t.key === 'outlet') return r < 18;
    if (t.key === 'mattress') return r < 55;
    return r < 62;
  }
  function dealerNameById(id) {
    for (var i = 0; i < DEALERS.length; i++) if (DEALERS[i].id === id) return DEALERS[i].name;
    return null;
  }

  function currentDealer() {
    var id = store.get('bd.dealer', null);
    if (!id) return null;
    for (var i = 0; i < DEALERS.length; i++) if (DEALERS[i].id === id) return DEALERS[i];
    return null;
  }

  function nearest(zip) {
    var z = String(zip || '').replace(/[^0-9]/g, '');
    if (z.length < 5 || !DEALERS.length) return null;
    var st = stateForZip(z);
    var pool = st ? DEALERS.filter(function (d) { return d.state === st; }) : [];
    if (!pool.length) pool = DEALERS;
    var best = pool[0], bd = Infinity;
    for (var i = 0; i < pool.length; i++) {
      var gap = zipGap(pool[i].zip, z);
      if (gap < bd) { bd = gap; best = pool[i]; }
    }
    return best;
  }

  /* ---------- the price ledger ---------- */
  function paintLedgers() {
    var d = currentDealer();
    $$('.ledger').forEach(function (el) {
      var online = parseFloat(el.getAttribute('data-online'));
      if (isNaN(online)) return;
      var priceEl = $('.ledger__row--local .ledger__price', el);
      var whyEl   = $('.ledger__row--local .ledger__why', el);
      var labelEl = $('.ledger__row--local .ledger__label span', el);
      if (!priceEl) return;

      if (d) {
        var local = Math.round(online * d.factor);
        priceEl.textContent = money(local);
        el.classList.add('is-resolved');
        if (labelEl) labelEl.textContent = d.name;
        if (whyEl) whyEl.innerHTML = 'You save ' + money(online - local) +
          ' by picking it up or having ' + d.name + ' deliver it. Same product, same crew.';
      } else {
        priceEl.textContent = money(online * RANGE_LOW) + ' to ' + money(online * RANGE_HIGH);
        el.classList.remove('is-resolved');
        if (labelEl) labelEl.textContent = 'Your local dealer';
        if (whyEl) whyEl.innerHTML = 'Dealers set their own floor price. Enter your ZIP to see the real number.';
      }
    });
  }

  function paintDealerChips() {
    var d = currentDealer();
    $$('[data-dealer-city]').forEach(function (el) {
      el.textContent = d ? d.city : 'Set your location';
    });
    $$('[data-dealer-name]').forEach(function (el) {
      if (d) el.setAttribute('title', d.name);
      el.textContent = d ? d.name : 'Find your dealer';
    });
    $$('[data-dealer-only]').forEach(function (el) { el.hidden = !d; });
    $$('[data-nodealer-only]').forEach(function (el) { el.hidden = !!d; });
  }

  function setDealer(d, announce) {
    if (!d) return;
    store.set('bd.dealer', d.id);
    paintLedgers();
    paintDealerChips();
    document.dispatchEvent(new CustomEvent('bd:dealerchange', { detail: d }));
    if (announce !== false) toast(d.name + ' is now your dealer. Every price on the site is theirs.');
  }

  /* ---------- cart ---------- */
  function cart() { return store.get('bd.cart', []); }
  function paintCart() {
    var n = cart().reduce(function (a, l) { return a + (l.qty || 1); }, 0);
    $$('[data-cart-count]').forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
  }
  function addToCart(line) {
    var c = cart(), hit = null;
    for (var i = 0; i < c.length; i++) if (c[i].sku === line.sku) hit = c[i];
    if (hit) hit.qty = (hit.qty || 1) + (line.qty || 1); else c.push(line);
    store.set('bd.cart', c);
    paintCart();
  }

  /* ---------- toast ---------- */
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    requestAnimationFrame(function () { toastEl.classList.add('is-up'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-up'); }, 4200);
  }

  /* ---------- ZIP forms ---------- */
  function wireZipForms() {
    $$('[data-zip-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = $('input', form);
        var err = $('[data-zip-error]', form.parentNode) || $('[data-zip-error]', form);
        var raw = (input && input.value || '').trim();
        if (!/^\d{5}$/.test(raw)) {
          if (err) { err.hidden = false; err.textContent = 'Enter a five digit ZIP code, for example 25143.'; }
          if (input) input.focus();
          return;
        }
        if (err) err.hidden = true;
        store.set('bd.zip', raw);
        var d = nearest(raw);
        if (d) {
          setDealer(d);
          if (form.hasAttribute('data-zip-goto')) {
            window.location.href = form.getAttribute('data-zip-goto');
          }
        }
      });
    });
  }

  /* ---------- mobile drawer ---------- */
  function wireDrawer() {
    var drawer = $('#drawer'), openBtn = $('[data-drawer-open]'), closeBtn = $('[data-drawer-close]');
    if (!drawer || !openBtn) return;
    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      drawer.hidden = false;
      document.body.style.overflow = 'hidden';
      openBtn.setAttribute('aria-expanded', 'true');
      var f = drawer.querySelector('a,button'); if (f) f.focus();
    }
    function close() {
      drawer.hidden = true;
      document.body.style.overflow = '';
      openBtn.setAttribute('aria-expanded', 'false');
      if (lastFocus) lastFocus.focus();
    }
    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) close();
    });
  }

  /* ---------- add to cart, delegated so rendered buttons work too ---------- */
  function wireAdd() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-add]');
      if (!btn) return;
      e.preventDefault();
      var d = currentDealer();
      var price = parseFloat(btn.getAttribute('data-price'));
      addToCart({
        sku:   btn.getAttribute('data-sku'),
        name:  btn.getAttribute('data-name'),
        brand: btn.getAttribute('data-brand') || '',
        price: price,
        img:   btn.getAttribute('data-img'),
        size:  btn.getAttribute('data-size') || '',
        qty: 1
      });
      toast(btn.getAttribute('data-name') + ' added to your cart' +
        (d ? '. ' + d.name + ' would be ' + money(price * (1 - d.factor)) + ' less.' : '.'));
    });
  }


  /* ---------- shared render helpers ----------
     Every surface that shows a price builds it through ledgerHTML, so the
     ledger can never drift between the grid, the product page and the cart. */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function localRange(online) {
    var d = currentDealer();
    if (d) return money(Math.round(online * d.factor));
    return money(online * RANGE_LOW) + ' to ' + money(online * RANGE_HIGH);
  }

  function ledgerHTML(online, scale) {
    var d = currentDealer();
    var cls = 'ledger' + (scale ? ' ledger--' + scale : '') + (d ? ' is-resolved' : '');
    return '<div class="' + cls + '" data-online="' + online + '">' +
      '<div class="ledger__row ledger__row--online">' +
        '<span class="ledger__label"><span>Online</span></span>' +
        '<span class="ledger__price num">' + money(online) + '</span>' +
        (scale === 'lg' ? '<p class="ledger__why">Ships anywhere in the lower 48, a delivery window you pick, and no negotiating.</p>' : '') +
      '</div>' +
      '<div class="ledger__row ledger__row--local">' +
        '<span class="ledger__label"><span>' + esc(d ? d.name : 'Your local dealer') + '</span></span>' +
        '<span class="ledger__price num">' + localRange(online) + '</span>' +
        '<p class="ledger__why"></p>' +
      '</div></div>';
  }

  function starsHTML(rating) {
    var out = '<span class="stars" aria-hidden="true">';
    for (var i = 0; i < 5; i++) {
      out += '<svg style="opacity:' + (i < Math.round(rating) ? 1 : .22) + '"><use href="#i-star"></use></svg>';
    }
    return out + '</span>';
  }

  function inStock(p, d) {
    if (!d || !p) return false;
    return holdsLine(d.id, p.sku);
  }

  function stockLine(p) {
    var d = currentDealer();
    if (d) {
      return inStock(p, d)
        ? '<b>In stock</b> at ' + esc(d.name)
        : 'Order in at ' + esc(d.name) + ', about 7 days';
    }
    return '<b>On the floor</b> at dealers near you';
  }

  /* The listed price always refers to this option: the one with no uplift
     (Queen on a bed), falling back to the first. Cards, the product page and
     the cart all read it from here so they can never disagree. */
  function baseOption(p) {
    var vals = (p.options && p.options.values) || [];
    for (var i = 0; i < vals.length; i++) if (!vals[i].delta) return vals[i];
    return vals[0] || null;
  }

  function cardHTML(p) {
    var b = baseOption(p), opt = b ? b.name : '';
    var vals = (p.options && p.options.values) || [];
    var label = (p.options && p.options.label) || 'Size';
    var optLine = vals.length > 1
      ? vals.length + ' ' + label.toLowerCase() + (label.toLowerCase().slice(-1) === 's' ? '' : 's')
      : opt;
    var flag = p.flag
      ? '<span class="pcard__flag' + (p.flag.toLowerCase().indexOf('dealer') > -1 ? ' pcard__flag--local' : '') + '">' + esc(p.flag) + '</span>'
      : (p.condition ? '<span class="pcard__flag pcard__flag--local">One only</span>' : '');
    return '<a class="pcard" href="product.html#' + esc(p.sku) + '">' +
      '<div class="pcard__media">' + flag +
        '<img src="' + esc(p.img) + '" alt="' + esc(p.brand + ' ' + p.name) + '" loading="lazy" decoding="async">' +
      '</div>' +
      '<div class="pcard__body">' +
        '<p class="pcard__opts">' + esc(optLine) +
          '<span class="dot" aria-hidden="true">·</span>' +
          '<span class="rate">' + p.rating.toFixed(1) + ' (' + p.reviews.toLocaleString('en-US') + ')</span>' +
          (p.was ? '<span class="pcard__was">' + money(p.was) + '</span>' : '') +
        '</p>' +
        '<span class="pcard__rule" aria-hidden="true"></span>' +
        '<span class="pcard__brand">' + esc(p.brand) + (p.type ? ' · ' + esc(p.type) : '') + '</span>' +
        '<h3 class="pcard__name">' + esc(p.name) + '</h3>' +
        (p.condition ? '<p class="pcard__cond">' + esc(p.condition) + '</p>' : '') +
        ledgerHTML(p.price, 'sm') +
        '<p class="pcard__ship">' + stockLine(p) + '</p>' +
      '</div></a>';
  }

  function bySku(sku) {
    var c = window.BD_CATALOG || [];
    for (var i = 0; i < c.length; i++) if (c[i].sku === sku) return c[i];
    return null;
  }

  /* ---------- expose for page scripts ---------- */
  window.BoxDrop = {
    dealers: DEALERS, currentDealer: currentDealer, setDealer: setDealer, nearest: nearest,
    states: STATES, stateForZip: stateForZip, zipGap: zipGap, openState: openState,
    zipRank: zipRank, compareRank: compareRank, stateMiles: stateMiles,
    hoursLine: hoursLine, dealerImg: dealerImg, dealerTier: dealerTier, inStock: inStock,
    weekFor: weekOf, clock: clockLabel,
    money: money, paintLedgers: paintLedgers, paintCart: paintCart, cart: cart,
    addToCart: addToCart, toast: toast, store: store, rangeLow: RANGE_LOW, rangeHigh: RANGE_HIGH,
    esc: esc, ledgerHTML: ledgerHTML, starsHTML: starsHTML, cardHTML: cardHTML,
    stockLine: stockLine, localRange: localRange, bySku: bySku, baseOption: baseOption,
    zip: function () { return store.get('bd.zip', null); },
    paintDealerChips: paintDealerChips, wireAdd: wireAdd
  };

  function init() {
    paintLedgers(); paintDealerChips(); paintCart();
    wireZipForms(); wireDrawer(); wireAdd();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
