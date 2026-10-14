# Bond Lab, and the Life Lab

Two labs on one machine. **Bond Lab** (`index.html`) is Chapter 2: atoms, electrons, bonds, water. **The Life Lab** (`life.html`) is Chapter 3: carbon, the one reaction that builds everything alive, and the four families it makes. Each hub links to the other, they share every line of shell code, and a learner sets up the display once for both.

Instruments for things too small to see. Poke them and watch what happens. Works in light and dark, with adjustable text size, high contrast and calm motion (the **Display** button).

Built for middle school chemistry. The aim is not memorized facts but an intuition that transfers: learners should come away with a feel for *why* things behave as they do, so a new situation is something they can reason about instead of recall.

Two things shape everything here. **Bonding is one spectrum, not a box of names** — covalent, polar, ionic, hydrogen bonds, ion–dipole, van der Waals are one question (how evenly do two atoms share?) asked at different settings, and the lab is arranged so you can slide between them without anything jumping. And **a bond is a consequence of what electrons cost**, not of atoms wanting full shells; the shells are the receipt.

**Numbers are off by default.** Everything is measured, and the measurements are all still there behind **Display → Show the numbers**. What shows first is a word tied to something a learner has touched — "a hot kettle shakes it loose", "room warm", "sodium hands it over" — and a bar, because *more than / less than* is usually the real question.

It installs. Served over https it is a progressive web app: add it to a home screen or install it from the browser's address bar and it opens full screen, with its own icon, and keeps working with no network at all — which matters in a classroom on school wifi, or on a tablet in a car.

No build step, no dependencies. Open `index.html` or `life.html`, or serve the folder.

```
python3 -m http.server 8000     # then visit http://localhost:8000
```

## What is in it

| Field | Instrument | Idea it makes touchable |
|---|---|---|
| Atoms | **Rungs** | Electron energy comes in rungs, not a ramp. Light of the wrong energy passes straight through; light of exactly the right energy is swallowed. White light shows the rungs as dark gaps. |
| Atoms | **Cloud** | An orbital is a place an electron is likely to be found. One snapshot is scatter; thousands make a shape. Slice it open to find the empty rings. |
| Atoms | **Shells** | Pull an atom's outer electron and measure the cost, atom by atom. The saw-tooth builds itself, and so does the cliff after a full shell. |
| Atoms | **Fill** | Give electrons away or share them until every outer ring is full. A quick way to predict a molecule's shape — and the instrument says plainly that it is bookkeeping, not a cause, and points at **Meet**. |
| Bonding | **The Spectrum** | The spine of the whole lab. One rail from evenly shared to handed over, with nothing jumping at the boundaries; double and triple bonding tighten the sharing end. Park a neighbour alongside and the hold that forms — hydrogen bond, dipole–dipole, ion–dipole, van der Waals — follows from how uneven the bond already was. Drag the neighbour away to see which holds reach and which die touching. |
| Bonding | **Meet** | Can one of these two afford to hand an electron over? Drag the electron across and find out: the cost of pulling it off, what the taker pays, what the resulting charges pay back. Nothing in the sum counts shells, and it still gets salt, water, magnesium oxide and methane right. A map of every element by how tightly it holds on shows the metal/non-metal split arriving rather than being announced. |
| Bonding | **Tug** | A close-up of one stretch of the rail. Change how hard each atom pulls and watch the cloud lean; bring a charge nearby and watch it lean further, or turn the whole molecule round. |
| Bonding | **The Well** | Every attraction is a valley in an energy landscape. Heat fills the valley. A hand is a weak spring. Real depths (kJ/mol), real distances (angstroms) and real temperatures decide what holds. |
| Bonding | **Handshake** | Hydrogen bonds are hands that only grip when they line up. Turn a molecule and the grip comes and goes; heat a crowd and the handshakes let go, sooner for weaker hands. |
| Bonding | **Flicker** | Even atoms with no charge stick together, faintly: their electron clouds slosh and the sloshes line up. Switch the jiggle off and the pull vanishes; compare small and big atoms, then cool a crowd of each gas to see which cling. |
| Water | **The Molecule** | One water molecule, and the two things that make it odd: lopsided bonds, and a bend that stops the two lopsided pulls cancelling. Open the angle and the molecule's pull collapses; bring a second one in and the hydrogen bond goes with it. Carbon dioxide is the control. |
| Water | **Cling** | A drop on three surfaces. Whether it beads or spreads is a contest between the surface's grab and the water's grip on itself. Tilt the surface and see who lets go first. |
| Water | **Skin** | Molecules at the edge have neighbors on one side only, so they are pulled inward. Poke the skin, weaken the grip with soap, and see why a drop wants to be round. |
| Water | **Climb** | Water climbs a thin tube, higher the thinner it is. Change the surface, the grip and gravity (or take it to the Moon) and see what the rise depends on. |
| Water | **Float** | Cool a sheet of molecules with three hands each and it gets *less* dense: the hands pull it into an open honeycomb. A block of that floats in its own liquid. Molecules with no hands never do this. |
| Water | **Slow** | The same heat into three boxes, three different temperatures. Water-like molecules spend heat letting go of handshakes, so they warm slowly, and cool slowly, too. |

