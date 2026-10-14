/* The Life Lab's challenges: ordinary things that only this chapter explains.

   Three for every instrument. The card, the marking and the storage are in
   js/quizkit.js; this file is nothing but the questions.

   The rule the wrong answers follow is the same one Bond Lab's bank uses, and
   it is worth restating because the obvious way to write these fails badly.
   If three options are folk explanations and the fourth is the only one that
   mentions a molecule, a learner who knows no chemistry scores full marks by
   picking whichever one sounds like chemistry. They have been tested on
   register, not on understanding. So:

     1. All four options are mechanisms. Every one names real molecules, real
        bonds, real reactions, in the same voice.
     2. Each wrong one is wrong for a reason you could put a finger on — the
        right process in the wrong direction, a true fact that does not answer
        this question, a real rule applied where it does not hold.
     3. No option can be picked out by being longest, or most technical, or
        most hedged. The correct answer is often the shortest.
     4. Several distractors are things people say out loud, or that get
        printed. Those are the valuable ones.

   The only way through is to know what is actually happening — and every one
   of these can be settled by going into the instrument named underneath and
   poking it. Each option carries a `why`, shown after answering, so a wrong
   pick teaches the specific thing that was wrong with it. */
(function () {
  'use strict';

  const BANK = [
    /* ============================================================ CARBON */

    /* ---- Four Hands ---- */
    {
      id: 'why-carbon', field: 'carbon', sim: 'backbone',
      ask: 'About 96% of your body is four elements: hydrogen, carbon, nitrogen and oxygen. Every long molecule in you is built on a backbone of just one of them. Why is it carbon and not one of the other three?',
      choices: [
        { t: 'Carbon is the lightest of the four, so chains of it cost the least to carry about.', ok: false,
          why: 'Hydrogen is lighter, and carbon is heavier than both nitrogen and oxygen. Weight is not what is choosing here.' },
        { t: 'Carbon can hold on in four directions at once, so a chain can carry things and still turn corners.', ok: true,
          why: 'Oxygen has two hands: one in, one out, and a line is all you ever get. Nitrogen has three, so it can branch but has nothing left over. Four is the first number that lets a chain branch and still have a hand free at every link.' },
        { t: 'Carbon’s bonds to other carbons are the strongest bonds any element makes, so the chains survive.', ok: false,
          why: 'A silicon–oxygen bond is stronger, and a carbon–carbon bond is not even the strongest bond carbon makes. A backbone that strong would be a problem anyway: nothing could take it apart again.' },
        { t: 'Carbon is far more abundant on Earth than the alternatives, so life had the most of it to work with.', ok: false,
          why: 'By mass, Earth’s crust is more than a quarter silicon and less than a thousandth carbon. Life went looking for carbon and had to concentrate it.' },
      ],
      after: 'Four hands is the whole of it. Two can only make a line. Three can branch, but a branching atom has used all three and has nothing spare to hold anything. Four can chain through, branch sideways, and still carry a group that does a job.',
      tryIt: 'Build a chain in Four Hands, then switch the hub element to oxygen and try to put a branch on it.',
    },
    {
      id: 'ring-needs', field: 'carbon', sim: 'backbone',
      ask: 'Every sugar in your blood is a ring. So is every letter in your DNA, and so is most of what a flower smells of. Rings are everywhere in living things. What does an atom have to be able to do before a useful ring is possible at all?',
      choices: [
        { t: 'Hold two neighbours and still have a hand left to carry something.', ok: true,
          why: 'A ring of two-handed atoms can exist — sulfur makes one — but every hand is used up holding the ring together, so it can carry nothing and do nothing. A useful ring needs a third hand at every corner.' },
        { t: 'Form bonds that can bend, since the corners of a ring are not at the angle a straight chain wants.', ok: false,
          why: 'True, and it is why three- and four-membered rings are strained and rare. But a five- or six-membered ring needs almost no bending, so this is not what decides whether rings happen.' },
        { t: 'Make double bonds, because a ring will not hold its shape without one to stiffen it.', ok: false,
          why: 'Cyclopentane and the ring in glucose have no double bonds anywhere and are perfectly stable. Benzene’s alternating double bonds are a special case, not a requirement.' },
        { t: 'Bond to itself, which most elements cannot do more than once or twice before the chain falls apart.', ok: false,
          why: 'A real limit — silicon chains fall apart in water, which is one reason life is not silicon. But it explains long chains, not rings in particular.' },
      ],
      after: 'Build a ring out of carbons in the instrument and count the hands: two are holding the ring, two are free. That is why a sugar ring can carry six hydroxyls and a DNA base can carry the pegs that make it pair.',
      tryIt: 'Make a six-carbon chain in Four Hands, join the ends, and count what is left over on each corner.',
    },
    {
      id: 'no-turning', field: 'carbon', sim: 'backbone',
      ask: 'Your body can tell two fat molecules apart that have exactly the same atoms, joined in exactly the same order. The only difference is which side of one particular bond the rest of the chain sits on. Why can the molecule not simply turn round and become the other one?',
      choices: [
        { t: 'The two ends are too heavy to swing past each other at body temperature.', ok: false,
          why: 'Molecules this size tumble billions of times a second. Weight is no obstacle at all — a single bond in the same chain spins freely the whole time.' },
        { t: 'That bond is a double bond, and a double bond does not turn.', ok: true,
          why: 'A single bond spins freely, which is why a chain is floppy. A double bond holds both ends in one plane. Whichever side the chain left on, it is stuck on, and the only way to swap is to break the bond and rebuild it.' },
        { t: 'Turning it would break the hydrogen bonds the chain has made with its neighbours, which costs too much.', ok: false,
          why: 'A hydrocarbon chain has no hydrogen bonds to break — there is no oxygen or nitrogen anywhere along it. It is held to its neighbours only by the weakest sort of stickiness.' },
        { t: 'The two forms are mirror images, and nothing can turn a left hand into a right hand.', ok: false,
          why: 'A real and important rule, and the wrong one here. These two are not mirror images: you could lay one over the other if the bond would only turn, and it will not.' },
      ],
      after: 'This is why a fat can be bent one way or the other and stay that way for good, and why one of those shapes stacks into something solid and the other does not.',
      tryIt: 'In Four Hands, select a bond, make it double, and drag the twist slider.',
    },

    /* ---- Handles ---- */
    {
      id: 'gel-vs-petrol', field: 'carbon', sim: 'handles',
      ask: 'Hand gel disappears into water and takes the grease off your hands. Petrol does neither — it sits on top of a puddle in a film. Both are small molecules of carbon and hydrogen. What is the gel carrying that the petrol is not?',
      choices: [
        { t: 'An —OH group, whose hydrogen can hold on to a water molecule.', ok: true,
          why: 'A hydrogen sitting on an oxygen is a hydrogen bond waiting to happen. Water grabs it, and the molecule goes into the water instead of sitting on it. Petrol has nothing to offer and the water shuts it out.' },
        { t: 'A charge, which the water’s own charges are attracted to.', ok: false,
          why: 'Alcohol carries no charge at all — it is a neutral molecule, which is why it does not conduct. Something charged would dissolve, but that is not what is happening here.' },
        { t: 'Smaller molecules, which fit between the water molecules instead of having to push them apart.', ok: false,
          why: 'Alcohol molecules are bigger than the smallest things in petrol, and still mix. Size is not what decides; what the molecule can hold on to is.' },
        { t: 'A lower density, so it floats into the water rather than being pushed out of it.', ok: false,
          why: 'Alcohol is less dense than water and still mixes completely. Petrol is less dense too and does not. Density says which one ends up on top, not whether they mix at all.' },
      ],
      after: 'One group, bolted onto an otherwise non-polar molecule, changes what it will and will not mix with. That is the whole idea of a functional group, and it is why soap works too.',
      tryIt: 'In Handles, press Ethane and read the water line, then bolt one —OH on and read it again.',
    },
    {
      id: 'sour-and-slippery', field: 'carbon', sim: 'handles',
      ask: 'Vinegar tastes sour. Bicarbonate of soda dissolved in water feels slippery and tastes bitter. Both are small, ordinary molecules in water. What are the two of them doing differently to the water around them?',
      choices: [
        { t: 'One is giving a hydrogen away and the other is taking one.', ok: true,
          why: 'A carboxyl group lets its hydrogen go in water. That is all being an acid is. Something basic does the opposite and takes one. Your tongue has receptors for the loose hydrogens, and that is the sour taste.' },
        { t: 'One is dissolving completely and the other is only partly dissolving, leaving grit.', ok: false,
          why: 'Both dissolve fully in enough water, and a solution with nothing left undissolved still tastes sour or bitter. How much dissolves is a different question from what it does once it has.' },
        { t: 'One breaks the hydrogen bonds between water molecules and the other strengthens them.', ok: false,
          why: 'Both of them disturb the water’s hydrogen bonding, and so does sugar, which tastes of neither. This cannot be what tells them apart.' },
        { t: 'One reacts with the water and the other simply mixes into it without changing.', ok: false,
          why: 'Both of them react with the water — that is exactly what handing a hydrogen over, or taking one, is. They are doing the same kind of thing in opposite directions.' },
      ],
      after: 'Acid and base are not two different substances. They are two directions of one move: who ends up holding the loose hydrogen.',
      tryIt: 'In Handles, put a —COOH on one end and watch the acid bar, then put an —NH₂ on instead.',
    },
    {
      id: 'fish-and-lemon', field: 'carbon', sim: 'handles',
      ask: 'Old fish smells, and squeezing lemon over it makes the smell go away almost at once. The smelly molecules are still there — nothing has been washed off or cooked. Why can you no longer smell them?',
      choices: [
        { t: 'The lemon’s own smell is strong enough to cover the fish’s, so your nose stops noticing it.', ok: false,
          why: 'It would need far more lemon than a squeeze, and a lemon rinsed off afterwards still works. Something has happened to the fish molecules, not to your nose.' },
        { t: 'The acid hands them a hydrogen, and what they become is too heavy to leave the surface.', ok: true,
          why: 'The smell is amines. An amine in acid takes a hydrogen and becomes charged, and a charged thing is held in the liquid far too strongly to fly off into the air. You can only smell what reaches your nose.' },
        { t: 'The acid breaks the smelly molecules down into smaller ones you have no receptor for.', ok: false,
          why: 'Lemon juice is nowhere near strong enough to break a molecule apart, and this works in seconds in the cold. Nothing has been broken.' },
        { t: 'The acid kills the bacteria that are producing the smell, so no more of it is made.', ok: false,
          why: 'It does slow them, over hours. But the smell goes immediately, and the molecules that were already there are the ones you were smelling.' },
      ],
      after: 'Charged things stay in liquids and neutral things escape into the air. That one fact is why an acid can switch a smell off, and why a drug that works as a tablet often will not work as a cream.',
      tryIt: 'In Handles, build the molecule with an —NH₂ on it and read what the acid bar does.',
    },

    /* ---- Twins ---- */
    {
      id: 'butter-oil', field: 'carbon', sim: 'twins',
      ask: 'Butter is solid in the fridge and olive oil is still liquid. Both are fats, both are mostly chains of carbon and hydrogen, and the chains are about the same length. What is different about the molecules?',
      choices: [
        { t: 'The olive oil molecules have kinks in them, so they cannot stack.', ok: true,
          why: 'A double bond puts a permanent bend in the chain. Straight chains lie against each other all the way down and the stickiness adds up until they set. Kinked ones cannot line up, so they are still sliding at fridge temperature.' },
        { t: 'The butter molecules are held to each other by hydrogen bonds and the oil ones are not.', ok: false,
          why: 'Neither has any. A hydrocarbon tail has no oxygen or nitrogen along it, so there is nothing for a hydrogen bond to form between. The only thing holding them together is the weakest sort of stickiness.' },
        { t: 'Butter has water mixed through it, and it is the water that freezes.', ok: false,
          why: 'Butter does contain some water, but clarified butter with the water taken out still sets hard, and it sets at the same sort of temperature.' },
        { t: 'The butter molecules are heavier, and heavier molecules need more heat to get moving.', ok: false,
          why: 'Generally true, and not the difference here. Olive oil’s main fat is actually the heavier of the two, and it is the one that stays liquid.' },
      ],
      after: 'Same atoms, same count, same order along the chain. One bond is bent the other way, and the result is a brick or a liquid.',
      tryIt: 'In Twins, pick “Which side of the double bond” and compare the two shapes.',
    },
    {
      id: 'winter-lighter', field: 'carbon', sim: 'twins',
      ask: 'A cheap lighter sometimes will not light on a cold morning, and a gas canister left in a tent overnight feels flat until the sun gets on it. Lighters sold for cold weather use a molecule with exactly the same formula as the ordinary kind. How does changing nothing but the shape help?',
      choices: [
        { t: 'The branched shape is a lump rather than a line, so it holds on to its neighbours less well.', ok: true,
          why: 'A straight chain lies alongside its neighbour over its whole length and every point of contact adds a scrap of grip. A branched one is a ball: it touches in patches, the grip never adds up, and it boils at a colder temperature — which is what you need.' },
        { t: 'The branched shape is more compact, so more of it fits in the canister and the pressure is higher.', ok: false,
          why: 'Branched molecules actually pack worse, not better, which is the whole point. And it is the liquid’s boiling point that decides whether gas comes out, not how much is in there.' },
        { t: 'The branched shape burns more easily once it is lit, so a smaller spark will do.', ok: false,
          why: 'Branched hydrocarbons are if anything harder to set off — that is exactly what the octane rating of petrol measures. The problem on a cold morning is getting gas out at all.' },
        { t: 'The branched shape is lighter, and a lighter molecule evaporates at a lower temperature.', ok: false,
          why: 'They have identical formulas, so they weigh exactly the same. Nothing has been added or taken away; a carbon has only moved.' },
      ],
      after: 'Isomers are why a chemical formula is not a name. C₄H₁₀ does not tell you whether your lighter works in the cold.',
      tryIt: 'In Twins, pick “Where the branch sits” and compare the two boiling points.',
    },
    {
      id: 'drink-or-propellant', field: 'carbon', sim: 'twins',
      ask: 'Two molecules have two carbons, six hydrogens and one oxygen each. One is the alcohol in beer, a liquid that mixes into water in any amount. The other comes out of a spray can as a gas and barely mixes with water at all. The oxygen is in a different place. Why does that change so much?',
      choices: [
        { t: 'One oxygen has a hydrogen on it to reach out with. The other is buried between carbons.', ok: true,
          why: 'A hydrogen sitting on an oxygen is what makes a hydrogen bond. The alcohol has one and can hold the next molecule and hold water. The ether’s oxygen has two carbons on it and nothing to offer, so almost nothing holds it and it boils a hundred degrees colder.' },
        { t: 'In one the oxygen is at the end, which makes the molecule longer and heavier at one end.', ok: false,
          why: 'They weigh exactly the same and are about the same size. How far the oxygen is from the end is not the point; what is attached to it is.' },
        { t: 'One of them is polar and the other is not, and only a polar molecule will mix into something as polar as water.', ok: false,
          why: 'Both are polar — an oxygen with carbons either side pulls electrons just as hard. Being polar is not enough. You have to be able to offer a hydrogen, and only one of them can.' },
        { t: 'One has its oxygen free to react and the other has it blocked, so only one dissolves.', ok: false,
          why: 'Close, but dissolving is not reacting. Neither one reacts with water at all; the question is only which can hold on to it.' },
      ],
      after: 'Same formula, same parts, one atom in a different place, and you get a drink or a propellant. A formula is a parts list, not a name.',
      tryIt: 'In Twins, pick “Where the oxygen sits” and switch between the two forms.',
    },

    /* ============================================================ BUILD */

    /* ---- The Template ---- */
    {
      id: 'why-water-digest', field: 'build', sim: 'template',
      ask: 'You cannot digest anything without water, and a body going without it stops being able to use food long before it runs out of anything else. Enzymes are proteins and are not used up. So what is the water for?',
      choices: [
        { t: 'It goes into the bonds. Every bond that gets broken takes a water molecule with it.', ok: true,
          why: 'Breaking a polymer is hydrolysis: the bond splits and the two halves take a hydrogen and a hydroxyl from a water molecule. It is not a solvent doing this; the water is a reactant and it ends up inside the pieces.' },
        { t: 'It carries the food along the gut, so without it nothing reaches the enzymes.', ok: false,
          why: 'True and important, and it would not explain why the chemistry itself stops. Plenty of digestion happens in a thick paste with very little free liquid.' },
        { t: 'It dissolves the food so the enzymes can reach the bonds they need to cut.', ok: false,
          why: 'Also true, and also not the answer. Fat is never dissolved in water at any point and is still hydrolysed; the water still goes into every ester bond that breaks.' },
        { t: 'It carries the acid your stomach makes, and it is that acid, not the water, that breaks the bonds apart.', ok: false,
          why: 'The stomach’s acid helps unfold proteins and gets one enzyme working, but the bonds are broken by water going in, acid or no acid. Your gut does most of its work after the acid has been neutralised.' },
      ],
      after: 'Dehydration builds and lets a water out; hydrolysis breaks and takes a water in. Every meal you have ever eaten was taken apart by water going into bonds.',
      tryIt: 'In The Template, run the slider from right to left and watch the water go back in.',
    },
    {
      id: 'muscle-waste', field: 'build', sim: 'template',
      ask: 'You build new protein out of the amino acids in your food. If you joined a hundred amino acids into one chain, the chain would weigh less than the hundred loose ones did. What left, and when?',
      choices: [
        { t: 'Ninety-nine water molecules, one at each bond as it formed.', ok: true,
          why: 'Every peptide bond is made by taking a hydrogen off one amino acid and a hydroxyl off the next and letting them leave together. A hundred blocks need ninety-nine bonds, so ninety-nine waters — one fewer than the blocks, because the two ends only hold on at one side.' },
        { t: 'A hundred water molecules, one for each amino acid that joined.', ok: false,
          why: 'The right reaction, the wrong count. The first amino acid joins nothing; it is the bonds that cost a water, and there is always one fewer bond than there are blocks.' },
        { t: 'Carbon dioxide, which is what the body breathes out when it builds things.', ok: false,
          why: 'Carbon dioxide comes out of burning fuel for energy, not out of joining monomers. Building a protein does cost energy, but the by-product of the joining itself is water.' },
        { t: 'Nothing left. The chain weighs exactly what went into it, as mass always does.', ok: false,
          why: 'Mass is conserved overall — but not in the chain. The waters are part of the total; they have simply gone somewhere else.' },
      ],
      after: 'One bond, one water, in all four families. It is the same bookkeeping whether you are building a protein, a starch, a fat or a strand of DNA.',
      tryIt: 'In Chain, build ten blocks and read the water counter.',
    },
    {
      id: 'mummy', field: 'build', sim: 'template',
      ask: 'A loaf left in a damp cupboard is unrecognisable in a fortnight. A body dried out in a desert is still recognisable after three thousand years. Bacteria explain some of it — but the molecules themselves also last far longer dry. Why?',
      choices: [
        { t: 'Dry air is colder at night, and cold slows every reaction down.', ok: false,
          why: 'Deserts are hot, often far hotter than a kitchen cupboard, and the dry things last anyway. Temperature is pulling the other way here.' },
        { t: 'Taking a bond apart needs a water molecule to go into it, and there is none.', ok: true,
          why: 'Hydrolysis is not something water helps with, it is something water is part of. Every bond that breaks takes a hydrogen and a hydroxyl out of a water molecule. With no water, the reaction has nothing to run on.' },
        { t: 'Drying forms new bonds between the molecules that lock everything in place.', ok: false,
          why: 'Some cross-linking does happen in dried tissue, and it is a side effect rather than the reason. Dried starch and dried sugar keep just as well and form no such bonds.' },
        { t: 'Without water the enzymes cannot move about to reach the bonds they would cut.', ok: false,
          why: 'True as far as it goes, and it only covers the enzyme-driven part. Bonds break slowly on their own too, and that also stops — because that reaction needs water as well.' },
      ],
      after: 'Jam, honey, salted fish, dried pasta and a mummy are all the same trick: take the water away and the reaction that takes things apart has nothing to work with.',
      tryIt: 'In The Template, try to get from the joined end back to the unjoined end and watch what has to go in.',
    },

    /* ---- Chain ---- */
    {
      id: 'flour-honey', field: 'build', sim: 'chain',
      ask: 'A spoonful of honey is sweet and a spoonful of flour is not. Both are almost entirely the same sugar — glucose — and nothing has been added to the flour to hide it. Why can you taste one and not the other?',
      choices: [
        { t: 'The glucose in flour is joined up into long chains, and your tongue only detects loose ones.', ok: true,
          why: 'Sweetness is a receptor on your tongue with a pocket a small sugar fits into. A chain of hundreds fits nothing. Chew the flour long enough for your spit to cut it up and it turns sweet, which is the same experiment.' },
        { t: 'Flour’s sugar is a different isomer of glucose that the receptor does not recognise.', ok: false,
          why: 'It is the same glucose, and in starch the rings are joined the way your own enzymes are built for. Isomers matter elsewhere in this chapter, not here.' },
        { t: 'Flour is a dry powder, and nothing can be tasted until it dissolves.', ok: false,
          why: 'Flour stirred into water still is not sweet, and dry sugar on a dry tongue tastes of nothing either. Dissolving is needed for both and tells them apart for neither.' },
        { t: 'The protein in flour wraps round each grain of starch and keeps the sugar off your taste receptors.', ok: false,
          why: 'Cornflour is almost pure starch with hardly any protein and is just as tasteless. There is nothing in the way; there is nothing loose to taste.' },
      ],
      after: 'Mono-, di-, oligo-, poly- are counting words. The molecule does not change as the chain gets longer — but what can get hold of it does.',
      tryIt: 'In Chain, pick Sugars and drag from one block to a hundred, watching the name.',
    },
    {
      id: 'label-sugar', field: 'build', sim: 'chain',
      ask: 'A packet of pasta can say “sugars: 2 g” and “carbohydrate: 70 g” on the same label, when the carbohydrate is nothing but sugar joined together. Nobody is lying. What are the two numbers counting?',
      choices: [
        { t: 'Chains short enough to taste sweet, against every glucose in the packet however it is joined.', ok: true,
          why: 'The word “sugar” on a label means one or two units; “carbohydrate” means all of it. Same molecule, counted at two different lengths, with no chemical difference between them — your gut turns one into the other.' },
        { t: 'Sugar you absorb, against carbohydrate whose bonds no enzyme of yours is the right shape for.', ok: false,
          why: 'You digest almost all of pasta’s starch and absorb it as glucose. The part you cannot digest is fibre, and that is counted separately again.' },
        { t: 'Added sugar, against all the glucose that was locked up in the wheat’s starch to begin with.', ok: false,
          why: 'Labels do count added sugar separately in some countries, and that is not what this pair of numbers is. The “sugars” line counts short chains whether anyone added them or not.' },
        { t: 'Sugar as it is, against carbohydrate weighed including the water that would be needed to break it up.', ok: false,
          why: 'A tidy idea and not how it is done. Both figures are the weight as it sits in the packet; the water that goes in later is yours, not the pasta’s.' },
      ],
      after: 'The name changes at one block, at two, at ten and at a hundred, and the chemistry does not change at any of them.',
      tryIt: 'In Chain, watch the name under the picture while you drag the length.',
    },
    {
      id: 'eat-to-build', field: 'build', sim: 'chain',
      ask: 'You replace most of the protein in your body every few weeks: it gets taken apart and rebuilt. Breaking bonds gives energy back and building them costs it. If it is the same bonds both ways, why does all this rebuilding leave you hungry?',
      choices: [
        { t: 'Because breaking gives back less than building costs, so the loop runs down.', ok: false,
          why: 'If that were true of the same bond, you could run the loop the other way and get energy from nothing. Making and breaking one bond comes out even; something else must be paying.' },
        { t: 'Because what you break and what you build are not the same bonds in the same order.', ok: true,
          why: 'You take apart whatever arrived and build what you actually need, and choosing costs. Every bond is made in the right place, in the right order, by machinery that has to be run, and running it is what you eat for.' },
        { t: 'Because the water released when you build is lost, and replacing it costs energy.', ok: false,
          why: 'The water goes back in when the next bond is broken, and a body has no shortage of it. Water is not the expensive part.' },
        { t: 'Because a protein breaks down into heat as well as amino acids, and the heat escapes.', ok: false,
          why: 'Heat does escape, and that is a consequence of the running costs rather than a separate drain. A bond broken carefully gives its energy to a carrier molecule, not to the room.' },
      ],
      after: 'Building and breaking are the same reaction in two directions, and the sums come out even. What is never free is doing it on purpose, in order, in the right place.',
      tryIt: 'In Chain, build twenty blocks, split them all, and compare the two ledger bars.',
    },

    /* ---- Hurry Up ---- */
    {
      id: 'tinned-pineapple', field: 'build', sim: 'enzyme',
      ask: 'A jelly made with tinned pineapple sets perfectly. The same jelly made with fresh pineapple never sets at all — it stays as a liquid however long you leave it in the fridge. The fruit is the same fruit. What has the tinning done?',
      choices: [
        { t: 'The heat of canning has unfolded an enzyme in the fruit, and an unfolded one cannot work.', ok: true,
          why: 'Fresh pineapple carries bromelain, which cuts protein, and jelly sets by its protein chains tangling. Cut the chains and there is nothing left to tangle. Canning heats the fruit, the enzyme comes apart, and it does not go back together when it cools.' },
        { t: 'The tinned fruit has been in syrup, and the extra sugar helps the jelly set.', ok: false,
          why: 'Sugar does change how a jelly sets a little, and nothing like this much. Tinned pineapple in its own juice, with no syrup at all, works just as well.' },
        { t: 'The acid in fresh pineapple stops the chains joining, and canning neutralises it.', ok: false,
          why: 'Tinned pineapple is just as acidic — the pH barely moves. Lemon juice is more acidic still and jelly sets with it quite happily.' },
        { t: 'Fresh pineapple holds far more water, which dilutes the gelatin below the point where it can set.', ok: false,
          why: 'Measure both and the water is much the same, and anyway you can use half as much fresh fruit and it still will not set. Something is actively being done to the gelatin.' },
      ],
      after: 'This is the lab itself. The enzyme is not slowed by heat, it is finished by it, and cooling it down afterwards changes nothing.',
      tryIt: 'In Hurry Up, press “Boil it”, wait for the rate to collapse, then press “Cool it back down”.',
    },
    {
      id: 'brown-apple', field: 'build', sim: 'enzyme',
      ask: 'A cut apple goes brown in half an hour. A cut apple dropped into boiling water for ten seconds and then taken out does not go brown at all, even days later. Ten seconds is not long enough to cook it. What did it do?',
      choices: [
        { t: 'It washed the sugars off the cut surface, and it is the sugars that brown.', ok: false,
          why: 'Sugars do brown, when you roast something at two hundred degrees for a long time. This browning happens in the cold in minutes, and a rinsed apple browns perfectly well.' },
        { t: 'It unfolded the enzyme on the cut surface, and the browning stops with it.', ok: true,
          why: 'An apple carries an enzyme that, once air reaches it, turns colourless molecules into brown ones. Ten seconds of boiling water wrecks its shape, and the shape was the whole of it. Nothing else about the apple has changed.' },
        { t: 'It drove the air out of the cut surface, and browning needs oxygen.', ok: false,
          why: 'Browning does need oxygen. But the apple is back in the air a moment later and the air gets straight back in; if that were the mechanism, it would brown as soon as you took it out.' },
        { t: 'It sealed the surface with a layer of cooked starch that keeps the oxygen out.', ok: false,
          why: 'An apple has very little starch, and ten seconds would not gelatinise it. You can see the cut surface is unchanged — it simply stays the colour it was.' },
      ],
      after: 'Lemon juice does the same job a different way: the acid stops the enzyme working without destroying it, which is why it wears off and boiling does not.',
      tryIt: 'In Hurry Up, compare what cold does to the rate with what boiling does — and whether each one comes back.',
    },
    {
      id: 'fever', field: 'build', sim: 'enzyme',
      ask: 'You are fine at 37 °C. At 40 °C you can barely stand up, and above 42 °C you are in serious danger. That is a change of five degrees in a body that copes with far bigger swings in the weather. Why is the inside of you so fussy?',
      choices: [
        { t: 'Because heat speeds every reaction up, and past a point the bonds being built cannot keep pace with the ones coming apart.', ok: false,
          why: 'Reactions do speed up, by a modest amount over five degrees — nothing like enough to break anything. And a hard run raises your output far more than that without any of this happening.' },
        { t: 'Because your enzymes are near the temperature where they come apart, and they do not come back.', ok: true,
          why: 'Enzymes work faster as it gets hotter, right up to the point where the folding gives way — and that point is not far above body temperature. Past it the shape is gone, and cooling down does not restore it. You are running close to the cliff on purpose, because fast is useful.' },
        { t: 'Because the extra heat drives water out through the membranes faster than it can be replaced.', ok: false,
          why: 'Fever does dehydrate you through sweating, and that is a separate problem with a separate remedy. Someone kept fully hydrated at 42 °C is still in danger.' },
        { t: 'Because the membranes around your cells melt, and the contents leak out.', ok: false,
          why: 'Membranes do get more fluid as they warm, and they stay intact well past the temperatures that kill. Your body adjusts their make-up to keep them workable across a far wider range than this.' },
      ],
      after: 'Living things sit just under the edge. Fast enough to be worth it, close enough that a few degrees matter.',
      tryIt: 'In Hurry Up, walk the temperature up a few degrees at a time and watch where the graph turns over.',
    },

    /* ============================================================ THE FOUR */

    /* ---- Fold ---- */
    {
      id: 'egg', field: 'four', sim: 'fold',
      ask: 'An egg white is clear and runny. Two minutes in a pan and it is white and solid, and nothing you do will turn it back. No new ingredient went in, nothing was taken out, and the pan was nowhere near hot enough to break a bond. What happened?',
      choices: [
        { t: 'The water in it boiled off, and what is left is the dried protein.', ok: false,
          why: 'A cooked egg white is still about four-fifths water — weigh one before and after and barely anything has gone. The solid thing is sitting in the water, not left behind by it.' },
        { t: 'The chains came unfolded and got hold of each other instead of themselves.', ok: true,
          why: 'Heat shakes a folded chain loose. Loose chains meet other loose chains, their non-polar parts find each other, and now they are joined into a tangle. The sequence is untouched. The shape is gone and there is no route back to it.' },
        { t: 'The heat made the protein react with the oxygen in the air, which is what turns it white.', ok: false,
          why: 'It goes white just as well sealed in a bag with no air at all, and boiled in the shell. Nothing has been oxidised.' },
        { t: 'The heat broke the chains into shorter pieces, and short pieces pack into a solid.', ok: false,
          why: 'That would need hydrolysis, and a frying pan does not supply it — the chains come out of a cooked egg the same length they went in. Nothing has been cut.' },
      ],
      after: 'This is the same result as boiling the pineapple juice: a shape lost is lost for good, because by the time it cools the chains are holding each other instead.',
      tryIt: 'In Fold, put two chains in, cook them, and then cool them back down.',
    },
    {
      id: 'perm', field: 'four', sim: 'fold',
      ask: 'Straightening hair with heat and water lasts until the next wash. A perm lasts until the hair grows out. Both are doing something to the same protein in the same hair. Why does one wash out and the other not?',
      choices: [
        { t: 'One rearranges weak holds that water can undo, and the other remakes proper bonds that it cannot.', ok: true,
          why: 'The everyday curl is held by hydrogen bonds, which water gets between and resets — which is why hair goes limp in the rain. A perm uses chemicals to break and remake sulfur-to-sulfur bonds, and water cannot touch those.' },
        { t: 'One of them only reaches the outside of each hair while the other soaks right through to the middle of the fibre.', ok: false,
          why: 'Heat and water get right through a hair in seconds — it is thinner than a sheet of paper. Both treatments reach everywhere; they are doing different things when they get there.' },
        { t: 'One works on the hair that is already there and the other changes what grows next.', ok: false,
          why: 'A perm does nothing to the follicle, which is why it grows out: the new hair is straight and the permed length stays curled until it is cut off.' },
        { t: 'One unfolds the protein and the other refolds it into a different shape.', ok: false,
          why: 'Nearly the right register, and the wrong level. Hair keratin is already in its final wound-together form in both cases. What changes is which bits are fastened to which, not whether it is folded.' },
      ],
      after: 'Levels two and three of protein structure, in a bathroom. The weak holds are the ones that make a shape adjustable; the proper bonds are the ones that make it permanent.',
      tryIt: 'In Fold, watch the dotted holds come and go with temperature, and compare them with the solid links cooking leaves behind.',
    },
    {
      id: 'lactase', field: 'four', sim: 'fold',
      ask: 'Lactose-free milk is ordinary milk with one enzyme added. It cuts the lactose and leaves the fat, the other proteins and everything else completely alone — in a liquid packed with molecules it could in principle get at. What stops it touching any of them?',
      choices: [
        { t: 'It is used up by the lactose before it can reach anything else.', ok: false,
          why: 'An enzyme is not used up at all. One molecule cuts lactose after lactose, thousands of times, and is still there at the end. If being consumed were the limit, the milk would never finish.' },
        { t: 'Its folded shape has a pocket that only lactose fits into.', ok: true,
          why: 'The shape is the specificity. A pocket that fits lactose does not fit a fat or another sugar any more than a key fits the wrong lock — which is also why cooking an enzyme ruins it, since the pocket goes with the shape.' },
        { t: 'It only works at the acidity of milk, and the other molecules need a different acidity to react.', ok: false,
          why: 'Enzymes do have an acidity they work best at, and that tunes how fast one works, not what it works on. Everything in the carton is at the same acidity anyway.' },
        { t: 'It is far too big to reach into the fat droplets, so only what is dissolved is exposed to it.', ok: false,
          why: 'Milk’s other sugars and its small proteins are dissolved right alongside the lactose and are left alone too. Being reachable is not the same as being a fit.' },
      ],
      after: 'A protein’s job is its shape. That is why there are tens of thousands of different ones in you and each does one thing.',
      tryIt: 'In Fold, change one bead in the middle of a settled chain and watch how much of the shape moves.',
    },

    /* ---- Sweet ---- */
    {
      id: 'cow-grass', field: 'four', sim: 'sweet',
      ask: 'A cow lives on grass. You would starve on it, even though grass is mostly cellulose and cellulose is made of glucose — the same glucose you live on when you eat a potato. What is a cow doing that you cannot?',
      choices: [
        { t: 'Chewing it for far longer, which grinds the chains into pieces small enough to absorb.', ok: false,
          why: 'Chewing breaks cells open and never touches a bond. You could blend grass to a paste and get nothing out of it; the joins are untouched by anything mechanical.' },
        { t: 'Keeping a tankful of microbes whose enzymes are the right shape for that join.', ok: true,
          why: 'The cow cannot digest cellulose either. It carries a stomach full of bacteria that can, and lives on what they hand over. A pocket shaped for the starch join does not fit the cellulose one, and no amount of wanting changes the shape.' },
        { t: 'Making a much stronger acid in its stomach, which breaks bonds yours cannot.', ok: false,
          why: 'A cow’s rumen is close to neutral — far less acidic than your stomach. If acid were the answer you would be the one eating grass.' },
        { t: 'Passing it through four stomachs, so each bond gets four chances at being broken.', ok: false,
          why: 'More passes at a bond nothing can break still gets you nothing. The chambers are there to hold the microbes and to send the cud back for more chewing.' },
      ],
      after: 'Same sugar, same reaction, same water going in. One ring is flipped over at every join, and that is the whole difference between a meal and a hedge.',
      tryIt: 'In Sweet, drop the gut enzyme on starch, then switch to cellulose and drop the same one.',
    },
    {
      id: 'bread-sweet', field: 'four', sim: 'sweet',
      ask: 'Hold a piece of plain bread in your mouth without swallowing and after a minute it tastes distinctly sweet. No sugar has been added and you have not swallowed anything. Where did the sweetness come from?',
      choices: [
        { t: 'The warmth of your mouth caramelised a little of the starch on the surface.', ok: false,
          why: 'Caramelising needs well over a hundred degrees. Your mouth is at body temperature, and the bread does not darken, which it would have to.' },
        { t: 'An enzyme in your spit is cutting the starch into pieces short enough to taste.', ok: true,
          why: 'Your spit carries amylase, which hydrolyses the join in starch. The glucose was there the whole time, locked up in chains too long for your receptors. Cut them and the same atoms are suddenly sweet.' },
        { t: 'Your spit is dissolving glucose that was already in the bread but trapped in the crumb.', ok: false,
          why: 'Bread has very little free sugar — baking uses most of what the yeast was given. And water alone on bread does not make it sweet; it takes spit.' },
        { t: 'Your tongue adjusts to the lack of other tastes and starts registering the starch itself.', ok: false,
          why: 'Starch sits on a tongue indefinitely without tasting of anything. Spit the bread out and rinse, and the sweetness goes with it — it was in the bread, not in you.' },
      ],
      after: 'Hydrolysis, happening in your mouth, with the by-product arriving on your tongue. The same reaction, with water going in, that this whole section is about.',
      tryIt: 'In Sweet, watch the gut enzyme working along a starch chain and letting glucose go.',
    },
    {
      id: 'cotton-rope', field: 'four', sim: 'sweet',
      ask: 'Cotton is almost pure cellulose, and cellulose is sugar. You can make a rope out of cotton strong enough to hold a person. A pile of sugar holds nothing at all. Where does the strength come from?',
      choices: [
        { t: 'The chains are far longer than sugar molecules, and long molecules tangle into something tough.', ok: false,
          why: 'Tangling does give some polymers their stretch. But cellulose is not tangled — it is laid out dead straight, and a tangle would make it soft rather than stiff.' },
        { t: 'The chains run straight, lie against each other, and hold on all the way down.', ok: true,
          why: 'Flipping every other ring makes the chain straight instead of coiled. Straight chains stack like planks and hydrogen-bond at every ring along their length. One of those holds is weak; thousands in a row is a rope.' },
        { t: 'The chains are cross-linked by proper bonds between them, which is what a fibre is.', ok: false,
          why: 'True of some materials — vulcanised rubber, a permed hair — and not of cellulose. There is no bond between one cellulose chain and the next; they are only holding hands.' },
        { t: 'Cellulose rings have an extra bond in them that sugar rings do not, which stiffens each ring.', ok: false,
          why: 'The ring is identical. Every difference between cellulose and the sugar in your tea is in how the rings are joined, not in what a ring is.' },
      ],
      after: 'Thousands of individually feeble holds, every one of them the same hydrogen bond that makes water odd, adding up to a tree.',
      tryIt: 'In Sweet, pick cellulose and press “Stack three of them”.',
    },

    /* ---- Two Faces ---- */
    {
      id: 'washing-up', field: 'four', sim: 'faces',
      ask: 'Hot water alone will not shift the grease off a plate. A drop of washing-up liquid and it comes away at once. The soap has not dissolved the grease — the grease is still grease. What has it done?',
      choices: [
        { t: 'Wrapped each bit of grease in molecules, tails inward, heads facing the water.', ok: true,
          why: 'A soap molecule has a polar head and a non-polar tail, so it can face both ways at once. A ball of them closes round the grease, tails inward, heads out — and the outside of that ball is something water will carry away.' },
        { t: 'Lowered the water’s surface tension, weakening the hydrogen bonds that were keeping it from getting under the grease.', ok: false,
          why: 'Soap does lower surface tension, which is why it foams and wets a surface better. But grease comes off into the water and stays off, which wetting alone cannot do.' },
        { t: 'Reacted with the fat and turned it into something that dissolves.', ok: false,
          why: 'That reaction is real — it is how soap is made in the first place — and it needs strong alkali and heat. At the sink nothing is reacting; the fat you wash off is the fat that was there.' },
        { t: 'Made the water slippery so the grease slides off rather than sticking.', ok: false,
          why: 'The slippery feel is soap on your skin, not on the plate. A dry plate rubbed with soap and then rinsed still has its grease; it takes soap and water together.' },
      ],
      after: 'One molecule with two faces, and it is the same molecule your cells are wrapped in. The only difference is the number of tails.',
      tryIt: 'In Two Faces, switch to the one-tailed molecule and watch what shape the crowd settles into.',
    },
    {
      id: 'needle-membrane', field: 'four', sim: 'faces',
      ask: 'Push a very fine needle through a cell and pull it out, and the membrane closes behind it as though nothing happened. Push a needle through a plastic bag and the hole stays. Both are thin sheets. Why does one heal?',
      choices: [
        { t: 'The membrane is woven out of long molecules that stretch and spring back, the way a sheet of rubber does.', ok: false,
          why: 'A membrane has no long molecules in it at all — each lipid is a small separate thing, not joined to its neighbours. There is nothing to spring.' },
        { t: 'Nothing in it is joined, so nothing broke, and the water shuts the gap.', ok: true,
          why: 'The lipids are not bonded to each other. They are held side by side only because the water will not have their tails out in the open. Push them apart and the same refusal shuts the gap, because a hole means exposed tails.' },
        { t: 'The cell detects the damage and builds new membrane across the hole.', ok: false,
          why: 'Cells do have repair machinery for bigger injuries, and it takes minutes. This closes instantly, in a dead cell as readily as a live one.' },
        { t: 'The pressure inside the cell pushes the membrane together from behind the needle.', ok: false,
          why: 'Pressure inside would push a hole open, not shut. An animal cell has barely any pressure anyway — it is the plant cells that are pumped up.' },
      ],
      after: 'A membrane is not built and not glued. It is what a crowd of two-faced molecules does in water, and it keeps doing it.',
      tryIt: 'In Two Faces, read the “what is holding it together” line while the sheet sits there.',
    },
    {
      id: 'store-fat', field: 'four', sim: 'faces',
      ask: 'A migrating bird, a hibernating bear and you all store spare energy as fat rather than as sugar. Sugar is easier to get at and far quicker to use. What is fat doing better?',
      choices: [
        { t: 'It holds about twice the energy per gram and carries no water with it.', ok: true,
          why: 'A fat is almost all carbon and hydrogen with nothing already part-burnt about it, so there is more to get out of each gram. Stored sugar also drags water along, which doubles the weight again. For anything that has to carry its store, fat wins twice over.' },
        { t: 'It cannot be broken down accidentally, so the store does not leak away between meals.', ok: false,
          why: 'Fat is broken down continually, which is the whole point of having it. A store nothing could open would be no use at all.' },
        { t: 'It is not soluble, so it does not upset the balance of water in the cells holding it.', ok: false,
          why: 'A real consideration, and a small one — a body stores glycogen in solution without trouble. It is the weight that decides.' },
        { t: 'It burns at a lower temperature, so less has to be spent getting the reaction going.', ok: false,
          why: 'Nothing in you is burnt in that sense; every step is run by enzymes at body temperature. Getting fat going actually takes more steps, not fewer.' },
      ],
      after: 'Sugar is the current account and fat is the savings. One is quick to reach and heavy to carry; the other is the opposite.',
      tryIt: 'In Two Faces, read the two energy bars at the bottom of the panel.',
    },

    /* ---- Letters ---- */
    {
      id: 'copy-itself', field: 'four', sim: 'letters',
      ask: 'A cell copies all of its DNA before it divides, and the copy is right to about one letter in a billion. Nothing in the cell knows what the sequence is supposed to say, and nothing is comparing the copy with a reference. How is the copy right?',
      choices: [
        { t: 'Each base only fits one partner, so the old strand decides what goes opposite it.', ok: true,
          why: 'The sequence is its own instruction. Pull the two strands apart and each one is a list of exactly which base has to go in at each position, because only one of the four will fit the width and the hydrogen bonds at the same time.' },
        { t: 'The cell keeps one master strand that is never read, and checks every new chain of bases against it.', ok: false,
          why: 'There is no master. Both strands of every chromosome get used, and both get copied; there is no untouched original anywhere.' },
        { t: 'The copying enzyme holds the whole sequence of bases inside its own folded structure as it goes.', ok: false,
          why: 'The same machinery copies every sequence there is, and it is far too small to hold three billion letters. It reads what is in front of it, one at a time.' },
        { t: 'Wrong bases go in freely, and the chains that end up carrying them are broken up afterwards.', ok: false,
          why: 'Proofreading is real and it is a tidy-up, not the mechanism. It catches what slips through; it does not supply the answer in the first place.' },
      ],
      after: 'That is the thing the pairing is for. Not a rule to remember — a way for a molecule to be a set of instructions for rebuilding itself.',
      tryIt: 'In Letters, press “Fill the other strand in for me” and see how little choice there was.',
    },
    {
      id: 'same-rail', field: 'four', sim: 'letters',
      ask: 'The sugar-and-phosphate rail of DNA is identical in you, in an oak tree and in the bacteria on a doorknob — the same two parts, over and over, for the whole length of every strand. Why has nothing ever varied it to carry more information?',
      choices: [
        { t: 'It is the strongest arrangement available, and anything else would come apart.', ok: false,
          why: 'RNA uses a sugar with one more oxygen on it and holds together fine; it is less stable and perfectly workable. Strength is not what has fixed it.' },
        { t: 'It has to be the same everywhere so that one strand can pair with another.', ok: false,
          why: 'Pairing is done by the bases. Two rails never touch each other, and strands with quite different backbones can be made to pair in a laboratory.' },
        { t: 'Because it never varies, the part hanging off it is free to.', ok: true,
          why: 'The thing holding a message together must not be part of the message. A rail that meant something would have to be a particular sequence to hold together at all, and then it could not be any sequence — which is the only thing a message needs to be.' },
        { t: 'Making two parts over and over is cheaper for the cell than making a variety.', ok: false,
          why: 'The cell makes four different bases anyway and thinks nothing of it. Cost is not the constraint; if varying the rail bought anything, it would be worth it.' },
      ],
      after: 'Same trick as a row of letters on a page: the paper has to be blank, or it could not hold any sentence you liked.',
      tryIt: 'In Letters, change the bases and watch what happens to the rail. Nothing does.',
    },
    {
      id: 'wrong-base', field: 'four', sim: 'letters',
      ask: 'Four bases, so a copying machine putting one in opposite an A has four to choose from and no way of knowing which is right. It gets it wrong roughly once in a hundred thousand tries, before any proofreading. What is keeping it right the rest of the time?',
      choices: [
        { t: 'Only one of the four is the right width to fit between the two rails.', ok: false,
          why: 'Half right, and not enough on its own. Two of the four are the right width opposite an A, so width alone would leave you choosing between them.' },
        { t: 'The right width, and the little hydrogen bonds along the edge lining up as well.', ok: true,
          why: 'Two tests, not one. A double ring must face a single ring or the rails buckle — and of the two that pass that, only one has its hydrogen-bond donors opposite the other’s acceptors. Pass both and exactly one base is left.' },
        { t: 'The enzyme compares each base against the one on the old strand before it bonds it in.', ok: false,
          why: 'Nothing in the machine knows what A is. It feels whether what has arrived sits properly, and a wrong one does not.' },
        { t: 'The wrong nucleotides are held elsewhere in the cell and never reach the growing chain.', ok: false,
          why: 'All four float about together in the same soup and all four arrive at the growing end constantly. They are sorted at the moment of fitting, not before.' },
      ],
      after: 'Two shape tests, both of them passive, both of them just geometry. Ten pairs are possible and two survive.',
      tryIt: 'In Letters, try pairing A with G, then A with C, and read what each one fails on.',
    },
  ];

  BL.quizAdd(BANK);
})();
