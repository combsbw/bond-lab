# Bond Lab

Instruments for things too small to see. Poke atoms, bonds and water molecules and watch what happens. Works in light and dark, with adjustable text size, high contrast and calm motion (the **Display** button).

Built for middle school chemistry. The aim is not memorized facts but an intuition that transfers: learners should come away with a feel for *why* things behave as they do, so a new situation is something they can reason about instead of recall.

Two things shape everything here. **Bonding is one spectrum, not a box of names** — covalent, polar, ionic, hydrogen bonds, ion–dipole, van der Waals are one question (how evenly do two atoms share?) asked at different settings, and the lab is arranged so you can slide between them without anything jumping. And **a bond is a consequence of what electrons cost**, not of atoms wanting full shells; the shells are the receipt.

**Numbers are off by default.** Everything is measured, and the measurements are all still there behind **Display → Show the numbers**. What shows first is a word tied to something a learner has touched — "a hot kettle shakes it loose", "room warm", "sodium hands it over" — and a bar, because *more than / less than* is usually the real question.

It installs. Served over https it is a progressive web app: add it to a home screen or install it from the browser's address bar and it opens full screen, with its own icon, and keeps working with no network at all — which matters in a classroom on school wifi, or on a tablet in a car.

No build step, no dependencies. Open `index.html`, or serve the folder.

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

Separately, every instrument carries three **challenges** — 48 in all (`js/quiz.js`). Each is about something ordinary that gets walked past without asking: why a sparkler flares and the argon in a window does nothing, why every snowflake has six sides, why a paperclip floats until somebody adds soap, why the pie filling burns your mouth and the pastry does not. None can be answered by remembering a definition, and each names the instrument that settles it and what to do when you get there.

Each has **four answers, and all four are meant to sound reasonable**. The three wrong ones are the explanations people actually give — plausible, often half-true, and wrong about the mechanism: steam burns worse because it is hotter than boiling water; the microwave is tuned to water's resonant frequency; the gecko has suction cups; the electron is moving too fast to photograph. Exactly one is right about what is really happening. A distractor nobody would pick teaches nothing; the useful ones are the ones a learner has to put down. They live on the hub per section and in each instrument under its readouts.

**Electrons are drawn as electrons.** Every one is a little shaded sphere, never a square pixel, and every cloud of them has a filled body underneath: a translucent region whose opacity is the density, thin at the edges and solid through the middle. In **Cloud** that body is the orbital itself, ray-marched — for each pixel the density is added up along a line going straight back into the screen, which is exactly what looking through something translucent does, and it is why a 2p comes out a dumbbell and a sliced 3s comes out with visible empty rings. It fades in as the catches pile up, so the story still runs the right way round: scatter first, then a shape out of the scatter. **Show** switches between the region, the catches, and both.

Every water instrument draws real water molecules: an oxygen, two hydrogens at the real 104.5° bend, a lone-pair lobe on the back, and hydrogen bonds drawn from a hydrogen to somebody's lone pair rather than centre to centre (`js/moldraw.js`). The physics underneath is unchanged — the model always had the hydrogens in those places; it was only ever drawn as a disk with four dots.

## How the instruments are meant to teach

These are the rules every instrument follows. Use them as a checklist when adding one.

1. **Perturb, do not present.** Every idea is reached by changing something and watching what answers: pull, heat, charge, swap an atom.
2. **Labels arrive after the experience.** Words like "polar covalent" appear as names for regions the learner has already explored, and the dial makes clear the boundaries are conventions.
3. **One quantity, many phenomena.** The Spectrum is about how unevenly electrons are shared, and everything downstream — every between-molecule hold, every property of water — is that same quantity acting outside the molecule instead of inside it. The Well is about depth versus heat.
4. **Say what the model is not.** Where an instrument teaches a shortcut that is useful but not a cause — Fill's octet puzzle, Meet's round-number payback — it says so on the page, rather than leaving a learner to find out later that they were told a story.
5. **True scale where it matters.** In The Well's *All four* view the depth bars are drawn on one linear scale, so van der Waals is a sliver. That is the point.
6. **Honest about being a model.** See below.

## Installing it, and working offline

`manifest.webmanifest` makes it installable and `sw.js` keeps it working without a network. Both are plain files; there is still nothing to build.

