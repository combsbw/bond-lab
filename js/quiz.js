/* Challenges: everyday things that only chemistry explains.

   Three for every instrument, about things a learner has walked past a hundred
   times without asking — a sparkler, a snowflake, a paperclip floating, a pie
   filling that burns when the pastry does not.

   The hard part is the wrong answers, and it is worth being explicit about the
   rule they follow, because the obvious way to write them fails badly.

   If three options are folk explanations ("salt is softer", "paper is
   absorbent") and the fourth is the only one that mentions electrons, then a
   learner who knows no chemistry at all scores full marks by picking whichever
   one sounds like chemistry. They have been tested on register, not on
   understanding. So:

     1. All four options are mechanisms. Every one names real forces, real
        particles, real energies, in the same voice.
     2. Each wrong one is wrong for a reason you could put a finger on — the
        right force at the wrong scale, the right idea with the sign flipped,
        a true fact that does not answer this question, a rule that is real
        but does not apply here.
     3. No option can be picked out by being longest, or most technical, or
        most hedged. The correct answer is often the shortest.
     4. Several distractors are things working scientists once believed, or
        that textbooks still print. Those are the valuable ones.

   The only way through is to know what is actually happening. Each option
   carries a `why`, shown after answering, so a wrong pick teaches the specific
   thing that was wrong with it rather than just losing. */
