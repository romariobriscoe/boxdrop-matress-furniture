/* Homepage editorial bands. Full bleed photograph, one product, the name and
   the dual price set over it. Prices come from the catalogue and resolve to
   the chosen dealer like every other price on the site. */
(function () {
  'use strict';
  var BD = window.BoxDrop;
  var el = document.getElementById('bands');
  if (!el || !BD) return;

  var BANDS = [
    { sku: 's2w-reactive-hybrid', img: 'assets/img/s-bedroom-wide.jpg',
      alt: 'A wide bedroom in soft daylight with a low platform bed made up in white.',
      sub: 'Two comfort settings on each side, and a zipper that lets you change your mind.' },
    { sku: 'vp-alloy', img: 'assets/img/l-sectional-alloy.jpg',
      alt: 'A grey modular sectional arranged along two walls of a bright living room.',
      sub: 'Six pieces that clip together in any order and come apart to get through a doorway.' },
    { sku: 'sc-stone', img: 'assets/img/l-recliner-stone.jpg',
      alt: 'A pale upholstered recliner beside a window in a quiet room.',
      sub: 'A recliner built to be slept in rather than apologised for, and it lifts you back out.' }
  ];

  function priceBlock(online) {
    var d = BD.currentDealer();
    var local = d ? BD.money(Math.round(online * d.factor)) : BD.localRange(online);
    return '<div class="band__price">' +
      '<span class="row on"><span class="lbl">Online</span><span class="amt">' + BD.money(online) + '</span></span>' +
      '<span class="row lo"><span class="lbl">' + BD.esc(d ? d.name : 'Your local dealer') + '</span>' +
        '<span class="amt">' + local + '</span></span>' +
      '<p class="band__why">' + (d
        ? 'You save ' + BD.money(online - Math.round(online * d.factor)) + ' buying it from them. Same product, same crew.'
        : 'Dealers set their own floor price. Enter your ZIP to see the real number.') + '</p>' +
      '</div>';
  }

  function paint() {
    el.innerHTML = BANDS.map(function (b) {
      var p = BD.bySku(b.sku);
      if (!p) return '';
      return '<a class="band" href="product.html#' + BD.esc(p.sku) + '">' +
        '<img src="' + BD.esc(b.img) + '" alt="' + BD.esc(b.alt) + '" loading="lazy" decoding="async">' +
        '<div class="band__in"><div class="wrap">' +
          '<p class="band__brand">' + BD.esc(p.brand) + '</p>' +
          '<h3>' + BD.esc(p.name) + '</h3>' +
          '<p class="band__sub">' + BD.esc(b.sub) + '</p>' +
          priceBlock(p.price) +
          '<span class="band__go">See it' +
            '<svg width="14" height="14" aria-hidden="true"><use href="#i-arrow"></use></svg></span>' +
        '</div></div></a>';
    }).join('');
  }

  /* The element autoplays natively, which is what muted video is allowed to
     do and what actually works; calling play() by hand raced the first byte
     and was rejected. All this does is stop it for anyone who has asked the
     system for reduced motion, and resume if they change their mind. */
  var film = document.getElementById('hero-film');
  if (film) {
    var still = window.matchMedia('(prefers-reduced-motion: reduce)');
    function sync() {
      if (still.matches) { film.pause(); film.removeAttribute('autoplay'); return; }
      var go = film.play();
      if (go && go.catch) go.catch(function () { /* blocked: the poster stands in */ });
    }
    still.addEventListener ? still.addEventListener('change', sync) : still.addListener(sync);
    if (still.matches) sync();
  }

  document.addEventListener('bd:dealerchange', paint);
  paint();
})();