The service worker is **network-first**, which is the opposite of the usual advice and deliberate. Cache-first is faster and means a classroom that opened the page last term keeps seeing last term's page, with no way to tell. Here, if there is a network you get what is on the server, and the cache is only the fallback when there is not. The page itself is fetched with the browser's HTTP cache switched off, so the one file that decides which version of everything else you see can never be a stale copy somebody's proxy held on to. Fonts are the one exception — large, and unchanged since the first commit — so they come from the cache.

Two things worth knowing when an update does not appear:

- **GitHub Pages is a CDN.** It serves assets with `Cache-Control: max-age=600`, so a change can take up to ten minutes to reach a browser that already has the old one, service worker or not. A hard reload skips it.
- **The site deploys from `main`.** Work sitting on a branch, however thoroughly pushed, changes nothing about what is live until it is merged.

`tools/gen-icons.js` draws the icon and renders every size the web asks for — 192 and 512 for Android, a maskable pair for launchers that crop to a circle, a 180 for iOS, 32 and 16 for the tab, and the scalable `assets/icon.svg`. Chromium does the rasterising, so it needs Playwright, the same as the smoke test. Edit the drawing at the top of that file and re-run it; nothing else references the sizes directly.

The one-file build strips the manifest, the icon links and the service worker registration, and inlines the icon as a data URI, because a single HTML file has no sibling files to point at and no origin to register against.

## Deploy to GitHub Pages

1. Push this folder to the `main` branch of a repository.
2. Repository **Settings**, then **Pages**, then **Build and deployment**: Source **Deploy from a branch**, Branch **main**, folder **/ (root)**.
3. The site appears at `https://<user>.github.io/<repo>/` within a minute or two.

`.nojekyll` is included so Pages serves every file as is. All paths are relative, so it works under a repository subpath.

Other builds: `node tools/bundle.js` writes a single self-contained `dist/bond-lab.html` (CSS, JS and fonts inlined), good for emailing or a USB stick.

## Layout

```
index.html          shell: header, #view, script tags (order matters: core, engines, instruments, app)
manifest.webmanifest  name, icons, colours: what makes it installable
sw.js               offline, network-first, so an update is never invisible
css/style.css       light, dark and high-contrast tokens at the top
assets/             self-hosted fonts (Atkinson Hyperlegible Next, Bricolage Grotesque)
assets/icons/       the app icon at every size the web asks for (generated)
js/core.js          helpers: canvas stage, pointer drag, loop, goals, registry, display settings,
                    plain-language word scales, meters, folds, electron spheres, filled clouds
js/moldraw.js       how a molecule looks: water, H2S-like, methane-like, ions, hydrogen bonds
js/quiz.js          the everyday challenges and the card that renders them
js/physics.js       energy wells and a thermostatted two-particle simulation
js/atoms.js         hydrogen-like levels, orbital samplers, ionization and electronegativity data
js/water2d.js       flat rigid-body "handshake" model (four hands per molecule, Langevin thermostat)
js/drude.js         dispersion forces from sloshing charge
js/lattice.js       lattice water model (three hands per molecule), Monte Carlo
js/<name>.js        one file per instrument
js/app.js           hash router and the hub page
tools/              Node checks and the browser smoke test (below)
```

### Adding an instrument

Create `js/<name>.js`, add its `<script>` tag before `js/app.js`, and register it:

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

To show a tile for something not built yet, add it to `PLANNED` in `js/app.js`.

## What the models simplify

Worth knowing before putting these in front of a class.

