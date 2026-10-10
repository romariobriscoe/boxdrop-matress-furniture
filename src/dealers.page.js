/* Dealer locator. 252 stores in 44 states, from the BoxDrop Direct network.
   A BoxDrop dealer sets their own price, so every card carries their number
   rather than the site's. */
(function () {
  'use strict';
  var BD = window.BoxDrop;
  var $ = function (s) { return document.querySelector(s); };
  var REF = 'sap-grandbay';          /* one mattress every floor is priced against */

  var state = { q: '', st: 'all', tier: 'all', mapOpen: false };

  function all() { return BD.dealers; }

  function counts() {
    var c = {};
    all().forEach(function (d) { c[d.state] = (c[d.state] || 0) + 1; });
    return c;
  }

  /* Store names spell the brand one way now, but shoppers type it both ways,
     so the brand token is collapsed on each side before comparing. */
  function brandFold(s) { return s.toLowerCase().replace(/\bbox\s+drop\b/g, 'boxdrop'); }

  /* A five digit ZIP in the box is a proximity question, not a filter: it
     orders every store by how near its ZIP is, rather than cutting the list
     down to one state. */
  function searchZip() {
    var q = state.q.trim();
    return /^\d{5}$/.test(q) ? q : null;
  }

  function sortZip() { return searchZip() || BD.zip(); }

  function matches(d) {
    if (state.st !== 'all' && d.state !== state.st) return false;
    if (state.tier !== 'all' && BD.dealerTier(d).key !== state.tier) return false;
    var q = brandFold(state.q.trim());
    if (!q || searchZip()) return true;
    var full = BD.states[d.state] ? BD.states[d.state].name : d.state;
    return brandFold(d.name + ' ' + d.city + ' ' + d.state + ' ' + full + ' ' + d.addr).indexOf(q) > -1;
  }

  function visible() {
    var z = sortZip();
    return all().filter(matches).sort(function (a, b) {
      if (z) {
        var r = BD.compareRank(BD.zipRank(a, z), BD.zipRank(b, z));
        if (r) return r;
      }
      if (a.state !== b.state) return a.state.localeCompare(b.state);
      return a.city.localeCompare(b.city);
    });
  }

  /* ---------- the national map --------------------------------------------
     A state tile grid rather than a projection. There are no store
     coordinates in the source and no boundary data here, so a scatter of
     bubbles had nothing behind it to read against and most states went
     unlabelled. A grid is openly schematic, labels every state, never
     overlaps, and still shows where the network is thin. */

  /* col, row. Eleven columns west to east, eight rows north to south. */
  var GRID = {
    AK:[0,0], ME:[10,0],
    VT:[9,1], NH:[10,1],
    WA:[0,2], ID:[1,2], MT:[2,2], ND:[3,2], MN:[4,2], WI:[5,2], MI:[6,2], NY:[8,2], RI:[9,2], MA:[10,2],
    OR:[0,3], NV:[1,3], WY:[2,3], SD:[3,3], IA:[4,3], IL:[5,3], IN:[6,3], OH:[7,3], PA:[8,3], NJ:[9,3], CT:[10,3],
    CA:[0,4], UT:[1,4], CO:[2,4], NE:[3,4], MO:[4,4], KY:[5,4], WV:[6,4], VA:[7,4], MD:[8,4], DE:[9,4],
    AZ:[1,5], NM:[2,5], KS:[3,5], AR:[4,5], TN:[5,5], NC:[6,5], SC:[7,5], DC:[8,5],
    OK:[3,6], LA:[4,6], MS:[5,6], AL:[6,6], GA:[7,6],
    HI:[0,7], TX:[3,7], FL:[8,7]
  };

  function mapSVG(list) {
    var T = 40, GAP = 5, PAD = 4;
    var W = 11 * (T + GAP) - GAP + PAD * 2;
    var H = 8 * (T + GAP) - GAP + PAD * 2;
    var total = counts(), shown = {};
    list.forEach(function (d) { shown[d.state] = (shown[d.state] || 0) + 1; });
    var mine = BD.currentDealer();

    var out = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="A grid of the fifty ' +
      'states, one tile each, showing how many BoxDrop stores are in each. ' + all().length +
      ' stores across ' + Object.keys(total).length + ' states.">'];

    Object.keys(GRID).forEach(function (st) {
      var g = GRID[st];
      var x = PAD + g[0] * (T + GAP), y = PAD + g[1] * (T + GAP);
      var n = total[st] || 0;
      var inResults = (shown[st] || 0) > 0;
      var isMine = mine && mine.state === st;
      var has = n > 0;
      var fill = isMine ? '#2DB84B' : has ? (inResults ? '#111D6B' : '#A8B0D8') : '#EDEFF6';
      var ink = has ? '#FFFFFF' : '#A7ADC4';
      var nm = BD.states[st] ? BD.states[st].name : st;

      out.push('<g class="mapdot' + (has ? '' : ' is-off') + '" data-state="' + st + '"' +
        (has ? ' tabindex="0" role="button"' : '') + '>');
      out.push('<title>' + BD.esc(nm) + ': ' + (has ? n + ' store' + (n === 1 ? '' : 's') : 'no stores yet') + '</title>');
      out.push('<rect x="' + x + '" y="' + y + '" width="' + T + '" height="' + T + '" rx="3" fill="' + fill + '"/>');
      out.push('<text x="' + (x + T / 2) + '" y="' + (y + 17) + '" text-anchor="middle" ' +
        'font-family="IBM Plex Mono, monospace" font-size="12" font-weight="600" fill="' + ink + '">' + st + '</text>');
      if (has) {
        out.push('<text x="' + (x + T / 2) + '" y="' + (y + 31) + '" text-anchor="middle" ' +
          'font-family="IBM Plex Mono, monospace" font-size="11" fill="' + ink + '" opacity=".82">' + n + '</text>');
      }
      out.push('</g>');
    });
    out.push('</svg>');
    return out.join('');
  }

  /* ---------- cards -------------------------------------------------------- */

  function cardHTML(d) {
    var mine = BD.currentDealer();
    var isMine = mine && mine.id === d.id;
    var ref = BD.bySku(REF);
    var price = ref ? Math.round(ref.price * d.factor) : null;
    var tier = BD.dealerTier(d);
    var open = BD.openState(d);

    return '<article class="dcard' + (isMine ? ' is-mine' : '') + '" id="store-' + BD.esc(d.id) + '">' +
      '<div class="dcard__media">' +
        '<img src="' + BD.esc(BD.dealerImg(d)) + '" alt="A BoxDrop showroom floor." loading="lazy" decoding="async">' +
        '<span class="dcard__tier dcard__tier--' + tier.key + '">' + BD.esc(tier.label) + '</span>' +
      '</div>' +
      '<div class="dcard__body">' +
        (isMine ? '<span class="dcard__mine"><svg width="12" height="12" aria-hidden="true"><use href="#i-pin"></use></svg> Your store</span>' : '') +
        '<h3>' + BD.esc(d.name) + '</h3>' +
        '<address class="dcard__addr">' + BD.esc(d.addr) + '</address>' +
        '<p class="dcard__open"><b class="' + (open.open ? 'open' : 'shut') + '">' +
          BD.esc(open.text) + '</b></p>' +
        (price ? '<p class="dcard__price"><span class="amt num">' + BD.money(price) + '</span>' +
          '<span class="was num">' + BD.money(ref.price) + ' online</span></p>' : '') +
        '<a class="btn btn--online btn--sm dcard__visit" href="dealer.html#' + BD.esc(d.id) + '">Visit local page</a>' +
        (d.phone
          ? '<a class="phone-link" href="tel:' + d.phone.replace(/[^0-9]/g, '') + '">' + BD.esc(d.phone) + '</a>'
          : '<span class="phone-link" aria-disabled="true">No number listed</span>') +
      '</div></article>';
  }

  /* Named groups with their own counts, the way the reference locator splits
     its stores from its resellers. Here the natural split is the state. */
  function setMap(open) {
    state.mapOpen = open;
    $('#mapwrap').hidden = !open;
    $('#view-map').setAttribute('aria-expanded', String(open));
    $('#view-map-label').textContent = open ? 'Hide map' : 'View map';
    try { BD.store.set('bd.locmap', open ? '1' : '0'); } catch (e) {}
  }

  /* In proximity mode the list is one run ordered by ZIP, so state headings
     would hide the very ordering that was asked for. */
  function renderNearest(list, zip) {
    var near = list.slice(0, 9), rest = list.slice(9);
    function block(title, note, items, id) {
      if (!items.length) return '';
      return '<section class="dsection"' + (id ? ' id="' + id + '"' : '') + '>' +
        '<header class="dsection__head"><h2>' + BD.esc(title) + '</h2>' +
        '<span class="dsection__n">' + items.length + ' ' + (items.length === 1 ? 'store' : 'stores') + '</span>' +
        (note ? '<p>' + BD.esc(note) + '</p>' : '') + '</header>' +
        '<div class="dlist">' + items.map(cardHTML).join('') + '</div></section>';
    }
    return block('Closest to ' + zip, 'Ordered by how near each store\u2019s ZIP is to yours.', near, 'nearest') +
           block('The rest of the network', null, rest);
  }

  function render() {
    var list = visible();
    var zq = searchZip();
    if (zq) {
      $('#dsections').innerHTML = list.length
        ? renderNearest(list, zq)
        : '<div class="empty"><h3>No stores match that</h3><p>Clear the floor or state filter and try again.</p>' +
          '<p style="margin-top:20px"><button type="button" class="btn btn--ghost btn--sm" id="loc-clear">Clear search</button></p></div>';
      $('#map').innerHTML = mapSVG(list);
      $('#loc-count').textContent = list.length;
      $('#loc-word').textContent = list.length === 1 ? 'store' : 'stores';
      $('#loc-near').textContent = 'nearest ' + zq + ' first';
      return;
    }
    var byState = {};
    list.forEach(function (d) { (byState[d.state] = byState[d.state] || []).push(d); });
    var order = Object.keys(byState);
    var z = BD.zip(), home = z ? BD.stateForZip(z) : null;
    order.sort(function (a, b) {
      if (home && a === home) return -1;
      if (home && b === home) return 1;
      return (BD.states[a] ? BD.states[a].name : a).localeCompare(BD.states[b] ? BD.states[b].name : b);
    });

    $('#dsections').innerHTML = list.length
      ? order.map(function (st) {
          var items = byState[st];
          var nm = BD.states[st] ? BD.states[st].name : st;
          return '<section class="dsection" id="state-' + st + '">' +
            '<header class="dsection__head">' +
              '<h2>' + BD.esc(nm) + '</h2>' +
              '<span class="dsection__n">' + items.length + ' ' + (items.length === 1 ? 'store' : 'stores') + '</span>' +
              (home === st ? '<p>Your ZIP puts you here.</p>' : '') +
            '</header>' +
            '<div class="dlist">' + items.map(cardHTML).join('') + '</div>' +
          '</section>';
        }).join('')
      : '<div class="empty"><h3>No stores match that</h3>' +
        '<p>Try a state, a town or a five digit ZIP. BoxDrop has 252 stores but not one in every county yet.</p>' +
        '<p style="margin-top:20px"><button type="button" class="btn btn--ghost btn--sm" id="loc-clear">Clear search</button></p></div>';

    $('#map').innerHTML = mapSVG(list);
    $('#loc-count').textContent = list.length;
    $('#loc-word').textContent = list.length === 1 ? 'store' : 'stores';
    $('#loc-near').textContent = state.st !== 'all'
      ? 'in ' + (BD.states[state.st] ? BD.states[state.st].name : state.st)
      : (z ? 'nearest ' + z + ' first' : 'in ' + Object.keys(counts()).length + ' states');
    var input = $('#zip-loc');
    if (z && !input.value && !state.q) input.value = z;
  }

  function fillStateSelect() {
    var c = counts();
    var opts = ['<option value="all">Every state</option>'];
    Object.keys(c).sort(function (a, b) {
      return (BD.states[a] ? BD.states[a].name : a).localeCompare(BD.states[b] ? BD.states[b].name : b);
    }).forEach(function (st) {
      opts.push('<option value="' + st + '">' + BD.esc(BD.states[st] ? BD.states[st].name : st) +
        ' (' + c[st] + ')</option>');
    });
    $('#state-sel').innerHTML = opts.join('');
  }

  /* ---------- events -------------------------------------------------------- */

  document.addEventListener('click', function (e) {
    var t = e.target;
    var pick = t.closest && t.closest('[data-pick]');
    if (pick) {
      var d = BD.dealers.filter(function (x) { return x.id === pick.getAttribute('data-pick'); })[0];
      if (d) {
        if (d.zip) BD.store.set('bd.zip', String(d.zip));
        BD.setDealer(d);
      }
      return;
    }
    var dot = t.closest && t.closest('.mapdot');
    if (dot) {
      state.st = dot.getAttribute('data-state');
      $('#state-sel').value = state.st;
      render();
      setMap(false);
      var sec = $('#state-' + state.st);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (t.closest && t.closest('#use-loc')) {
      BD.toast('A live site would ask your browser for this. Type a ZIP for now.');
      $('#zip-loc').focus();
      return;
    }
    if (t.closest && t.closest('#view-map')) { setMap(!state.mapOpen); return; }
    if (t.id === 'loc-clear') {
      state.q = ''; state.st = 'all'; state.tier = 'all';
      $('#zip-loc').value = ''; $('#state-sel').value = 'all'; $('#tier').value = 'all';
      render();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var dot = e.target.closest && e.target.closest('.mapdot');
    if (dot) { e.preventDefault(); dot.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });

  document.addEventListener('change', function (e) {
    if (e.target.id === 'state-sel') { state.st = e.target.value; render(); }
    if (e.target.id === 'tier') { state.tier = e.target.value; render(); }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id !== 'zip-loc') return;
    state.q = e.target.value;
    render();
  });

  document.addEventListener('bd:dealerchange', function () {
    var box = $('#zip-loc');
    state.q = box && /^\d{5}$/.test(box.value.trim()) ? box.value.trim() : '';
    render();
  });

  fillStateSelect();
  setMap(BD.store.get('bd.locmap', '0') === '1');
  render();
})();