Each instrument has a short list of quiet things to try (not instructions). They tick off when the learner actually produces the situation, and the hub remembers them in the browser.

**Progress can be put back.** Every instrument's list ends with *Start this one over*, which clears that module's ticks and the calls committed to in it. **Display → Progress** says how much this lab remembers and clears the lot — ticks, calls and challenge answers — for the lab you are in and no other, leaving the display settings alone. Both are two-tap: the button arms, says what it is about to do, and forgets it was asked after a few seconds. Nothing is stored anywhere but the browser, so another browser or another device starts fresh either way.

Separately, every instrument carries three **challenges** — 48 in all (`js/quiz.js`). Each is about something ordinary that gets walked past without asking: why a sparkler flares and the argon in a window does nothing, why every snowflake has six sides, why a paperclip floats until somebody adds soap, why a kettle boils dry in minutes but splitting the same water takes hours.

**All four answers are mechanisms.** This is the part that is easy to get wrong. If three options are folk explanations ("salt is softer", "paper is absorbent") and the fourth is the only one that mentions electrons, a learner who knows no chemistry scores full marks by picking whichever one sounds like chemistry — they have been tested on register, not understanding. So every option names real forces, real particles, real energies, in the same voice, and each wrong one is wrong for a reason you could put a finger on: the right force at the wrong scale, the right idea with the sign flipped, a true fact that does not answer this question, a rule that is real but does not apply here. Several are things textbooks still print — that a microwave is tuned to water's resonant frequency, that a gecko has suction cups, that a pond freezes from the bottom up because water is densest at 4 °C.

The file is written to be checkable, and it is worth re-running those checks after editing it. In Bond Lab's 48 the correct answer is the strictly longest option in 8% (chance is 25%), uniquely the most technical in 6%, and the only one using chemistry vocabulary in 2%. In the Life Lab's 30 all three are at 0%, and "pick the shortest" lands at 23%. None of the usual shortcuts work in either. Every option also carries a `why`, revealed on all four once an answer is picked, because finding out exactly why a tempting wrong answer fails is worth more than being told the right one.

Every water instrument draws real water molecules: an oxygen, two hydrogens at the real 104.5° bend, a lone-pair lobe on the back, and hydrogen bonds drawn from a hydrogen to somebody's lone pair rather than centre to centre (`js/moldraw.js`). The physics underneath is unchanged — the model always had the hydrogens in those places; it was only ever drawn as a disk with four dots.

## The Life Lab

Chapter 3 arrives as four dozen names and is really one mechanism applied four times. The hub says that before a learner reads a word: carbon first (why any of it is possible at all), then the one build/break reaction, then the four families as four runs of it.

