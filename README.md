# Bond Lab

Instruments for things too small to see. Poke atoms, bonds and water molecules and watch what happens. Works in light and dark, with adjustable text size, high contrast and calm motion (the **Display** button).

Built for middle school chemistry. The aim is not memorized facts but an intuition that transfers: learners should come away with a feel for *why* things behave as they do, so a new situation is something they can reason about instead of recall.

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
| Atoms | **Fill** | Give electrons away or share them until every outer ring is full. Which one works depends on the atoms. |
| Bonding | **Tug** | Covalent, polar and ionic are not three boxes. They are stretches of one dial: how unequal the pull on a shared electron cloud is. A charged probe bends the cloud and turns polar molecules. |
| Bonding | **The Well** | Every attraction is a valley in an energy landscape. Heat fills the valley. A hand is a weak spring. Real depths (kJ/mol), real distances (angstroms) and real temperatures decide what holds. |
| Bonding | **Handshake** | Hydrogen bonds are hands that only grip when they line up. Turn a molecule and the grip comes and goes; heat a crowd and the handshakes let go, sooner for weaker hands. |
| Bonding | **Flicker** | Even atoms with no charge stick together, faintly: their electron clouds slosh and the sloshes line up. Switch the jiggle off and the pull vanishes; compare small and big atoms, then cool a crowd of each gas to see which cling. |
| Water | **Cling** | A drop on three surfaces. Whether it beads or spreads is a contest between the surface's grab and the water's grip on itself. Tilt the surface and see who lets go first. |
| Water | **Skin** | Molecules at the edge have neighbors on one side only, so they are pulled inward. Poke the skin, weaken the grip with soap, and see why a drop wants to be round. |
| Water | **Climb** | Water climbs a thin tube, higher the thinner it is. Change the surface, the grip and gravity (or take it to the Moon) and see what the rise depends on. |
| Water | **Float** | Cool a sheet of molecules with three hands each and it gets *less* dense: the hands pull it into an open honeycomb. A block of that floats in its own liquid. Molecules with no hands never do this. |
| Water | **Slow** | The same heat into three boxes, three different temperatures. Water-like molecules spend heat letting go of handshakes, so they warm slowly, and cool slowly, too. |

Each instrument has a short list of quiet challenges (not instructions). They tick off when the learner actually produces the situation, and the hub remembers them in the browser.

## How the instruments are meant to teach

These are the rules every instrument follows. Use them as a checklist when adding one.

1. **Perturb, do not present.** Every idea is reached by changing something and watching what answers: pull, heat, charge, swap an atom.
2. **Labels arrive after the experience.** Words like "polar covalent" appear as names for regions the learner has already explored, and the dial makes clear the boundaries are conventions.
3. **One quantity, many phenomena.** Tug is about unequal pull. The Well is about depth versus heat. Water's properties are built from those two ideas, and from one more: hands that only grip when aligned.
4. **True scale where it matters.** In The Well's *All four* view the depth bars are drawn on one linear scale, so van der Waals is a sliver. That is the point.
5. **Honest about being a model.** See below.

## Deploy to GitHub Pages

1. Push this folder to the `main` branch of a repository.
2. Repository **Settings**, then **Pages**, then **Build and deployment**: Source **Deploy from a branch**, Branch **main**, folder **/ (root)**.
3. The site appears at `https://<user>.github.io/<repo>/` within a minute or two.

`.nojekyll` is included so Pages serves every file as is. All paths are relative, so it works under a repository subpath.

Other builds: `node tools/bundle.js` writes a single self-contained `dist/bond-lab.html` (CSS, JS and fonts inlined), good for emailing or a USB stick.

## Layout

```
index.html          shell: header, #view, script tags (order matters: core, engines, instruments, app)
css/style.css       light, dark and high-contrast tokens at the top
assets/             self-hosted fonts (Atkinson Hyperlegible Next, Bricolage Grotesque)
js/core.js          helpers: canvas stage, pointer drag, loop, goals, registry, display settings
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
  tagline: 'One line that makes you curious.',
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

- **Tug** uses Pauling electronegativity and Pauling's ionic-character estimate, `1 - exp(-ΔEN²/4)`. No bond comes out as exactly 0% or 100%. The polar/ionic cut-off is set at ΔEN 2.0 (books use 1.7 or 2.0, and 0.4 or 0.5 for nonpolar); the dial shows the curve under them is smooth. Atom sizes shrink for the cation and grow for the anion as an illustration, not a calculation.
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
node tools/gen-caloric.js       # regenerates Slow's table (--check just verifies the effect)

# needs Playwright: visits every route, reports console errors and horizontal overflow
NODE_PATH=<path to playwright> BL_OUT=./shots node tools/smoke.js light 390 844 2
```
