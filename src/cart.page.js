/* Cart. The last place to be straight with somebody about the two prices. */
(function () {
  'use strict';
  var BD = window.BoxDrop;
  var $ = function (s) { return document.querySelector(s); };
  var TAX = 0.06;              // WV state rate, used as a plausible estimate
  var FREE_OVER = 599;

  var SAMPLE = [
    { sku: 's2w-reactive-hybrid', size: 'Queen', qty: 1 },
    { sku: 'sap-ss200', size: 'Queen', qty: 1 },
    { sku: 'ne-nightstand', size: 'Walnut', qty: 2 }
  ];

  function lines() {
    return BD.cart().map(function (l) {
      var p = BD.bySku(l.sku);
      return {
        raw: l, p: p,
        name: l.name || (p && p.name) || l.sku,
        brand: l.brand || (p && p.brand) || '',
        img: l.img || (p && p.img) || '',
        size: l.size || '',
        price: typeof l.price === 'number' ? l.price : (p ? p.price : 0),
        qty: l.qty || 1
      };
    });
  }

  function save(list) {
    BD.store.set('bd.cart', list.map(function (l) {
      return { sku: l.raw.sku, name: l.name, brand: l.brand, price: l.price, img: l.img, size: l.size, qty: l.qty };
    }));
    BD.paintCart();
  }

  function render() {
    var L = lines();
    var any = L.length > 0;
    $('#cart-empty').hidden = any;
    $('#cart-grid').hidden = !any;
    $('#cart-lede').textContent = any
      ? 'Both prices are held side by side all the way through, so you can still change your mind about how you buy it.'
      : 'Nothing here yet.';
    if (!any) return;

    var d = BD.currentDealer();

    $('#lines').innerHTML = L.map(function (l, i) {
      var line = l.price * l.qty;
      var localLine = d ? Math.round(line * d.factor) : null;
      return '<div class="line">' +
        '<div class="line__media"><img src="' + BD.esc(l.img) + '" alt="' + BD.esc(l.name) + '" loading="lazy"></div>' +
        '<div class="line__body">' +
          '<span class="line__brand">' + BD.esc(l.brand) + '</span>' +
          '<h3 class="line__name"><a href="product.html#' + BD.esc(l.raw.sku) + '">' + BD.esc(l.name) + '</a></h3>' +
          (l.size ? '<span class="line__opt">' + BD.esc(l.size) + '</span>' : '') +
          '<div class="line__tools">' +
            '<span class="qty"><button type="button" data-q="-1" data-i="' + i + '" aria-label="Reduce quantity">−</button>' +
            '<span class="num">' + l.qty + '</span>' +
            '<button type="button" data-q="1" data-i="' + i + '" aria-label="Increase quantity">+</button></span>' +
            '<button type="button" class="linkbtn" data-rm="' + i + '">Remove</button>' +
          '</div>' +
        '</div>' +
        '<div class="line__price">' +
          '<span class="amt num">' + BD.money(line) + '</span>' +
          '<span class="loc num">' + (localLine
              ? BD.money(localLine) + ' at ' + BD.esc(d.name)
              : BD.localRange(line) + ' local') + '</span>' +
        '</div></div>';
    }).join('');

    var sub = L.reduce(function (a, l) { return a + l.price * l.qty; }, 0);
    var ship = sub >= FREE_OVER ? 0 : 89;
    var tax = (sub + ship) * TAX;
    var total = sub + ship + tax;

    $('#s-sub').textContent = BD.money(sub);
    $('#s-ship').textContent = ship ? BD.money(ship) : 'Free';
    $('#s-ship-label').textContent = ship ? 'Delivery and setup' : 'Delivery and setup, over ' + BD.money(FREE_OVER);
    $('#s-tax').textContent = BD.money(tax);
    $('#s-total').textContent = BD.money(total);
    $('#s-finance').innerHTML = '<b>' + BD.money(total / 12) + ' a month</b> for 12 months at 0% APR on approved credit.';

    // the final, honest reminder
    if (d) {
      var localSub = L.reduce(function (a, l) { return a + Math.round(l.price * l.qty * d.factor); }, 0);
      var localTotal = localSub + localSub * TAX;
      $('#nudge').innerHTML =
        '<p class="eyebrow eyebrow--local" style="margin:0">The same basket at your dealer</p>' +
        '<p class="figure num">' + BD.money(localTotal) + '</p>' +
        '<p>That is <b>' + BD.money(total - localTotal) + ' less</b> at ' + BD.esc(d.name) +
        ', collected or delivered by the same crew. Nothing about the order changes except where you pay for it.</p>' +
        '<p style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' +
        '<a class="btn btn--solid-local btn--sm" href="dealers.html">Call ' + BD.esc(d.name) + '</a>' +
        '</p>' +
        '<p style="font-size:var(--t-xs);color:var(--ink-3);margin:0">' +
        'Dealers set their own prices, so treat this as their usual rather than a quote.</p>';
    } else {
      $('#nudge').innerHTML =
        '<p class="eyebrow eyebrow--local" style="margin:0">Before you check out</p>' +
        '<p class="figure num">' + BD.money(total * (1 - BD.rangeHigh)) + ' to ' + BD.money(total * (1 - BD.rangeLow)) + '</p>' +
        '<p>That is roughly what this basket would be cheaper by at your local BoxDrop. ' +
        'Enter your ZIP and we will show you the real figure and who it is.</p>' +
        '<form data-zip-form style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">' +
        '<label class="vis-hidden" for="zip-cart">ZIP code</label>' +
        '<input id="zip-cart" name="zip" type="text" inputmode="numeric" autocomplete="postal-code" maxlength="5" placeholder="25143" ' +
        'style="height:46px;width:116px;padding:0 13px;border:1.5px solid var(--local);border-radius:3px;background:var(--surface);font-family:var(--mono);letter-spacing:.1em">' +
        '<button class="btn btn--solid-local btn--sm" type="submit" style="min-height:46px">Show the figure</button>' +
        '<p data-zip-error hidden style="flex-basis:100%;color:var(--stop);font-size:13px;margin:0"></p>' +
        '</form>';
      var form = $('#nudge').querySelector('[data-zip-form]');
      if (form) form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = (form.querySelector('input').value || '').trim();
        var err = form.querySelector('[data-zip-error]');
        if (!/^\d{5}$/.test(v)) { err.hidden = false; err.textContent = 'Enter a five digit ZIP code, for example 25143.'; return; }
        BD.store.set('bd.zip', v);
        BD.setDealer(BD.nearest(v));
      });
    }

    var when = new Date(Date.now() + 5 * 864e5).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    $('#cart-delivery').innerHTML = d
      ? '<b>' + BD.esc(d.name) + ' will bring this</b><p class="when">Earliest ' + when + '</p>' +
        '<p>' + BD.esc(d.addr) + '. Two people, into the room you choose, old mattress away with them. ' +
        'They will call the day before with a two hour window.</p>'
      : '<b>Delivered by your local BoxDrop</b><p class="when">Usually 3 to 7 days</p>' +
        '<p>We route the order to the dealer nearest the delivery address at checkout. Set your location ' +
        'now if you would rather know who that is first.</p>';
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.id === 'load-sample') {
      BD.store.set('bd.cart', SAMPLE.map(function (s) {
        var p = BD.bySku(s.sku);
        return { sku: s.sku, name: p.name, brand: p.brand, price: p.price, img: p.img, size: s.size, qty: s.qty };
      }));
      BD.paintCart(); render();
      BD.toast('Sample order loaded for review');
      return;
    }
    if (t.id === 'empty-cart') { BD.store.set('bd.cart', []); BD.paintCart(); render(); return; }
    if (t.id === 'checkout') {
      BD.toast('Checkout is out of scope for this prototype. The flow stops here.');
      return;
    }
    if (t.dataset && t.dataset.q) {
      var L = lines(), i = parseInt(t.dataset.i, 10);
      L[i].qty = Math.max(1, L[i].qty + parseInt(t.dataset.q, 10));
      save(L); render(); return;
    }
    if (t.dataset && t.dataset.rm !== undefined) {
      var L2 = lines(); L2.splice(parseInt(t.dataset.rm, 10), 1);
      save(L2); render();
    }
  });

  document.addEventListener('bd:dealerchange', render);
  render();
})();