| Field | Instrument | Idea it makes touchable |
|---|---|---|
| Carbon | **Four Hands** | Carbon holds on in four directions, and that is the whole reason it is the backbone. In three dimensions, because the four hands point at the corners of a tetrahedron and a flat cross would be a lie: drag to turn it over, click a spare hand and another atom joins on, build a chain that zigzags the way a real one does, bend a branch out of it, curl it into a chair-shaped ring. Pick a bond and twist it and the far half of the molecule really rotates about it. Make it double and it locks, with the plane it is stuck in drawn in. |
| Carbon | **Handles** | A hydrocarbon on its own is good for burning and nothing else. Bolt a group onto a spare hand and it becomes vinegar, antifreeze, the smell of old fish, or an amino acid. The panel at the bottom is the payoff: the four bond names of the next section fall out of which two handles happen to be facing each other. |
| Carbon | **Twins** | Isomers, with the parts counter pinned to the screen so it is obvious nothing was added or taken away. Three pairs: where the oxygen sits (a drink or a propellant), where the branch sits (a lighter that works in the cold), and which side of a double bond the chain left on (butter or olive oil). |
| Building and breaking | **The Template** | The spine. Two blocks with their handles facing each other and one slider: right and a water molecule is squeezed out, leaving a bond; left and the water goes back in and the bond is gone. Four tabs change the parts and the name of the bond and change nothing else. The hill in the energy picture is the hand-off to Hurry Up. |
| Building and breaking | **Chain** | Run the template a hundred times and keep the receipts: n blocks, n−1 bonds, n−1 waters, in every family. The size names — mono-, di-, oligo-, poly- — change on the readout while nothing about the molecule does. |
| Building and breaking | **Hurry Up** | Chapter 3's bench lab, Fruity Enzymes, with the bowl on the screen. Gelatin sets because its long chains tangle; bromelain cuts them, so the jelly never sets — unless you boil the juice first, and then the enzyme unfolds and does not come back. One panel is the energy hill with and without it, one is rate against temperature filling in as you hold each setting, and one is the three tubes as you would line them up on a worktop. |
| The four families | **Fold** | Set the order of the beads; the water decides the shape. The four levels of protein structure are measured off the screen rather than asserted. Cook it and the shape goes and does not come back, because by then the chains have got hold of each other. |
| The four families | **Sweet** | The same glucose, joined two ways. Every ring the same way up and the chain coils — starch, which your spit is shaped for. Every other ring flipped and it runs straight — cellulose, which stacks into wood and which your enzymes cannot touch. Drop the same gut enzyme on each. |
| The four families | **Two Faces** | Drop lipids into water and leave them alone. Nothing in the model pulls them into a shape; the water refuses the tails and the sheet is what is left over. Take the head off and there is no membrane to be had. |
| The four families | **Letters** | Base pairing as a shape rather than a rule. Two double rings shove the rails apart, two single ones pinch them, and most of the pairs that are the right width have their hydrogen bonds facing the wrong way. Ten pairs, two survivors, all of it arrived at by clicking. |

The Life Lab's check-offs go further than Bond Lab's. Each one says exactly what to poke and how, and asks for a prediction *before* you poke it — one click, no going back — and only says whether the call held once the instrument has seen the thing happen (`BL.protocol` in `js/core.js`). Watching something happen is not the same as having expected it, and a learner who only watches finds out nothing while feeling like they did.

It carries its own thirty challenges (`js/life/quiz.js`), written to the same rule and measured against it: tinned pineapple in a jelly, why a cut apple stops going brown after ten seconds in boiling water, why a perm outlasts a blow-dry, why a cow eats grass and you cannot, why washing-up liquid works, why a label can say "sugars 2 g" and "carbohydrate 70 g" about the same molecule.

## How the instruments are meant to teach

These are the rules every instrument follows. Use them as a checklist when adding one.

1. **Perturb, do not present.** Every idea is reached by changing something and watching what answers: pull, heat, charge, swap an atom.
1b. **Predict before you poke.** Watching something happen is not the same as having expected it, and a learner who only watches finds out nothing while feeling like they did. The Life Lab's check-offs ask for a call first — one click, no going back — and only say whether it held once the instrument has actually seen the thing happen.
2. **Labels arrive after the experience.** Words like "polar covalent" appear as names for regions the learner has already explored, and the dial makes clear the boundaries are conventions.
3. **One quantity, many phenomena.** The Spectrum is about how unevenly electrons are shared, and everything downstream — every between-molecule hold, every property of water — is that same quantity acting outside the molecule instead of inside it. The Well is about depth versus heat.
4. **Say what the model is not.** Where an instrument teaches a shortcut that is useful but not a cause — Fill's octet puzzle, Meet's round-number payback — it says so on the page, rather than leaving a learner to find out later that they were told a story.
5. **True scale where it matters.** In The Well's *All four* view the depth bars are drawn on one linear scale, so van der Waals is a sliver. That is the point.
6. **Honest about being a model.** See below.

## Installing it, and working offline

