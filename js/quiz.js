/* Challenges: questions about things the learner has already seen happen.

   These are not recall questions. Every one of them is about something
   ordinary — a burst pipe, a beaded windscreen, a street lamp, a balloon stuck
   to a wall — and every one of them can be settled by going into an instrument
   and doing something. So each carries the instrument that settles it and the
   thing to do when you get there. Getting it wrong costs nothing: the point is
   to have an opinion before you look, because a prediction you have committed
   to is the only thing that makes the answer land.

   The correct choice is marked `ok`. Order is shuffled per render so the right
   answer is never in the same place twice. */
(function () {
  'use strict';
  const { h } = BL;

  const BANK = [
    /* ------------------------------------------------------------ atoms */
    {
      id: 'lamps', field: 'atoms', sim: 'rungs',
      ask: 'A sodium street lamp glows orange, a neon sign glows red, a mercury lamp glows cold blue-white. Each is a sealed tube of one gas with electricity running through it. Why does each gas have its own colour?',
      choices: [
        { t: 'The glass of each tube is tinted a different colour.', ok: false },
        { t: 'Each gas is already that colour before you switch it on.', ok: false },
        { t: 'An electron in each kind of atom can only stand on certain rungs, so only certain jumps are possible — and each jump gives out one particular colour.', ok: true },
      ],
      after: 'The ladder of rungs is different for every element, so the set of colours it can give out is different too. It is a fingerprint, and it is how we know what stars are made of without going there.',
      tryIt: 'In Rungs, give the nucleus more charge and watch the whole ladder stretch — then watch which colours come out.',
    },
    {
      id: 'sodium-oil', field: 'atoms', sim: 'shells',
      ask: 'Sodium metal has to be stored under oil or it reacts with the air almost at once. A gold ring sits on a finger for fifty years and stays gold. Both are metals. What is different?',
      choices: [
        { t: 'Sodium’s outermost electron is barely held on to, so it goes to the first thing that asks for it. Gold holds on to its own far more tightly.', ok: true },
        { t: 'Sodium is softer, and soft things react faster.', ok: false },
        { t: 'Gold is heavier, so the air cannot get at it.', ok: false },
      ],
      after: 'Reactivity is not a personality. It is the price of an electron. Measure that price and you can predict the behaviour before you ever see the metal.',
      tryIt: 'In Shells, pull an electron off sodium, then off chlorine, and compare what each one cost.',
    },
    {
      id: 'tube-led', field: 'atoms', sim: 'rungs',
      ask: 'A fluorescent tube and a warm LED can look like the same white. Split each one with a prism and the tube gives a few bright lines while the LED gives a smooth band. Why?',
      choices: [
        { t: 'The prism is the wrong shape for LED light.', ok: false },
        { t: 'The tube’s light is made by atoms dropping between rungs, and only certain drops exist — so only certain colours come out.', ok: true },
        { t: 'LEDs are brighter, and brightness washes out the lines.', ok: false },
      ],
      after: 'Anything that makes light one atom at a time gives you lines. Anything that makes light out of a hot solid or a packed crystal gives you a smear. The lines are the ladder showing through.',
      tryIt: 'In Rungs, shine white light at the atom and watch the dark gaps appear exactly where the jumps are.',
    },
    {
      id: 'photo', field: 'atoms', sim: 'cloud',
      ask: 'Almost every poster of an atom shows electrons going round the nucleus like tiny planets. What is wrong with that picture?',
      choices: [
        { t: 'Nothing — it is just drawn too small to see properly.', ok: false },
        { t: 'The electrons go round the other way.', ok: false },
        { t: 'An electron has no path. You can only ever catch it somewhere, and the cloud is the pile-up of thousands of catches — a map of where it is likely to be.', ok: true },
      ],
      after: 'That is why the shapes matter. The cloud is not a blur of something moving fast; it is the shape of where the thing can be found at all, and it is that shape that decides how an atom bonds.',
      tryIt: 'In Cloud, take one snapshot, then a hundred, then thousands, and watch the shape arrive out of nothing but scatter.',
    },
    {
      id: 'salt-way', field: 'atoms', sim: 'shells',
      ask: 'Every grain of table salt is sodium with a + charge and chlorine with a −. You never find it the other way round. Why not?',
      choices: [
        { t: 'Taking sodium’s outer electron costs almost nothing and chlorine is glad of it. Going the other way costs far more than it could ever pay back.', ok: true },
        { t: 'Sodium is written first in the name, so it goes first.', ok: false },
        { t: 'Chlorine is a gas, and gases always end up negative.', ok: false },
      ],
      after: 'The direction of a handover is set by the prices, not by a rule you have to remember. Measure both prices and the direction tells you itself.',
      tryIt: 'In Meet, put sodium and chlorine together, then try dragging the electron the other way round.',
    },

    /* ---------------------------------------------------------- bonding */
    {
      id: 'salt-wax', field: 'bonding', sim: 'spectrum',
      ask: 'Table salt melts at 801 °C. Candle wax melts in your hand. Both are solids. Why such an enormous gap?',
      choices: [
        { t: 'Wax is made of lighter atoms, and light things melt sooner.', ok: false },
        { t: 'To melt salt you have to overcome charges pulling on each other in every direction. To melt wax you only have to shake whole molecules loose from the feeble flicker that holds them side by side.', ok: true },
        { t: 'Salt is a crystal and crystals are always stronger.', ok: false },
      ],
      after: 'Melting never breaks the bonds inside a molecule — it only undoes the hold between one lump and the next. Salt has no "inside": the ionic pull IS the hold between neighbours, so melting it means fighting the strongest thing on the ladder.',
      tryIt: 'In The Spectrum, slide to the ionic end and put another one beside it. Then slide back to the even end and do the same.',
    },
    {
      id: 'oil-sugar', field: 'bonding', sim: 'spectrum',
      ask: 'Stir sugar into water and it vanishes. Pour oil into water and it sits there in a slick. Both are made mostly of carbon, hydrogen and oxygen. Why the difference?',
      choices: [
        { t: 'Sugar is a powder and powders dissolve.', ok: false },
        { t: 'Oil is lighter than water, and light things float instead of dissolving.', ok: false },
        { t: 'Sugar is covered in δ+ and δ− ends that can hydrogen-bond to water. Oil has almost no charged ends, so water molecules would rather hold on to each other than make room for it.', ok: true },
      ],
      after: '"Like dissolves like" is not a rule, it is a consequence. Something only dissolves if the holds it can make with the liquid are worth as much as the holds the liquid already has with itself.',
      tryIt: 'In The Spectrum, pick O–H and park another one of these beside it. Then slide to the even end and watch the hold collapse.',
    },
    {
      id: 'helium-petrol', field: 'bonding', sim: 'flicker',
      ask: 'Helium has to be chilled to −269 °C before it will turn liquid. Petrol is a liquid on a summer day. Neither has any charge on it at all. So what holds petrol together?',
      choices: [
        { t: 'Petrol molecules are big and floppy, so their clouds slosh more — and a bigger slosh makes a stronger flicker between neighbours. Helium’s cloud is tiny and barely sloshes.', ok: true },
        { t: 'Petrol has a smell, and smells are sticky.', ok: false },
        { t: 'Helium is a noble gas and noble gases cannot be liquids.', ok: false },
      ],
      after: 'Even the weakest hold on the ladder is never zero. Make a molecule big enough and the flicker alone is enough to make it a liquid, or a wax, or the grip that lets a gecko walk up glass.',
      tryIt: 'In Flicker, put the smallest atom and the biggest atom at the same distance and compare the pull.',
    },
    {
      id: 'balloon', field: 'bonding', sim: 'spectrum',
      ask: 'Rub a balloon on your hair and it sticks to the wall. The wall is not charged. What is holding it there?',
      choices: [
        { t: 'Static makes the air push it against the wall.', ok: false },
        { t: 'The charge on the balloon squashes the clouds in the wall out of shape, and then holds on to the dent it made.', ok: true },
        { t: 'Tiny hairs on the balloon hook into the paint.', ok: false },
      ],
      after: 'A charge can make a dipole where there was not one before. That borrowed unevenness is the same thing an ion does to a water molecule when salt dissolves, only weaker — and it stops the moment you take the charge away.',
      tryIt: 'In The Spectrum, slide to the even end so there are no charged ends at all, then park a + ion beside it and watch the cloud dent.',
    },
    {
      id: 'boil-split', field: 'bonding', sim: 'well',
      ask: 'Boiling a kettle dry takes a few minutes on a hob. Splitting that same water into hydrogen and oxygen gas needs a current run through it for hours. Both "break water apart". Why the gulf?',
      choices: [
        { t: 'Boiling only pulls the molecules away from each other. Splitting has to break the bonds inside each molecule, and those are ten to twenty times deeper.', ok: true },
        { t: 'Electricity is simply a slower way of heating things.', ok: false },
        { t: 'Steam is still water, so boiling does not break anything at all.', ok: false },
      ],
      after: 'Steam is still H₂O — every molecule comes through boiling intact. That is the whole difference between a change of state and a chemical reaction, and on the energy ladder it is the difference between the bottom rungs and the top.',
      tryIt: 'In The Well, break a hydrogen bond with heat, then try to break a covalent one the same way.',
    },
    {
      id: 'magnesium', field: 'bonding', sim: 'meet',
      ask: 'A magnesium ribbon burns with a white flare bright enough to hurt your eyes. Neon, right next to it on the shelf, does nothing whatever. Why?',
      choices: [
        { t: 'Neon is a gas, and gases do not burn.', ok: false },
        { t: 'Magnesium’s two outer electrons are cheap to part with and oxygen pays handsomely for them. Neon holds its own so tightly that nothing can afford the price.', ok: true },
        { t: 'Magnesium is a metal and all metals burn.', ok: false },
      ],
      after: 'That flare is the payback: the energy released when the handover turns out to be a very good deal indeed. The size of the flame is the size of the bargain.',
      tryIt: 'In Meet, put magnesium with oxygen and watch it move two electrons at once — then try neon’s neighbours and see what the sum does.',
    },

    /* ------------------------------------------------------------ water */
    {
      id: 'pipes', field: 'water', sim: 'float',
      ask: 'A hard frost bursts water pipes, and ice cubes float in a glass. Almost everything else in the world shrinks and sinks when it freezes. What is water doing?',
      choices: [
        { t: 'Ice traps air bubbles, and the bubbles make it lighter.', ok: false },
        { t: 'Freezing water lines its molecules up so that every hydrogen bond gets made — and the only pattern that does that is full of holes. So ice takes up more room than the water it came from.', ok: true },
        { t: 'Cold makes water heavier, and heavy things push outwards.', ok: false },
      ],
      after: 'That is not a quirk. Because ice floats, a frozen pond keeps a lid of ice over liquid water instead of freezing solid from the bottom up, and everything in it lives through the winter.',
      tryIt: 'In Float, cool the water-like sheet slowly and watch the holes open up as the hands find each other.',
    },
    {
      id: 'skater', field: 'water', sim: 'skin',
      ask: 'A pond skater walks on water. Drop the same insect into a dish of alcohol and it sinks. Why does water have a skin and alcohol barely one at all?',
      choices: [
        { t: 'Water is thicker than alcohol.', ok: false },
        { t: 'A molecule at the water’s surface has neighbours below and beside it but none above, so it gets pulled inwards hard — and water molecules pull on each other far harder than alcohol molecules do.', ok: true },
        { t: 'The insect’s legs are waterproof but not alcohol-proof.', ok: false },
      ],
      after: 'Surface tension is just the inward pull on the molecules unlucky enough to be on the outside. Anything that weakens the grip between molecules — soap, heat, alcohol — flattens the skin.',
      tryIt: 'In Skin, drop a soap molecule into the surface and watch the pull arrows go slack.',
    },
    {
      id: 'towel-wax', field: 'water', sim: 'cling',
      ask: 'A paper towel soaks a spill straight up out of the table. The bonnet of a freshly waxed car makes the same water sit up in beads. Same water. What changed?',
      choices: [
        { t: 'Whether the surface grabs the water harder than the water grabs itself. Paper does; wax does not, so the water holds on to itself instead and pulls into a ball.', ok: true },
        { t: 'Wax is warmer than paper, and warm things repel water.', ok: false },
        { t: 'Paper is rough, and rough surfaces are always wetter.', ok: false },
      ],
      after: 'It is always a contest between two holds — water to surface, and water to water. Everything from a raincoat to a non-stick pan to the lining of your lungs is someone deciding which side should win.',
      tryIt: 'In Cling, keep the surface exactly as it is and change only how tightly the water grips itself.',
    },
    {
      id: 'sea-sand', field: 'water', sim: 'slow',
      ask: 'On a hot afternoon the sand burns your feet and the sea is still freezing. The sun has been shining on both of them all day. Why has the water hardly warmed?',
      choices: [
        { t: 'The sea is deeper, so the sun cannot reach the bottom.', ok: false },
        { t: 'Heat going into water mostly goes into shaking hydrogen bonds loose instead of speeding the molecules up — and it is the speed, not the heat, that a thermometer reads.', ok: true },
        { t: 'Water reflects sunlight and sand absorbs it.', ok: false },
      ],
      after: 'The same stubbornness runs your body, the weather and the ocean. It is why a coastal town has milder winters than one inland, and why your temperature stays put while a great deal is going on inside you.',
      tryIt: 'In Slow, put exactly the same heat into all three boxes and watch which one refuses to warm up.',
    },
    {
      id: 'sweat', field: 'water', sim: 'slow',
      ask: 'Sweating cools you down even when the air around you is hotter than you are. How can losing water make you colder?',
      choices: [
        { t: 'Sweat is colder than the body that made it.', ok: false },
        { t: 'The wet skin blocks the heat of the air.', ok: false },
        { t: 'Only the fastest molecules have enough in them to break every hydrogen bond at once and get away. What is left behind is the slower ones — and slower is exactly what colder means.', ok: true },
      ],
      after: 'Evaporation always skims the fastest off the top. It is why a wet towel on a window cools a room, why dogs pant, and why you shiver getting out of a pool on a warm day.',
      tryIt: 'In Slow, watch how much heat the water-like box swallows before its temperature will move at all.',
    },
    {
      id: 'co2-water', field: 'water', sim: 'h2o',
      ask: 'Carbon dioxide and water are both tiny molecules, and in both of them the oxygen pulls the shared electrons hard. One you breathe out as a gas. The other you are mostly made of. Why?',
      choices: [
        { t: 'Carbon dioxide is lighter than water.', ok: false },
        { t: 'Carbon dioxide is straight, so its two lopsided bonds pull in exactly opposite directions and cancel out. Water is bent, so its two pulls add up and the molecule ends up with a charged side.', ok: true },
        { t: 'Carbon dioxide has no hydrogen, and only hydrogen makes liquids.', ok: false },
      ],
      after: 'Lopsided bonds are not enough on their own: the shape has to stop them cancelling. Bend carbon dioxide and it would be a liquid; straighten water and oceans would be steam.',
      tryIt: 'In The Molecule, straighten water out and watch its pull collapse to nothing — then bend it back.',
    },
  ];

  const KEY = 'quiz';
  const saved = () => BL.store.get(KEY, {}) || {};
  const mark = (id, ok) => { const s = saved(); s[id] = ok ? 'right' : 'wrong'; BL.store.set(KEY, s); };

  BL.quizBank = BANK;
  BL.quizFor = (opts) => BANK.filter((q) => (opts.sim ? q.sim === opts.sim : q.field === opts.field));
  BL.quizScore = (field) => {
    const s = saved();
    const qs = BANK.filter((q) => q.field === field);
    return { done: qs.filter((q) => s[q.id] === 'right').length, total: qs.length };
  };

  /* One challenge, as a card. Answer it, then go and check. */
  function card(q, opts) {
    const state = saved()[q.id];
    const box = h('li', { class: 'ch' + (state === 'right' ? ' right' : '') });
    const ask = h('p', { class: 'ch-ask' }, q.ask);
    const list = h('div', { class: 'ch-choices', role: 'group', 'aria-label': 'Choose an answer' });
    const result = h('div', { class: 'ch-result', hidden: true });

    // shuffled, so the answer is never in the same slot twice
    const order = q.choices.map((c, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }

    let answered = false;
    const btns = order.map((i) => {
      const c = q.choices[i];
      const b = h('button', { type: 'button', class: 'ch-choice' }, c.t);
      b.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        btns.forEach((o, k) => {
          const cc = q.choices[order[k]];
          o.classList.add(cc.ok ? 'is-right' : 'is-wrong');
          o.disabled = true;
        });
        b.classList.add('picked');
        const right = !!c.ok;
        mark(q.id, right);
        if (right) box.classList.add('right');
        result.hidden = false;
        result.textContent = '';
        result.append(
          h('p', { class: 'ch-verdict ' + (right ? 'yes' : 'no') }, right ? 'Yes.' : 'Not that one.'),
          h('p', {}, q.after),
          h('p', { class: 'ch-try' },
            h('span', {}, q.tryIt + ' '),
            h('a', { class: 'ch-go', href: '#/' + q.sim }, 'Go and check →')));
        if (opts && opts.onanswer) opts.onanswer();
      });
      list.appendChild(b);
      return b;
    });

    box.append(ask, list, result);
    if (state) {
      box.append(h('p', { class: 'ch-seen' }, state === 'right' ? 'You have answered this one.' : 'You have had a go at this one.'));
    }
    return box;
  }

  /* A set of challenges. opts: {field} or {sim}, plus an optional title. */
  BL.challenges = function (host, opts) {
    const qs = BL.quizFor(opts);
    if (!qs.length) return null;
    const list = h('ul', { class: 'ch-list' }, qs.map((q) => card(q, opts)));
    const sec = h('section', { class: 'panel challenges' },
      h('h2', {}, opts.title || 'Challenges'),
      h('p', { class: 'hint' }, opts.lede || 'Everyday things that come out of what is on this page. Commit to an answer first — then go and settle it yourself.'),
      list);
    host.appendChild(sec);
    return sec;
  };
})();
