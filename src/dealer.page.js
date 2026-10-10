/* One store's own page, after the way Hastens writes up a showroom: the shop
   itself rather than a second storefront. Address, the week's hours, what the
   place is, and a short strip of what is on that floor. */
(function () {
  'use strict';
  var BD = window.BoxDrop;
  var $ = function (s) { return document.querySelector(s); };
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function pick() {
    var id = (location.hash || '').replace('#', '');
    return BD.dealers.filter(function (d) { return d.id === id; })[0] || BD.currentDealer() || BD.dealers[0];
  }

  /* Written from what the sheet actually gives us, so it differs store to
     store without pretending to be the owner's own words. */
  function blurb(d, tier) {
    var st = BD.states[d.state] ? BD.states[d.state].name : d.state;
    var own = !/^boxdrop/i.test(d.name)
      ? 'It keeps its own name over the door rather than BoxDrop\'s, which is what independently owned means here. '
      : '';
    var floor = {
      outlet:   'This is a clearance floor. What is on it is what there is, and it turns over quickly, so it is worth a call before you drive.',
      mattress: 'It is a sleep floor: mattresses and bases out to lie on, with furniture ordered in, usually inside a week.',
      full:     'Mattresses, bases and furniture are all out on the floor, so you can lie on the thing before you buy it.'
    }[tier.key] || 'Mattresses and bases are out on the floor to lie on.';
    return '<p>' + BD.esc(d.name) + ' is one of 252 BoxDrop stores, and one of ' +
      stateCount(d.state) + ' in ' + BD.esc(st) + '. ' + BD.esc(own) + BD.esc(floor) + '</p>' +
      '<p>Because the store owns its own stock and drives its own van, it sets its own floor price. ' +
      'That is why the number you see here is lower than the one on the rest of this site, and why ' +
      'the same two people who load the van carry it up your stairs.</p>';
  }

  function stateCount(st) {
    return BD.dealers.filter(function (d) { return d.state === st; }).length;
  }

  function hoursTable(d) {
    var now = new Date(), today = now.getDay();
    var rows = [];
    for (var i = 0; i < 7; i++) {
      var day = (today + i) % 7;
      var date = new Date(now.getTime() + i * 86400000);
      var slot = BD.weekFor(d)[day];
      rows.push('<tr' + (i === 0 ? ' class="is-today"' : '') + '>' +
        '<th scope="row">' + (i === 0 ? 'Today' : DAYS[day]) + '</th>' +
        '<td class="d">' + MON[date.getMonth()] + ' ' + date.getDate() + '</td>' +
        '<td class="' + (slot ? '' : 'shut') + '">' +
          (slot ? BD.clock(slot[0]) + ' to ' + BD.clock(slot[1]) : 'Closed') + '</td></tr>');
    }
    return rows.join('');
  }

  function tiles(d, tier) {
    var ref = BD.bySku('sap-grandbay');
    var pct = Math.round((1 - d.factor) * 100);
    var mine = BD.currentDealer();
    var isMine = mine && mine.id === d.id;
    return '<a class="sttile" href="dealers.html">' +
        '<img src="assets/img/s-showroom-2.jpg" alt="" aria-hidden="true" loading="lazy">' +
        '<div><p class="eyebrow">Their floor price</p>' +
        '<h3>About ' + pct + '% under this website</h3>' +
        '<p>' + (ref ? 'The ' + BD.esc(ref.name) + ' is ' + BD.money(ref.price) + ' online and ' +
          BD.money(Math.round(ref.price * d.factor)) + ' on this floor.' : '') + '</p>' +
        '<span class="go">' + (isMine ? 'This is your store' : 'Compare other stores') +
        '<svg width="14" height="14" aria-hidden="true"><use href="#i-arrow"></use></svg></span></div></a>' +
      '<a class="sttile" href="index.html#how">' +
        '<img src="assets/img/s-rest.jpg" alt="" aria-hidden="true" loading="lazy">' +
        '<div><p class="eyebrow">' + BD.esc(tier.label) + '</p>' +
        '<h3>They deliver it themselves</h3>' +
        '<p>No freight carrier. The crew from this store brings it in, sets it up in the room you ' +
        'choose and takes the old mattress away.</p>' +
        '<span class="go">How the two prices work' +
        '<svg width="14" height="14" aria-hidden="true"><use href="#i-arrow"></use></svg></span></div></a>';
  }

  /* This strip belongs to the store whose page this is, not to whoever the
     visitor has picked, so it carries that store's own price and never the
     shared two price ledger. */
  function floorCard(p, d) {
    var base = BD.baseOption(p);
    return '<a class="pcard floorcard" href="product.html#' + BD.esc(p.sku) + '">' +
      '<div class="pcard__media">' +
        '<img src="' + BD.esc(p.img) + '" alt="' + BD.esc(p.brand + ' ' + p.name) + '" loading="lazy" decoding="async">' +
      '</div>' +
      '<div class="pcard__body">' +
        '<p class="pcard__opts">On the floor' + (base ? '<span class="dot" aria-hidden="true">\u00b7</span>' +
          '<span class="rate">' + BD.esc(base.name) + '</span>' : '') + '</p>' +
        '<span class="pcard__rule" aria-hidden="true"></span>' +
        '<span class="pcard__brand">' + BD.esc(p.brand) + (p.type ? ' \u00b7 ' + BD.esc(p.type) : '') + '</span>' +
        '<h3 class="pcard__name">' + BD.esc(p.name) + '</h3>' +
        '<p class="floorcard__price"><span class="amt num">' + BD.money(Math.round(p.price * d.factor)) + '</span>' +
          '<span class="was num">' + BD.money(p.price) + ' online</span></p>' +
      '</div></a>';
  }

  function floor(d) {
    var held = (window.BD_CATALOG || []).filter(function (p) { return BD.inStock(p, d); });
    var show = held.slice(0, 4);
    $('#st-floor').innerHTML = show.map(function (p) { return floorCard(p, d); }).join('');
    $('#st-floor-note').textContent = held.length
      ? held.length + ' of the ' + window.BD_CATALOG.length + ' lines on this site are on this floor today. ' +
        'Anything else they can usually bring in inside a week.'
      : 'Nothing of ours is on this floor today. They order in, usually inside a week.';
  }

  function near(d) {
    var others = BD.dealers.filter(function (x) { return x.state === d.state && x.id !== d.id; }).slice(0, 6);
    $('#st-near-h').textContent = others.length
      ? 'Other stores in ' + (BD.states[d.state] ? BD.states[d.state].name : d.state)
      : 'The rest of the network';
    $('#st-near').innerHTML = others.length
      ? others.map(function (o) {
          var os = BD.openState(o);
          return '<a class="stnear__item" href="dealer.html#' + BD.esc(o.id) + '">' +
            '<strong>' + BD.esc(o.name) + '</strong>' +
            '<span>' + BD.esc(o.city) + ', ' + BD.esc(o.state) + '</span>' +
            '<span class="' + (os.open ? 'open' : 'shut') + '">' + BD.esc(os.text) + '</span></a>';
        }).join('')
      : '<p class="measure">This is the only BoxDrop in the state so far.</p>';
  }

  function render() {
    var d = pick();
    if (!d) return;
    var tier = BD.dealerTier(d);
    var open = BD.openState(d);
    var st = BD.states[d.state] ? BD.states[d.state].name : d.state;

    document.title = d.name + ' · BoxDrop';
    $('#crumb-name').textContent = d.name;
    $('#st-name').textContent = d.name;
    $('#st-where').textContent = d.city + ', ' + st + ' · ' + tier.label;
    $('#st-sum').textContent = d.name + ' in ' + d.city + ': mattresses and furniture from an ' +
      'independently owned store that sets its own price and makes its own deliveries.';
    $('#st-open').innerHTML = '<b class="' + (open.open ? 'open' : 'shut') + '">' + BD.esc(open.text) + '</b>';
    $('#st-photo').src = BD.dealerImg(d);
    $('#st-photo').alt = 'The showroom floor at ' + d.name + '.';
    $('#st-addr').textContent = d.addr;
    $('#st-dir').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(d.addr);
    $('#st-phone').innerHTML = d.phone
      ? '<a class="phone-link" href="tel:' + d.phone.replace(/[^0-9]/g, '') + '">' + BD.esc(d.phone) + '</a>'
      : 'Not listed';
    $('#st-own').innerHTML = d.url
      ? '<a class="link-arrow" href="' + BD.esc(d.url) + '" target="_blank" rel="noopener noreferrer">' +
        'Their own store page <svg width="13" height="13" aria-hidden="true"><use href="#i-arrow"></use></svg></a>'
      : '';
    $('#st-hours').innerHTML = hoursTable(d);
    $('#st-info').innerHTML = blurb(d, tier);
    $('#st-tiles').innerHTML = tiles(d, tier);

    var mine = BD.currentDealer();
    $('#st-cta').innerHTML = (mine && mine.id === d.id)
      ? '<span class="btn btn--local" aria-disabled="true">This is your store</span>' +
        '<a class="btn btn--online" href="category.html#mattresses">Shop their prices</a>'
      : '<button type="button" class="btn btn--solid-local" data-pick="' + BD.esc(d.id) + '">Make this my store</button>' +
        '<a class="btn btn--ghost" href="dealers.html">Find another</a>';

    floor(d);
    near(d);
  }

  document.addEventListener('click', function (e) {
    var pickBtn = e.target.closest && e.target.closest('[data-pick]');
    if (!pickBtn) return;
    var d = BD.dealers.filter(function (x) { return x.id === pickBtn.getAttribute('data-pick'); })[0];
    if (d) {
      if (d.zip) BD.store.set('bd.zip', String(d.zip));
      BD.setDealer(d);
    }
  });

  window.addEventListener('hashchange', function () { render(); window.scrollTo({ top: 0 }); });
  document.addEventListener('bd:dealerchange', render);
  render();
})();