- **The Spectrum** and **Tug** use Pauling electronegativity and Pauling's ionic-character estimate, `1 - exp(-ΔEN²/4)`. No bond comes out as exactly 0% or 100%. The zone edges are conventions (books draw them near ΔEN 0.4–0.5 and 1.7–2.0) and both instruments show the curve running smoothly through them; sodium chloride lands just the ionic side, as anyone would expect of table salt. The Spectrum's between-molecule depths are the same kJ/mol figures The Well simulates, so the two line up, and the distance falloff is a single power law per kind — right in order (ion–dipole reaches furthest, van der Waals dies first), rough in size.
- **Meet** costs a handover as `payback + electron affinity − ionization energy`. The two measured values are real. The payback is a deliberate round number (5.5 eV per unit of charge each way, four times that for a two-electron handover) standing in for the pull from every ion packed around the pair; the instrument says so on the page. Changing it would move a handful of borderline pairs across the line and would change nothing about how the decision is made. Verdicts come out right for salt, water, methane, carbon dioxide, magnesium oxide, the alkali halides and the calcium salts; aluminium chloride reads ionic when it is really closer to covalent.
- **The Molecule** adds the two bond tugs as arrows, which is the real reason carbon dioxide has no overall pull and water does. The bend and the difference in pull are both free to move, which real molecules are not.
- **Cloud**'s filled body is the real hydrogen-like density, added up along the line of sight. Two liberties are taken to make it legible, both the same ones a photograph of a nebula takes. The brightness scale is compressed hard, because the density across a 1s cloud runs over four orders of magnitude and shown straight it would be a dot. And the faintest tail is simply not painted, because a cloud has no edge — it only gets dimmer forever — and drawn honestly it fills the frame with haze. Where the body stops is close to where a textbook draws its boundary surface, and for the same reason. Nothing is smoothed or stylised beyond that: the empty rings in a sliced 3s, the four lobes of a 3d, and the sphere a whole p subshell adds up to are all the arithmetic, not a drawing.
- **Atoms** uses hydrogen-like levels for the rungs, cloud shapes and slices, and real measured ionization energies and electronegativities for the atom-by-atom instruments. Many-electron atoms are not solved; the effective charge shown is a textbook estimate.
- **The Well** simulates only the distance between two particles (a 1D relative coordinate with a 3D entropy term) under a thermostat. Depths and resting distances are textbook values for H–H, an Na⁺Cl⁻ pair, an O–H···O hydrogen bond, HCl···HCl, Na⁺···OH₂ and Ar···Ar. Vibration speeds are compressed so the eye can follow them. The "room" a free pair can wander in is a fixed size, so the temperatures where pairs come apart are right in *order* and rough in *size*. After a big change in heat the simulation runs faster for a moment; the chart shows the long-run answer.
- **Handshake, Cling, Skin and Slow** are **two-dimensional toy models**: flat molecules, each with two hands that give a hydrogen and two that receive one, plus a general stickiness. The temperature scale is calibrated so the water-like crowd comes apart near 373 K and the other kinds fall where they fall, so the order is right and the exact numbers are not. A flat crowd is not a 3D liquid; surface tension and contact angles come out in the right direction, not the right size.
- **Climb** is a calculation, not a simulation: the textbook balance of rim pull against weight, `h = 4γcosθ / (ρgd)`, with γ set by how tightly the water grips itself and θ by how the surface's grab compares with that grip (matching the drops in Cling). The close-up beside the tubes is a drawing of the idea. A molecule-by-molecule capillary needs thousands of molecules and was too noisy to teach from.
- **Float** is a Monte Carlo lattice model: a triangular grid where each molecule has three hands 120° apart, and the sheet trades molecules with a reservoir so its density can change. Cooling it opens a honeycomb, and the density peak sits mid-range. The numbers on the axis are relative, not degrees (real water is densest near 4 °C). It shows *why* the anomaly happens, not its size.
- **Slow** runs three crowds and reads each one's temperature off a table of energy against temperature measured from the same crowd (`tools/gen-caloric.js`). The handshake counts are live. At the very low end the model has a flat region where nothing can move; that is a quirk of a flat classical model.
- Nothing here shows boiling or freezing as sharp transitions. They come out smeared, because the crowds are small.

## Checks

```
node tools/check-physics.js     # wells: bottoms, forces, stiffness, order of letting go
node tools/check-atoms.js       # levels, orbital samplers, periodic-table trends
node tools/check-water2d.js     # the flat water model (add --sweep for the temperature scan)
node tools/check-drude.js       # dispersion force
node tools/check-lattice.js     # density peaks mid-range for water-like, never for no-hands
node tools/check-contrast.js    # WCAG contrast of the tokens in all four themes
node tools/bundle.js            # one-file build
node tools/gen-icons.js         # redraws the app icon at every size (needs Playwright)
node tools/gen-caloric.js       # regenerates Slow's table (--check just verifies the effect)

# needs Playwright: visits every route, reports console errors and horizontal overflow
NODE_PATH=<path to playwright> BL_OUT=./shots node tools/smoke.js light 390 844 2
```
