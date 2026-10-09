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
  var DEALERS = [
    { id:'d478', name:'BoxDrop Nitro',          city:'Nitro, WV',        zip:25143,
      addr:'4109 1st Avenue, Nitro, WV 25143',  phone:'(304) 555 0142', factor:0.83,
      open:'Open until 7:00 PM', hours:'Mon to Sat 10 to 7 · Sun 12 to 5',
      img:'assets/img/s-showroom-1.jpg', tier:'Full line dealer', miles:'4 mi' },
    { id:'d512', name:'BoxDrop Charleston',     city:'Charleston, WV',   zip:25301,
      addr:'1201 Washington Street E, Charleston, WV 25301', phone:'(304) 555 0188', factor:0.86,
      open:'Open until 6:00 PM', hours:'Mon to Sat 10 to 6 · Sun closed',
      img:'assets/img/s-showroom-2.jpg', tier:'Full line dealer', miles:'16 mi' },
    { id:'d604', name:'BoxDrop Teays Valley',   city:'Hurricane, WV',    zip:25526,
      addr:'3886 Teays Valley Road, Hurricane, WV 25526', phone:'(304) 555 0119', factor:0.85,
      open:'Closes 5:00 PM', hours:'Tue to Sat 10 to 5 · Sun and Mon closed',
      img:'assets/img/b-adjroom.jpg', tier:'Mattress and bedroom', miles:'23 mi' },
    { id:'d731', name:'BoxDrop Huntington',     city:'Huntington, WV',   zip:25701,
      addr:'2840 5th Avenue, Huntington, WV 25701', phone:'(304) 555 0170', factor:0.84,
      open:'Open until 7:00 PM', hours:'Mon to Sat 10 to 7 · Sun 1 to 5',
      img:'assets/img/b-walnut-set.jpg', tier:'Full line dealer', miles:'48 mi' },
    { id:'d890', name:'BoxDrop Parkersburg',    city:'Parkersburg, WV',  zip:26101,
      addr:'1710 Grand Central Avenue, Vienna, WV 26105', phone:'(304) 555 0133', factor:0.87,
      open:'Open until 6:00 PM', hours:'Mon to Sat 10 to 6 · Sun 12 to 4',
      img:'assets/img/b-adjroom.jpg', tier:'Mattress only', miles:'71 mi' }
  ];

  var RANGE_LOW = 0.82, RANGE_HIGH = 0.88;

  function money(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  /* ---------- dealer state ---------- */
  function currentDealer() {
    var id = store.get('bd.dealer', null);
    if (!id) return null;
    for (var i = 0; i < DEALERS.length; i++) if (DEALERS[i].id === id) return DEALERS[i];
    return null;
  }

  function nearest(zip) {
    var n = parseInt(String(zip).slice(0, 5), 10);
    if (isNaN(n)) return null;
    var best = DEALERS[0], bd = Infinity;
    for (var i = 0; i < DEALERS.length; i++) {
      var d = Math.abs(DEALERS[i].zip - n);
      if (d < bd) { bd = d; best = DEALERS[i]; }
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

  function stockLine(p) {
    var d = currentDealer();
    var list = p.stock || [];
    if (d) {
      return list.indexOf(d.id) > -1
        ? '<b>In stock</b> at ' + esc(d.name)
        : 'Order in at ' + esc(d.name) + ', about 7 days';
    }
    return '<b>In stock</b> at ' + list.length + ' dealer' + (list.length === 1 ? '' : 's');
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
