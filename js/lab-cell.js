/* What the Cell Lab is, for the shared app shell in js/app.js.
   Chapter 4: the cell, its rooms, and the thread of DNA that has to fit in one.

   The chapter is, in the source's own words, two unrelated chapters stapled
   together: an organelle half and a DNA half. It says to refuse to look for a
   connection between them until each is solid, so the hub does exactly that.
   The first two fields are the organelle half, which is a hub and spokes: one
   master boundary (rooms, or no rooms) and six jobs sorted against it. The
   third field is the DNA half, which is a ladder: five rungs, each defined only
   in terms of the one before, no rung skippable.

   The spine is the answer to the chapter's own first hook question — a cell is
   basically a bag of the molecules from Chapter 3, so what does walling parts of
   it off into rooms buy that having them loose would not? */
(function () {
  'use strict';
  (window.BL = window.BL || {}).lab = {
    name: 'Cell Lab',
    version: 'v1.0',
    tagline: 'A cell is a bag of the molecules you have already met, divided into rooms. Poke the rooms, then the thread that has to fit inside one.',

    fields: [
      { id: 'rule', name: 'The one rule', lede: 'Every cell is a bag of the molecules from the last chapter. Some cells wall parts of the bag off into rooms and some do not — and that one difference sorts nearly everything else in this chapter before you have learned a single organelle.' },
      { id: 'jobs', name: 'Six jobs', lede: 'A cell splits its labour six ways: holding its shape, making energy, building proteins, cleaning up, pulling itself in two, and guarding the plans. Learn the jobs and the organelles file themselves. Every one of them is a room built for one of the six.' },
      { id: 'thread', name: 'The thread', lede: 'A separate question altogether: how do two metres of DNA fit into a room too small to see? First the code and how the two strands face each other, then the five steps that squeeze it in. This half is a ladder — each step is the one before, packed tighter, and none can be skipped.' },
    ],

    spine: {
      href: '#/rooms',
      title: 'A membrane makes a room',
      blurb: 'A cell is a bag of the same molecules you met last chapter. What it buys by walling parts of the bag off is the whole of this chapter: acid in one room and not the next, a poison kept away from the plans, a protein passed down an assembly line instead of lost in the soup. Eukaryotes have the rooms. Prokaryotes do not. Every organelle is a room with a job.',
      rows: [
        ['build proteins', 'ribosome · ER · Golgi'],
        ['make energy', 'mitochondria · chloroplast'],
        ['clean up', 'lysosome · peroxisome · vacuole'],
        ['guard the plans', 'nucleus'],
      ],
      tone: 'jobs',
      go: 'Open Rooms →',
    },

    siblings: [
      {
        href: 'life.html',
        kicker: 'The chapter before',
        title: 'Life Lab',
        blurb: 'The membrane in every cell here is the sheet the water built in Two Faces, and the DNA is the strand you paired up in Letters. If either is shaky, go back one chapter.',
        go: 'Open the Life Lab →',
      },
    ],
  };
})();