`manifest.webmanifest` and `manifest-life.webmanifest` make the two labs installable, and `sw.js` keeps both working without a network. They are plain files; there is still nothing to build. Each lab installs separately, with its own icon and its own name, and both share one service worker and one saved set of display settings.

The service worker is **network-first**, which is the opposite of the usual advice and deliberate. Cache-first is faster and means a classroom that opened the page last term keeps seeing last term's page, with no way to tell. Here, if there is a network you get what is on the server, and the cache is only the fallback when there is not. The page itself is fetched with the browser's HTTP cache switched off, so the one file that decides which version of everything else you see can never be a stale copy somebody's proxy held on to. Fonts are the one exception — large, and unchanged since the first commit — so they come from the cache.

Two things worth knowing when an update does not appear:

- **GitHub Pages is a CDN.** It serves assets with `Cache-Control: max-age=600`, so a change can take up to ten minutes to reach a browser that already has the old one, service worker or not. A hard reload skips it.
- **The site deploys from `main`.** Work sitting on a branch, however thoroughly pushed, changes nothing about what is live until it is merged.

`tools/gen-icons.js` draws both icons — two atoms sharing a leaning cloud for Bond Lab, two blocks joined with a drop of water lifting off for the Life Lab — and renders every size the web asks for — 192 and 512 for Android, a maskable pair for launchers that crop to a circle, a 180 for iOS, 32 and 16 for the tab, and the scalable `assets/icon.svg`. Chromium does the rasterising, so it needs Playwright, the same as the smoke test. Edit the drawing at the top of that file and re-run it; nothing else references the sizes directly.

The one-file build strips the manifest, the icon links, the service-worker registration and the card linking to the other lab, and inlines the icon as a data URI, because a single HTML file has no sibling files to point at and no origin to register against.

## Deploy to GitHub Pages

1. Push this folder to the `main` branch of a repository.
2. Repository **Settings**, then **Pages**, then **Build and deployment**: Source **Deploy from a branch**, Branch **main**, folder **/ (root)**.
3. The site appears at `https://<user>.github.io/<repo>/` within a minute or two.

`.nojekyll` is included so Pages serves every file as is. All paths are relative, so it works under a repository subpath.

Both labs go up together; `life.html` is a sibling of `index.html` and all paths stay relative.

Other builds: `node tools/bundle.js` writes a single self-contained `dist/bond-lab.html` (CSS, JS and fonts inlined), good for emailing or a USB stick, and `node tools/bundle.js --life` does the same for `dist/life-lab.html`.

## Layout

```
index.html          Bond Lab's shell: header, #view, script tags
life.html           the Life Lab's shell: the same machine, different instruments
                    (order matters in both: core, lab config, engines, instruments, quiz, app)
manifest.webmanifest  name, icons, colours: what makes Bond Lab installable
manifest-life.webmanifest  the same for the Life Lab
sw.js               offline, network-first, so an update is never invisible
css/style.css       light, dark and high-contrast tokens at the top
assets/             self-hosted fonts (Atkinson Hyperlegible Next, Bricolage Grotesque)
assets/icons/       both app icons at every size the web asks for (generated)
js/core.js          helpers: canvas stage, pointer drag, loop, goals, guided protocols, registry,
                    display settings, plain-language word scales, meters, folds, electron spheres,
                    filled clouds, the element palette
js/view3d.js        the one way to turn a solid over, everywhere: drag to orbit (with momentum),
                    pinch or wheel to zoom, double-tap to go home, arrow keys, and a claim
                    system so a press can grab an atom instead of turning the view
js/app.js           hash router and hub page, shared by both labs, driven by BL.lab
js/lab-bond.js      what Bond Lab is: name, fields, spine, the link to the other lab
js/lab-life.js      the same for the Life Lab
js/quizkit.js       the challenge card, its marking and its storage — shared
js/quiz.js          Bond Lab's 48 challenges
js/moldraw.js       how a molecule looks: water, H2S-like, methane-like, ions, hydrogen bonds
js/physics.js       energy wells and a thermostatted two-particle simulation
js/atoms.js         hydrogen-like levels, orbital samplers, ionization and electronegativity data
js/water2d.js       flat rigid-body "handshake" model (four hands per molecule, Langevin thermostat)
js/drude.js         dispersion forces from sloshing charge
js/lattice.js       lattice water model (three hands per molecule), Monte Carlo
js/<name>.js        one file per Bond Lab instrument
js/life/draw.js     how an organic molecule looks: lettered atoms, single/double/triple bonds,
                    rings, functional-group pills, fatty tails, and the four monomers
js/life/geom.js     3D positions for a molecule from a plain atom-and-bond list (tetrahedral, staggered)
js/life/fold3.js    the 3D bead chain behind Fold
js/life/lipid.js    amphiphiles in implicit water, for Two Faces
js/life/quiz.js     the Life Lab's 30 challenges
js/life/<name>.js   one file per Life Lab instrument
tools/              Node checks and the browser smoke test (below)
```

