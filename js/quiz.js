/* Challenges: everyday things that only chemistry explains.

   Three for every instrument, and all of them about something a learner has
   already walked past a hundred times without asking — a sparkler, a snowflake,
   a paperclip floating, a pie filling that burns your mouth when the pastry
   does not. Nothing here can be answered by remembering a definition. Each one
   names the instrument that settles it and what to do when you get there, so a
   guess can always be taken and checked rather than looked up.

   Every question has four answers and all four are meant to sound reasonable.
   Three of them are the explanations people actually give — plausible, often
   half-true, and wrong about the mechanism. Exactly one is right about what is
   really happening, and it is marked `ok`. A distractor that nobody would pick
   teaches nothing; the useful ones are the ones a learner has to put down.

   Order is shuffled per render, so the answer is never in the same place. */
(function () {
  'use strict';
  const { h } = BL;

  const BANK = [
    /* ============================================================ ATOMS */

    /* ---- Rungs: energy comes in steps, and the steps are an element's own ---- */
    {
      id: 'sunburn', field: 'atoms', sim: 'rungs',
      ask: 'You can sit under a bright red heat lamp all afternoon and never burn. Twenty minutes outside on a cloudy summer day and you are pink. The red lamp is far brighter. Why does the weaker light do the damage?',
      choices: [
        { t: 'Burning needs one single packet of light carrying enough energy to knock an electron loose. Red packets are too small no matter how many arrive; ultraviolet packets are big enough.', ok: true },
        { t: 'Red light is cooler than ultraviolet, so it cannot heat your skin enough to damage it.', ok: false },
        { t: 'Clouds act like a lens and focus the sunlight into a stronger beam.', ok: false },
        { t: 'There is simply more ultraviolet light on a cloudy day than there is red light from the lamp.', ok: false },
      ],
      after: 'Brightness is how many packets arrive. Energy per packet is something else entirely, and it is the only thing that matters for whether a jump can happen at all. A million packets that are each too small still do nothing — which is why a red lamp is safe and a thin layer of cloud is not.',
      tryIt: 'In Rungs, set the photon energy low and fire as many as you like. Then raise it past the top of the ladder and fire one.',
    },
    {
      id: 'fireworks', field: 'atoms', sim: 'rungs',
      ask: 'Firework makers get red from strontium, green from barium and yellow from sodium. They cannot get green out of sodium however they build the shell. Why is each metal stuck with its own colour?',
      choices: [
        { t: 'The colour comes from how hot each metal burns, and hotter metals glow bluer.', ok: false },
        { t: 'Every element has its own ladder of rungs at its own spacings, so the gaps — and the colours those gaps give out — are fixed for that element.', ok: true },
        { t: 'Each metal is already that colour, and the heat just makes you able to see it.', ok: false },
        { t: 'Dyes are mixed in with the metal, and they survive the explosion long enough to colour the flame.', ok: false },
      ],
      after: 'The set of colours an element can give out is a fingerprint nobody can edit. It is also how we know what stars are made of without going to one: the light arrives carrying the ladder it came from.',
      tryIt: 'In Rungs, give the nucleus more charge and watch the whole ladder stretch. Every gap moves, and so does every colour it can make.',
    },
    {
      id: 'glowstars', field: 'atoms', sim: 'rungs',
      ask: 'Glow-in-the-dark stars on a bedroom ceiling have to be left under the light first. Then the light goes off and they glow for hours. Where was that glow being kept?',
      choices: [
        { t: 'The plastic soaked up heat from the lamp and is letting it back out as a faint glow.', ok: false },
        { t: 'A little of the lamp light is trapped inside the plastic, bouncing around until it leaks back out.', ok: false },
        { t: 'Light pushed electrons up onto higher rungs, and they drop back down slowly, handing the energy back out as light as they go.', ok: true },
        { t: 'The paint soaks light up the way a sponge soaks up water, and then squeezes it out again.', ok: false },
      ],
      after: 'Nothing is stored as light — light cannot sit still. What is stored is electrons parked somewhere they would rather not stay. The slow glow is them coming down, one at a time, over hours instead of instantly.',
      tryIt: 'In Rungs, lift the electron with a photon and watch it come back down — sometimes in two steps rather than one.',
    },

    /* ---- Cloud: an orbital is a region, not a racetrack ---- */
    {
      id: 'solidtable', field: 'atoms', sim: 'cloud',
      ask: 'An atom is almost entirely empty space — the nucleus is a speck in the middle of nothing. So why can you not push your hand through a table?',
      choices: [
        { t: 'The atoms in a table are packed so tightly that there are no gaps left between them.', ok: false },
        { t: 'The electron cloud is the atom’s real size, and the table’s clouds and your hand’s clouds push each other away long before any nucleus gets near.', ok: true },
        { t: 'The nuclei are so heavy that nothing can push past them.', ok: false },
        { t: 'The atoms are bonded to each other, and the bonds are what stops your hand.', ok: false },
      ],
      after: '"Empty space" is misleading. The space is not empty, it is occupied — by a cloud that has a definite size and will not share it. Everything you have ever touched, you touched cloud to cloud. The nuclei never meet.',
      tryIt: 'In Cloud, pile up catches until the region fills in. That filled region is how big the atom actually is.',
    },
    {
      id: 'neonsign', field: 'atoms', sim: 'cloud',
      ask: 'A neon sign runs for years. The neon inside never gets used up, never reacts with the glass, never turns into anything else. What makes it so unwilling?',
      choices: [
        { t: 'Neon atoms are too small to bond with anything.', ok: false },
        { t: 'The sealed glass tube keeps anything away that it could react with.', ok: false },
        { t: 'Its outer clouds are completely full, and a full set of clouds adds up to a perfect sphere — no lopsided place for another atom to take hold of.', ok: true },
        { t: 'The electricity running through it protects the atoms from reacting.', ok: false },
      ],
      after: 'Shape is the thing. A half-filled set of clouds sticks out in a direction, and a direction is something another atom can grab. Fill the set and the lumps cancel exactly, leaving a smooth ball with no handle on it anywhere.',
      tryIt: 'In Cloud, stack all three p clouds together and look at what shape they add up to.',
    },
    {
      id: 'noorbit', field: 'atoms', sim: 'cloud',
      ask: 'Every poster of an atom shows electrons circling the nucleus like planets. No photograph of that has ever been taken, of anything, ever. Why not?',
      choices: [
        { t: 'The electron moves far too fast for any camera to follow.', ok: false },
        { t: 'Electrons are too small to see even with the most powerful microscope.', ok: false },
        { t: 'The orbit is there, but it keeps changing shape too quickly to photograph.', ok: false },
        { t: 'There is no orbit to photograph. You can only ever catch the electron somewhere, and the cloud is the pile-up of thousands of separate catches.', ok: true },
      ],
      after: 'This is the one that catches nearly everybody, because "too fast for a camera" sounds so reasonable. But the problem is not speed. There is no path being travelled, so there is nothing a faster camera would reveal. What there is, is a map of where it turns up — and that map has a shape, and the shape is what does the chemistry.',
      tryIt: 'In Cloud, take one catch. Then a hundred. Then thousands, and watch a shape arrive out of pure scatter.',
    },

    /* ---- Shells: what an electron costs ---- */
    {
      id: 'saltsafe', field: 'atoms', sim: 'shells',
      ask: 'Sodium metal has to be kept under oil, and a lump of it thrown in water explodes. You sprinkle sodium on your chips every day. Same element. What changed?',
      choices: [
        { t: 'In salt the sodium has already given its loose outer electron away. The metal still has it, and hands it to the first thing that asks.', ok: true },
        { t: 'In salt the sodium is mixed with chlorine, which dilutes it enough to be safe.', ok: false },
        { t: 'The sodium in salt is a different, heavier kind of sodium atom.', ok: false },
        { t: 'Table salt has been treated at the factory to make it safe to eat.', ok: false },
      ],
      after: 'An atom and its ion are not the same thing wearing a different hat. The whole of sodium’s violence is one electron it is desperate to be rid of. Once it has gone, there is nothing left to give, and what is left is seasoning.',
      tryIt: 'In Shells, pull sodium’s outer electron off and see how little it costs.',
    },
    {
      id: 'lithiumbattery', field: 'atoms', sim: 'shells',
      ask: 'Your phone has a lithium battery. There is no such thing as a neon battery, and there never will be. Both are small, light atoms. Why lithium?',
      choices: [
        { t: 'Lithium is lighter, so electrons can move through it faster.', ok: false },
        { t: 'Neon is a gas, and gases cannot carry electricity.', ok: false },
        { t: 'Lithium is a metal, and only metals can store energy.', ok: false },
        { t: 'A battery works by moving electrons from one place to another. Lithium gives one up for almost nothing. Neon will not give one up at any price.', ok: true },
      ],
      after: 'A battery is a controlled electron handover, and it is only worth building out of something that parts with electrons cheaply. The price is a measurable number, it is different for every element, and it decides what gets used for what.',
      tryIt: 'In Shells, measure what it costs to pull an electron off lithium. Then try neon.',
    },
    {
      id: 'nacl2', field: 'atoms', sim: 'shells',
      ask: 'Table salt is always one sodium to one chlorine. Never two chlorines to a sodium. Sodium has plenty more electrons in it, so why does it only ever give up one?',
      choices: [
        { t: 'Sodium only has one electron in total to give away.', ok: false },
        { t: 'The first electron is loose and cheap. The second one has to come out of a full inner shell, and costs about ten times as much — more than anything could pay back.', ok: true },
        { t: 'Chlorine can only ever accept one electron from any one atom.', ok: false },
        { t: 'An atom carrying two charges would be unstable and tear itself apart.', ok: false },
      ],
      after: 'There is a cliff in the price, and formulas sit on the edge of it. Sodium stops at one because the second one is unaffordable; magnesium goes to two because for magnesium the cliff comes one electron later. The formula is the shape of the price list.',
      tryIt: 'In Shells, take one electron off sodium, then try to take a second, and watch the price jump.',
    },

    /* ---- Fill: the counting trick that happens to work ---- */
    {
      id: 'whyh2o', field: 'atoms', sim: 'fill',
      ask: 'Water is always two hydrogens to one oxygen. Never one, never three. Nobody decided this. Why does it come out that way every single time?',
      choices: [
        { t: 'Two hydrogen atoms weigh about the right amount to balance one oxygen.', ok: false },
        { t: 'Hydrogen atoms are small enough that exactly two fit against an oxygen.', ok: false },
        { t: 'Oxygen is two electrons short of a full outer ring, so it shares with exactly two hydrogens. One fewer leaves a gap; one more has nothing left to share with.', ok: true },
        { t: 'It was named H₂O, and chemists have followed that recipe ever since.', ok: false },
      ],
      after: 'Counting to a full ring predicts the formula correctly nearly every time, which is why it is taught. It is worth knowing it is a scoring system rather than a cause — nothing in nature is counting. Meet shows you the same answer arrived at from what electrons actually cost.',
      tryIt: 'In Fill, build water, then try to attach a third hydrogen and see what happens to the rings.',
    },
    {
      id: 'carbonlife', field: 'atoms', sim: 'fill',
      ask: 'Every living thing is built on carbon. Not one living thing is built on neon. Both are small, ordinary atoms sitting a few places apart on the same row.',
      choices: [
        { t: 'Carbon is far more common on Earth than neon is.', ok: false },
        { t: 'Carbon is four short of a full ring, so it can share with four neighbours at once and build chains and rings that go on forever. Neon is already full and shares with nobody.', ok: true },
        { t: 'Carbon is heavier, so it holds big molecules together better.', ok: false },
        { t: 'Carbon is black, and living things need pigment to work.', ok: false },
      ],
      after: 'Four is the magic number: enough connections to branch, ring and chain without limit. Being common would not help if an atom could only ever make one bond — and neon, which makes none, is just as available and built nothing.',
      tryIt: 'In Fill, solve a carbon puzzle and count how many sharing partners it needs. It is four, every time.',
    },
    {
      id: 'nitrogenbreath', field: 'atoms', sim: 'fill',
      ask: 'Four out of every five breaths you take is nitrogen. It goes in and comes straight back out, completely unchanged, your whole life. Your body does need nitrogen — it is in every protein. So why can it not use any of that?',
      choices: [
        { t: 'Nitrogen molecules are too small for your lungs to absorb.', ok: false },
        { t: 'Nitrogen is lighter than oxygen, so it passes straight through.', ok: false },
        { t: 'Your body has no use for nitrogen, so it ignores it.', ok: false },
        { t: 'The two nitrogen atoms share three pairs of electrons — the tightest bond there is — and almost nothing can prise that apart.', ok: true },
      ],
      after: 'You are surrounded by the nitrogen you need and cannot touch a molecule of it. Bacteria in soil can, barely, and the entire food chain depends on them doing it. One very tight bond stands between an ocean of free nitrogen and everything that eats.',
      tryIt: 'In Fill, make two atoms share three pairs and see how much has to line up for it to work.',
    },

    /* ========================================================== BONDING */

    /* ---- The Spectrum: one dial, every kind of hold ---- */
    {
      id: 'saltsand', field: 'bonding', sim: 'spectrum',
      ask: 'Stir salt into a glass of water and it vanishes in seconds. Stir sand in and it sits there forever. Both are hard, dry crystals that look much the same ground up.',
      choices: [
        { t: 'Salt grains are smaller than sand grains, so water gets round them more easily.', ok: false },
        { t: 'Salt is softer, so the water grinds it away.', ok: false },
        { t: 'Water’s charged ends can get in between salt’s ions and hold each one on its own. Sand’s atoms are locked together by shared electrons, and water has nothing to offer that.', ok: true },
        { t: 'Salt is lighter, so it floats apart in the water.', ok: false },
      ],
      after: 'Dissolving is not breaking something up by force. It is water making each piece a better offer than the piece was already getting. Salt’s ions can take that offer; sand’s shared bonds cannot, at any grain size.',
      tryIt: 'In The Spectrum, slide to the ionic end and park an ion beside a molecule with strong ends.',
    },
    {
      id: 'oilwater', field: 'bonding', sim: 'spectrum',
      ask: 'Oil poured into water sits in a layer and will not mix no matter how hard you stir. Within a minute of stopping, it has gathered itself back into a layer. What is pushing them apart?',
      choices: [
        { t: 'Oil is lighter than water, so it always rises to the top.', ok: false },
        { t: 'Water and oil carry opposite charges, and that difference keeps them separate.', ok: false },
        { t: 'Nothing pushes them apart. Oil has almost no charged ends, so water molecules would rather hold on to each other’s δ+ and δ− than make room for it.', ok: true },
        { t: 'Oil is greasy, and grease repels water.', ok: false },
      ],
      after: 'Oil really is lighter, and that really is why it ends up on top — but it is not why it refuses to mix. Alcohol is lighter than water too, and mixes perfectly. The separation is water choosing itself, not oil being pushed.',
      tryIt: 'In The Spectrum, slide to the even end and try to get a neighbour to hold on at all.',
    },
    {
      id: 'gluetape', field: 'bonding', sim: 'spectrum',
      ask: 'Superglue sticks your fingers together in seconds and will not let go. Sticky tape holds a poster up for a year and then peels off clean. Both are sticky. Why is one of them so much more serious?',
      choices: [
        { t: 'Superglue sets hard while tape’s glue stays soft and can be pulled away.', ok: false },
        { t: 'Superglue soaks into skin, where tape only sits on the surface.', ok: false },
        { t: 'Your skin is slightly damp, and tape does not stick well to damp things.', ok: false },
        { t: 'Superglue forms real shared-electron bonds with your skin. Tape only has the faint, everywhere stickiness between clouds that happen to be touching.', ok: true },
        ],
      after: 'They are not the same thing at different strengths. They are different rungs of the ladder: one is a bond inside a molecule, the other is the weakest hold there is between molecules. Peeling tape costs almost nothing. Peeling superglue costs skin.',
      tryIt: 'In The Spectrum, compare where a covalent bond sits on the ladder and where van der Waals sits.',
    },

    /* ---- Meet: can one of them afford the handover ---- */
    {
      id: 'metalnonmetal', field: 'bonding', sim: 'meet',
      ask: 'Sodium and chlorine make salt. Magnesium and oxygen make a white powder. But sodium and magnesium together make nothing in particular, and neither do oxygen and chlorine. Why does it take one of each?',
      choices: [
        { t: 'Metals and non-metals start out with opposite charges and attract each other.', ok: false },
        { t: 'A handover only pays off when one side lets go cheaply and the other is glad to receive. Two cheap givers have nobody to give to; two eager takers have nothing to take.', ok: true },
        { t: 'Two metals are both solid, so they cannot react with each other.', ok: false },
        { t: 'Metals are too heavy to accept electrons from one another.', ok: false },
      ],
      after: 'This is the whole metal-and-non-metal rule, arrived at rather than announced. Nobody has to remember which side of the table is which: line the elements up by what an electron costs them and the rule falls out of the prices.',
      tryIt: 'In Meet, take one element from each end of the givers-and-takers map, then take two from the same end.',
    },
    {
      id: 'sparkler', field: 'bonding', sim: 'meet',
      ask: 'A sparkler burns with a white flare bright enough to hurt your eyes. The argon sealed inside a double-glazed window sits there doing nothing for thirty years. Both are just atoms meeting air.',
      choices: [
        { t: 'Sparklers use metal powder, and powders catch fire more easily than lumps.', ok: false },
        { t: 'The argon is sealed in glass where no oxygen can get to it.', ok: false },
        { t: 'Magnesium’s two outer electrons are cheap to hand over and oxygen pays handsomely for them. Argon holds its own so tightly that nothing can afford the price.', ok: true },
        { t: 'Magnesium is lighter, so its atoms move faster and catch fire more easily.', ok: false },
      ],
      after: 'That flare is the payback — the energy let go when a handover turns out to be a very good deal. The brightness of the flame is the size of the bargain. Argon is offered the same deal and it is simply not worth taking.',
      tryIt: 'In Meet, put magnesium with oxygen and watch it move two electrons at once.',
    },
    {
      id: 'whichway', field: 'bonding', sim: 'meet',
      ask: 'In salt it is always the sodium that ends up positive and the chlorine negative. Never the other way round, in any salt, anywhere. What fixes the direction?',
      choices: [
        { t: 'Sodium is written first in the formula, so it takes the first charge.', ok: false },
        { t: 'Sodium is a metal, and metals are positive by nature.', ok: false },
        { t: 'Chlorine is a gas, and gases always end up negative.', ok: false },
        { t: 'Pulling an electron off sodium is cheap and chlorine is glad of it. The other way round costs far more than the result could ever pay back.', ok: true },
      ],
      after: '"Metals are positive" is a description of the answer dressed up as the reason for it. The actual reason is two measured prices, and you can check them both. Try the handover in the wrong direction and the sum comes out hopeless.',
      tryIt: 'In Meet, put sodium with chlorine, then try dragging the electron the other way.',
    },

    /* ---- Tug: one bond, and what a passing charge does to it ---- */
    {
      id: 'microwave', field: 'bonding', sim: 'tug',
      ask: 'A microwave heats your soup in two minutes and the ceramic bowl comes out barely warm. Both were in there the same length of time, in the same box.',
      choices: [
        { t: 'Microwaves pass straight through ceramic and are absorbed by liquids.', ok: false },
        { t: 'The microwaves are tuned to the same frequency as water, so the water resonates.', ok: false },
        { t: 'A microwave is an electric field flipping back and forth billions of times a second. Water molecules have a δ+ end and a δ− end, so they get twisted round and round, and that twisting is heat. The bowl has no ends to grab.', ok: true },
        { t: 'The soup is darker than the bowl, so it soaks up more energy.', ok: false },
      ],
      after: 'Resonance is the explanation almost everyone gives and it is not right — if it were, the frequency would have to be exact, and microwaves deliberately are not tuned to water’s resonance at all. What happens is simpler and more interesting: a lopsided molecule in a flipping field gets wrenched round, and molecules being wrenched round is what heat is.',
      tryIt: 'In Tug, build a bond with strong δ+ and δ− ends, then move the charge probe around and watch the whole molecule swing to follow it.',
    },
    {
      id: 'waterstream', field: 'bonding', sim: 'tug',
      ask: 'Run a thin stream of water from a tap, rub a plastic comb on your sleeve and hold it close. The whole stream bends towards the comb without touching it.',
      choices: [
        { t: 'The comb’s charge rubs off onto the water, and opposite charges then attract.', ok: false },
        { t: 'The comb pushes the air aside and the stream falls into the gap.', ok: false },
        { t: 'Static electricity makes the water lighter, so it is easier to deflect.', ok: false },
        { t: 'Water molecules already have a δ+ end and a δ− end. The comb’s charge turns them all to face it, and then pulls hardest on the end that is nearer.', ok: true },
      ],
      after: 'The water never becomes charged — pour it into a cup afterwards and it is perfectly ordinary. The trick is that it did not need to be. The ends were already there, built into the shape of the molecule. The comb only had to line them up.',
      tryIt: 'In Tug, switch on the charge probe and bring it near a bond that already leans. Watch the molecule turn to face it.',
    },
    {
      id: 'combpaper', field: 'bonding', sim: 'tug',
      ask: 'The same charged comb will pick up tiny scraps of paper. The paper has not been rubbed on anything and carries no charge of its own.',
      choices: [
        { t: 'The comb’s charge pushes the electron clouds inside the paper over to one side, so the near side of the paper turns slightly opposite — a lean it did not have until the comb arrived.', ok: true },
        { t: 'Paper comes out of the factory with a slight charge already on it.', ok: false },
        { t: 'The scraps are so light that any force at all is enough to lift them.', ok: false },
        { t: 'The comb and the paper touch and swap some charge between them.', ok: false },
      ],
      after: 'A charge can create a lean where there was none, in something completely neutral, just by being nearby. Take the comb away and the paper goes back to having no ends at all. The same borrowed lean is what sticks a balloon to a wall and what lets a gecko hold on to glass.',
      tryIt: 'In Tug, make the sharing perfectly even so nothing is charged, then bring the probe close and watch the cloud lean anyway.',
    },

    /* ---- The Well: how deep the valley is ---- */
    {
      id: 'boilsplit', field: 'bonding', sim: 'well',
      ask: 'Boiling a kettle dry takes a few minutes. Splitting that same water into hydrogen and oxygen gas needs a current run through it for hours. Both are described as breaking water apart.',
      choices: [
        { t: 'Boiling only pulls whole molecules away from each other. Splitting has to break the bonds inside each molecule, and those are ten to twenty times deeper.', ok: true },
        { t: 'Electricity is simply a slower way of putting heat in.', ok: false },
        { t: 'Boiling happens at 100 °C and splitting needs a far higher temperature than a kettle can reach.', ok: false },
        { t: 'A kettle puts its heat into one spot, while a current spreads out through the whole tank.', ok: false },
      ],
      after: 'Every molecule comes through boiling completely intact — steam is still H₂O. That is the whole difference between a change of state and a chemical reaction, and on the energy ladder it is the difference between the bottom rungs and the top.',
      tryIt: 'In The Well, break a hydrogen bond with heat, then try to break a covalent one the same way.',
    },
    {
      id: 'steamburn', field: 'bonding', sim: 'well',
      ask: 'Steam from a kettle burns far worse than the boiling water in it. Measure them both and they are the same temperature — 100 °C. So where does the extra damage come from?',
      choices: [
        { t: 'Steam is hotter than boiling water.', ok: false },
        { t: 'Steam moves fast, so it hits your skin harder.', ok: false },
        { t: 'Turning back into water releases all the energy it took to break the holds between the molecules — straight into your skin, on top of the heat.', ok: true },
        { t: 'Steam spreads over a much larger area of skin at once.', ok: false },
      ],
      after: 'Pulling molecules apart costs energy, and the bill is paid back in full the instant they snap together again. Steam is carrying a loaded spring that water is not, and it unloads on the first cold thing it meets.',
      tryIt: 'In The Well, see how much heat it takes to pull a pair apart. All of that comes back when they fall together again.',
    },
    {
      id: 'buttersalt', field: 'bonding', sim: 'well',
      ask: 'Butter melts in a warm pan in seconds. Sprinkle salt into the same pan, leave the hob on full all afternoon, and the grains are still grains.',
      choices: [
        { t: 'Salt is a mineral, and minerals do not melt.', ok: false },
        { t: 'Salt grains are too small to hold enough heat to melt.', ok: false },
        { t: 'Melting butter only has to shake whole molecules loose from each other. Melting salt means fighting the pull between charges, which is far deeper than a hob can reach.', ok: true },
        { t: 'The pan is not actually hot enough to melt butter either — it only softens it.', ok: false },
      ],
      after: 'Salt does melt, at about 800 °C, which is red heat. Melting point is a direct readout of how deep the hold is, which is why a list of melting points tells you what kind of hold a substance uses before you know anything else about it.',
      tryIt: 'In The Well, set the heat to about a kitchen hob and see which kinds of hold let go and which do not budge.',
    },

    /* ---- Handshake: a grip that only works lined up ---- */
    {
      id: 'sanitiser', field: 'bonding', sim: 'handshake',
      ask: 'Hand sanitiser is dry in fifteen seconds. The same amount of water takes several minutes and feels much less cold. Both are clear liquids at room temperature.',
      choices: [
        { t: 'Alcohol is lighter than water, so it lifts off more easily.', ok: false },
        { t: 'Water molecules grip each other at both ends with hydrogen bonds. Alcohol has far fewer places to grip, so its molecules get away much more easily.', ok: true },
        { t: 'Alcohol is thinner, so it spreads into a wider layer and dries faster.', ok: false },
        { t: 'Alcohol is warmer than water at room temperature.', ok: false },
      ],
      after: 'How fast something evaporates is a direct measure of how firmly its molecules hold each other. The cold feeling is the other half of the same fact: the ones that escape take their energy with them, and the ones left behind are slower.',
      tryIt: 'In Handshake, heat a crowd with strong hands and a crowd with weak hands side by side and see which flies apart first.',
    },
    {
      id: 'snowflake', field: 'bonding', sim: 'handshake',
      ask: 'Every snowflake has six sides. Not five, not seven, and it does not depend on where it formed or what it formed around.',
      choices: [
        { t: 'Falling through the air rounds them into six points, the way a river rounds a pebble.', ok: false },
        { t: 'A water molecule can only shake hands in particular directions, and the only pattern where every molecule grips every neighbour is six-sided.', ok: true },
        { t: 'Six sides is the shape that falls most slowly, so those are the ones that survive.', ok: false },
        { t: 'Each flake copies the shape of the dust speck it formed around.', ok: false },
      ],
      after: 'A hydrogen bond is picky about direction in a way that ordinary stickiness is not — it only grips when a hydrogen is pointing straight at a lone pair. Billions of molecules each insisting on that at once leaves exactly one pattern, and you can see it from across the room.',
      tryIt: 'In Handshake, turn one molecule slowly and watch the grip appear only at certain angles.',
    },
    {
      id: 'methaneboil', field: 'bonding', sim: 'handshake',
      ask: 'Water boils at 100 °C. Methane — the gas in a cooker — is a molecule of almost exactly the same size and weight, and it is still a gas inside a freezer at −160 °C.',
      choices: [
        { t: 'Water is considerably heavier than methane.', ok: false },
        { t: 'Methane is flammable, and flammable things boil at lower temperatures.', ok: false },
        { t: 'Water is naturally a liquid and methane is naturally a gas.', ok: false },
        { t: 'Water molecules hold on to each other with hydrogen bonds. Methane has no charged ends at all, so there is almost nothing holding its molecules together.', ok: true },
      ],
      after: 'By size alone water should boil somewhere near −80 °C. It boils 180 degrees higher than it has any right to, and that gap is hydrogen bonding, and the fact that there are oceans instead of an atmosphere of steam is the direct consequence.',
      tryIt: 'In Handshake, cool a crowd with hands and a crowd with no hands to the same temperature and see which sticks together.',
    },

    /* ---- Flicker: the weakest hold there is, and it is never zero ---- */
    {
      id: 'gecko', field: 'bonding', sim: 'flicker',
      ask: 'A gecko runs up a pane of glass and across the ceiling. Its feet are dry — no glue, no slime, and it leaves no mark behind.',
      choices: [
        { t: 'Tiny suction cups on its toes grip the glass.', ok: false },
        { t: 'Its feet carry a static charge that sticks to the glass.', ok: false },
        { t: 'Its toes are covered in a natural glue that dries instantly.', ok: false },
        { t: 'Millions of microscopic hairs get close enough to the glass for the flicker between electron clouds to take hold. Each one is pitiful; there are a billion of them.', ok: true },
      ],
      after: 'The weakest force in this whole lab, scaled up by sheer number, carries an animal up a window. It also explains why a gecko cannot hold on to a dusty surface: the hairs cannot get close enough, and this hold dies the instant there is any distance at all.',
      tryIt: 'In Flicker, push two atoms close together and watch how sharply the pull grows as they nearly touch.',
    },
    {
      id: 'oilwax', field: 'bonding', sim: 'flicker',
      ask: 'Cooking oil pours. Candle wax is a solid you could hit with a hammer. Chemically they are close cousins — long chains of carbon and hydrogen with no charged ends on either.',
      choices: [
        { t: 'Wax molecules are much longer, so there is far more cloud to slosh and far more of it pressed against the next molecule.', ok: true },
        { t: 'The wax has been cooled and set, while the oil has not.', ok: false },
        { t: 'Oil is wet and wax is dry.', ok: false },
        { t: 'Wax has had a hardener added to it so it will hold a shape.', ok: false },
      ],
      after: 'Same kind of hold, more of it. Lengthen the chain and the flicker between neighbours adds up along the whole molecule — which is why the same family runs from gas, to petrol, to oil, to wax, to candle, as the chains get longer and nothing else changes.',
      tryIt: 'In Flicker, put the smallest atom and the biggest atom at the same distance and compare the pull.',
    },
    {
      id: 'airpuddle', field: 'bonding', sim: 'flicker',
      ask: 'The air in this room is molecules flying about with space between them. They do attract each other — every molecule does. So why has the air not long since collected into a puddle on the floor?',
      choices: [
        { t: 'Air molecules are too light to fall.', ok: false },
        { t: 'Air molecules repel one another.', ok: false },
        { t: 'Nitrogen and oxygen are small molecules with very little cloud to slosh, so the flicker between them is far too feeble to hold them together against room-temperature jostling.', ok: true },
        { t: 'There is too much space between them for them ever to meet.', ok: false },
      ],
      after: 'They do attract, and it is not nothing — chill the air to −196 °C and it does collect into a puddle, which is how liquid nitrogen is made. At room temperature the molecules simply have far more energy than that faint hold can contain.',
      tryIt: 'In Flicker, cool a crowd of atoms down and find the temperature where they finally cling together.',
    },

    /* ============================================================ WATER */

    /* ---- The Molecule: bent, and lopsided, and both matter ---- */
    {
      id: 'co2water', field: 'water', sim: 'h2o',
      ask: 'Carbon dioxide and water are both tiny molecules, and in both of them oxygen pulls the shared electrons hard. One you breathe out as a gas. The other you are mostly made of.',
      choices: [
        { t: 'Carbon dioxide is lighter than water.', ok: false },
        { t: 'Carbon dioxide is straight, so its two lopsided bonds pull in exactly opposite directions and cancel. Water is bent, so its two pulls add up and leave the molecule with a charged side.', ok: true },
        { t: 'Carbon dioxide has no hydrogen in it, and only hydrogen makes liquids.', ok: false },
        { t: 'Our bodies produce carbon dioxide as a gas, so that is the form it takes.', ok: false },
      ],
      after: 'Carbon dioxide is actually two and a half times heavier than water, which makes it a gas in spite of its weight, not because of it. Lopsided bonds are not enough on their own — the shape has to stop them cancelling. Bend carbon dioxide and it would be a liquid. Straighten water and the oceans would be steam.',
      tryIt: 'In The Molecule, straighten water out and watch its pull collapse to nothing. Then bend it back.',
    },
    {
      id: 'universal', field: 'water', sim: 'h2o',
      ask: 'Almost everything that happens inside you happens dissolved in water. Blood, sap, tears, the inside of every cell. Why is water the liquid life ended up running on?',
      choices: [
        { t: 'Water is a liquid, and liquids mix with nearly everything.', ok: false },
        { t: 'Water is the most common liquid on Earth, so living things adapted to use it.', ok: false },
        { t: 'Its bent shape leaves it with a δ− side and a δ+ side, so it can take hold of almost anything that carries a charge or has a charged end.', ok: true },
        { t: 'Water molecules are very small, so they slip in between other molecules easily.', ok: false },
      ],
      after: 'Being common would not have helped if water had no grip. Carbon dioxide is common too, and dissolves almost nothing. The usefulness comes from the two charged sides — and those come from the bend.',
      tryIt: 'In The Molecule, turn the lopsidedness down to nothing and ask what that molecule could still dissolve.',
    },
    {
      id: 'dressing', field: 'water', sim: 'h2o',
      ask: 'Salad dressing separates within minutes of being shaken. Vinegar is mostly water and mixes with water perfectly. Olive oil never does. All three are clear liquids.',
      choices: [
        { t: 'Oil is thicker than vinegar, so it cannot mix in properly.', ok: false },
        { t: 'Oil is lighter and floats, and things that float cannot mix.', ok: false },
        { t: 'Vinegar is an acid, and acids dissolve in water.', ok: false },
        { t: 'Vinegar’s molecules have charged ends just like water’s, so the two can swap grips. Oil’s molecules have almost none, so water holds on to itself instead.', ok: true },
      ],
      after: 'Whether two liquids mix is a question about ends, not about thickness or weight. Honey is far thicker than oil and dissolves in water instantly, because it is covered in charged ends.',
      tryIt: 'In The Molecule, turn the lopsidedness down to nothing and watch the second molecule lose its grip.',
    },

    /* ---- Cling: who grips harder, the surface or the water ---- */
    {
      id: 'waxedcar', field: 'water', sim: 'cling',
      ask: 'Rain stands up in round beads on a freshly waxed car and runs off in a flat sheet on the car next to it. Same rain, same afternoon.',
      choices: [
        { t: 'Wax is waterproof, so it repels the water.', ok: false },
        { t: 'Wax is smoother, so there is less for the water to hold on to.', ok: false },
        { t: 'It is a contest: whether the surface grips the water harder than the water grips itself. Wax does not, so the water holds on to itself and pulls into a ball.', ok: true },
        { t: 'The waxed panel is slightly warmer, and water pulls away from warm surfaces.', ok: false },
      ],
      after: 'Nothing is repelling anything. Both surfaces attract water; wax just attracts it less than water attracts itself. Everything from a raincoat to a non-stick pan to the lining of your lungs is somebody deciding which side of that contest should win.',
      tryIt: 'In Cling, keep the surface exactly as it is and change only how tightly the water grips itself.',
    },
    {
      id: 'meniscus', field: 'water', sim: 'cling',
      ask: 'Water in a glass curves up where it meets the sides. Mercury in an old thermometer curves down. Both are liquids in glass tubes, sitting still.',
      choices: [
        { t: 'Mercury is much heavier, so gravity drags its edges down.', ok: false },
        { t: 'Air pressure pushes down harder on the middle of the liquid than on the edges.', ok: false },
        { t: 'Water grips glass harder than it grips itself, so the edge climbs. Mercury grips itself harder than it grips glass, so the edge pulls down.', ok: true },
        { t: 'The inside of the glass is slightly curved where it was moulded.', ok: false },
      ],
      after: 'The same contest as the waxed car, seen edge-on. Which way a liquid curves at the wall tells you, at a glance, which of the two grips is winning — and it is the reason you are taught to read a measuring cylinder at the bottom of the curve.',
      tryIt: 'In Cling, turn the surface’s grab right down and watch the drop’s edge tip past upright.',
    },
    {
      id: 'ducksback', field: 'water', sim: 'cling',
      ask: 'Water runs off a duck’s back — it is such a common saying that nobody asks why. A duck swims all day and climbs out dry.',
      choices: [
        { t: 'Feathers are too smooth for water to stay on.', ok: false },
        { t: 'The duck’s body heat evaporates the water as fast as it lands.', ok: false },
        { t: 'Feathers trap a layer of air that pushes the water away.', ok: false },
        { t: 'The duck combs an oily coating through its feathers, and that oil barely grips water — so the water holds itself together and rolls off in beads.', ok: true },
        ],
      after: 'A duck that cannot reach its oil gland gets waterlogged and can drown, which is the same chemistry run the other way. It is also exactly why oil on seabirds is so deadly: it ruins the surface that was keeping the water out.',
      tryIt: 'In Cling, set the surface to wax and tilt it until the drop slides straight off.',
    },

    /* ---- Skin: the molecules unlucky enough to be on the outside ---- */
    {
      id: 'paperclip', field: 'water', sim: 'skin',
      ask: 'Lay a steel paperclip gently on still water and it sits there. Steel is eight times denser than water. Touch the surface with a drop of washing-up liquid and the clip drops like a stone.',
      choices: [
        { t: 'The paperclip is light enough to float like a little boat.', ok: false },
        { t: 'Air trapped underneath the clip holds it up until the soap releases it.', ok: false },
        { t: 'Molecules at the surface have neighbours below and beside but none above, so they are pulled inwards hard, making a skin. Soap gets in between them and weakens that pull.', ok: true },
        { t: 'Soap makes the water heavier, so the clip can no longer stay on top.', ok: false },
      ],
      after: 'It is not floating. It is being held up by a skin, and the skin is nothing more than the inward pull on the molecules that ended up on the outside. Weaken that pull and the clip goes straight through, which is why the soap works instantly.',
      tryIt: 'In Skin, add soap and watch where it ends up and what happens to the pull arrows.',
    },
    {
      id: 'rounddrop', field: 'water', sim: 'skin',
      ask: 'A drip hanging off a tap is round. A raindrop is round. Spilled mercury balls up. Why is a ball the shape a liquid goes to when nothing else is acting on it?',
      choices: [
        { t: 'Falling through the air wears the drop round, the way a river rounds a pebble.', ok: false },
        { t: 'Air presses in evenly from every side and squeezes it into a ball.', ok: false },
        { t: 'Water is made of round molecules, so it makes round drops.', ok: false },
        { t: 'Every molecule at the edge is being pulled inwards, and a ball is the shape with the least edge for a given amount of liquid.', ok: true },
        ],
      after: 'The drip is round before it falls, so the air cannot be doing it. It is round for the same reason a crowd pushing inwards from all sides ends up a circle: that shape leaves the fewest molecules stuck out on the surface.',
      tryIt: 'In Skin, compare the edge of a long strip of water with the edge of the same water bunched up.',
    },
    {
      id: 'bubbles', field: 'water', sim: 'skin',
      ask: 'You cannot blow a bubble with plain water. Everyone has tried. Add a drop of washing-up liquid and suddenly you can blow one the size of your head.',
      choices: [
        { t: 'Soap makes the water thicker, so the bubble wall is stronger.', ok: false },
        { t: 'Soap adds tiny amounts of air into the water.', ok: false },
        { t: 'Plain water pulls its surface together so hard that a thin film snaps shut at once. Soap weakens that pull enough for a film to stretch out and hold.', ok: true },
        { t: 'Soap makes the water slippery, so it stretches more easily.', ok: false },
      ],
      after: 'The surprise is that soap makes bubbles possible by making water weaker, not stronger. Plain water’s surface tension is too high — it tears any film shut before it can grow. Bubbles live in the gap soap opens up.',
      tryIt: 'In Skin, add soap and watch the inward pull on the edge molecules go slack.',
    },

    /* ---- Climb: water dragging itself uphill ---- */
    {
      id: 'tallTree', field: 'water', sim: 'climb',
      ask: 'A tall tree lifts water from its roots to leaves a hundred metres up, all day, every day, with no pump and no moving parts anywhere in it.',
      choices: [
        { t: 'The roots push the water up under pressure from below.', ok: false },
        { t: 'The leaves suck the water up, the way you suck on a straw.', ok: false },
        { t: 'Water grips the walls of extremely narrow tubes and drags the rest of itself up behind it — and the narrower the tube, the higher it goes.', ok: true },
        { t: 'The sun warms the water, and warm things rise.', ok: false },
      ],
      after: 'Sucking cannot do it: a perfect vacuum can only lift water about ten metres before the column breaks. The tubes in wood are so fine that the grip on the walls carries the column far past that, which is the only reason tall trees are possible at all.',
      tryIt: 'In Climb, make the tube narrower and narrower and watch how much higher the water goes.',
    },
    {
      id: 'papertowel', field: 'water', sim: 'climb',
      ask: 'Touch the corner of a paper towel to a spill and the water climbs up into it, against gravity, on its own. Touch a plastic bag to the same spill and nothing happens at all.',
      choices: [
        { t: 'Paper is absorbent and plastic is not.', ok: false },
        { t: 'Paper soaks up water the way a sponge soaks up air.', ok: false },
        { t: 'Paper is lighter, so water can rise into it more easily.', ok: false },
        { t: 'Paper is a mesh of tiny channels whose walls grip water hard enough to haul it upwards. Plastic barely grips water at all, so there is nothing to climb.', ok: true },
      ],
      after: '"Absorbent" names the behaviour without explaining it. It takes two things: channels narrow enough, and walls that grip water harder than water grips itself. Take either away — wax the paper, or widen the gaps — and the climbing stops.',
      tryIt: 'In Climb, switch between a surface that grips water and one that does not, and watch what the water does in the tube.',
    },
    {
      id: 'candlewick', field: 'water', sim: 'climb',
      ask: 'A candle burns for hours and the wick never runs dry, even though the flame is at the top and the melted wax is in a pool at the bottom.',
      choices: [
        { t: 'The heat of the flame sucks the wax up towards it.', ok: false },
        { t: 'The wick is hollow and the wax runs up through the middle.', ok: false },
        { t: 'The wick’s narrow fibres grip the melted wax and pull it up to the flame as fast as the flame burns it away.', ok: true },
        { t: 'The wax turns to gas in the pool and rises up to the flame.', ok: false },
      ],
      after: 'The wick is not fuel, it is plumbing — which is why a candle with its wick pulled out goes out, and a wick with no wax burns away in seconds. The same effect lifts water up a tree and a spill into a paper towel.',
      tryIt: 'In Climb, find which tube lifts the water highest. That is the same thing a wick is doing.',
    },

    /* ---- Float: the one that gets it backwards, and why that matters ---- */
    {
      id: 'frozencan', field: 'water', sim: 'float',
      ask: 'A can of fizzy drink left in the freezer splits itself open. Almost every other substance shrinks when it freezes.',
      choices: [
        { t: 'The gas dissolved in the drink expands as it gets cold.', ok: false },
        { t: 'Freezing lines the water molecules up so that every hydrogen bond gets made — and the only pattern that manages that is full of holes. So ice takes up more room than the water it came from.', ok: true },
        { t: 'The metal can shrinks in the cold and squeezes the drink until something gives.', ok: false },
        { t: 'Cold makes water heavier, and the can cannot take the extra weight.', ok: false },
      ],
      after: 'Water is doing the opposite of what nearly everything else does, and it is doing it because its grips are fussy about direction. Satisfying all of them at once forces an open, roomy pattern — and open means bigger.',
      tryIt: 'In Float, cool the water-like sheet slowly and watch the holes open up as the hands find each other.',
    },
    {
      id: 'frozenpond', field: 'water', sim: 'float',
      ask: 'A pond freezes over in winter and the fish are still alive in spring. If ice behaved like almost any other solid, they would not be.',
      choices: [
        { t: 'The fish make enough body heat to keep the water around them liquid.', ok: false },
        { t: 'Ponds only freeze at the shallow edges, never in the middle.', ok: false },
        { t: 'Moving water cannot freeze, and the fish keep it moving.', ok: false },
        { t: 'Ice is less dense than water, so it floats and forms a lid — leaving liquid water underneath it all winter.', ok: true },
      ],
      after: 'If ice sank, ponds and lakes would freeze from the bottom up and freeze solid, every winter, killing everything in them. A single odd fact about one molecule’s shape is why fresh water has anything living in it at all.',
      tryIt: 'In Float, cool the sheet until the block floats, then switch to the no-hands kind and watch it sink.',
    },
    {
      id: 'oilfreezer', field: 'water', sim: 'float',
      ask: 'A bottle of water left in the freezer cracks. A bottle of cooking oil in the same freezer goes thick and cloudy and comes out in one piece.',
      choices: [
        { t: 'Oil does not freeze.', ok: false },
        { t: 'Oil molecules have no hands to lock into an open pattern, so as they cool they only ever pack in tighter — and tighter means smaller.', ok: true },
        { t: 'Oil is lighter than water, so it does not push outwards as hard.', ok: false },
        { t: 'Oil is slippery and slides out of the way rather than pressing on the bottle.', ok: false },
      ],
      after: 'Oil does freeze — it just shrinks doing it, like nearly everything else. Water is the odd one out, and it is odd for a reason you can point at: directional grips that only all fit in a roomy arrangement.',
      tryIt: 'In Float, switch to the kind with no hands and cool it. Does it open up, or close down?',
    },

    /* ---- Slow: where the heat goes ---- */
    {
      id: 'sandsea', field: 'water', sim: 'slow',
      ask: 'On a hot afternoon the sand burns your feet and the sea is still freezing. The sun has been on both of them all day, side by side.',
      choices: [
        { t: 'The sea is deep, so the sunlight cannot reach the bottom.', ok: false },
        { t: 'Water reflects sunlight away and sand absorbs it.', ok: false },
        { t: 'Heat going into water mostly goes into shaking hydrogen bonds loose rather than speeding molecules up — and it is the speed, not the heat, that a thermometer reads.', ok: true },
        { t: 'Sand is darker, so it takes in more of the sun’s energy.', ok: false },
      ],
      after: 'The water is absorbing plenty of energy. It just spends it on something a thermometer cannot see — pulling grips apart instead of making molecules move faster. The energy is in there; it is simply not showing up as temperature.',
      tryIt: 'In Slow, put exactly the same heat into all three boxes and watch which one refuses to warm up.',
    },
    {
      id: 'piefilling', field: 'water', sim: 'slow',
      ask: 'A hot pie comes out of the oven. The pastry you can hold. The filling takes the skin off the roof of your mouth. They have been at the same temperature for the last half hour.',
      choices: [
        { t: 'The filling is hotter than the pastry.', ok: false },
        { t: 'The watery filling holds far more heat than dry pastry does at the same temperature, so it has much more to unload into your mouth.', ok: true },
        { t: 'The filling is wet, and wet things conduct heat faster.', ok: false },
        { t: 'The pastry is on the outside, so it has had longer to cool.', ok: false },
      ],
      after: 'Temperature and heat are not the same thing, and this is where it bites. Same temperature, wildly different amount of energy stored, because water can soak up enormous quantities without its temperature moving much. Getting it back out of there is your problem.',
      tryIt: 'In Slow, heat all three boxes to the same temperature and see which one needed the most heat to get there.',
    },
    {
      id: 'coastal', field: 'water', sim: 'slow',
      ask: 'Two towns at the same latitude: one on the coast, one two hundred miles inland. The coastal one has milder winters and cooler summers, every year, without fail.',
      choices: [
        { t: 'Sea air is damper, and damp air holds on to heat better.', ok: false },
        { t: 'The coast is lower down, and low places are always warmer.', ok: false },
        { t: 'Sea water is salty, and salt keeps it from getting too cold.', ok: false },
        { t: 'The sea takes an enormous amount of heat to warm up and gives it back just as slowly, so it holds the whole coast steady against whatever the season does.', ok: true },
      ],
      after: 'An ocean is a flywheel for temperature. The same stubbornness that keeps the sea cold in June keeps it warm in December, and it is why Britain is habitable and places at the same latitude in Canada are not.',
      tryIt: 'In Slow, heat all three boxes and then cool them. Which is the last one to let go of its heat?',
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