(function () {
  'use strict';
  const { h } = BL;

  const BANK = [
    /* ============================================================ ATOMS */

    /* ---- Rungs ---- */
    {
      id: 'sunburn', field: 'atoms', sim: 'rungs',
      ask: 'You can sit under a bright red heat lamp all afternoon and never burn. Twenty minutes outdoors under thin cloud and you are pink. The lamp delivers far more energy per second. What is ultraviolet doing that red light cannot?',
      choices: [
        { t: 'A jump only happens if one single photon carries the whole gap. Red photons fall short of it, so no number of them adds up.', ok: true,
          why: 'Energy arrives in indivisible packets. Below the threshold nothing happens at any brightness; above it, one packet is enough.' },
        { t: 'Ultraviolet has a shorter wavelength, so more wave crests strike each molecule per second and the damage accumulates faster.', ok: false,
          why: 'Frequency is not a delivery rate. A dim UV lamp still burns and a blinding red one still does not, which rules this out.' },
        { t: 'Skin absorbs red strongly at the surface, so ultraviolet is what penetrates deep enough to reach living cells.', ok: false,
          why: 'Backwards: UV is absorbed nearer the surface than red is. Depth is not what decides it.' },
        { t: 'Several red photons arriving at once can pool their energy into one large jump, but a lamp is too dim for that to happen often.', ok: false,
          why: 'Photons do not pool at ordinary brightness. It takes laser intensities, which is why a bright lamp never catches up.' },
      ],
      after: 'Brightness counts packets. Energy per packet is a separate quantity, and it alone decides whether a jump is possible. This is the single idea that makes the whole ladder picture matter.',
      tryIt: 'In Rungs, set the photon energy low and fire as many as you like. Then raise it past the top of the ladder and fire one.',
    },
    {
      id: 'fireworks', field: 'atoms', sim: 'rungs',
      ask: 'Strontium gives red, barium gives green, sodium gives yellow. No firework maker has ever got green out of sodium, however the shell is built. What fixes each metal to its colour?',
      choices: [
        { t: 'The gaps between that element’s energy levels are fixed, and each gap emits one particular colour.', ok: true,
          why: 'The ladder is a property of the atom. Change the element and every rung moves; keep it and nothing you do outside can shift the colour.' },
        { t: 'Colour is set by flame temperature, and each metal burns at its own, with the hotter ones emitting towards the blue.', ok: false,
          why: 'That is how a glowing poker works — a smooth spread of colour. Flame tests give a few sharp lines instead, which temperature cannot produce.' },
        { t: 'Heavier atoms bind their electrons more tightly, so the light released comes out further towards the red the heavier the metal is.', ok: false,
          why: 'Barium is heavier than strontium and emits green, not deeper red. Mass does not order the colours.' },
        { t: 'The colour belongs to the compound, so strontium nitrate and strontium chloride burn with different colours.', ok: false,
          why: 'Both burn red. The compound falls apart in the heat and the bare atom does the emitting, so the colour follows the element.' },
      ],
      after: 'A set of emitted colours is a fingerprint nothing can edit. It is also how the composition of a star is known without going there: the light arrives still carrying the ladder it left.',
      tryIt: 'In Rungs, give the nucleus more charge and watch every rung move. The colours move with them.',
    },
    {
      id: 'glowstars', field: 'atoms', sim: 'rungs',
      ask: 'Glow-in-the-dark stars have to be left under a lamp first, then they glow for hours in the dark. Light cannot be stored — it travels at the speed of light. So what is being kept, and where?',
      choices: [
        { t: 'The pigment absorbs the light and re-emits it at once, but the plastic scatters it internally so it takes hours to escape.', ok: false,
          why: 'Light crosses a millimetre of plastic in picoseconds. No amount of scattering stretches that into hours.' },
        { t: 'Electrons are lifted to a level they can only leave slowly, and they trickle back down over hours, emitting as they go.', ok: true,
          why: 'What is stored is electrons parked somewhere awkward. The glow is their slow return, one at a time.' },
        { t: 'The pigment takes in energy as heat and radiates it back out as visible light while it cools.', ok: false,
          why: 'A warm object this cool emits only infrared. Glow stars are at room temperature and still visible, so heat is not the source.' },
        { t: 'The pigment reacts slowly with oxygen and the light comes from that reaction, which is why glow paint fades over the years.', ok: false,
          why: 'That is a glow stick, which needs no charging. These need light first and work sealed in plastic with no oxygen reaching them.' },
      ],
      after: 'Nothing holds light still. What a phosphor holds is an electron in a state it is reluctant to leave, and the long glow is the measure of that reluctance.',
      tryIt: 'In Rungs, lift the electron with a photon and watch it come down — sometimes in two steps rather than one.',
    },

    /* ---- Cloud ---- */
    {
      id: 'solidtable', field: 'atoms', sim: 'cloud',
      ask: 'An atom is overwhelmingly empty space — the nucleus is a speck in a vast nothing. Push your hand onto a table and it stops dead. What is it stopping against?',
      choices: [
        { t: 'The positive nuclei in the table repel the positive nuclei in your hand, and that repulsion holds the two apart.', ok: false,
          why: 'Nuclei never get near each other. The clouds meet thousands of times sooner and settle it long before.' },
        { t: 'Electrons circle so fast that they sweep out a solid shell, the way a spinning fan blade looks like a disc.', ok: false,
          why: 'There is no circling and no sweeping. An electron has no path — Cloud exists to show exactly that.' },
        { t: 'The electron clouds themselves cannot share space, so the table’s clouds and your hand’s push apart.', ok: true,
          why: 'The cloud is the atom’s real size. Every touch you have ever felt was cloud against cloud.' },
        { t: 'The table’s atoms are bonded to one another, and it is those bonds that your hand has to break to get through.', ok: false,
          why: 'Bonds hold the table together, but resting a hand on it breaks none. The resistance is there with no bonds involved — it works on loose sand too.' },
      ],
      after: '"Mostly empty space" is misleading. The space is occupied — by something with a definite size that will not share it. The nuclei of your hand and the table have never once met.',
      tryIt: 'In Cloud, pile up catches until the region fills in. That filled region is how big the atom actually is.',
    },
    {
      id: 'neonsign', field: 'atoms', sim: 'cloud',
      ask: 'A neon sign runs for years. The neon never gets used up, never attacks the glass, never forms a compound with anything. Chemists spent a century failing to make it react at all.',
      choices: [
        { t: 'Its outer clouds are all filled, and a filled set adds up to a sphere — no lobe for a neighbour to grip.', ok: true,
          why: 'Shape is the handle. Half-filled sets stick out in a direction; filled ones cancel exactly and leave nothing to grip.' },
        { t: 'Neon’s outer shell is full, so there is no space left for another atom’s electron to move into.', ok: false,
          why: 'Bonding is not an electron moving into a gap. Two full-shelled atoms could still share if there were anything to gain — there is not.' },
        { t: 'Neon’s electrons are all paired up, and paired electrons are not available for bonding.', ok: false,
          why: 'Water bonds through its lone pairs constantly. Being paired is no bar at all.' },
        { t: 'Ten protons pull neon’s clouds in so tightly that they cannot reach far enough to overlap a neighbour.', ok: false,
          why: 'Fluorine has nine protons, is barely larger, and is the most reactive element there is. Reach is not the problem.' },
      ],
      after: 'Argon, krypton and xenon are all bigger and all slightly reactive under pressure. Neon resists hardest because it combines a full, round cloud with an enormous price on its electrons.',
      tryIt: 'In Cloud, stack all three p clouds together and look at the shape they add up to.',
    },
    {
      id: 'noorbit', field: 'atoms', sim: 'cloud',
      ask: 'Every diagram shows electrons circling a nucleus like planets. No one has ever photographed that orbit, for any atom, in a century of trying.',
      choices: [
        { t: 'Measuring the electron’s position disturbs its motion, so any photograph destroys the very orbit it was trying to record.', ok: false,
          why: 'A sophisticated-sounding defence of a picture that is not there. The problem is not that measuring spoils the orbit — there is no orbit to spoil.' },
        { t: 'There is no path to photograph. Each measurement finds it somewhere, with no route in between.', ok: true,
          why: 'A cloud is a map of where it turns up, not a long-exposure photograph of something moving.' },
        { t: 'The electron is spread out as a wave, so any photograph of it comes out as a blur rather than a point.', ok: false,
          why: 'A single measurement always finds it at one point, never smeared. The blur appears only after many measurements are collected.' },
        { t: 'The orbit lies in a different plane each instant, so over any exposure the planes average into a cloud.', ok: false,
          why: 'This keeps the orbit and hides it behind averaging. The shapes that come out — lobes, rings, gaps — are not what tilted circles would give.' },
      ],
      after: '"Too fast for a camera" is the answer almost everyone gives, and the trouble with it is that it assumes there is something to catch up with. The cloud is not a smear of motion. It is where the thing is found, and its shape is what does the chemistry.',
      tryIt: 'In Cloud, take one catch. Then a hundred. Then thousands, and watch a shape arrive out of pure scatter.',
    },

    /* ---- Shells ---- */
    {
      id: 'saltsafe', field: 'atoms', sim: 'shells',
      ask: 'Sodium metal is kept under oil and detonates in water. You eat sodium every day on your chips. Same element, utterly different behaviour.',
      choices: [
        { t: 'In salt the sodium shares its outer electron with chlorine, and sharing keeps it pinned in place.', ok: false,
          why: 'Nothing is shared in salt. The electron was handed over outright — that is the difference between an ionic and a covalent bond.' },
        { t: 'In salt the sodium has already lost that electron. The metal still has it, and gives it to anything.', ok: true,
          why: 'Sodium’s entire violence is one electron it is desperate to shed. Once it is gone there is nothing left to give.' },
        { t: 'Each sodium in the crystal is surrounded by chlorines, so water cannot reach it to react.', ok: false,
          why: 'Water reaches it immediately — that is what dissolving is. The sodium is reached and does nothing, because there is nothing left to do.' },
        { t: 'The sodium is bonded in salt, and bonded atoms react far more slowly than free ones do.', ok: false,
          why: 'Bonded atoms react violently all the time; petrol is nothing but bonded atoms. Being bonded is not what makes it safe.' },
      ],
      after: 'An atom and its ion are not the same substance in a different mood. They have different numbers of electrons, and for sodium that one electron is the whole story.',
      tryIt: 'In Shells, pull sodium’s outer electron off and see how little it costs.',
    },
    {
      id: 'lithiumbattery', field: 'atoms', sim: 'shells',
      ask: 'Your phone runs on lithium. There is no neon battery and never will be, though neon is light, abundant and sits two places away on the same row.',
      choices: [
        { t: 'Lithium is a metal, so its outer electrons are already loose in the solid, and that flow of loose electrons is the current.', ok: false,
          why: 'That describes a wire, not a battery. A battery needs a reaction that hands electrons over, not a metal that merely conducts.' },
        { t: 'Lithium ions are the smallest of any metal, so they travel through the cell faster than any alternative.', ok: false,
          why: 'True, and it is why lithium cells charge fast — but a sodium cell works too. Mobility is a bonus, not the reason neon fails.' },
        { t: 'A battery runs on electrons being handed over. Lithium parts with one almost free; neon will not at any price.', ok: true,
          why: 'Everything about a cell follows from what an electron costs at each electrode. Neon’s price is simply unpayable.' },
        { t: 'Neon atoms do not bond to each other, so there is no solid neon to build an electrode out of.', ok: false,
          why: 'Solid neon exists below −249 °C. Build the electrode and it still would not work, because nothing can buy its electrons.' },
      ],
      after: 'Which elements end up in batteries is settled almost entirely by one measured number per element. Lithium is at the cheap end of it, and the whole industry is built on that.',
      tryIt: 'In Shells, measure what it costs to pull an electron off lithium. Then try neon.',
    },
    {
      id: 'nacl2', field: 'atoms', sim: 'shells',
      ask: 'Salt is always one sodium to one chlorine. Magnesium chloride is one magnesium to two chlorines. Sodium has eleven electrons, so why does it stop after giving one?',
      choices: [
        { t: 'Once sodium is Na⁺ its positive charge grips the rest harder, so the second electron costs about twice the first.', ok: false,
          why: 'The direction is right and the size is far out. The real jump is roughly tenfold, and that gap is what sets the formula.' },
        { t: 'The second electron has to come out of a filled inner shell, which costs roughly ten times the first.', ok: true,
          why: 'There is a cliff in the price list and formulas sit on its edge. Magnesium’s cliff comes one electron later, so it gives two.' },
        { t: 'Chlorine can take only one electron, because a double negative charge would repel any further ones.', ok: false,
          why: 'Two chlorine atoms could take one each. The limit is on what sodium can afford to give, not on what chlorine can accept.' },
        { t: 'Full inner shells are closed and cannot lose electrons at all, so sodium has only the one available.', ok: false,
          why: 'They can be stripped — it just costs enormously. "Impossible" and "unaffordable" lead to the same formula for different reasons.' },
      ],
      after: 'Formulas are not arbitrary. They sit exactly where the price of the next electron jumps off a cliff, and you can measure that cliff for every element.',
      tryIt: 'In Shells, take one electron off sodium, then try to take a second, and watch the price jump.',
    },

    /* ---- Fill ---- */
    {
      id: 'whyh2o', field: 'atoms', sim: 'fill',
      ask: 'Water is always two hydrogens to one oxygen. Never one, never three, in any sample anywhere. Nobody chose this.',
      choices: [
        { t: 'Oxygen is two electrons short of a full ring, so it shares a pair with each of two hydrogens.', ok: true,
          why: 'Count the gaps and the formula falls out. It predicts correctly almost every time, which is why it is taught first.' },
        { t: 'Oxygen carries a 2− charge and each hydrogen a 1+, so two hydrogens are needed to make the molecule neutral.', ok: false,
          why: 'Those are oxidation numbers — a bookkeeping device for electrons that are shared, not transferred. Nothing in water is actually ±2.' },
        { t: 'Hydrogen needs eight electrons like every other atom, and two hydrogens sharing one oxygen gets each of them there.', ok: false,
          why: 'Hydrogen needs two, not eight — its first ring holds only two. The rule of eight is not universal.' },
        { t: 'Oxygen’s two lone pairs each need a hydrogen to cap them, which fixes the count at two.', ok: false,
          why: 'Lone pairs are what is left over after bonding, not sockets waiting to be filled. They stay uncapped, and they are what makes water sticky.' },
      ],
      after: 'Counting to a full ring gets the formula right nearly every time. It is worth knowing it is a scoring system rather than a cause — nothing in nature is counting. Meet reaches the same answer from what electrons actually cost.',
      tryIt: 'In Fill, build water, then try to attach a third hydrogen and watch what the rings do.',
    },
    {
      id: 'carbonlife', field: 'atoms', sim: 'fill',
      ask: 'Every living thing is built on carbon. Nothing is built on neon, and almost nothing on boron. All three are small, ordinary atoms on the same row.',
      choices: [
        { t: 'Carbon sits mid-row, so it can give four electrons away or take four in, and that flexibility lets it bond to anything.', ok: false,
          why: 'Moving four charges costs far more than any bond returns. Carbon does neither — it shares, which is why it is so versatile.' },
        { t: 'Carbon bonds to itself more strongly than any other element does, so only carbon can form long chains.', ok: false,
          why: 'Silicon and sulfur both chain. Carbon chains are more stable, but strength is not what sets the number of bonds it makes.' },
        { t: 'Carbon is four short of a full ring, so it shares with four neighbours — enough to branch, ring and chain.', ok: true,
          why: 'Four is the smallest number that lets a skeleton branch in three dimensions and still carry groups. Three only makes sheets.' },
        { t: 'Carbon is small enough for four atoms to fit around it without crowding, which sets four as its limit.', ok: false,
          why: 'Silicon is considerably larger and also makes four. Room is not the constraint; the electron count is.' },
      ],
      after: 'Four connections is the magic number: enough to branch in every direction and still hold groups on the side. Abundance would not have helped — neon is plentiful and built nothing.',
      tryIt: 'In Fill, solve a carbon puzzle and count the sharing partners. It is four, every time.',
    },
    {
      id: 'nitrogenbreath', field: 'atoms', sim: 'fill',
      ask: 'Four of every five breaths is nitrogen, in and straight back out, unchanged, your whole life. Your body needs nitrogen — every protein contains it — and cannot touch a molecule of this.',
      choices: [
        { t: 'Nitrogen molecules are non-polar, so the polar molecules in your blood cannot attract them and they are breathed back out.', ok: false,
          why: 'True, and it is why nitrogen barely dissolves — but dissolving is not reacting. Oxygen is non-polar too and your body uses it constantly.' },
        { t: 'In N₂ both atoms have full outer shells, so the molecule has no electrons available to react with.', ok: false,
          why: 'Every stable molecule has full shells; that is what makes it a molecule. N₂ does react, given enough energy — lightning does it nightly.' },
        { t: 'The two atoms share three pairs of electrons, and prising that apart costs more than your chemistry can supply.', ok: true,
          why: 'A triple bond is the strongest in common chemistry. The barrier is the price, not availability.' },
        { t: 'Each nitrogen carries a lone pair pointing outwards that shields the bond from anything approaching it.', ok: false,
          why: 'Those lone pairs are exposed, not protective — they are exactly where a catalyst grabs N₂ to break it.' },
      ],
      after: 'You are swimming in the nitrogen you need and cannot reach it. Bacteria can, barely, and the entire food chain depends on them doing it. One very strong bond stands between an ocean of free nitrogen and everything that eats.',
      tryIt: 'In Fill, make two atoms share three pairs and see how much has to line up for it to work.',
    },

    /* ========================================================== BONDING */

    /* ---- The Spectrum ---- */
    {
      id: 'saltsand', field: 'bonding', sim: 'spectrum',
      ask: 'Salt vanishes into a glass of water in seconds. Sand sits in the bottom forever. Ground to the same powder, both are hard, dry, colourless crystals.',
      choices: [
        { t: 'Water dissolves by hydrogen bonding to things. Salt’s ions accept hydrogen bonds; the atoms in sand cannot.', ok: false,
          why: 'Water holds ions by ion–dipole, a different and stronger thing. Sand’s surface does form hydrogen bonds — it just stays a network underneath.' },
        { t: 'Sand is held by charges too, but silicon’s charge is so much larger that water cannot overcome the pull.', ok: false,
          why: 'Sand is not ionic. Silicon and oxygen share their electrons in a continuous covalent network, which is a different problem entirely.' },
        { t: 'Water’s charged ends surround each ion, paying for the lattice. Sand’s shared bonds offer water nothing.', ok: true,
          why: 'Dissolving is an energy trade: what water gains surrounding the pieces against what the solid costs to take apart.' },
        { t: 'Salt’s ions already carry full charges, so they drift apart as soon as they are wetted; sand’s atoms are neutral and stay put.', ok: false,
          why: 'Those charges are precisely what holds the crystal together — salt melts at 801 °C. Nothing drifts apart on its own.' },
      ],
      after: 'Dissolving is not force. It is water making each piece a better offer than it was already getting. Salt’s ions can take the offer; a covalent network has nothing to trade.',
      tryIt: 'In The Spectrum, slide to the ionic end and park an ion beside a molecule with strong ends.',
    },
    {
      id: 'oilwater', field: 'bonding', sim: 'spectrum',
      ask: 'Oil in water separates within a minute of stopping stirring. Alcohol, which is also lighter than water, mixes completely and never comes back out.',
      choices: [
        { t: 'Oil is non-polar and water polar, and the mismatch between them produces a repulsion that drives the two apart.', ok: false,
          why: 'Nothing repels. Oil and water do attract — just far more weakly than water attracts water, and that difference is the whole effect.' },
        { t: 'Oil molecules are much larger, so water cannot surround them well enough to carry them into solution.', ok: false,
          why: 'Sugar and proteins are far larger than oil molecules and dissolve readily. Ends matter, size does not.' },
        { t: 'Water’s hydrogen-bonded network acts as a sieve too fine for oil molecules to pass through, so they are filtered out.', ok: false,
          why: 'The network is not a barrier and is reorganising constantly. Oil is excluded because water gains more by bonding to itself, not by being strained out.' },
        { t: 'Oil has almost no charged ends, so water gains more by holding its own δ+ and δ− than by making room for it.', ok: true,
          why: 'Alcohol is lighter than water too and mixes perfectly, because it brings an −OH to the trade. Density has nothing to do with it.' },
      ],
      after: 'Oil really is lighter and really does end up on top. That is not why it refuses to mix — alcohol is lighter too. The separation is water choosing itself.',
      tryIt: 'In The Spectrum, slide to the even end and try to get a neighbour to hold on at all.',
    },
    {
      id: 'gluetape', field: 'bonding', sim: 'spectrum',
      ask: 'Superglue bonds your fingers in seconds and will not let go. Sticky tape holds a poster for a year and peels away clean. Both stick on contact.',
      choices: [
        { t: 'Superglue is polar and hydrogen bonds to the moisture on skin, where tape is non-polar and cannot.', ok: false,
          why: 'Moisture is genuinely involved — it triggers the setting — but what forms afterwards is a covalent polymer, not hydrogen bonds.' },
        { t: 'Superglue forms shared-electron bonds with the surface; tape has only dispersion between clouds in contact.', ok: true,
          why: 'Different rungs of the ladder entirely: one is a bond inside a molecule, the other the weakest hold between them.' },
        { t: 'Superglue sets into a rigid solid while tape’s adhesive stays soft, and rigid materials grip harder than soft ones.', ok: false,
          why: 'Soft is better for contact, not worse — it is why tape works at all. Hardness is a result of the bonding, not the cause of the grip.' },
        { t: 'Superglue’s molecules are far longer, so much more surface is in contact and far more dispersion holds it.', ok: false,
          why: 'That is the mechanism for tape, borrowed. Superglue is not winning by having more of a weak force; it is using a different one.' },
      ],
      after: 'They are not the same stickiness at two strengths. One makes bonds with your skin; the other leans on the faintest hold in chemistry and gets away with it because the contact area is enormous.',
      tryIt: 'In The Spectrum, compare where a covalent bond sits on the ladder and where van der Waals sits.',
    },

    /* ---- Meet ---- */
    {
      id: 'metalnonmetal', field: 'bonding', sim: 'meet',
      ask: 'Sodium and chlorine make salt. Magnesium and oxygen make a white powder. Sodium with magnesium makes nothing in particular, and neither does oxygen with chlorine.',
      choices: [
        { t: 'Two metals cannot bond because both would end up positive, and two positive ions repel one another.', ok: false,
          why: 'Metals alloy freely — brass and steel are two metals bonded. Neither becomes an ion; they pool their electrons instead.' },
        { t: 'A handover pays only when one side lets go cheaply and the other gains. Two givers have nobody to give to.', ok: true,
          why: 'The metal-and-non-metal rule arrives from the prices rather than from the table’s layout.' },
        { t: 'Two non-metals have nearly full shells already, so neither has spare electrons to contribute to a bond.', ok: false,
          why: 'Two non-metals bond constantly — O₂, CO₂, every molecule in you. They share rather than hand over.' },
        { t: 'Elements bond with their opposites, and metals and non-metals sit on opposite sides of the periodic table.', ok: false,
          why: 'That restates where the answer appears on a chart instead of saying what happens. It also predicts nothing for two elements near the middle.' },
      ],
      after: 'Nobody has to remember which side of the table is which. Line the elements up by what an electron costs them and the rule falls out of the prices, with the awkward middle cases included.',
      tryIt: 'In Meet, take one element from each end of the givers-and-takers map, then two from the same end.',
    },
    {
      id: 'sparkler', field: 'bonding', sim: 'meet',
      ask: 'A sparkler flares white-hot. The argon sealed in a double-glazed window does nothing for thirty years. Both are metal-or-gas atoms meeting ordinary air.',
      choices: [
        { t: 'Magnesium has two outer electrons and oxygen needs two, so they match exactly; argon’s shell is full and matches nothing.', ok: false,
          why: 'The counts do line up, but matching is a description of the result. Calcium matches oxygen too and reacts far more gently — the prices differ.' },
        { t: 'Argon’s atoms are larger, so its outer electrons sit further from the nucleus and are harder to draw into a reaction.', ok: false,
          why: 'Further out normally means easier to remove, not harder. Argon’s electrons are expensive despite its size, not because of it.' },
        { t: 'Magnesium is a reactive metal and argon a noble gas; reactivity follows from which group an element belongs to.', ok: false,
          why: 'The group is where we filed it after observing this. It names the pattern without saying what produces it.' },
        { t: 'Magnesium’s two outer electrons are cheap to give and oxygen repays far more than they cost. Argon’s cannot be bought.', ok: true,
          why: 'The flare is the payback made visible — the energy released when a handover turns out to be a very good deal.' },
      ],
      after: 'The brightness of that flame is the size of the bargain. Argon is offered the same deal every second of those thirty years and it is simply not worth taking.',
      tryIt: 'In Meet, put magnesium with oxygen and watch it move two electrons at once.',
    },
    {
      id: 'whichway', field: 'bonding', sim: 'meet',
      ask: 'In every salt it is the sodium that goes positive and the chlorine negative. Never once the other way round. What fixes the direction?',
      choices: [
        { t: 'Chlorine has seven outer electrons and needs one more, so it takes one from whatever atom is nearest.', ok: false,
          why: 'Then chlorine would strip fluorine, which it never does. Needing one explains nothing about where it comes from.' },
        { t: 'Sodium’s nucleus holds fewer protons, so it grips its electrons more loosely and loses them to any atom with more.', ok: false,
          why: 'Hydrogen has one proton and does not surrender to helium with two. Proton count alone does not order them.' },
        { t: 'Taking an electron off sodium is cheap and chlorine gains by receiving it. Reversed, the cost swamps the payback.', ok: true,
          why: 'Two measured prices, and you can run the sum in either direction and watch one of them come out hopeless.' },
        { t: 'Metals conduct because their electrons are loose, and that same looseness is what makes sodium give one to chlorine.', ok: false,
          why: 'Conduction is electrons moving within the metal, which they do without ever leaving it. A different process from handing one to another element.' },
      ],
      after: '"Metals go positive" describes the answer rather than causing it. Underneath are two numbers you can look up, and they also handle the pairs where the simple rule fails.',
      tryIt: 'In Meet, put sodium with chlorine, then try dragging the electron the other way.',
    },

    /* ---- Tug ---- */
    {
      id: 'microwave', field: 'bonding', sim: 'tug',
      ask: 'Two minutes in the microwave: the soup is scalding and the ceramic bowl is barely warm. Both sat in the same box for the same time.',
      choices: [
        { t: 'The microwave’s frequency matches water’s natural vibration frequency, so water resonates and absorbs the energy.', ok: false,
          why: 'The most repeated explanation there is, and false. Ovens are deliberately tuned away from any resonance — otherwise the outside would cook and the middle stay raw.' },
        { t: 'Water absorbs because its O–H bonds stretch at that frequency; ceramic’s bonds are too stiff to be driven.', ok: false,
          why: 'O–H stretching happens in the infrared, thousands of times higher in frequency. Microwaves are nowhere near it.' },
        { t: 'Microwaves break the hydrogen bonds between water molecules, and the heat appears as those bonds re-form.', ok: false,
          why: 'Breaking and re-forming returns the same energy it took. Nothing is gained around a loop like that.' },
        { t: 'The field reverses billions of times a second and wrenches lopsided molecules round. That churning is heat.', ok: true,
          why: 'Water has a δ+ end and a δ− end for the field to grab. Ceramic has no ends, so there is nothing to twist.' },
      ],
      after: 'The resonance story is so widespread it is worth knowing why it cannot be right: resonant absorption would be so efficient that everything would cook in a thin skin at the surface. The real answer is cruder and more interesting — a lopsided molecule shoved back and forth, and shoving is what heat is.',
      tryIt: 'In Tug, build a bond with strong δ+ and δ− ends, then move the charge probe and watch the molecule swing to follow.',
    },
    {
      id: 'waterstream', field: 'bonding', sim: 'tug',
      ask: 'Run a thin stream from the tap, rub a comb on your sleeve and hold it near. The whole stream bends towards the comb and never touches it.',
      choices: [
        { t: 'Water molecules already have δ+ and δ− ends. The comb turns them, then pulls hardest on the near end.', ok: true,
          why: 'It works with pure distilled water, which has no ions to move — so it has to be the molecules themselves turning.' },
        { t: 'Charge flows from the comb onto the stream, and the charged water is then drawn to the oppositely charged comb.', ok: false,
          why: 'If the water took charge from the comb they would share a sign and repel. Catch the water afterwards and it is uncharged.' },
        { t: 'Water conducts, so the comb’s field drives dissolved ions to the far side and the near side is left attracted.', ok: false,
          why: 'Tap water does carry ions, but distilled water bends just as well. The permanent dipoles do it without any ions present.' },
        { t: 'The comb’s field weakens surface tension on the near side, and the stream curves towards the weaker side.', ok: false,
          why: 'Surface tension pulls a stream into drops, not sideways. Nothing in it would steer the column towards an object.' },
      ],
      after: 'The water never becomes charged. It did not need to — the ends were built into the shape of the molecule before the comb arrived. All the comb does is line them up and then pull on the closer one.',
      tryIt: 'In Tug, switch on the charge probe and bring it near a bond that already leans.',
    },
    {
      id: 'combpaper', field: 'bonding', sim: 'tug',
      ask: 'The same comb picks up scraps of paper. The paper has been rubbed on nothing and carries no charge at all.',
      choices: [
        { t: 'The comb ionises the thin layer of air between them, and the ions carry the paper across the gap.', ok: false,
          why: 'Ionising air takes thousands of volts per millimetre and makes a visible spark. A comb manages neither.' },
        { t: 'Paper holds water, and those polar molecules line up with the field and drag the scrap along.', ok: false,
          why: 'Genuinely tempting, since paper is damp — but the trick works on oven-dried paper and on plastic foam with no water in it.' },
        { t: 'The paper collects a little charge from the comb on contact and is attracted to it from then on.', ok: false,
          why: 'Contact charging would leave both the same sign, and the scrap would be flung off. Many do jump away after touching — that is this effect, afterwards.' },
        { t: 'The field pushes the paper’s clouds to the far side, leaving the near side slightly opposite.', ok: true,
          why: 'A lean created from nothing, in something neutral. Remove the comb and the paper has no ends again.' },
      ],
      after: 'A charge can manufacture a lean in something that had none, simply by being nearby. That borrowed lean sticks a balloon to a wall and lets a gecko hold on to glass.',
      tryIt: 'In Tug, make the sharing perfectly even, then bring the probe close and watch the cloud lean anyway.',
    },

    /* ---- The Well ---- */
    {
      id: 'boilsplit', field: 'bonding', sim: 'well',
      ask: 'A kettle boils dry in minutes. Splitting the same water into hydrogen and oxygen needs a current for hours. Both are described as breaking water apart.',
      choices: [
        { t: 'Boiling overcomes the hydrogen bonds; splitting has to overcome those and the covalent bonds too, so it costs about twice as much.', ok: false,
          why: 'Right ingredients, wrong scale. The covalent bonds are not an extra helping — they are fifteen times deeper, and that gap is the point.' },
        { t: 'Heat spreads energy among all the molecules so none gets enough to break a bond; a current delivers it to one at a time.', ok: false,
          why: 'Heat does give some molecules far more than average, which is how thermal decomposition works. Water needs about 2000 °C — just not reachable in a kettle.' },
        { t: 'Boiling separates whole molecules from each other. Splitting breaks the bonds inside them, which are far deeper.', ok: true,
          why: 'Steam is still H₂O. Every molecule comes through boiling intact, which is the whole difference between a state change and a reaction.' },
        { t: 'Boiling is a physical change and splitting a chemical one, and chemical changes always demand more energy.', ok: false,
          why: 'Not always — some reactions run at room temperature while melting iron does not. The classification follows the energies rather than setting them.' },
      ],
      after: 'On the ladder this is the distance between the bottom rungs and the top. Boiling costs about 41 kJ per mole; splitting costs about 480 per bond.',
      tryIt: 'In The Well, break a hydrogen bond with heat, then try to break a covalent one the same way.',
    },
    {
      id: 'steamburn', field: 'bonding', sim: 'well',
      ask: 'Steam scalds far worse than boiling water. Put a thermometer in each and both read 100 °C.',
      choices: [
        { t: 'Steam conducts heat into skin much better than liquid water, so the same energy arrives far faster.', ok: false,
          why: 'Backwards — steam conducts about twenty times worse. Still air is an insulator, which is how a duvet works.' },
        { t: 'Steam’s molecules are further apart, so each carries more energy and delivers more of it on impact.', ok: false,
          why: 'At the same temperature a molecule has the same average energy in both. Spacing changes the density, not the energy each one holds.' },
        { t: 'Condensing returns every bit of energy that separating the molecules cost, straight into your skin.', ok: true,
          why: 'Steam arrives carrying a loaded spring that water does not, and it releases it on the first cold thing it meets.' },
        { t: 'Steam is at higher energy but the same temperature, because its molecules move faster without a thermometer registering it.', ok: false,
          why: 'Half right: higher energy, same temperature. But a thermometer reads exactly that molecular speed, so it cannot be hidden from it.' },
      ],
      after: 'Pulling molecules apart costs energy and the bill is repaid in full the instant they fall back together. About 2260 kJ per kilogram — more than five times what heating the water from freezing to boiling took.',
      tryIt: 'In The Well, see how much heat it takes to pull a pair apart. All of it comes back when they snap together.',
    },
    {
      id: 'buttersalt', field: 'bonding', sim: 'well',
      ask: 'Butter melts in a warm pan in seconds. Salt in the same pan on full heat all afternoon is still grains.',
      choices: [
        { t: 'Salt is held in a lattice, and a lattice has to come apart all at once rather than molecule by molecule.', ok: false,
          why: 'Lattices melt from the surface inwards like anything else. Being a lattice is not what makes it hard, the depth of the pull is.' },
        { t: 'Butter is a mixture and softens over a range; salt is pure and melts sharply, at a point the hob never reaches.', ok: false,
          why: 'Both halves are true and neither answers it. Pure water melts sharply at 0 °C — sharpness says nothing about how high.' },
        { t: 'Melting butter shakes whole molecules loose. Melting salt fights full charges through the crystal.', ok: true,
          why: 'Melting point reads out how deep the hold is, which is why it tells you what kind of hold a substance uses before anything else does.' },
        { t: 'Salt’s ionic bonds are stronger than butter’s covalent bonds, so far more heat is needed to break them.', ok: false,
          why: 'Butter’s covalent bonds are not what melt — they survive melting completely. The comparison is with the weak holds between its molecules.' },
      ],
      after: 'Salt melts at 801 °C — glowing red heat. The number is a direct readout of what holds it, and that is why a table of melting points tells you the bonding before you know anything else.',
      tryIt: 'In The Well, set the heat to about a kitchen hob and see which holds let go and which do not budge.',
    },

    /* ---- Handshake ---- */
    {
      id: 'sanitiser', field: 'bonding', sim: 'handshake',
      ask: 'Hand sanitiser is gone in fifteen seconds. The same puddle of water takes minutes. Both are clear liquids at room temperature.',
      choices: [
        { t: 'Alcohol molecules are smaller and lighter, so they reach escape speed at the surface more readily.', ok: false,
          why: 'Ethanol is 46 units to water’s 18 — two and a half times heavier. It evaporates faster while being the heavier molecule.' },
        { t: 'Alcohol has a lower surface tension, so molecules at the surface are held back less and leave sooner.', ok: false,
          why: 'Lower surface tension is another consequence of the weaker grip, not its cause. Both follow from the same thing.' },
        { t: 'Each water molecule grips neighbours at several points; alcohol has one such point and a greasy tail.', ok: true,
          why: 'Water offers two hydrogens and two lone pairs — four grips. Ethanol offers one −OH and a hydrocarbon tail that offers nothing.' },
        { t: 'Alcohol’s O–H bond is less polar than water’s, so the hydrogen bonds it forms are individually weaker.', ok: false,
          why: 'The two −OH groups are very nearly as polar as each other. It is how many grips there are, not how good each one is.' },
      ],
      after: 'Evaporation rate is a direct readout of how firmly molecules hold each other. The cold feeling is the other half of the same fact: the fastest leave, and what stays behind is slower.',
      tryIt: 'In Handshake, heat a crowd with strong hands and one with weak hands side by side.',
    },
    {
      id: 'snowflake', field: 'bonding', sim: 'handshake',
      ask: 'Every snowflake has six sides. Not five, not eight, regardless of where it formed or what it formed around.',
      choices: [
        { t: 'A hydrogen bond grips only when a hydrogen points at a lone pair, and one pattern satisfies them all.', ok: true,
          why: 'Billions of molecules each insisting on the same direction leaves exactly one pattern, and it is visible from across the room.' },
        { t: 'Water’s bond angle is about 105°, and the nearest regular shape that tiles the plane from that angle is a hexagon.', ok: false,
          why: 'Uses the right number and the wrong reasoning. 105° tiles nothing; the hexagon comes from the tetrahedral directions of the lone pairs.' },
        { t: 'Ice grows fastest along six directions, because those are the ones where molecules pack most tightly.', ok: false,
          why: 'Ice is the loosest packing water has — that is why it floats. The six directions are the open ones, not the tight ones.' },
        { t: 'Oxygen carries six outer electrons, and the crystal inherits its six-fold symmetry from that count.', ok: false,
          why: 'Counting electrons does not set a crystal’s symmetry. Sulfur also has six and its crystals are nothing like this.' },
      ],
      after: 'A hydrogen bond is fussy about direction in a way ordinary stickiness is not. That fussiness, repeated through a crystal, is what puts a shape you can see on your sleeve.',
      tryIt: 'In Handshake, turn one molecule slowly and watch the grip appear only at certain angles.',
    },
    {
      id: 'methaneboil', field: 'bonding', sim: 'handshake',
      ask: 'Water boils at 100 °C. Methane is almost the same size and weight and is still a gas at −160 °C. By size alone, water should boil near −80 °C.',
      choices: [
        { t: 'Water’s O–H bonds are much stronger than methane’s C–H bonds, so more energy is needed to boil it.', ok: false,
          why: 'The classic error: boiling breaks no bonds inside a molecule. Steam is still H₂O, with every O–H intact.' },
        { t: 'Methane’s four bonds point evenly outwards making it a smooth sphere, and spheres slide past each other easily.', ok: false,
          why: 'Shape affects packing a little, but neon is a perfect sphere and still condenses. The missing ingredient is charged ends, not roundness.' },
        { t: 'Water’s molecules grip each other with hydrogen bonds; methane has no charged ends, leaving only dispersion.', ok: true,
          why: 'Water boils 180 degrees above where its size says it should, and that whole excess is hydrogen bonding.' },
        { t: 'Water is heavier than methane, and heavier molecules need more energy to leave the surface of a liquid.', ok: false,
          why: '18 against 16 — all but identical. The weight trend is real but far too small to explain a 260-degree difference.' },
      ],
      after: 'That 180-degree excess is why there are oceans instead of an atmosphere of steam. Remove hydrogen bonding and water boils below the temperature of a freezer.',
      tryIt: 'In Handshake, cool a crowd with hands and one with none to the same temperature.',
    },

    /* ---- Flicker ---- */
    {
      id: 'gecko', field: 'bonding', sim: 'flicker',
      ask: 'A gecko runs up a pane of glass and across the ceiling. Its feet are dry, leave no residue, and work on glass polished to optical flatness.',
      choices: [
        { t: 'The hairs trap microscopic pockets of air, and the pressure difference holds the foot against the surface.', ok: false,
          why: 'Suction needs a pressure difference, and geckos hold on perfectly in a vacuum chamber where there is none.' },
        { t: 'Millions of fine hairs press close enough for dispersion between electron clouds to take hold.', ok: true,
          why: 'Each contact is negligible and there are around a billion of them. The weakest force in chemistry, scaled up by number.' },
        { t: 'The hairs are polar and form hydrogen bonds with the oxygen atoms at the glass surface.', ok: false,
          why: 'Reasonable, since glass surfaces do hydrogen bond — but geckos grip Teflon and graphite just as well, and neither offers any.' },
        { t: 'At the scale of the hairs, friction against the surface is enough to carry the animal’s weight.', ok: false,
          why: 'Friction needs something pressing the surfaces together. On a ceiling the only thing pressing is gravity, pulling the wrong way.' },
      ],
      after: 'The vacuum-chamber experiment is what settled it. Suction and friction both fail there and the gecko does not, which leaves the faintest hold in this lab carrying an entire animal up a window.',
      tryIt: 'In Flicker, push two atoms close together and watch how sharply the pull grows as they nearly touch.',
    },
    {
      id: 'oilwax', field: 'bonding', sim: 'flicker',
      ask: 'Cooking oil pours. Candle wax is a solid you could hit with a hammer. Both are chains of carbon and hydrogen with no charged ends anywhere on them.',
      choices: [
        { t: 'Wax molecules are heavier, and heavier molecules move more sluggishly and settle into a solid sooner.', ok: false,
          why: 'Weight comes along with length here, so the two are hard to separate — but mercury atoms are far heavier than wax molecules and mercury is liquid.' },
        { t: 'Wax’s chains are far longer, so much more cloud lies against the neighbour and the dispersion adds along it.', ok: true,
          why: 'Same force, more of it. The family runs gas, petrol, oil, wax, as the chains lengthen and nothing else changes.' },
        { t: 'Wax molecules are branched and tangle together, while oil’s are straight and slide past one another.', ok: false,
          why: 'The reverse: waxes are straight chains that stack neatly, and it is oils that carry kinks stopping them packing.' },
        { t: 'Oil’s chains contain double bonds, and double bonds are weaker, so the molecules hold each other less firmly.', ok: false,
          why: 'Oils do contain double bonds and a double bond is stronger, not weaker. What it does is bend the chain so the molecules cannot stack.' },
      ],
      after: 'Nothing about the kind of force changes across that whole family. Only the amount of molecule in contact changes, and it is enough to take you from a gas to something you can carve.',
      tryIt: 'In Flicker, put the smallest atom and the biggest at the same distance and compare.',
    },
    {
      id: 'airpuddle', field: 'bonding', sim: 'flicker',
      ask: 'The molecules in this room attract one another — every molecule attracts every other. So why has the air not long since pooled on the floor?',
      choices: [
        { t: 'Nitrogen and oxygen are non-polar, and non-polar molecules have no attraction between them to pool with.', ok: false,
          why: 'They do attract, which is exactly why liquid nitrogen exists. "Non-polar" means no permanent ends, not no attraction.' },
        { t: 'Gas molecules are nearly always too far apart for dispersion, which only works while they are touching.', ok: false,
          why: 'Dispersion is short-ranged, but air molecules collide billions of times a second. They are not failing to meet.' },
        { t: 'They are small, with little cloud to slosh, so dispersion is far too weak at room temperature.', ok: true,
          why: 'Chill them to −196 °C and the same attraction wins. It is a contest between a fixed pull and the energy of the jostling.' },
        { t: 'The molecules are in constant motion, and objects moving past one another cannot be held together by attraction.', ok: false,
          why: 'Motion and attraction coexist everywhere — planets orbit, liquids flow. It is the amount of motion against the depth of the hold.' },
      ],
      after: 'The attraction never goes away. Cool the air enough and it does puddle, which is how liquid nitrogen is made. At room temperature the molecules simply carry far more energy than that faint hold can contain.',
      tryIt: 'In Flicker, cool a crowd of atoms and find the temperature where they finally cling.',
    },

    /* ============================================================ WATER */

    /* ---- The Molecule ---- */
    {
      id: 'co2water', field: 'water', sim: 'h2o',
      ask: 'Carbon dioxide and water are both small molecules where oxygen pulls the shared electrons hard. One is a gas you breathe out. The other you are mostly made of. Carbon dioxide is the heavier of the two.',
      choices: [
        { t: 'Carbon dioxide is straight, so its two bond leans point opposite and cancel. Water is bent, so they add.', ok: true,
          why: 'Lopsided bonds are not enough on their own — the shape has to stop them cancelling.' },
        { t: 'Carbon dioxide has no hydrogen, so it cannot hydrogen bond, and hydrogen bonding is what makes a substance liquid.', ok: false,
          why: 'Bromine and olive oil are liquids with no hydrogen bonds anywhere. Hydrogen bonding raises a boiling point; it is not required for one.' },
        { t: 'Its double bonds hold the electrons tightly in the middle of the molecule, leaving the ends with no charge.', ok: false,
          why: 'The oxygens are strongly δ− — each C=O is markedly polar. The charge is there; it is the symmetry that wastes it.' },
        { t: 'Carbon dioxide’s bonds are less polar than water’s, so there is less lean to be cancelled in the first place.', ok: false,
          why: 'C=O is about as polar as O–H. Two strong leans pointing opposite ways still add to nothing.' },
      ],
      after: 'Bend carbon dioxide and it would be a liquid. Straighten water and the oceans would be steam. Sulfur dioxide is bent, and it is a liquid under mild pressure while carbon dioxide is not.',
      tryIt: 'In The Molecule, straighten water out and watch its pull collapse. Then bend it back.',
    },
    {
      id: 'universal', field: 'water', sim: 'h2o',
      ask: 'Blood, sap, tears, the inside of every cell — life runs its chemistry dissolved in water and nothing else.',
      choices: [
        { t: 'Water molecules are small, so they work into the gaps between other molecules and prise them apart.', ok: false,
          why: 'Hydrogen fluoride and ammonia are smaller still and dissolve far less. Getting in between is not the difficulty.' },
        { t: 'Water is neither acid nor alkali, so it dissolves things without reacting with them and changing them.', ok: false,
          why: 'True and beside the point — hexane is neutral too and dissolves almost nothing that matters to a cell.' },
        { t: 'Water’s very high surface tension lets it draw other molecules into itself.', ok: false,
          why: 'Surface tension is water’s grip on itself, which works against taking anything else in. It is an obstacle, not the means.' },
        { t: 'The bend leaves it with a δ− side and a δ+ side, so it can take hold of ions and of charged ends.', ok: true,
          why: 'Both sides matter: the δ− oxygen grips positive ions and the δ+ hydrogens grip negative ones. One molecule handles both.' },
      ],
      after: 'Abundance would not have helped without the grip. Carbon dioxide is plentiful too and dissolves almost nothing. The usefulness comes from two charged sides, and those come from the bend.',
      tryIt: 'In The Molecule, turn the lopsidedness down to nothing and ask what is left to dissolve with.',
    },
    {
      id: 'dressing', field: 'water', sim: 'h2o',
      ask: 'Salad dressing separates within minutes. Vinegar is mostly water and mixes with water perfectly; olive oil never does, however long you shake it.',
      choices: [
        { t: 'Vinegar is acidic, and the H⁺ ions it releases are what let it mix; oil releases no ions at all.', ok: false,
          why: 'Ethanol releases no ions and mixes with water completely. It is the −OH group doing it, not the acidity.' },
        { t: 'Oil and water have different densities, and liquids of different densities cannot form a single phase.', ok: false,
          why: 'Ethanol is noticeably less dense than water and mixes in any proportion. Density decides which ends up on top, not whether they mix.' },
        { t: 'Vinegar’s molecules carry charged ends like water’s, so the two trade grips. Oil’s have none.', ok: true,
          why: 'Whether two liquids mix is a question about ends. Honey is far thicker than oil and dissolves instantly, being covered in them.' },
        { t: 'Oil molecules are much larger than vinegar’s, and water can only carry small molecules into solution.', ok: false,
          why: 'Sugars and proteins dwarf an oil molecule and dissolve readily. Size is not the barrier; absent charged ends are.' },
      ],
      after: 'Thickness, weight and size all sound like they should matter and none of them does. What matters is whether the molecule brings anything to a trade that water values more than its own company.',
      tryIt: 'In The Molecule, turn the lopsidedness down and watch the second molecule lose its grip.',
    },

    /* ---- Cling ---- */
    {
      id: 'waxedcar', field: 'water', sim: 'cling',
      ask: 'Rain stands in beads on a freshly waxed car and runs off in a sheet on the one parked next to it. Same rain, same afternoon.',
      choices: [
        { t: 'Wax is non-polar and water polar, and that mismatch produces a repulsion that pushes the drop up into a bead.', ok: false,
          why: 'Wax does attract water — just weakly. There is no repulsion anywhere; the drop beads because water attracts water more.' },
        { t: 'Wax fills in the microscopic pits in the paint, leaving far less surface area for the water to touch.', ok: false,
          why: 'Roughness does matter, and it usually makes beading stronger, not weaker. Wax beads water even when polished mirror-smooth.' },
        { t: 'Wax is hydrophobic, so by its nature it drives water away from its surface.', ok: false,
          why: '"Hydrophobic" is the name for this behaviour, not an explanation of it. It says what happens and stops there.' },
        { t: 'It is a contest between water’s grip on the surface and on itself, and wax loses it.', ok: true,
          why: 'Both surfaces attract water. Paint attracts it more than water attracts water; wax attracts it less. That is the whole difference.' },
      ],
      after: 'Nothing repels anything. Everything from a raincoat to a non-stick pan to the lining of your lungs is somebody deciding which way that contest should go.',
      tryIt: 'In Cling, keep the surface as it is and change only how tightly the water grips itself.',
    },
    {
      id: 'meniscus', field: 'water', sim: 'cling',
      ask: 'Water in a glass curves up where it meets the side. Mercury in a glass tube curves down. Both are still liquids in glass.',
      choices: [
        { t: 'Water grips glass more than itself, so the edge climbs. Mercury grips itself more, so it sags.', ok: true,
          why: 'The same contest as the waxed car, seen edge on — and the direction of the curve tells you at a glance which side is winning.' },
        { t: 'Mercury is far denser, so gravity drags its edges down where it cannot do the same to water.', ok: false,
          why: 'Gravity acts on the whole liquid, not just its rim. Mercury curves down in a tube so narrow that its weight is negligible.' },
        { t: 'Glass is slightly polar and attracts water’s dipoles; mercury has no dipoles, so nothing draws it to the glass.', ok: false,
          why: 'Mercury has no dipole and is still attracted to glass — just less than to itself. It also wets copper readily, with no dipole involved.' },
        { t: 'Air pressure bears on the surface, and the curve forms in whichever direction the denser liquid allows.', ok: false,
          why: 'Air pressure presses equally everywhere, including down the glass wall. It cannot pick out an edge or a direction.' },
      ],
      after: 'Which way a liquid curves at a wall is a direct readout of which grip is stronger, and it is why you are taught to read a measuring cylinder at the bottom of the curve for water and the top for mercury.',
      tryIt: 'In Cling, turn the surface’s grab right down and watch the drop’s edge tip past upright.',
    },
    {
      id: 'ducksback', field: 'water', sim: 'cling',
      ask: 'A duck swims all day and climbs out dry. A duck that cannot reach its preen gland gets waterlogged and can drown.',
      choices: [
        { t: 'Feather barbs interlock into a mesh too fine for water molecules to fit between.', ok: false,
          why: 'A water molecule is about a ten-thousandth the width of those gaps. The structure matters, but not by being too fine to enter.' },
        { t: 'Preen oil is less dense than water and floats on it, lifting the drops clear of the feather.', ok: false,
          why: 'The oil is bound to the feather, not floating free. And a film of oil on a feather is not buoyant enough to lift anything.' },
        { t: 'Feathers carry a slight negative charge that repels the δ− oxygen end of each water molecule.', ok: false,
          why: 'A molecule with two ends would simply turn its δ+ hydrogens towards the charge and be attracted instead.' },
        { t: 'Preen oil leaves a surface water barely grips, so it holds itself together and rolls off.', ok: true,
          why: 'The detail that settles it: take the oil away and the same feathers soak through. The surface chemistry, not the structure, is doing it.' },
      ],
      after: 'This is exactly why spilled oil is lethal to seabirds. It wrecks the surface that was keeping the water out, and the bird becomes waterlogged and chilled in its own feathers.',
      tryIt: 'In Cling, set the surface to wax and tilt it until the drop slides off.',
    },

    /* ---- Skin ---- */
    {
      id: 'paperclip', field: 'water', sim: 'skin',
      ask: 'A steel paperclip laid gently on still water sits there. Steel is eight times denser than water. Touch the surface with washing-up liquid and it drops instantly.',
      choices: [
        { t: 'Surface molecules pack more tightly than those below, forming a denser layer the clip can rest on.', ok: false,
          why: 'The surface layer is slightly less tightly packed, not more. Density at the top is not what is holding it.' },
        { t: 'The clip displaces its own weight in water and floats, as anything less dense than water does.', ok: false,
          why: 'Steel is eight times denser — it cannot displace its weight. Press it through and it sinks straight away, exactly as density says.' },
        { t: 'Surface molecules are pulled inward by neighbours below but not above, and soap weakens that pull.', ok: true,
          why: 'It is not floating, it is being held on a skin. Soap does not sink the clip by weighing it down; it removes what was holding it.' },
        { t: 'Hydrogen bonds form a continuous sheet across the surface, and soap molecules break those bonds chemically.', ok: false,
          why: 'Soap reacts with nothing — rinse it away and the surface recovers completely. It gets between the molecules, it does not break anything.' },
      ],
      after: 'The giveaway is how fast the soap works. Nothing has time to react or dissolve; the soap simply reaches the surface and the support is gone.',
      tryIt: 'In Skin, add soap and watch where it goes and what the pull arrows do.',
    },
    {
      id: 'rounddrop', field: 'water', sim: 'skin',
      ask: 'A drip hanging from a tap is round before it ever falls. Mercury spilled on a bench balls up. In orbit, water floats as near-perfect spheres.',
      choices: [
        { t: 'Air presses evenly on every side of the drop and squeezes it into the roundest shape available.', ok: false,
          why: 'The drops in orbit are inside a pressurised cabin, with air on all sides, and they are rounder than any on Earth. Air is not shaping them.' },
        { t: 'Molecules at the surface are pulled inward, and a sphere has the least surface for a given volume.', ok: true,
          why: 'Being at the surface is the costly thing, so the liquid takes the shape with the fewest molecules stuck out in it.' },
        { t: 'Water molecules repel one another slightly at short range, pushing the drop out into an even shape.', ok: false,
          why: 'If they repelled, the drop would keep spreading rather than pulling in. Attraction is what holds it together.' },
        { t: 'Surface tension pulls the surface flat, and the flattest surface that can close on itself is a sphere.', ok: false,
          why: 'Right term, wrong geometry. Surface tension shrinks area; a sphere is the smallest area, not the flattest shape.' },
      ],
      after: 'The drip is round before it falls, so air resistance cannot be doing it. It is round for the same reason a crowd pressing inward ends up a circle: that shape leaves fewest on the outside.',
      tryIt: 'In Skin, compare the edge of a long strip of water with the same water bunched up.',
    },
    {
      id: 'bubbles', field: 'water', sim: 'skin',
      ask: 'You cannot blow a bubble with plain water. Everyone has tried. One drop of washing-up liquid and you can blow one the size of your head.',
      choices: [
        { t: 'Soap molecules link neighbouring water molecules together, making the film strong enough to hold air.', ok: false,
          why: 'Soap does the opposite — it gets between water molecules and weakens their hold. A strengthened film would snap shut faster, not slower.' },
        { t: 'Soap thickens the water so the film drains more slowly and survives long enough to be inflated.', ok: false,
          why: 'Drainage does set how long a bubble lasts, but soapy water is barely thicker than plain. The film has to form at all first.' },
        { t: 'Soap lowers the water’s density, so the film is light enough to be held up as a bubble.', ok: false,
          why: 'A bubble wall is microns thick and weighs almost nothing either way. Its weight was never the problem.' },
        { t: 'Plain water’s surface pulls together so hard that a film snaps shut at once; soap lowers that pull.', ok: true,
          why: 'Soap makes bubbles possible by making water weaker, which is the opposite of what it sounds like it should do.' },
      ],
      after: 'Water has one of the highest surface tensions of any ordinary liquid — it tears a film shut before it can grow. Bubbles live in the gap soap opens up by lowering it.',
      tryIt: 'In Skin, add soap and watch the inward pull on the edge molecules go slack.',
    },

    /* ---- Climb ---- */
    {
      id: 'tallTree', field: 'water', sim: 'climb',
      ask: 'A tall tree lifts water a hundred metres to its highest leaves, all day, with no pump and no moving parts. A perfect vacuum pump can only lift water about ten metres before the column breaks.',
      choices: [
        { t: 'Evaporation at the leaves lowers the pressure at the top and atmospheric pressure pushes the column up from below.', ok: false,
          why: 'Pushing from below is capped at about ten metres by atmospheric pressure, which is the very limit the question names.' },
        { t: 'Water grips the walls of extremely narrow tubes and drags the column up behind it, higher the narrower they are.', ok: true,
          why: 'The tubes in wood are microns across. At that width the grip on the walls carries the column far past what any push could.' },
        { t: 'Sugars made in the leaves draw water upward by osmosis, cell by cell, the whole way from the roots.', ok: false,
          why: 'Osmosis moves water between cells across membranes, but the trunk’s transport vessels are dead and hollow with no membranes at all.' },
        { t: 'Roots generate pressure that forces water up the stem from below.', ok: false,
          why: 'Root pressure is real and measurable, and it manages a couple of metres at most. It is not nothing, and it is nowhere near enough.' },
      ],
      after: 'The ten-metre limit is the clue. Anything that works by pushing from the bottom is stuck there, so whatever carries water to the top of a redwood has to be pulling, from inside tubes narrow enough to hold on.',
      tryIt: 'In Climb, make the tube narrower and narrower and watch how much higher the water goes.',
    },
    {
      id: 'papertowel', field: 'water', sim: 'climb',
      ask: 'A paper towel touched to a spill draws the water up into itself against gravity. A plastic bag touched to the same spill does nothing.',
      choices: [
        { t: 'Paper is porous and plastic is not, and porous materials take liquid into their pores.', ok: false,
          why: 'Porosity alone is not enough — a sponge made of wax is full of pores and wicks nothing. The walls have to grip the liquid as well.' },
        { t: 'Paper fibres swell as they wet, opening further channels that draw in still more water.', ok: false,
          why: 'Cellulose does swell, and it tends to narrow the channels rather than open them. The climbing starts before any swelling could.' },
        { t: 'Paper is a mesh of narrow channels whose walls grip water harder than it grips itself.', ok: true,
          why: 'Two conditions, both needed: channels narrow enough, and walls that win the grip contest. Wax the paper and it stops.' },
        { t: 'Cellulose reacts with water and holds it chemically until the sheet is wrung out again.', ok: false,
          why: 'No reaction occurs — the water comes back out unchanged and the paper is unchanged too. It is held, not combined.' },
      ],
      after: '"Absorbent" names the behaviour without explaining it. Take away either ingredient — wax the paper, or widen the channels — and the climbing stops, which is how you know both are needed.',
      tryIt: 'In Climb, switch between a surface that grips water and one that does not.',
    },
    {
      id: 'candlewick', field: 'water', sim: 'climb',
      ask: 'A candle burns for hours and the wick never runs dry, with the flame at the top and the molten wax pooled at the bottom. Pull the wick out and the flame goes out; burn a wick with no wax and it is gone in seconds.',
      choices: [
        { t: 'The flame’s heat lowers the pressure just above the wick, and air pressure below pushes the wax up.', ok: false,
          why: 'Hot gas above a flame is at ordinary atmospheric pressure. There is no suction there to pull anything up.' },
        { t: 'Molten wax expands as it warms, and that expansion drives it up through the wick.', ok: false,
          why: 'Expansion pushes in every direction equally, including sideways and down. It cannot pick out "up the wick".' },
        { t: 'Wax vaporises in the pool and the vapour travels up the wick to burn at the flame.', ok: false,
          why: 'The pool is far too cool to vaporise wax — it is barely above melting. Vaporising happens at the very tip, after the liquid has arrived.' },
        { t: 'The wick’s fibres form narrow channels that grip molten wax and lift it as fast as it burns away.', ok: true,
          why: 'The wick is plumbing, not fuel. That is why it needs wax to survive and the wax needs it to burn.' },
      ],
      after: 'The two failure modes give it away. No wick and the wax will not come up; no wax and the wick burns. Each needs the other, because one is the fuel and the other is the pipe.',
      tryIt: 'In Climb, find which tube lifts the water highest. That is what a wick is doing.',
    },

    /* ---- Float ---- */
    {
      id: 'frozencan', field: 'water', sim: 'float',
      ask: 'A can left in the freezer splits itself open. Nearly every other substance contracts as it freezes.',
      choices: [
        { t: 'Hydrogen bonds grow much stronger as water cools, drawing the molecules into a structure that resists containment.', ok: false,
          why: 'Stronger attraction would pull things closer, making ice denser. The expansion needs the bonds to be fussy about direction, not strong.' },
        { t: 'The molecules do pack closer as they cool, but dissolved gas comes out of solution and bursts the can.', ok: false,
          why: 'A can of plain water with no gas in it splits just as readily. And gas coming out of solution takes up less room when cold, not more.' },
        { t: 'Ice crystals grow as long needles that press outward on the walls as they lengthen.', ok: false,
          why: 'Crystals grow into the space available. What breaks the can is the total volume being larger, whatever shape the crystals take.' },
        { t: 'Freezing arranges water so every hydrogen bond is satisfied, and the only arrangement that does is full of gaps.', ok: true,
          why: 'Directional grips force an open framework. Open means bigger, so the solid takes more room than the liquid did.' },
      ],
      after: 'Water does the opposite of nearly everything else, and it does it because its grips insist on particular directions. Satisfying all of them at once leaves no choice but a roomy, hollow framework.',
      tryIt: 'In Float, cool the water-like sheet slowly and watch the holes open up.',
    },
    {
      id: 'frozenpond', field: 'water', sim: 'float',
      ask: 'A pond freezes over and the fish are alive in spring. If ice behaved like almost any other solid, they would not be.',
      choices: [
        { t: 'Water is densest at 4 °C, so the coldest water sinks and the pond freezes from the bottom up, leaving the top liquid.', ok: false,
          why: 'The 4 °C fact is real and the conclusion is inverted. Water below 4 °C becomes less dense and rises, which is why ice forms on top.' },
        { t: 'Ice is less dense than liquid water, so it floats and forms a lid with liquid water beneath it.', ok: true,
          why: 'An expanding solid floats, and a floating solid caps the pond instead of filling it from the bottom.' },
        { t: 'Ice insulates so well that the water below never loses enough heat to reach freezing.', ok: false,
          why: 'Ice does insulate and ponds do go on freezing thicker all winter. Insulation slows it; floating is what stops it reaching the bottom.' },
        { t: 'Dissolved minerals lower the freezing point of the deeper water enough to keep it liquid all winter.', ok: false,
          why: 'Fresh water holds far too little dissolved material — a fraction of a degree at most. Sea water manages about −2 °C, and that is salty.' },
      ],
      after: 'If ice sank, lakes would freeze from the bottom up and freeze solid, killing everything in them every winter. One odd fact about one molecule’s shape is why fresh water has anything living in it.',
      tryIt: 'In Float, cool the sheet until the block floats, then switch to the no-hands kind.',
    },
    {
      id: 'oilfreezer', field: 'water', sim: 'float',
      ask: 'A bottle of water in the freezer cracks. A bottle of cooking oil in the same freezer goes thick and cloudy and comes out intact.',
      choices: [
        { t: 'Oil molecules are long chains that fold up as they cool, taking less room rather than more.', ok: false,
          why: 'They straighten and stack as they cool, which is what makes fats solid. Either way the result is tighter packing, not looser.' },
        { t: 'Oil is non-polar, and only polar substances can build the open structures that expand on freezing.', ok: false,
          why: 'Polarity is not the test — silicon and bismuth are not polar and both expand. What matters is grips that insist on a direction.' },
        { t: 'Oil’s molecules have no directional grips, so cooling simply packs them closer.', ok: true,
          why: 'With nothing demanding a particular arrangement, molecules settle into whatever is tightest — which is what nearly everything does.' },
        { t: 'Oil’s freezing point is far below a domestic freezer, so it never solidifies and cannot expand.', ok: false,
          why: 'Much of it does solidify — that is the cloudiness. And even fully frozen it would contract, as the other options are circling.' },
      ],
      after: 'Water is the odd one out and it is odd for a reason you can point to. Take away the directional grips and you get the ordinary behaviour: colder means tighter means denser.',
      tryIt: 'In Float, switch to the kind with no hands and cool it. Does it open up, or close down?',
    },

    /* ---- Slow ---- */
    {
      id: 'sandsea', field: 'water', sim: 'slow',
      ask: 'On a hot afternoon the sand burns your feet and the sea is still freezing. The sun has been on both of them all day, side by side.',
      choices: [
        { t: 'The sea mixes constantly, spreading its heat so thin through such a volume that its temperature barely moves.', ok: false,
          why: 'Mixing does spread it, and a shallow rock pool that cannot mix still warms far faster than the same depth of sea. Something else is absorbing it.' },
        { t: 'Evaporation carries heat off the sea surface about as fast as the sun delivers it.', ok: false,
          why: 'Evaporation does cool the surface and is nowhere near enough to account for the difference. A covered bucket of water still warms slowly.' },
        { t: 'Sand grains are small and separate, so each heats on its own and reaches a high temperature quickly.', ok: false,
          why: 'Grain size changes how fast heat travels, not how much a material can hold. Solid rock warms quickly too.' },
        { t: 'Heat into water mostly pulls hydrogen bonds apart rather than speeding molecules up, and a thermometer reads speed.', ok: true,
          why: 'The energy is absorbed — it just goes somewhere a thermometer cannot see. Water takes about five times as much as sand for the same rise.' },
      ],
      after: 'Water is taking in plenty of energy. It spends it on pulling grips apart instead of on motion, and temperature only measures the motion.',
      tryIt: 'In Slow, put the same heat into all three boxes and watch which refuses to warm.',
    },
    {
      id: 'piefilling', field: 'water', sim: 'slow',
      ask: 'A hot pie: the pastry you can hold, the filling takes the roof off your mouth. Both have been at the same temperature for half an hour.',
      choices: [
        { t: 'The filling is darker and absorbed more of the oven’s radiant heat than the pale pastry did.', ok: false,
          why: 'After half an hour everything in the oven is at the same temperature regardless of colour. Colour affects how fast it got there, not where it ended.' },
        { t: 'The filling is denser than the pastry, and denser materials hold more heat for their size.', ok: false,
          why: 'Density and heat capacity often move together and are different things. Lead is extremely dense and holds very little heat.' },
        { t: 'The watery filling stores far more energy at the same temperature, so it has much more to unload.', ok: true,
          why: 'Same temperature, very different amounts of energy, because water soaks up so much per degree. Getting it back out is your problem.' },
        { t: 'The pastry’s dry surface loses heat to the air far faster, so it has cooled before it reaches your mouth.', ok: false,
          why: 'It does cool a little faster, and the filling still burns you after both have been sitting out. The gap is too large for surface cooling.' },
      ],
      after: 'Temperature and heat are not the same quantity, and this is where the difference bites. Equal temperatures, wildly unequal stored energy.',
      tryIt: 'In Slow, heat all three boxes to the same temperature and see which needed the most heat.',
    },
    {
      id: 'coastal', field: 'water', sim: 'slow',
      ask: 'Two towns at the same latitude: one coastal, one two hundred miles inland. The coastal one has milder winters and cooler summers, every year.',
      choices: [
        { t: 'Coastal air is humid, and water vapour holds heat well enough to keep winter temperatures up.', ok: false,
          why: 'Water vapour is a real greenhouse gas and the effect is far too small locally. Humid inland places do not get the same evening-out.' },
        { t: 'The sea takes enormous heat for a small temperature change, and returns it as slowly.', ok: true,
          why: 'The same stubbornness that keeps the sea cold in June keeps it warm in December. An ocean is a flywheel for temperature.' },
        { t: 'Sea water is salty, and salt lowers its freezing point and keeps the coast from getting too cold.', ok: false,
          why: 'Salt lowers the freezing point by about two degrees. Coastal winters are milder by far more than that, and in summer salt would do nothing at all.' },
        { t: 'Wind blows off the sea, and moving air carries heat more efficiently than still air, evening temperatures out.', ok: false,
          why: 'The wind is the delivery, not the supply. It only moderates anything because what it is blowing over has stayed at a steady temperature.' },
      ],
      after: 'An ocean is a heat store with an enormous capacity and a very slow response. It is why Britain is habitable and places at the same latitude in Canada are not.',
      tryIt: 'In Slow, heat all three boxes and then cool them. Which is last to let go?',
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
      const b = h('button', { type: 'button', class: 'ch-choice' }, h('span', { class: 'ch-t' }, c.t));
      b.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        /* Every option explains itself afterwards, not just the one that was
           picked. The whole point of a good wrong answer is that finding out
           why it fails is worth more than being told the right one. */
        btns.forEach((o, k) => {
          const cc = q.choices[order[k]];
          o.classList.add(cc.ok ? 'is-right' : 'is-wrong');
          o.disabled = true;
          if (cc.why) o.appendChild(h('span', { class: 'ch-why' }, cc.why));
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
      h('p', { class: 'hint' }, opts.lede || 'Everyday things that come out of what is on this page. All four answers are real mechanisms and only one is right — commit to it, then go and settle it yourself.'),
      list);
    host.appendChild(sec);
    return sec;
  };
})();
