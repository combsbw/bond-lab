/* What the Life Lab is, for the shared app shell in js/app.js.
   Chapter 3: carbon, the build/break reaction, and the four families it makes.

   The chapter looks like forty new facts and is really one mechanism applied
   four times. The hub is laid out to say that before a learner reads a word:
   carbon first (why any of it is possible), then the one reaction (both
   directions), then the four families as four runs of the same reaction. */
(function () {
  'use strict';
  (window.BL = window.BL || {}).lab = {
    name: 'Life Lab',
    version: 'v1.0',
    tagline: 'Everything alive is built out of one reaction run backwards and forwards. Poke it and watch.',

    fields: [
      { id: 'carbon', name: 'Carbon', lede: 'Almost all of you is four elements, and one of them does the building. Carbon has four hands — enough for chains, branches and rings — and whatever you bolt onto those hands is what the molecule then does for a living.' },
      { id: 'build', name: 'Building and breaking', lede: 'One reaction squeezes a water molecule out and leaves a bond behind. The other pushes a water molecule in and the bond is gone. That is the whole of it, and life does nothing else all day.' },
      { id: 'four', name: 'The four families', lede: 'Proteins, carbohydrates, lipids and nucleic acids. Four different jobs, four different monomers, and the same two reactions in every single one. Build each one and watch where its job comes from.' },
    ],

    spine: {
      href: '#/template',
      title: 'One reaction, four families',
      blurb: 'Proteins, sugars, fats and DNA are not four chemistries. They are one reaction — take a water molecule out and a bond appears; put a water molecule in and the bond is gone — run on four different sets of parts. Learn it once here and the rest of the chapter is the same move with different names.',
      rows: [
        ['amino acids', 'peptide bond'],
        ['sugars', 'glycosidic bond'],
        ['fatty acids', 'ester bond'],
        ['nucleotides', 'phosphodiester bond'],
      ],
      tone: 'families',
      go: 'Open The Template →',
    },

    siblings: [
      {
        href: 'index.html',
        kicker: 'The chapter before',
        title: 'Bond Lab',
        blurb: 'Every bond in here is a bond from there. Covalent sharing, polar ends, hydrogen bonds and non-polar hydrocarbons are what folds a protein and what holds a membrane together. If any of that is shaky, go back one chapter.',
        go: 'Open Bond Lab →',
      },
      {
        href: 'cell.html',
        kicker: 'The chapter after',
        title: 'Cell Lab',
        blurb: 'Everything you built here goes to work. The membrane you watched assemble wraps every cell, the proteins fold and ship down an assembly line, and the DNA you paired up has to be folded small enough to fit in a nucleus.',
        go: 'Open the Cell Lab →',
      },
    ],
  };
})();
