/* What Bond Lab is, for the shared app shell in js/app.js.
   Chapter 2: atoms, electrons, bonds, water. */
(function () {
  'use strict';
  (window.BL = window.BL || {}).lab = {
    name: 'Bond Lab',
    version: 'v1.1',
    tagline: 'Instruments for things too small to see. Poke them and watch what answers.',

    fields: [
      { id: 'atoms', name: 'Atoms', lede: 'Where the electrons are, why they sit where they sit, and why the outer ones are the only ones that ever meet anybody.' },
      { id: 'bonding', name: 'Bonding', lede: 'What happens when two atoms meet — and why every kind of bond you have ever been given a name for is one dial at a different setting.' },
      { id: 'water', name: 'Water', lede: 'One small bent molecule, and everything it does because of the way it holds on.' },
    ],

    spine: {
      href: '#/spectrum',
      title: 'It is all one dial',
      blurb: 'Covalent, polar, ionic, hydrogen bonds, van der Waals — not a list of five different things. One question, asked at different settings: how evenly do two atoms share their electrons? Start here.',
      rows: [
        ['shared evenly', 'covalent'],
        ['shared unevenly', 'polar covalent'],
        ['nearly taken', 'very polar'],
        ['handed over', 'ionic'],
      ],
      go: 'Open The Spectrum →',
    },

    sibling: {
      href: 'life.html',
      kicker: 'Next chapter',
      title: 'Life Lab',
      blurb: 'Carbon has four hands, and life uses one reaction to join things with them and one to take them apart again. Proteins, sugars, fats and DNA are that reaction run four different ways. Everything in there assumes what is in here.',
      go: 'Open the Life Lab →',
    },
  };
})();