### Adding an instrument

Create `js/<name>.js` (or `js/life/<name>.js`), add its `<script>` tag to that lab's HTML before `js/app.js`, and register it:

```js
BL.register({
  id: 'example', field: 'water', order: 9, name: 'Example',
  tagline: 'One line that makes you curious.',             // hub tile
  lede: 'One plain sentence saying what you are looking at and what to do.',   // above the stage
  art: '<svg viewBox="0 0 200 120">…</svg>',         // hub tile art
  goals: [{ id: 'x', text: 'Do the thing.' }],
  mount({ stage, aux, dock }) {                      // three slots: pinned stage, wide readouts, controls
    // build into those elements, return { destroy() {} }
  },
});
```

`field` must be one of the `fields` in that lab's config file. To show a tile for something not built yet, add it to `planned` there.

For a Life Lab instrument, prefer `BL.protocol(host, id, defs)` over `BL.goals`: it takes the same `{id, text}` and adds `how` (the exact move to make) and `ask`/`opts`/`right` (the call to commit to before poking). It shares storage with `BL.goals`, so the hub's progress pips need no special case.

## What the models simplify

Worth knowing before putting these in front of a class.

- **The Spectrum** and **Tug** use Pauling electronegativity and Pauling's ionic-character estimate, `1 - exp(-ΔEN²/4)`. No bond comes out as exactly 0% or 100%. The zone edges are conventions (books draw them near ΔEN 0.4–0.5 and 1.7–2.0) and both instruments show the curve running smoothly through them; sodium chloride lands just the ionic side, as anyone would expect of table salt. The Spectrum's between-molecule depths are the same kJ/mol figures The Well simulates, so the two line up, and the distance falloff is a single power law per kind — right in order (ion–dipole reaches furthest, van der Waals dies first), rough in size.
- **Meet** costs a handover as `payback + electron affinity − ionization energy`. The two measured values are real. The payback is the pull between the + ball and the − ball you are left with — but you only get two charged balls if the electron actually stays where you put it, so it is scaled by how much harder the taker grips than the giver (the difference in their Mulliken electronegativities, which is built from the same two measured numbers). Between two atoms that hold electrons equally loosely, almost none of the payback is earned, which is why no pair of metals comes out ionic.

  That scaling is not decoration. An earlier version handed out a flat payback regardless of who was taking, and the instrument drew Na⁺K⁻ and called it ionic — the most wrong thing a module about what bonds with what could say. `tools/check-meet.js` now pins the behaviour down: every real salt, every molecule, the two genuinely borderline cases, and an exhaustive sweep of all 136 pairs confirming that no two metals ever come out ionic.

  Two known misses, reported by that checker rather than hidden: it calls aluminium chloride and silicon tetrafluoride ionic when both are really covalent. Both are small, highly charged cations that distort the anion far enough to pull the bond back towards sharing — Fajans' rules — which measured ionization energies and electron affinities cannot see on their own. Two out of 136, both genuinely borderline.
