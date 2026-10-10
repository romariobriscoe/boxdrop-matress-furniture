/* BoxDrop sample catalogue.
   Realistic stand-in data for the prototype. Prices are the ONLINE price for
   the base option; dealer pricing is derived per dealer at render time.
   Photography is placeholder imagery from the brands BoxDrop carries. */
(function () {
  'use strict';

  var MATTRESS_SIZES = [
    { name: 'Twin',     delta: -300, dims: '38 x 75 in' },
    { name: 'Twin XL',  delta: -250, dims: '38 x 80 in' },
    { name: 'Full',     delta: -150, dims: '54 x 75 in' },
    { name: 'Queen',    delta: 0,    dims: '60 x 80 in' },
    { name: 'King',     delta: 300,  dims: '76 x 80 in' },
    { name: 'Cal King', delta: 300,  dims: '72 x 84 in' }
  ];
  var BASE_SIZES = [
    { name: 'Twin XL',  delta: -200, dims: '38 x 80 in' },
    { name: 'Queen',    delta: 0,    dims: '60 x 80 in' },
    { name: 'King',     delta: 400,  dims: '2 x 38 x 80 in' },
    { name: 'Cal King', delta: 400,  dims: '2 x 36 x 84 in' }
  ];

  var CATEGORIES = {
    mattresses: {
      title: 'Mattresses',
      lede: 'Every mattress on this site is one your local dealer can put you on before you buy. ' +
            'Firmness is rated on one scale across all four brands, so a medium here is a medium everywhere.',
      optionLabel: 'Size'
    },
    bases: {
      title: 'Adjustable bases',
      lede: 'Head up for reading, feet up for circulation, and a flat position that still fits your frame. ' +
            'Every base here pairs with every mattress we sell.',
      optionLabel: 'Size'
    },
    bedroom: {
      title: 'Bedroom',
      lede: 'Frames, headboards, nightstands and full sets. Delivered and assembled in the room by the same ' +
            'crew that brings your mattress.',
      optionLabel: 'Finish'
    },
    living: {
      title: 'Living room',
      lede: 'Modular seating you can add to later, and recliners built for people who actually fall asleep in them. ' +
            'Pieces ship individually so a sectional can grow one chair at a time.',
      optionLabel: 'Fabric'
    },
    dining: {
      title: 'Dining',
      lede: 'Tables, chairs, stools and servers from Steve Silver. Sets ship as sets, and the crew ' +
            'that brings your mattress assembles them in the room rather than leaving you a flat pack.',
      optionLabel: 'Finish'
    },
    outlet: {
      title: 'Outlet',
      lede: 'Floor models, customer returns and one off sizes. Every piece is inspected, every piece is sold once, ' +
            'and the trial period still applies.',
      optionLabel: 'Size'
    }
  };

  function sizes(list, label) { return { label: label || 'Size', values: list }; }
  function opts(label, names) {
    return { label: label, values: names.map(function (n) { return { name: n, delta: 0 }; }) };
  }

  var P = [

    /* ---------------- mattresses ---------------- */
    {
      sku: 's2w-reactive-hybrid', cat: 'mattresses', brand: 'Sleep2Win by Sapphire Sleep',
      name: 'Reactive Hybrid 15 inch', price: 1899, img: 'assets/img/m-reactive.jpg',
      gallery: ['assets/img/m-reactive.jpg', 'assets/img/d-surface-quilt.jpg', 'assets/img/d-surface-hybrid.jpg', 'assets/img/d-coil.jpg'],
      rating: 4.8, reviews: 64, type: 'Hybrid', firmness: 6, height: 15, flag: 'New for 2026',
      options: sizes(MATTRESS_SIZES.slice(1)), stock: ['d478', 'd512', 'd731', 'd259', 'd311', 'd338', 'd349', 'd357', 'd428'],
      blurb: 'Two comfort settings on each side, and a zipper that lets you change your mind. ' +
             'Unzip the cover, lift out the 5 inch comfort top and set each side to medium firm or medium plush. ' +
             'No pump, no app, nothing to plug in.',
      features: ['Swappable comfort top', 'Cooling cover', 'Adjustable base ready', 'Made in the USA'],
      layers: [
        { name: 'Cooling quilted cover', h: 0.5, note: 'Zips off, hypoallergenic' },
        { name: 'Swappable comfort top', h: 5,   note: '5 in per side, firm or plush' },
        { name: 'Transition foam',        h: 1,   note: '' },
        { name: 'Pocketed coils',         h: 7,   note: 'Up to 1,088, foam encased' },
        { name: 'Base foam',              h: 1.5, note: '' }
      ],
      specs: [
        ['Profile height', '15 in'],
        ['Comfort scale', '6 of 10, medium, and 4 of 10 when flipped to plush'],
        ['Coil count', 'Up to 2,600 micro coils over up to 1,088 pocketed coils'],
        ['Edge support', 'Foam encased, reinforced perimeter'],
        ['Cover', 'Quilted cooling knit, zips off and washes'],
        ['Certification', 'CertiPUR-US foams'],
        ['Trial', '101 nights'],
        ['Warranty', '10 years, non prorated'],
        ['Assembled in', 'United States']
      ]
    },
    {
      sku: 'sap-grandbay', cat: 'mattresses', brand: 'Sapphire Sleep',
      name: 'Grand Bay Luxury Firm Tight Top', price: 899, img: 'assets/img/m-grandbay.jpg',
      gallery: ['assets/img/m-grandbay.jpg', 'assets/img/d-surface-quilt.jpg', 'assets/img/d-innerspring.jpg'],
      rating: 4.6, reviews: 212, type: 'Innerspring', firmness: 7, height: 12, flag: 'Dealer favourite',
      options: sizes(MATTRESS_SIZES), stock: ['d478', 'd512', 'd604', 'd731', 'd890', 'd259', 'd311', 'd324', 'd338', 'd349', 'd428', 'd433', 'd517'],
      blurb: 'The bed our dealers sell more of than anything else. A firm tight top on a pocketed coil ' +
             'unit, with no pillow top to soften or settle. If you wake up sinking, start here.',
      features: ['Firm support', 'No pillow top to settle', 'Pocketed coils', 'Made in the USA'],
      specs: [['Profile height', '12 in'], ['Comfort scale', '7 of 10, firm'], ['Coil count', '884 pocketed coils'],
              ['Edge support', 'Foam encased'], ['Trial', '101 nights'], ['Warranty', '10 years']]
    },
    {
      sku: 'sap-immense', cat: 'mattresses', brand: 'Sapphire Sleep',
      name: 'Immense Luxury Firm Pillow Top', price: 1199, img: 'assets/img/m-immense.jpg',
      gallery: ['assets/img/m-immense.jpg', 'assets/img/d-surface-hybrid.jpg'],
      rating: 4.7, reviews: 168, type: 'Pillow top', firmness: 6, height: 14,
      options: sizes(MATTRESS_SIZES), stock: ['d478', 'd512', 'd604', 'd247', 'd268', 'd311', 'd338', 'd349', 'd357', 'd412', 'd433', 'd517'],
      blurb: 'A supportive coil unit under a genuine pillow top, which is the combination most couples ' +
             'land on when one of them sleeps on their side.',
      features: ['Pillow top', 'Pocketed coils', 'Medium feel', 'Made in the USA'],
      specs: [['Profile height', '14 in'], ['Comfort scale', '6 of 10, medium'], ['Coil count', '1,024 pocketed coils'],
              ['Trial', '101 nights'], ['Warranty', '10 years']]
    },
    {
      sku: 'sap-coolphase', cat: 'mattresses', brand: 'Sapphire Sleep',
      name: 'CoolPhase Hybrid', price: 1499, img: 'assets/img/m-coolphase-hybrid.jpg',
      gallery: ['assets/img/m-coolphase-hybrid.jpg', 'assets/img/d-foam.jpg'],
      rating: 4.6, reviews: 97, type: 'Hybrid', firmness: 5, height: 13,
      options: sizes(MATTRESS_SIZES), stock: ['d478', 'd731', 'd233', 'd268', 'd338', 'd357', 'd412', 'd433'],
      blurb: 'Phase change material in the quilt pulls heat away for the first hour, which is the hour ' +
             'that decides whether you fall asleep. For people who run hot.',
      features: ['Phase change cooling', 'Hybrid coils', 'Medium feel'],
      specs: [['Profile height', '13 in'], ['Comfort scale', '5 of 10, medium'], ['Cooling', 'Phase change quilt panel'],
              ['Trial', '101 nights'], ['Warranty', '10 years']]
    },
    {
      sku: 'sap-silver', cat: 'mattresses', brand: 'Sapphire Sleep',
      name: 'Silver Series Plush', price: 1099, img: 'assets/img/m-silver.jpg',
      gallery: ['assets/img/m-silver.jpg', 'assets/img/d-foam.jpg'],
      rating: 4.4, reviews: 143, type: 'Memory foam', firmness: 4, height: 12,
      options: sizes(MATTRESS_SIZES), stock: ['d512', 'd604', 'd216', 'd259', 'd349', 'd357', 'd412', 'd428', 'd517', 'd528'],
      blurb: 'A soft memory foam bed with a silver infused cover. Side sleepers and lighter frames ' +
             'get the pressure relief they are after without losing the edge.',
      features: ['Memory foam', 'Plush feel', 'Silver infused cover'],
      specs: [['Profile height', '12 in'], ['Comfort scale', '4 of 10, plush'], ['Trial', '101 nights'], ['Warranty', '10 years']]
    },
    {
      sku: 'br-black', cat: 'mattresses', brand: 'Beautyrest',
      name: 'Black C Class Medium', price: 2299, img: 'assets/img/m-br-black.png',
      gallery: ['assets/img/m-br-black.png', 'assets/img/d-surface-quilt.jpg', 'assets/img/d-coil.jpg'],
      rating: 4.7, reviews: 1284, type: 'Hybrid', firmness: 5, height: 14,
      options: sizes(MATTRESS_SIZES), stock: ['d478', 'd512', 'd731', 'd216', 'd247', 'd259', 'd268', 'd311', 'd338', 'd357', 'd366', 'd428', 'd433', 'd528'],
      blurb: 'The bed people come in asking for by name. Beautyrest Black puts a dense micro coil layer ' +
             'over the main unit, which is why it feels supportive and soft at the same time.',
      features: ['Micro coil comfort layer', 'Medium feel', 'Premium quilt'],
      specs: [['Profile height', '14 in'], ['Comfort scale', '5 of 10, medium'], ['Coil system', 'T3 pocketed coil with micro coils'],
              ['Trial', '101 nights'], ['Warranty', '10 years']]
    },
    {
      sku: 'br-harmony', cat: 'mattresses', brand: 'Beautyrest',
      name: 'Harmony Lux Carbon Medium', price: 1399, img: 'assets/img/m-br-harmony.png',
      gallery: ['assets/img/m-br-harmony.png', 'assets/img/d-surface-hybrid.jpg'],
      rating: 4.5, reviews: 642, type: 'Hybrid', firmness: 5, height: 13,
      options: sizes(MATTRESS_SIZES), stock: ['d478', 'd604', 'd890', 'd216', 'd233', 'd247', 'd259', 'd311', 'd324', 'd338', 'd357', 'd366', 'd433', 'd528'],
      blurb: 'A carbon fibre layer spreads weight sideways instead of letting it sink, so the bed stays ' +
             'flat under two very different people.',
      features: ['Carbon fibre support', 'Hybrid coils', 'Medium feel'],
      specs: [['Profile height', '13 in'], ['Comfort scale', '5 of 10, medium'], ['Trial', '101 nights'], ['Warranty', '10 years']]
    },
    {
      sku: 'br-pressuresmart', cat: 'mattresses', brand: 'Beautyrest',
      name: 'PressureSmart Plush', price: 799, img: 'assets/img/m-br-pressuresmart.png',
      gallery: ['assets/img/m-br-pressuresmart.png'],
      rating: 4.3, reviews: 904, type: 'Innerspring', firmness: 3, height: 12,
      options: sizes(MATTRESS_SIZES), stock: ['d512', 'd604', 'd890', 'd216', 'd233', 'd259', 'd268', 'd324', 'd349', 'd357', 'd366', 'd428', 'd433', 'd517'],
      blurb: 'The softest bed we stock at this price, and the one guest rooms end up with. ' +
             'A plush quilt over a standard pocketed coil unit.',
      features: ['Plush feel', 'Pocketed coils', 'Guest room favourite'],
      specs: [['Profile height', '12 in'], ['Comfort scale', '3 of 10, plush'], ['Trial', '101 nights'], ['Warranty', '10 years']]
    },
    {
      sku: 'se-icomfortpro', cat: 'mattresses', brand: 'Serta',
      name: 'iComfort Pro Hybrid Medium', price: 1699, img: 'assets/img/m-serta-icomfortpro.png',
      gallery: ['assets/img/m-serta-icomfortpro.png', 'assets/img/d-coil.jpg'],
      rating: 4.5, reviews: 806, type: 'Hybrid', firmness: 5, height: 13,
      options: sizes(MATTRESS_SIZES), stock: ['d478', 'd512', 'd731', 'd216', 'd259', 'd324', 'd338', 'd349', 'd357', 'd366', 'd412', 'd433', 'd528'],
      blurb: 'Serta built this one around the shoulders and hips, with a softer zone where you are ' +
             'heaviest and a firmer one under the lower back.',
      features: ['Zoned support', 'Cooling cover', 'Medium feel'],
      specs: [['Profile height', '13 in'], ['Comfort scale', '5 of 10, medium'], ['Support', 'Five zone coil layout'],
              ['Trial', '101 nights'], ['Warranty', '10 years']]
    },
    {
      sku: 'se-iseries', cat: 'mattresses', brand: 'Serta',
      name: 'iSeries Medium Hybrid', price: 1549, img: 'assets/img/m-serta-iseries.png',
      gallery: ['assets/img/m-serta-iseries.png', 'assets/img/d-surface-quilt.jpg'],
      rating: 4.4, reviews: 511, type: 'Hybrid', firmness: 5, height: 13,
      options: sizes(MATTRESS_SIZES), stock: ['d604', 'd731', 'd216', 'd233', 'd311', 'd324', 'd412', 'd433', 'd517', 'd528'],
      blurb: 'A straightforward hybrid with a cool to the touch cover. If you want the feel of ' +
             'the iComfort Pro without the zoning, this is it.',
      features: ['Cool to the touch cover', 'Hybrid coils', 'Medium feel'],
      specs: [['Profile height', '13 in'], ['Comfort scale', '5 of 10, medium'], ['Trial', '101 nights'], ['Warranty', '10 years']]
    },
    {
      sku: 'se-perfectsleeper', cat: 'mattresses', brand: 'Serta',
      name: 'Perfect Sleeper Cool Twist Firm', price: 949, img: 'assets/img/m-serta-perfectsleeper.png',
      gallery: ['assets/img/m-serta-perfectsleeper.png', 'assets/img/d-innerspring.jpg'],
      rating: 4.2, reviews: 1130, type: 'Innerspring', firmness: 8, height: 12,
      options: sizes(MATTRESS_SIZES), stock: ['d478', 'd890', 'd216', 'd259', 'd311', 'd349', 'd412', 'd428', 'd433', 'd517'],
      blurb: 'Genuinely firm, not firm as a figure of speech. Stomach sleepers and anyone who has ' +
             'been told to keep their back flat.',
      features: ['Firm support', 'Gel foam quilt', 'Pocketed coils'],
      specs: [['Profile height', '12 in'], ['Comfort scale', '8 of 10, firm'], ['Trial', '101 nights'], ['Warranty', '10 years']]
    },
    {
      sku: 'ne-classic', cat: 'mattresses', brand: 'Nectar',
      name: 'Classic Memory Foam 12 inch', price: 699, img: 'assets/img/m-nectar-classic.jpg',
      gallery: ['assets/img/m-nectar-classic.jpg', 'assets/img/d-foam.jpg'],
      rating: 4.5, reviews: 3420, type: 'Memory foam', firmness: 6, height: 12,
      options: sizes(MATTRESS_SIZES), stock: ['d512', 'd604', 'd890', 'd216', 'd233', 'd259', 'd311', 'd324', 'd338', 'd412', 'd428', 'd433', 'd517', 'd528'],
      blurb: 'The bed in the box, except a person brings it and unboxes it for you. ' +
             'Medium memory foam, and the most reviewed mattress we carry.',
      features: ['Memory foam', 'Medium feel', 'Boxed delivery'],
      specs: [['Profile height', '12 in'], ['Comfort scale', '6 of 10, medium'], ['Trial', '101 nights'], ['Warranty', '10 years']]
    },

    /* ---------------- adjustable bases ---------------- */
    {
      sku: 'sap-ss200', cat: 'bases', brand: 'Sapphire Sleep', name: 'SS200 Adjustable Base',
      price: 999, img: 'assets/img/a-ss200.jpg', gallery: ['assets/img/a-ss200.jpg', 'assets/img/a-restbed.jpg'],
      rating: 4.6, reviews: 184, type: 'Adjustable base', options: sizes(BASE_SIZES), stock: ['d478', 'd512', 'd216', 'd247', 'd268', 'd311', 'd324', 'd338', 'd357', 'd412', 'd428', 'd433', 'd528'],
      blurb: 'Head and foot articulation, a wireless remote with two saved positions, and a massage ' +
             'motor that is quiet enough to leave on.',
      features: ['Head and foot lift', 'Two memory positions', 'Massage', 'Wireless remote'],
      specs: [['Lift', 'Head and foot'], ['Memory positions', '2'], ['Massage', 'Head and foot, three speeds'],
              ['Under bed clearance', '7 in'], ['Warranty', '10 years on the frame, 3 on the motor']]
    },
    {
      sku: 'sap-ss100', cat: 'bases', brand: 'Sapphire Sleep', name: 'SS100 Adjustable Base',
      price: 699, img: 'assets/img/a-ss100.jpg', gallery: ['assets/img/a-ss100.jpg'],
      rating: 4.4, reviews: 126, type: 'Adjustable base', options: sizes(BASE_SIZES), stock: ['d478', 'd604', 'd890', 'd259', 'd268', 'd311', 'd349', 'd412', 'd428', 'd433'],
      blurb: 'The base most people actually need. Head and foot lift, a simple remote, and nothing ' +
             'else to go wrong.',
      features: ['Head and foot lift', 'Wired remote', 'Fits most frames'],
      specs: [['Lift', 'Head and foot'], ['Remote', 'Wired'], ['Warranty', '10 years on the frame']]
    },
    {
      sku: 'ne-premier', cat: 'bases', brand: 'Nectar', name: 'Premier Adjustable Base',
      price: 1299, img: 'assets/img/a-premier.jpg', gallery: ['assets/img/a-premier.jpg', 'assets/img/b-adjroom.jpg'],
      rating: 4.7, reviews: 298, type: 'Adjustable base', options: sizes(BASE_SIZES), stock: ['d512', 'd731', 'd216', 'd233', 'd324', 'd338', 'd349', 'd428', 'd433', 'd517', 'd528'],
      blurb: 'Zero gravity preset, under bed lighting and USB ports on both sides. The one people ' +
             'keep when they move house.',
      features: ['Zero gravity preset', 'Under bed lighting', 'USB on both sides', 'Massage'],
      specs: [['Lift', 'Head and foot'], ['Presets', 'Zero gravity, anti snore, flat'],
              ['Ports', 'Two USB per side'], ['Warranty', '10 years']]
    },
    {
      sku: 'ne-luxe', cat: 'bases', brand: 'Nectar', name: 'Luxe Adjustable Base',
      price: 999, img: 'assets/img/a-luxe.jpg', gallery: ['assets/img/a-luxe.jpg'],
      rating: 4.5, reviews: 211, type: 'Adjustable base', options: sizes(BASE_SIZES), stock: ['d604', 'd216', 'd247', 'd259', 'd268', 'd311', 'd349', 'd357', 'd528'],
      blurb: 'Head and foot lift with an anti snore preset, which is the setting that ends up getting used.',
      features: ['Anti snore preset', 'Head and foot lift', 'Wireless remote'],
      specs: [['Lift', 'Head and foot'], ['Presets', 'Anti snore, flat'], ['Warranty', '10 years']]
    },
    {
      sku: 'ne-classic-base', cat: 'bases', brand: 'Nectar', name: 'Classic Adjustable Base',
      price: 749, img: 'assets/img/a-classic.jpg', gallery: ['assets/img/a-classic.jpg'],
      rating: 4.3, reviews: 164, type: 'Adjustable base', options: sizes(BASE_SIZES), stock: ['d478', 'd890', 'd216', 'd233', 'd247', 'd259', 'd268', 'd311', 'd324', 'd338', 'd428', 'd433', 'd517', 'd528'],
      blurb: 'An entry adjustable base that still lifts the head high enough to read in bed properly.',
      features: ['Head and foot lift', 'Wired remote'],
      specs: [['Lift', 'Head and foot'], ['Warranty', '10 years']]
    },
    {
      sku: 'sap-restbed', cat: 'bases', brand: 'Sapphire Sleep', name: 'Rest Adjustable Sleep Set',
      price: 1499, img: 'assets/img/a-restbed.jpg', gallery: ['assets/img/a-restbed.jpg', 'assets/img/a-ss200.jpg'],
      rating: 4.6, reviews: 88, type: 'Adjustable base', options: sizes(BASE_SIZES), stock: ['d478', 'd247', 'd259', 'd311', 'd349', 'd357', 'd433'],
      blurb: 'The SS200 base and a matching 12 inch hybrid, sold as one set so the heights line up ' +
             'and the warranty is single source.',
      features: ['Base and mattress together', 'Matched heights', 'Single warranty'],
      specs: [['Includes', 'SS200 base and 12 in hybrid mattress'], ['Lift', 'Head and foot'], ['Warranty', '10 years']]
    },

    /* ---------------- bedroom ---------------- */
    {
      sku: 'ne-mornington', cat: 'bedroom', brand: 'Nectar', name: 'Mornington Upholstered Bed',
      price: 899, img: 'assets/img/b-mornington.jpg', gallery: ['assets/img/b-mornington.jpg', 'assets/img/b-adjroom.jpg'],
      rating: 4.5, reviews: 240, type: 'Bed frame', options: opts('Finish', ['Slate', 'Oat', 'Charcoal']),
      stock: ['d478', 'd512', 'd216', 'd233', 'd259', 'd338', 'd357', 'd412', 'd433', 'd528'],
      blurb: 'A tall upholstered headboard with a slatted base, so it takes a mattress on its own ' +
             'without a foundation underneath.',
      features: ['No foundation needed', 'Tall headboard', 'Assembled in the room'],
      specs: [['Headboard height', '52 in'], ['Clearance', '12 in'], ['Slat spacing', '2.5 in'], ['Warranty', '3 years']]
    },
    {
      sku: 'ne-bamboo-frame', cat: 'bedroom', brand: 'Nectar', name: 'Bamboo Platform Frame',
      price: 549, img: 'assets/img/b-bamboo-frame.jpg', gallery: ['assets/img/b-bamboo-frame.jpg'],
      rating: 4.4, reviews: 176, type: 'Bed frame', options: opts('Finish', ['Natural', 'Walnut']),
      stock: ['d512', 'd604', 'd216', 'd259', 'd311', 'd357', 'd412', 'd433', 'd441', 'd528'],
      blurb: 'Solid bamboo, low profile, and it goes together without tools. The frame for a room ' +
             'that already has enough going on.',
      features: ['Solid bamboo', 'Tool free assembly', 'Low profile'],
      specs: [['Height', '14 in'], ['Material', 'Solid bamboo'], ['Weight limit', '900 lb'], ['Warranty', '3 years']]
    },
    {
      sku: 'ne-onita', cat: 'bedroom', brand: 'Nectar', name: 'Onita Bed Frame',
      price: 749, img: 'assets/img/b-onita.jpg', gallery: ['assets/img/b-onita.jpg'],
      rating: 4.3, reviews: 132, type: 'Bed frame', options: opts('Finish', ['White', 'Natural']),
      stock: ['d604', 'd890', 'd233', 'd259', 'd311', 'd357', 'd412'],
      blurb: 'A clean painted frame with a low headboard, built for a smaller room where a tall ' +
             'headboard would take over.',
      features: ['Low headboard', 'Painted finish', 'Slatted base'],
      specs: [['Headboard height', '38 in'], ['Clearance', '11 in'], ['Warranty', '3 years']]
    },
    {
      sku: 'ne-walnut-set', cat: 'bedroom', brand: 'Nectar', name: 'Bamboo Core Bedroom Set',
      price: 1899, img: 'assets/img/b-walnut-set.jpg', gallery: ['assets/img/b-walnut-set.jpg', 'assets/img/b-nightstand.jpg'],
      rating: 4.6, reviews: 94, type: 'Bedroom set', options: opts('Finish', ['Walnut', 'Natural']),
      stock: ['d478', 'd731', 'd233', 'd357', 'd412', 'd433', 'd441', 'd528'],
      blurb: 'Bed, headboard and two nightstands in one delivery, which is the only sensible way ' +
             'to buy a bedroom. One crew, one afternoon.',
      features: ['Four pieces', 'One delivery', 'Matched finish'],
      specs: [['Includes', 'Bed, headboard, two nightstands'], ['Material', 'Solid bamboo'], ['Warranty', '3 years']]
    },
    {
      sku: 'ne-nightstand', cat: 'bedroom', brand: 'Nectar', name: 'Bamboo Nightstand',
      price: 329, img: 'assets/img/b-nightstand.jpg', gallery: ['assets/img/b-nightstand.jpg'],
      rating: 4.4, reviews: 208, type: 'Nightstand', options: opts('Finish', ['Natural', 'Grey', 'Walnut']),
      stock: ['d478', 'd512', 'd604', 'd216', 'd259', 'd311', 'd338', 'd357', 'd366', 'd433', 'd441', 'd517', 'd528'],
      blurb: 'Two drawers, soft close, and a shelf deep enough for a book that is not a paperback.',
      features: ['Two soft close drawers', 'Arrives assembled'],
      specs: [['Width', '22 in'], ['Depth', '16 in'], ['Height', '24 in'], ['Warranty', '3 years']]
    },
    {
      sku: 'ne-adjroom', cat: 'bedroom', brand: 'Nectar', name: 'Classic Sleep Set with Adjustable Base',
      price: 1649, img: 'assets/img/b-adjroom.jpg', gallery: ['assets/img/b-adjroom.jpg', 'assets/img/a-classic.jpg'],
      rating: 4.5, reviews: 71, type: 'Bedroom set', options: sizes(BASE_SIZES), stock: ['d512', 'd233', 'd259', 'd412', 'd433', 'd528'],
      blurb: 'Mattress, adjustable base and frame bought together so nothing has to be matched up later.',
      features: ['Three pieces', 'Adjustable base included', 'One delivery'],
      specs: [['Includes', 'Mattress, adjustable base, frame'], ['Warranty', '10 years on the mattress, 3 on the frame']]
    },

    /* ---------------- living room ---------------- */
    {
      sku: 'vp-8pc', cat: 'living', brand: 'Versa Posh', name: '8 Piece Modular Sectional',
      price: 6492, img: 'assets/img/l-sectional-fawn.jpg',
      gallery: ['assets/img/l-sectional-fawn.jpg', 'assets/img/l-sectional-top.jpg', 'assets/img/l-sectional-alloy.jpg'],
      rating: 4.7, reviews: 58, type: 'Sectional', options: opts('Fabric', ['Fawn', 'Alloy', 'Tofu']),
      stock: ['d478', 'd731', 'd233', 'd259', 'd311', 'd357', 'd433', 'd517', 'd528'],
      blurb: 'Eight pieces that clip together in any order and come apart to get through a doorway. ' +
             'Add a chair in two years and the fabric still matches, because we keep the dye lot.',
      features: ['Eight pieces', 'Reconfigurable', 'Removable covers', 'Fits through a 30 in door'],
      specs: [['Overall width', '158 in'], ['Depth', '40 in'], ['Seat height', '18 in'],
              ['Fill', 'High resilience foam and feather blend'], ['Covers', 'Removable and washable'], ['Warranty', '5 years on the frame']]
    },
    {
      sku: 'vp-5pc', cat: 'living', brand: 'Versa Posh', name: '5 Piece Modular Sectional',
      price: 4395, img: 'assets/img/l-sectional-top.jpg',
      gallery: ['assets/img/l-sectional-top.jpg', 'assets/img/l-sectional-alloy2.jpg'],
      rating: 4.6, reviews: 112, type: 'Sectional', options: opts('Fabric', ['Alloy', 'Fawn', 'Tofu']),
      stock: ['d478', 'd512', 'd731', 'd216', 'd233', 'd259', 'd433', 'd528'],
      blurb: 'The starting configuration. Two corners, two armless chairs and an ottoman, which ' +
             'covers most rooms before you add anything.',
      features: ['Five pieces', 'Reconfigurable', 'Removable covers'],
      specs: [['Overall width', '112 in'], ['Depth', '40 in'], ['Seat height', '18 in'], ['Warranty', '5 years on the frame']]
    },
    {
      sku: 'vp-alloy', cat: 'living', brand: 'Versa Posh', name: '6 Piece Modular Sectional',
      price: 5290, img: 'assets/img/l-sectional-alloy.jpg', gallery: ['assets/img/l-sectional-alloy.jpg'],
      rating: 4.6, reviews: 44, type: 'Sectional', options: opts('Fabric', ['Alloy', 'Fawn']),
      stock: ['d731', 'd259', 'd357', 'd412', 'd517'],
      blurb: 'Five seats and a console, so the person in the middle has somewhere to put a drink.',
      features: ['Six pieces', 'Built in console', 'Reconfigurable'],
      specs: [['Overall width', '134 in'], ['Depth', '40 in'], ['Warranty', '5 years on the frame']]
    },
    {
      sku: 'vp-alloy2', cat: 'living', brand: 'Versa Posh', name: '7 Piece Modular Sectional',
      price: 5890, img: 'assets/img/l-sectional-alloy2.jpg', gallery: ['assets/img/l-sectional-alloy2.jpg'],
      rating: 4.5, reviews: 37, type: 'Sectional', options: opts('Fabric', ['Alloy', 'Tofu']),
      stock: ['d478', 'd216', 'd311', 'd338', 'd357', 'd412', 'd441', 'd517'],
      blurb: 'A U shape for a room where the television is not the only thing people face.',
      features: ['Seven pieces', 'U configuration', 'Reconfigurable'],
      specs: [['Overall width', '146 in'], ['Depth', '40 in'], ['Warranty', '5 years on the frame']]
    },
    {
      sku: 'vp-corner', cat: 'living', brand: 'Versa Posh', name: 'Modular Corner Chair',
      price: 1149, img: 'assets/img/l-corner.png', gallery: ['assets/img/l-corner.png'],
      rating: 4.5, reviews: 76, type: 'Seating', options: opts('Fabric', ['Tofu', 'Alloy', 'Fawn']),
      stock: ['d478', 'd512', 'd216', 'd259', 'd338', 'd357', 'd412', 'd433'],
      blurb: 'The piece that turns a sofa into a sectional. Left or right facing, decided at delivery.',
      features: ['Left or right facing', 'Clips to any module', 'Removable cover'],
      specs: [['Width', '40 in'], ['Depth', '40 in'], ['Seat height', '18 in'], ['Warranty', '5 years on the frame']]
    },
    {
      sku: 'vp-armless', cat: 'living', brand: 'Versa Posh', name: 'Modular Armless Chair',
      price: 749, img: 'assets/img/l-armless.jpg', gallery: ['assets/img/l-armless.jpg'],
      rating: 4.4, reviews: 91, type: 'Seating', options: opts('Fabric', ['Fawn', 'Alloy', 'Tofu']),
      stock: ['d478', 'd512', 'd604', 'd311', 'd338', 'd357', 'd412', 'd433', 'd517', 'd528'],
      blurb: 'One more seat, added to the middle of a run. The cheapest way to make a sofa longer.',
      features: ['Clips to any module', 'Removable cover'],
      specs: [['Width', '32 in'], ['Depth', '40 in'], ['Warranty', '5 years on the frame']]
    },
    {
      sku: 'vp-ottoman', cat: 'living', brand: 'Versa Posh', name: 'Modular Ottoman',
      price: 899, img: 'assets/img/l-ottoman.jpg', gallery: ['assets/img/l-ottoman.jpg'],
      rating: 4.5, reviews: 103, type: 'Seating', options: opts('Fabric', ['Alloy', 'Fawn', 'Tofu']),
      stock: ['d478', 'd604', 'd890', 'd233', 'd259', 'd338', 'd357', 'd412', 'd433', 'd517'],
      blurb: 'Pushes in to make a chaise, pulls out to seat two more people at a party.',
      features: ['Doubles as a chaise', 'Clips to any module'],
      specs: [['Width', '40 in'], ['Depth', '40 in'], ['Warranty', '5 years on the frame']]
    },
    {
      sku: 'vp-console', cat: 'living', brand: 'Versa Posh', name: 'Modular Console',
      price: 539, img: 'assets/img/l-console.png', gallery: ['assets/img/l-console.png'],
      rating: 4.3, reviews: 48, type: 'Seating', options: opts('Fabric', ['Tofu', 'Alloy']),
      stock: ['d512', 'd311', 'd338', 'd357', 'd433', 'd517', 'd528'],
      blurb: 'A lid that lifts, two cup holders and a charging port, sized to drop between two seats.',
      features: ['Storage under the lid', 'Two cup holders', 'USB charging'],
      specs: [['Width', '13 in'], ['Depth', '40 in'], ['Warranty', '5 years on the frame']]
    },
    {
      sku: 'vp-wedge', cat: 'living', brand: 'Versa Posh', name: 'Modular Wedge',
      price: 599, img: 'assets/img/l-wedge.jpg', gallery: ['assets/img/l-wedge.jpg'],
      rating: 4.2, reviews: 29, type: 'Seating', options: opts('Fabric', ['Alloy', 'Fawn']),
      stock: ['d604', 'd216', 'd233', 'd259', 'd311', 'd338', 'd433', 'd528'],
      blurb: 'Turns a corner at an angle rather than a right angle, for a room that is not square.',
      features: ['Angled corner', 'Clips to any module'],
      specs: [['Width', '40 in'], ['Depth', '40 in'], ['Warranty', '5 years on the frame']]
    },
    {
      sku: 'sc-stone', cat: 'living', brand: 'Somnicline', name: 'Sleep Recovery Chair, Stone',
      price: 2499, img: 'assets/img/l-recliner-stone.jpg',
      gallery: ['assets/img/l-recliner-stone.jpg', 'assets/img/l-recliner-hero.jpg'],
      rating: 4.8, reviews: 36, type: 'Recliner', options: opts('Fabric', ['Stone', 'Saddle', 'Cream']),
      stock: ['d478', 'd311', 'd338', 'd357', 'd433', 'd517'],
      blurb: 'A recliner designed to be slept in rather than apologised for. It lies flat enough ' +
             'to count as a bed, and it lifts you out of it when you are done.',
      features: ['Lies flat', 'Powered lift', 'Heat and massage', 'Side pocket'],
      specs: [['Recline', 'To 180 degrees'], ['Lift', 'Powered, to standing'], ['Width', '36 in'],
              ['Weight limit', '375 lb'], ['Warranty', '5 years on the frame, 2 on the motor']]
    },
    {
      sku: 'sc-saddle', cat: 'living', brand: 'Somnicline', name: 'Sleep Recovery Chair, Saddle',
      price: 2499, img: 'assets/img/l-recliner-saddle.jpg', gallery: ['assets/img/l-recliner-saddle.jpg'],
      rating: 4.7, reviews: 28, type: 'Recliner', options: opts('Fabric', ['Saddle', 'Stone', 'Cream']),
      stock: ['d512', 'd731', 'd216', 'd233', 'd311', 'd338', 'd357', 'd412', 'd433', 'd517', 'd528'],
      blurb: 'The same chair in a warmer leather. Lies flat, lifts you out, and holds a position ' +
             'without creeping back.',
      features: ['Lies flat', 'Powered lift', 'Heat and massage'],
      specs: [['Recline', 'To 180 degrees'], ['Lift', 'Powered, to standing'], ['Width', '36 in'], ['Warranty', '5 years on the frame']]
    },
    {
      sku: 'sc-cream', cat: 'living', brand: 'Somnicline', name: 'Sleep Recovery Chair, Cream',
      price: 2399, img: 'assets/img/l-recliner-hero.jpg', gallery: ['assets/img/l-recliner-hero.jpg'],
      rating: 4.6, reviews: 21, type: 'Recliner', options: opts('Fabric', ['Cream', 'Stone', 'Saddle']),
      stock: ['d890', 'd338', 'd357', 'd412', 'd433'],
      blurb: 'The lightest of the three fabrics, and the one that disappears into a room instead ' +
             'of announcing that somebody needs a recliner.',
      features: ['Lies flat', 'Powered lift', 'Side pocket'],
      specs: [['Recline', 'To 180 degrees'], ['Width', '36 in'], ['Warranty', '5 years on the frame']]
    },

    /* ---------------- dining ---------------- */
    {
      sku: 'ss-colfax', cat: 'dining', brand: 'Steve Silver', name: 'Colfax Round Dining Set',
      price: 1099, img: 'assets/img/dn-colfax.jpg', gallery: ['assets/img/dn-colfax.jpg', 'assets/img/dn-cayla.jpg'],
      rating: 4.6, reviews: 143, type: 'Dining set', options: opts('Finish', ['White and chrome', 'Walnut']),
      stock: ['d478', 'd512', 'd731', 'd216', 'd259', 'd311', 'd338', 'd412', 'd433', 'd517', 'd528'],
      blurb: 'A round top seats five without anybody getting a table leg, which is the whole reason ' +
             'round tables exist. Four upholstered chairs included.',
      features: ['Five pieces', 'Seats five', 'Assembled in the room'],
      specs: [['Includes', 'Round table and four chairs'], ['Table diameter', '45 in'], ['Height', '30 in'],
              ['Chair', 'Upholstered seat and back'], ['Warranty', '1 year']]
    },
    {
      sku: 'ss-aberdeen', cat: 'dining', brand: 'Steve Silver', name: 'Aberdeen Counter Height Dining Set',
      price: 899, img: 'assets/img/dn-aberdeen.jpg', gallery: ['assets/img/dn-aberdeen.jpg', 'assets/img/dn-wallen.jpg'],
      rating: 4.4, reviews: 97, type: 'Dining set', options: opts('Finish', ['Black and oak', 'Grey']),
      stock: ['d478', 'd604', 'd216', 'd233', 'd338', 'd357', 'd412', 'd528'],
      blurb: 'Counter height, so it works as a table and as somewhere to stand with a coffee. ' +
             'Four stools tuck fully under.',
      features: ['Counter height', 'Five pieces', 'Stools tuck under'],
      specs: [['Includes', 'Counter table and four stools'], ['Table', '36 x 36 in'], ['Height', '36 in'], ['Warranty', '1 year']]
    },
    {
      sku: 'ss-giles', cat: 'dining', brand: 'Steve Silver', name: 'Giles Oval Dining Table',
      price: 749, img: 'assets/img/dn-giles.jpg', gallery: ['assets/img/dn-giles.jpg'],
      rating: 4.5, reviews: 61, type: 'Table', options: opts('Finish', ['Antique white', 'Oak']),
      stock: ['d512', 'd731', 'd259', 'd311', 'd338', 'd357', 'd412', 'd433', 'd528'],
      blurb: 'An oval top with a leaf, so it is a four seater most of the week and a six seater at ' +
             'Christmas. Chairs sold separately on purpose.',
      features: ['Extends with a leaf', 'Seats four to six', 'Chairs sold separately'],
      specs: [['Closed', '66 x 42 in'], ['Extended', '84 x 42 in'], ['Height', '30 in'], ['Warranty', '1 year']]
    },
    {
      sku: 'ss-avalon', cat: 'dining', brand: 'Steve Silver', name: 'Avalon Round Table with Lazy Susan',
      price: 1349, img: 'assets/img/dn-avalon.jpg', gallery: ['assets/img/dn-avalon.jpg'],
      rating: 4.7, reviews: 48, type: 'Table', options: opts('Finish', ['Espresso']),
      stock: ['d478', 'd216', 'd259', 'd311', 'd338', 'd366', 'd412', 'd528'],
      blurb: 'A built in lazy susan under glass. Sounds like a gimmick until you have eaten at one ' +
             'with six people and nobody has asked for anything to be passed.',
      features: ['Built in lazy susan', 'Glass insert', 'Seats six'],
      specs: [['Diameter', '54 in'], ['Height', '30 in'], ['Lazy susan', '24 in, glass'], ['Warranty', '1 year']]
    },
    {
      sku: 'ss-cayla', cat: 'dining', brand: 'Steve Silver', name: 'Cayla Dining Chair, pair',
      price: 349, img: 'assets/img/dn-cayla.jpg', gallery: ['assets/img/dn-cayla.jpg'],
      rating: 4.3, reviews: 112, type: 'Seating', options: opts('Finish', ['Grey', 'Oak']),
      stock: ['d478', 'd512', 'd604', 'd357', 'd433', 'd528'],
      blurb: 'Slat back, solid wood, sold in pairs so you can add two when the family grows.',
      features: ['Sold in pairs', 'Solid wood', 'Arrives assembled'],
      specs: [['Seat height', '18 in'], ['Overall height', '38 in'], ['Weight limit', '250 lb'], ['Warranty', '1 year']]
    },
    {
      sku: 'ss-joanna', cat: 'dining', brand: 'Steve Silver', name: 'Joanna Dining Bench',
      price: 299, img: 'assets/img/dn-joanna.jpg', gallery: ['assets/img/dn-joanna.jpg'],
      rating: 4.4, reviews: 76, type: 'Seating', options: opts('Finish', ['Antique white', 'Oak']),
      stock: ['d512', 'd890', 'd259', 'd311', 'd338', 'd357', 'd412', 'd433', 'd517'],
      blurb: 'A bench down one side seats three children where two chairs seated two, and it pushes ' +
             'right under when it is not in use.',
      features: ['Seats three', 'Tucks under the table', 'Solid wood'],
      specs: [['Width', '48 in'], ['Seat height', '18 in'], ['Weight limit', '400 lb'], ['Warranty', '1 year']]
    },
    {
      sku: 'ss-wallen', cat: 'dining', brand: 'Steve Silver', name: 'Wallen Counter Stool, pair',
      price: 429, img: 'assets/img/dn-wallen.jpg', gallery: ['assets/img/dn-wallen.jpg'],
      rating: 4.2, reviews: 54, type: 'Seating', options: opts('Finish', ['Oak and black', 'Grey']),
      stock: ['d478', 'd731', 'd233', 'd259', 'd311', 'd338', 'd357', 'd412', 'd433', 'd517', 'd528'],
      blurb: 'Swivel seats with a back, which is the difference between a stool people sit on and a ' +
             'stool people lean against for a minute.',
      features: ['Swivel', 'Counter or bar height', 'Sold in pairs'],
      specs: [['Seat height', '24 in counter, 30 in bar'], ['Swivel', '360 degrees'], ['Weight limit', '250 lb'], ['Warranty', '1 year']]
    },
    {
      sku: 'ss-ryan', cat: 'dining', brand: 'Steve Silver', name: 'Ryan Server',
      price: 899, img: 'assets/img/dn-ryan.jpg', gallery: ['assets/img/dn-ryan.jpg'],
      rating: 4.5, reviews: 39, type: 'Storage', options: opts('Finish', ['Weathered oak']),
      stock: ['d512', 'd216', 'd233', 'd357', 'd433'],
      blurb: 'Three drawers and a cupboard, at the height you actually serve from. Most people end ' +
             'up using it for everything except serving.',
      features: ['Three drawers', 'Felt lined top drawer', 'Arrives assembled'],
      specs: [['Width', '60 in'], ['Depth', '18 in'], ['Height', '36 in'], ['Warranty', '1 year']]
    },
    {
      sku: 'ss-sherlock', cat: 'dining', brand: 'Steve Silver', name: 'Sherlock Server Cart',
      price: 499, img: 'assets/img/dn-sherlock.jpg', gallery: ['assets/img/dn-sherlock.jpg'],
      rating: 4.1, reviews: 27, type: 'Storage', options: opts('Finish', ['Black and oak']),
      stock: ['d604', 'd233', 'd259', 'd357', 'd412', 'd433', 'd528'],
      blurb: 'Open shelves on castors. Wheels out for a party, wheels back against the wall after.',
      features: ['On castors', 'Three open shelves', 'Arrives assembled'],
      specs: [['Width', '34 in'], ['Depth', '16 in'], ['Height', '34 in'], ['Warranty', '1 year']]
    },
    {
      sku: 'ss-buffet', cat: 'dining', brand: 'Steve Silver', name: 'Lighted Buffet and China',
      price: 1899, img: 'assets/img/dn-buffet.jpg', gallery: ['assets/img/dn-buffet.jpg'],
      rating: 4.6, reviews: 33, type: 'Storage', options: opts('Finish', ['Cherry']),
      stock: ['d478', 'd890', 'd216', 'd311', 'd338', 'd357', 'd433'],
      blurb: 'Two pieces, glass doors, lit from inside. The thing people inherit and then buy again ' +
             'for themselves twenty years later.',
      features: ['Two pieces', 'Interior lighting', 'Glass doors', 'Felt lined drawers'],
      specs: [['Width', '66 in'], ['Depth', '18 in'], ['Height', '82 in'], ['Lighting', 'Touch dimmer'], ['Warranty', '1 year']]
    },

    /* ---------------- living room, motion upholstery ---------------- */
    {
      sku: 'fx-argo-sect', cat: 'living', brand: 'Flexsteel', name: 'Argo Leather Power Reclining Sectional',
      price: 4299, img: 'assets/img/l-argo-sect.jpg', gallery: ['assets/img/l-argo-sect.jpg', 'assets/img/l-argo-rec.jpg'],
      rating: 4.7, reviews: 86, type: 'Sectional', options: opts('Leather', ['Navy', 'Walnut']),
      stock: ['d478', 'd731', 'd216', 'd259', 'd357', 'd412', 'd433', 'd517'],
      blurb: 'Every seat reclines under power, with the headrest and lumbar on their own switches. ' +
             'Flexsteel builds these on a steel seat frame, which is why they outlast the fabric.',
      features: ['Power recline on every seat', 'Power headrest and lumbar', 'Steel seat frame', 'Top grain leather'],
      specs: [['Overall width', '124 in'], ['Depth', '40 in'], ['Seat height', '20 in'],
              ['Frame', 'Blue Steel Spring, lifetime'], ['Power', 'Three motors per seat'], ['Warranty', 'Lifetime on the frame']]
    },
    {
      sku: 'fx-clive-sofa', cat: 'living', brand: 'Flexsteel', name: 'Clive Power Reclining Sofa',
      price: 2199, img: 'assets/img/l-clive-sofa.jpg', gallery: ['assets/img/l-clive-sofa.jpg', 'assets/img/l-clive-love.jpg'],
      rating: 4.6, reviews: 164, type: 'Sofa', options: opts('Fabric', ['Chocolate', 'Clove']),
      stock: ['d478', 'd512', 'd604', 'd216', 'd311', 'd338', 'd357', 'd412', 'd433', 'd528'],
      blurb: 'A three seater where both ends recline and the middle stays put, so somebody can still ' +
             'sit up straight and eat.',
      features: ['Power recline both ends', 'Power headrest and lumbar', 'Steel seat frame'],
      specs: [['Width', '87 in'], ['Depth', '40 in'], ['Seat height', '20 in'],
              ['Frame', 'Blue Steel Spring, lifetime'], ['Warranty', 'Lifetime on the frame']]
    },
    {
      sku: 'fx-clive-love', cat: 'living', brand: 'Flexsteel', name: 'Clive Power Reclining Loveseat with Console',
      price: 1999, img: 'assets/img/l-clive-love.jpg', gallery: ['assets/img/l-clive-love.jpg'],
      rating: 4.5, reviews: 118, type: 'Sofa', options: opts('Fabric', ['Clove', 'Chocolate']),
      stock: ['d512', 'd890', 'd233', 'd338', 'd357', 'd433', 'd517'],
      blurb: 'Two recliners with a console between them, two cup holders and a lid that lifts. ' +
             'The most argued over piece of furniture in any house, settled.',
      features: ['Console with storage', 'Two cup holders', 'Power headrest and lumbar'],
      specs: [['Width', '77 in'], ['Depth', '40 in'], ['Seat height', '20 in'], ['Warranty', 'Lifetime on the frame']]
    },
    {
      sku: 'fx-zecliner', cat: 'living', brand: 'Flexsteel', name: 'Zecliner Power Lift Recliner',
      price: 2399, img: 'assets/img/l-zecliner.jpg', gallery: ['assets/img/l-zecliner.jpg'],
      rating: 4.8, reviews: 72, type: 'Recliner', options: opts('Fabric', ['Graphite', 'Sand', 'Fog']),
      stock: ['d478', 'd512', 'd233', 'd259', 'd412', 'd433', 'd528'],
      blurb: 'Designed to be slept in rather than apologised for, and it lifts you out of it at the ' +
             'end. Heat and massage on both the back and the seat.',
      features: ['Powered lift to standing', 'Heat and massage', 'Power headrest and lumbar', 'Sleeps flat'],
      specs: [['Width', '36 in'], ['Recline', 'To near flat'], ['Lift', 'Powered, to standing'],
              ['Weight limit', '350 lb'], ['Warranty', 'Lifetime on the frame, 3 years on the motor']]
    },
    {
      sku: 'fx-sola', cat: 'living', brand: 'Flexsteel', name: 'Sola Leather Power Recliner',
      price: 1899, img: 'assets/img/l-sola.jpg', gallery: ['assets/img/l-sola.jpg'],
      rating: 4.6, reviews: 58, type: 'Recliner', options: opts('Leather', ['Cream', 'Saddle']),
      stock: ['d604', 'd731', 'd338', 'd357', 'd517'],
      blurb: 'A recliner that does not look like one until you use it. Heat and massage are hidden ' +
             'in the side, not advertised on the arm.',
      features: ['Heat and massage', 'Power headrest and lumbar', 'Top grain leather'],
      specs: [['Width', '34 in'], ['Depth', '40 in'], ['Weight limit', '300 lb'], ['Warranty', 'Lifetime on the frame']]
    },
    {
      sku: 'fx-walker', cat: 'living', brand: 'Flexsteel', name: 'Walker Leather Power Gliding Recliner',
      price: 1699, img: 'assets/img/l-walker.jpg', gallery: ['assets/img/l-walker.jpg'],
      rating: 4.5, reviews: 94, type: 'Recliner', options: opts('Leather', ['Chocolate', 'Black']),
      stock: ['d478', 'd890', 'd216', 'd259', 'd311', 'd357', 'd433', 'd528'],
      blurb: 'It glides as well as reclines, which matters more than it sounds if anybody in the ' +
             'house gets a baby to sleep in it.',
      features: ['Glides and reclines', 'Power headrest and lumbar', 'Top grain leather'],
      specs: [['Width', '35 in'], ['Depth', '40 in'], ['Glide', 'Front to back'], ['Warranty', 'Lifetime on the frame']]
    },
    {
      sku: 'fx-argo-rec', cat: 'living', brand: 'Flexsteel', name: 'Argo Leather Power Recliner',
      price: 1549, img: 'assets/img/l-argo-rec.jpg', gallery: ['assets/img/l-argo-rec.jpg'],
      rating: 4.4, reviews: 67, type: 'Recliner', options: opts('Leather', ['Navy', 'Walnut']),
      stock: ['d731', 'd216', 'd233', 'd259', 'd338', 'd433'],
      blurb: 'The single chair version of the Argo sectional, for the person who wants the good seat ' +
             'without redoing the whole room.',
      features: ['Power recline', 'Power headrest and lumbar', 'Matches the Argo sectional'],
      specs: [['Width', '36 in'], ['Depth', '40 in'], ['Seat height', '20 in'], ['Warranty', 'Lifetime on the frame']]
    },

    /* ---------------- outlet ---------------- */
    {
      sku: 'out-harmony', cat: 'outlet', brand: 'Beautyrest', name: 'Harmony Lux Carbon Medium, Queen floor model',
      price: 899, was: 1399, img: 'assets/img/m-br-harmony.png', gallery: ['assets/img/m-br-harmony.png'],
      rating: 4.5, reviews: 642, type: 'Hybrid', firmness: 5, condition: 'Floor model, Nitro',
      options: opts('Size', ['Queen']), stock: ['d478', 'd338', 'd357', 'd412', 'd433', 'd528'],
      blurb: 'Six months on the Nitro floor with a protector on it. One only.',
      features: ['One only', 'Floor model', 'Full warranty'],
      specs: [['Condition', 'Floor model, protector used throughout'], ['Trial', '101 nights'], ['Warranty', '10 years, full']]
    },
    {
      sku: 'out-iseries', cat: 'outlet', brand: 'Serta', name: 'iSeries Medium Hybrid, King floor model',
      price: 1099, was: 1849, img: 'assets/img/m-serta-iseries.png', gallery: ['assets/img/m-serta-iseries.png'],
      rating: 4.4, reviews: 511, type: 'Hybrid', firmness: 5, condition: 'Floor model, Charleston',
      options: opts('Size', ['King']), stock: ['d512', 'd233', 'd311', 'd357', 'd528'],
      blurb: 'A king at close to queen money because the store is changing its floor plan.',
      features: ['One only', 'Floor model', 'Full warranty'],
      specs: [['Condition', 'Floor model'], ['Trial', '101 nights'], ['Warranty', '10 years, full']]
    },
    {
      sku: 'out-silver', cat: 'outlet', brand: 'Sapphire Sleep', name: 'Silver Series Plush, Twin XL',
      price: 599, was: 849, img: 'assets/img/m-silver.jpg', gallery: ['assets/img/m-silver.jpg'],
      rating: 4.4, reviews: 143, type: 'Memory foam', firmness: 4, condition: 'Overstock, new',
      options: opts('Size', ['Twin XL']), stock: ['d604', 'd216', 'd311', 'd338', 'd412', 'd433', 'd517'],
      blurb: 'Ordered for a dorm contract that shrank. Still sealed, four of them left.',
      features: ['New, never used', 'Four available', 'Full warranty'],
      specs: [['Condition', 'New overstock'], ['Trial', '101 nights'], ['Warranty', '10 years, full']]
    },
    {
      sku: 'out-ottoman', cat: 'outlet', brand: 'Versa Posh', name: 'Modular Ottoman, Fawn, returned',
      price: 599, was: 899, img: 'assets/img/l-ottoman.jpg', gallery: ['assets/img/l-ottoman.jpg'],
      rating: 4.5, reviews: 103, type: 'Seating', condition: 'Customer return, cover replaced',
      options: opts('Fabric', ['Fawn']), stock: ['d478', 'd216', 'd233', 'd259', 'd311', 'd338', 'd357', 'd412', 'd433', 'd441', 'd517'],
      blurb: 'Came back because it did not fit the room. New cover fitted, frame untouched.',
      features: ['One only', 'New cover', 'Full warranty'],
      specs: [['Condition', 'Customer return with a new cover'], ['Warranty', '5 years on the frame, full']]
    },
    {
      sku: 'out-onita', cat: 'outlet', brand: 'Nectar', name: 'Onita Bed Frame, White, display',
      price: 449, was: 749, img: 'assets/img/b-onita.jpg', gallery: ['assets/img/b-onita.jpg'],
      rating: 4.3, reviews: 132, type: 'Bed frame', condition: 'Display, minor mark',
      options: opts('Size', ['Queen']), stock: ['d890', 'd216', 'd233', 'd259', 'd311', 'd338', 'd357', 'd412', 'd433', 'd517', 'd528'],
      blurb: 'One scuff on the left foot, which faces the wall. Otherwise as new.',
      features: ['One only', 'Mark on one foot', 'Full warranty'],
      specs: [['Condition', 'Display with a mark on one foot'], ['Warranty', '3 years, full']]
    },
    {
      sku: 'out-recliner', cat: 'outlet', brand: 'Somnicline', name: 'Sleep Recovery Chair, Saddle, display',
      price: 1799, was: 2499, img: 'assets/img/l-recliner-saddle.jpg', gallery: ['assets/img/l-recliner-saddle.jpg'],
      rating: 4.7, reviews: 28, type: 'Recliner', condition: 'Display, Huntington',
      options: opts('Fabric', ['Saddle']), stock: ['d731', 'd216', 'd233', 'd357', 'd433', 'd441', 'd517'],
      blurb: 'The chair everyone sat in. The motor has the hours to prove it and still works perfectly.',
      features: ['One only', 'Display', 'Full warranty'],
      specs: [['Condition', 'Display'], ['Warranty', '5 years on the frame, full']]
    }
  ];

  window.BD_CATALOG = P;
  window.BD_CATEGORIES = CATEGORIES;
})();
