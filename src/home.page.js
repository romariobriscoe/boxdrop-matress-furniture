/* Best sellers come from the same catalogue and the same card renderer the
   category grid uses, so the two can never drift apart. */
(function () {
  'use strict';
  var BD = window.BoxDrop;
  var PICKS = ['sap-grandbay', 's2w-reactive-hybrid', 'br-black', 'se-icomfortpro'];
  var el = document.getElementById('best');
  if (!el || !BD) return;
  function paint() {
    el.innerHTML = PICKS.map(BD.bySku).filter(Boolean).map(BD.cardHTML).join('');
    BD.paintLedgers();
  }
  document.addEventListener('bd:dealerchange', paint);
  paint();
})();