- **The Molecule** adds the two bond tugs as arrows, which is the real reason carbon dioxide has no overall pull and water does. The bend and the difference in pull are both free to move, which real molecules are not.
- **Cloud**'s filled body is the real hydrogen-like density, added up along the line of sight. Two liberties are taken to make it legible, both the same ones a photograph of a nebula takes. The brightness scale is compressed hard, because the density across a 1s cloud runs over four orders of magnitude and shown straight it would be a dot. And the faintest tail is simply not painted, because a cloud has no edge — it only gets dimmer forever — and drawn honestly it fills the frame with haze. Where the body stops is close to where a textbook draws its boundary surface, and for the same reason. Nothing is smoothed or stylised beyond that: the empty rings in a sliced 3s, the four lobes of a 3d, and the sphere a whole p subshell adds up to are all the arithmetic, not a drawing.
- **Atoms** uses hydrogen-like levels for the rungs, cloud shapes and slices, and real measured ionization energies and electronegativities for the atom-by-atom instruments. Many-electron atoms are not solved; the effective charge shown is a textbook estimate.
- **The Well** simulates only the distance between two particles (a 1D relative coordinate with a 3D entropy term) under a thermostat. Depths and resting distances are textbook values for H–H, an Na⁺Cl⁻ pair, an O–H···O hydrogen bond, HCl···HCl, Na⁺···OH₂ and Ar···Ar. Vibration speeds are compressed so the eye can follow them. The "room" a free pair can wander in is a fixed size, so the temperatures where pairs come apart are right in *order* and rough in *size*. After a big change in heat the simulation runs faster for a moment; the chart shows the long-run answer.
- **Handshake, Cling, Skin and Slow** are **two-dimensional toy models**: flat molecules, each with two hands that give a hydrogen and two that receive one, plus a general stickiness. The temperature scale is calibrated so the water-like crowd comes apart near 373 K and the other kinds fall where they fall, so the order is right and the exact numbers are not. A flat crowd is not a 3D liquid; surface tension and contact angles come out in the right direction, not the right size.
- **Climb** is a calculation, not a simulation: the textbook balance of rim pull against weight, `h = 4γcosθ / (ρgd)`, with γ set by how tightly the water grips itself and θ by how the surface's grab compares with that grip (matching the drops in Cling). The close-up beside the tubes is a drawing of the idea. A molecule-by-molecule capillary needs thousands of molecules and was too noisy to teach from.
- **Float** is a Monte Carlo lattice model: a triangular grid where each molecule has three hands 120° apart, and the sheet trades molecules with a reservoir so its density can change. Cooling it opens a honeycomb, and the density peak sits mid-range. The numbers on the axis are relative, not degrees (real water is densest near 4 °C). It shows *why* the anomaly happens, not its size.
- **Slow** runs three crowds and reads each one's temperature off a table of energy against temperature measured from the same crowd (`tools/gen-caloric.js`). The handshake counts are live. At the very low end the model has a flat region where nothing can move; that is a quirk of a flat classical model.
- Nothing here shows boiling or freezing as sharp transitions. They come out smeared, because the crowds are small.

And for the Life Lab:

- **The Template** and **Chain** are drawings and bookkeeping, not simulations. The reaction coordinate's hill is a shape, not a calculated barrier; what it is there to say is that both ends are stable and something is in the way, which is true of every one of these reactions and is the reason enzymes exist at all. Chain's energy ledger comes out exactly even on purpose, because that is what the chemistry says about one bond made and the same bond broken.
- **Hurry Up** is a plain-language enzyme model: activity rises with temperature as `exp((T−278)/13)`, unfolding starts near 45 °C and runs away from there, and the rate saturates in the substrate the way Michaelis and Menten's does. The constants are chosen so the three tubes on the bench come out the way the real lab does, and `tools/check-enzyme.js` pins exactly that — juice on ice sets, juice at room warmth stays runny, boiled-then-cooled juice sets, the rate peaks and then falls off a cliff, unfolding is one-way, and more substrate stops helping once the enzymes are busy. The bowl on screen runs about twelve times faster than the bench panel's twenty minutes so nobody has to wait, and it says so on the page.
- **Fold** is a 2D bead chain under a Langevin thermostat: a spring along the backbone, a weaker one three beads along (that is the backbone holding on to itself), an attraction between non-polar beads, charges pulling and pushing, and a mild outward preference for the polar ones. All four levels are measured from the beads' positions rather than asserted. What it gets right is the mechanism — non-polar inside, charges paired, heat taking the shape away, and chains that end up stuck to each other rather than refolding. What it does not have is real amino acids, real bond angles or a real helix; the coil is two-dimensional.
- **Two Faces** has no force in it that makes a membrane. The whole model is: the water will not have the non-polar beads, a head will not sit among tails, heads take up room, and nothing sits on top of anything. Tails lying parallel grip harder than tails crossing at an angle, which is what makes a kinked tail a worse neighbour than a straight one. What falls out of that — a sheet from two tails, balls from one, a droplet from none — falls out, and `tools/check-lipid.js` runs each shape over several seeds to make sure it keeps falling out. A sheet that has tucked its ends round into a closed bag counts as a sheet, because that is what real bilayers do and it is what a cell is. The readout says what actually formed on this run rather than what was meant to.

  One thing it deliberately does not claim. A flat model like this does not reproduce a membrane freezing: measure how far a lipid actually travels in the cold and the kinked one comes out very slightly *slower*, which is the wrong way round. So the instrument never says "which one goes stiff first". It reads the thing underneath instead — how tightly the tails have managed to pack — where the model is both right and emphatic, a straight-tailed sheet packing about 1.5× tighter at every temperature. Tight packing is what being solid *is*, so the butter-and-olive-oil point still lands, and **Twins** carries the two molecules themselves.
