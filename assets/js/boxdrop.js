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
    { id:'d478', name:'BoxDrop Nitro', city:'Nitro', state:'WV', zip:25143,
      addr:'4109 1st Avenue, Nitro, WV 25143', phone:'(304) 555 0142', factor:0.83,
      lat:38.415, lng:-81.843, oh:[[12,17],[10,19],[10,19],[10,19],[10,19],[10,19],[10,19]],
      img:'assets/img/s-showroom-1.jpg', tier:'Flagship floor', tierKey:'flagship', tierNote:'Every line on the floor, including pieces most stores only order in.' },
    { id:'d512', name:'BoxDrop Charleston', city:'Charleston', state:'WV', zip:25301,
      addr:'1201 Washington Street E, Charleston, WV 25301', phone:'(304) 555 0188', factor:0.86,
      lat:38.35, lng:-81.633, oh:[null,[10,18],[10,18],[10,18],[10,18],[10,18],[10,18]],
      img:'assets/img/s-showroom-2.jpg', tier:'Full line dealer', tierKey:'full', tierNote:'Mattresses, bases and furniture, all out on the floor to lie on.' },
    { id:'d604', name:'BoxDrop Teays Valley', city:'Hurricane', state:'WV', zip:25526,
      addr:'3886 Teays Valley Road, Hurricane, WV 25526', phone:'(304) 555 0119', factor:0.85,
      lat:38.433, lng:-82.025, oh:[[12,17],[10,18],[10,18],[10,18],[10,20],[10,20],[10,18]],
      img:'assets/img/s-bedroom-wide.jpg', tier:'Full line dealer', tierKey:'full', tierNote:'Mattresses, bases and furniture, all out on the floor to lie on.' },
    { id:'d731', name:'BoxDrop Huntington', city:'Huntington', state:'WV', zip:25701,
      addr:'2851 5th Avenue, Huntington, WV 25701', phone:'(304) 555 0164', factor:0.84,
      lat:38.419, lng:-82.445, oh:[[13,17],[11,19],[11,19],[11,19],[11,19],[11,19],[10,19]],
      img:'assets/img/b-mornington.jpg', tier:'Full line dealer', tierKey:'full', tierNote:'Mattresses, bases and furniture, all out on the floor to lie on.' },
    { id:'d890', name:'BoxDrop Parkersburg', city:'Parkersburg', state:'WV', zip:26101,
      addr:'1300 Grand Central Avenue, Parkersburg, WV 26101', phone:'(304) 555 0173', factor:0.87,
      lat:39.267, lng:-81.562, oh:[[12,17],[10,19],[10,19],[10,19],[10,19],[10,19],[10,19]],
      img:'assets/img/l-sectional-top.jpg', tier:'Full line dealer', tierKey:'full', tierNote:'Mattresses, bases and furniture, all out on the floor to lie on.' },
    { id:'d216', name:'BoxDrop Beckley', city:'Beckley', state:'WV', zip:25801,
      addr:'1620 Harper Road, Beckley, WV 25801', phone:'(304) 555 0206', factor:0.85,
      lat:37.778, lng:-81.188, oh:[null,[10,18],[10,18],[10,18],[10,18],[10,18],[10,18]],
      img:'assets/img/s-rest.jpg', tier:'Full line dealer', tierKey:'full', tierNote:'Mattresses, bases and furniture, all out on the floor to lie on.' },
    { id:'d233', name:'BoxDrop Morgantown', city:'Morgantown', state:'WV', zip:26505,
      addr:'1075 Van Voorhis Road, Morgantown, WV 26505', phone:'(304) 555 0231', factor:0.88,
      lat:39.629, lng:-79.956, oh:[[12,17],[10,18],[10,18],[10,18],[10,20],[10,20],[10,18]],
      img:'assets/img/b-adjroom.jpg', tier:'Full line dealer', tierKey:'full', tierNote:'Mattresses, bases and furniture, all out on the floor to lie on.' },
    { id:'d247', name:'BoxDrop Martinsburg', city:'Martinsburg', state:'WV', zip:25401,
      addr:'801 Foxcroft Avenue, Martinsburg, WV 25401', phone:'(304) 555 0247', factor:0.89,
      lat:39.456, lng:-77.964, oh:[[13,17],[11,19],[11,19],[11,19],[11,19],[11,19],[10,19]],
      img:'assets/img/l-recliner-hero.jpg', tier:'Mattress and base', tierKey:'mattress', tierNote:'Sleep only. Furniture comes in on order, usually inside a week.' },
    { id:'d259', name:'BoxDrop Clarksburg', city:'Clarksburg', state:'WV', zip:26301,
      addr:'412 Emily Drive, Clarksburg, WV 26301', phone:'(304) 555 0259', factor:0.86,
      lat:39.28, lng:-80.344, oh:[[12,17],[10,19],[10,19],[10,19],[10,19],[10,19],[10,19]],
      img:'assets/img/s-showroom-1.jpg', tier:'Full line dealer', tierKey:'full', tierNote:'Mattresses, bases and furniture, all out on the floor to lie on.' },
    { id:'d268', name:'BoxDrop Wheeling', city:'Wheeling', state:'WV', zip:26003,
      addr:'40 Twentyninth Street, Wheeling, WV 26003', phone:'(304) 555 0268', factor:0.87,
      lat:40.064, lng:-80.721, oh:[null,[10,18],[10,18],[10,18],[10,18],[10,18],[10,18]],
      img:'assets/img/s-showroom-2.jpg', tier:'Mattress and base', tierKey:'mattress', tierNote:'Sleep only. Furniture comes in on order, usually inside a week.' },
    { id:'d311', name:'BoxDrop Portsmouth', city:'Portsmouth', state:'OH', zip:45662,
      addr:'1202 Gallia Street, Portsmouth, OH 45662', phone:'(740) 555 0311', factor:0.84,
      lat:38.731, lng:-82.998, oh:[[12,17],[10,18],[10,18],[10,18],[10,20],[10,20],[10,18]],
      img:'assets/img/s-bedroom-wide.jpg', tier:'Full line dealer', tierKey:'full', tierNote:'Mattresses, bases and furniture, all out on the floor to lie on.' },
    { id:'d324', name:'BoxDrop Chillicothe', city:'Chillicothe', state:'OH', zip:45601,
      addr:'1270 N Bridge Street, Chillicothe, OH 45601', phone:'(740) 555 0324', factor:0.86,
      lat:39.333, lng:-82.983, oh:[[13,17],[11,19],[11,19],[11,19],[11,19],[11,19],[10,19]],
      img:'assets/img/b-mornington.jpg', tier:'Mattress and base', tierKey:'mattress', tierNote:'Sleep only. Furniture comes in on order, usually inside a week.' },
    { id:'d338', name:'BoxDrop Athens', city:'Athens', state:'OH', zip:45701,
      addr:'985 E State Street, Athens, OH 45701', phone:'(740) 555 0338', factor:0.85,
      lat:39.329, lng:-82.101, oh:[[12,17],[10,19],[10,19],[10,19],[10,19],[10,19],[10,19]],
      img:'assets/img/l-sectional-top.jpg', tier:'Full line dealer', tierKey:'full', tierNote:'Mattresses, bases and furniture, all out on the floor to lie on.' },
    { id:'d349', name:'BoxDrop Marietta', city:'Marietta', state:'OH', zip:45750,
      addr:'109 Acme Street, Marietta, OH 45750', phone:'(740) 555 0349', factor:0.86,
      lat:39.415, lng:-81.455, oh:[null,[10,18],[10,18],[10,18],[10,18],[10,18],[10,18]],
      img:'assets/img/s-rest.jpg', tier:'Mattress and base', tierKey:'mattress', tierNote:'Sleep only. Furniture comes in on order, usually inside a week.' },
    { id:'d357', name:'BoxDrop Grove City', city:'Grove City', state:'OH', zip:43123,
      addr:'2130 Stringtown Road, Grove City, OH 43123', phone:'(614) 555 0357', factor:0.88,
      lat:39.881, lng:-83.093, oh:[[12,17],[10,18],[10,18],[10,18],[10,20],[10,20],[10,18]],
      img:'assets/img/b-adjroom.jpg', tier:'Flagship floor', tierKey:'flagship', tierNote:'Every line on the floor, including pieces most stores only order in.' },
    { id:'d366', name:'BoxDrop Cambridge', city:'Cambridge', state:'OH', zip:43725,
      addr:'2428 Southgate Parkway, Cambridge, OH 43725', phone:'(740) 555 0366', factor:0.85,
      lat:40.031, lng:-81.588, oh:[[13,17],[11,19],[11,19],[11,19],[11,19],[11,19],[10,19]],
      img:'assets/img/l-recliner-hero.jpg', tier:'Clearance floor', tierKey:'outlet', tierNote:'One off pieces and floor models. What is there is what there is.' },
    { id:'d412', name:'BoxDrop Ashland', city:'Ashland', state:'KY', zip:41101,
      addr:'1515 Greenup Avenue, Ashland, KY 41101', phone:'(606) 555 0412', factor:0.83,
      lat:38.478, lng:-82.638, oh:[[12,17],[10,19],[10,19],[10,19],[10,19],[10,19],[10,19]],
      img:'assets/img/s-showroom-1.jpg', tier:'Full line dealer', tierKey:'full', tierNote:'Mattresses, bases and furniture, all out on the floor to lie on.' },
    { id:'d428', name:'BoxDrop Pikeville', city:'Pikeville', state:'KY', zip:41501,
      addr:'254 Hambley Boulevard, Pikeville, KY 41501', phone:'(606) 555 0428', factor:0.82,
      lat:37.479, lng:-82.519, oh:[null,[10,18],[10,18],[10,18],[10,18],[10,18],[10,18]],
      img:'assets/img/s-showroom-2.jpg', tier:'Mattress and base', tierKey:'mattress', tierNote:'Sleep only. Furniture comes in on order, usually inside a week.' },
    { id:'d433', name:'BoxDrop Lexington', city:'Lexington', state:'KY', zip:40502,
      addr:'3090 Richmond Road, Lexington, KY 40502', phone:'(859) 555 0433', factor:0.87,
      lat:38.015, lng:-84.472, oh:[[12,17],[10,18],[10,18],[10,18],[10,20],[10,20],[10,18]],
      img:'assets/img/s-bedroom-wide.jpg', tier:'Flagship floor', tierKey:'flagship', tierNote:'Every line on the floor, including pieces most stores only order in.' },
    { id:'d441', name:'BoxDrop Louisa', city:'Louisa', state:'KY', zip:41230,
      addr:'125 S Lake Drive, Louisa, KY 41230', phone:'(606) 555 0441', factor:0.81,
      lat:38.114, lng:-82.603, oh:[[13,17],[11,19],[11,19],[11,19],[11,19],[11,19],[10,19]],
      img:'assets/img/b-mornington.jpg', tier:'Clearance floor', tierKey:'outlet', tierNote:'One off pieces and floor models. What is there is what there is.' },
    { id:'d517', name:'BoxDrop Bristol', city:'Bristol', state:'VA', zip:24201,
      addr:'1521 Euclid Avenue, Bristol, VA 24201', phone:'(276) 555 0517', factor:0.84,
      lat:36.596, lng:-82.188, oh:[[12,17],[10,19],[10,19],[10,19],[10,19],[10,19],[10,19]],
      img:'assets/img/l-sectional-top.jpg', tier:'Full line dealer', tierKey:'full', tierNote:'Mattresses, bases and furniture, all out on the floor to lie on.' },
    { id:'d528', name:'BoxDrop Roanoke', city:'Roanoke', state:'VA', zip:24012,
      addr:'3433 Orange Avenue NE, Roanoke, VA 24012', phone:'(540) 555 0528', factor:0.86,
      lat:37.3, lng:-79.918, oh:[null,[10,18],[10,18],[10,18],[10,18],[10,18],[10,18]],
      img:'assets/img/s-rest.jpg', tier:'Full line dealer', tierKey:'full', tierNote:'Mattresses, bases and furniture, all out on the floor to lie on.' },
  ];

  var RANGE_LOW = 0.82, RANGE_HIGH = 0.88;

  function money(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  /* ---------- dealer state ---------- */
  /* ---------- geography and opening hours ----------------------------- */

  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /* ZIP centroids we actually know: the stores themselves. For any other ZIP
     we borrow the coordinates of the numerically closest one, which is rough
     but ordered the same way ZIPs are, and good enough to sort a list by. */
  function zipPoint(zip) {
    var n = parseInt(zip, 10);
    if (!n || isNaN(n)) return null;
    var best = null, bd = Infinity;
    for (var i = 0; i < DEALERS.length; i++) {
      var gap = Math.abs(DEALERS[i].zip - n);
      if (gap < bd) { bd = gap; best = DEALERS[i]; }
    }
    return best ? { lat: best.lat, lng: best.lng, exact: bd === 0 } : null;
  }

  function milesBetween(a, b) {
    if (!a || !b) return null;
    var R = 3958.8, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var la = a.lat * rad, lb = b.lat * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(la) * Math.cos(lb);
    return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))));
  }

  function clockLabel(h) {
    var ampm = h >= 12 ? 'PM' : 'AM', n = h % 12; if (n === 0) n = 12;
    return n + ' ' + ampm;
  }

  /* Open or shut right now, worked out from the week rather than stored as a
     sentence, so the card never claims a store is open on a day it is not. */
  function openState(d, now) {
    now = now || new Date();
    var day = now.getDay(), hour = now.getHours() + now.getMinutes() / 60;
    var today = d.oh && d.oh[day];
    if (today && hour >= today[0] && hour < today[1]) {
      return { open: true, text: 'Open until ' + clockLabel(today[1]) };
    }
    if (today && hour < today[0]) {
      return { open: false, text: 'Opens ' + clockLabel(today[0]) + ' today' };
    }
    for (var i = 1; i <= 7; i++) {
      var nd = (day + i) % 7, slot = d.oh && d.oh[nd];
      if (slot) {
        return { open: false, text: 'Opens ' + clockLabel(slot[0]) +
          (i === 1 ? ' tomorrow' : ' ' + DAYS[nd]) };
      }
    }
    return { open: false, text: 'Call for hours' };
  }

  function hoursLine(d) {
    if (!d.oh) return '';
    var out = [], i = 0;
    function key(s) { return s ? s[0] + '-' + s[1] : 'x'; }
    var order = [1, 2, 3, 4, 5, 6, 0];           /* Monday first, the way a door sign reads */
    while (i < order.length) {
      var j = i;
      while (j + 1 < order.length && key(d.oh[order[j + 1]]) === key(d.oh[order[i]])) j++;
      var slot = d.oh[order[i]];
      var span = i === j ? DAYS[order[i]].slice(0, 3)
                         : DAYS[order[i]].slice(0, 3) + ' to ' + DAYS[order[j]].slice(0, 3);
      out.push(span + ' ' + (slot ? clockLabel(slot[0]).replace(' AM', '').replace(' PM', '') +
        ' to ' + clockLabel(slot[1]).replace(' AM', '').replace(' PM', '') : 'closed'));
      i = j + 1;
    }
    return out.join(' · ');
  }

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
    zipPoint: zipPoint, milesBetween: milesBetween, openState: openState, hoursLine: hoursLine,
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