- **Four Hands** is real three-dimensional geometry, not a drawing of some. Spare hands are worked out from where an atom's neighbours already are — one neighbour gives three directions at the tetrahedral angle, staggered against the grandparent so chains zigzag; two give the pair left over either side of their plane; three give the one gap — so a bare atom, a chain end, a branch point and a ring corner all come out of the same few lines. A twist is a Rodrigues rotation of everything past the bond, about that bond's own axis. What it does not do is relax: bond lengths are all 1 and angles are all ideal, nothing repels anything, and a ring is placed rather than found. It is a model of what carbon's hands allow, not of what a molecule settles into.
- **Fold** is a chain of beads in three dimensions with one rule — non-polar beads go together, wet ones do not mind — plus the backbone's own stiffness. Heat scales the non-polar attraction nearly to nothing, so the chain opens and cannot find its way back until it is cooled; pulling it straight and letting go refolds it. `tools/check-fold.js` checks it folds with its non-polar beads inside, that an all-wet chain stays loose, that an all-non-polar one is tighter, that heat opens it and cooked links persist, and that a pulled chain refolds, across three seeds. It is a toy chain: there is no real protein's sequence, no secondary structure, and the compactness numbers are chosen so the difference is plain, not measured.
- **The 3D panels** (water's lone pairs in The Molecule, real ice in Float, the double helix in Letters, the bilayer/micelle/droplet in Two Faces) are drawn from real geometry, not decoration, but are not simulations. Ice is hexagonal ice Ih laid out from its unit cell (a = 4.52 Å, c = 7.37 Å, nearest oxygens 2.76 Å apart), so the channels you can look down are genuinely there. The melt slider is a picture of the lattice slumping into its own holes — each molecule drifts toward the nearest channel and starts to wobble — with the density read off the real 0.917 → 1.00 g/cm³; it is not a molecular-dynamics melt.
- **Sweet** and **Letters** are models of shape, not simulations. Sweet's two chain geometries are the real reason starch coils and cellulose does not, drawn rather than computed. Letters tests a pair on two things — one double ring facing one single ring, and hydrogen-bond donors facing acceptors all along the edge — which is enough to leave exactly A–T and G–C standing out of the ten, and is the real reason; but it is a peg-and-hole cartoon of it.

## Checks

```
node tools/check-physics.js     # wells: bottoms, forces, stiffness, order of letting go
node tools/check-atoms.js       # levels, orbital samplers, periodic-table trends
node tools/check-meet.js        # Meet predicts the right kind of bond, and no two metals are ionic
node tools/check-water2d.js     # the flat water model (add --sweep for the temperature scan)
node tools/check-drude.js       # dispersion force
node tools/check-lattice.js     # density peaks mid-range for water-like, never for no-hands
node tools/check-enzyme.js      # Hurry Up reproduces the bench lab's three tubes
node tools/check-fold.js       # a chain folds with its non-polar beads inside, heat opens it, a pulled chain refolds, over several seeds
node tools/check-lipid.js       # lipids make what the chapter says they make, over several seeds
node tools/check-contrast.js    # WCAG contrast of the tokens in all four themes
node tools/bundle.js            # one-file build (add --life for the other lab)
node tools/gen-icons.js         # redraws the app icon at every size (needs Playwright)
node tools/gen-caloric.js       # regenerates Slow's table (--check just verifies the effect)

# needs Playwright: visits every route, reports console errors and horizontal overflow
NODE_PATH=<path to playwright> BL_OUT=./shots node tools/smoke.js light 390 844 2 index.html
NODE_PATH=<path to playwright> BL_OUT=./shots node tools/smoke.js light 390 844 2 life.html
```
