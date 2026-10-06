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
| Bonding | Flicker | Planned: van der Waals and induced dipoles. |
| Water | Cling, Skin, Climb, Float, Slow | Planned: adhesion and cohesion, surface tension, capillary action, density, specific heat. Each built from the bonding instruments, not around them. |

Each instrument has a short list of quiet challenges (not instructions). They tick off when the learner actually produces the situation, and the hub remembers them in the browser.

## How the instruments are meant to teach

These are the rules every instrument follows. Use them as a checklist when adding one.

1. **Perturb, do not present.** Every idea is reached by changing something and watching what answers: pull, heat, charge, swap an atom.
2. **Labels arrive after the experience.** Words like "polar covalent" appear as names for regions the learner has already explored, and the dial makes clear the boundaries are conventions.
3. **One quantity, many phenomena.** Tug is about unequal pull. The Well is about depth versus heat. Water's properties are built from those two ideas.
4. **True scale where it matters.** In The Well's *All four* view the depth bars are drawn on one linear scale, so van der Waals is a sliver. That is the point.
5. **Honest about being a model.** See below.

## Deploy to GitHub Pages

1. Create a repository and push this folder to the `main` branch.
2. Repository **Settings**, then **Pages**, then **Build and deployment**: Source **Deploy from a branch**, Branch **main**, folder **/ (root)**.
3. The site appears at `https://<user>.github.io/<repo>/` within a minute or two.

`.nojekyll` is included so Pages serves every file as is. All paths are relative, so it works under a repository subpath.

Other builds: `python3 tools/bundle.py` writes a single self-contained `dist/bond-lab.html`.

## Layout

```
index.html          shell: header, #view, script tags
css/style.css       one dark-field look, tokens at the top
js/core.js          helpers: canvas stage, pointer drag, loop, goals, registry
js/physics.js       energy wells and a thermostatted two-particle simulation (pure, testable)
js/tug.js           instrument: electron sharing
js/well.js          instrument: bond strength versus heat
js/app.js           hash router and the hub page
tools/              check-physics.js (sanity checks), bundle.py (single-file build)
```

### Adding an instrument

Create `js/<name>.js`, add its `<script>` tag before `js/app.js`, and register it:

```js
BL.register({
  id: 'handshake', field: 'bonding', name: 'Handshake',
  tagline: 'Why water molecules find each other.',
  art: '<svg viewBox="0 0 200 112">…</svg>',       // hub tile art
  goals: [{ id: 'x', text: 'Do the thing.' }],
  mount({ stage, aux, dock }) {                      // three slots: pinned stage, wide readout, controls
    // build into those elements, return { destroy() {} }
  },
});
```

Then remove its entry from `PLANNED` in `js/app.js`.

## What the models simplify

Worth knowing before putting these in front of a class.

- **Tug** uses Pauling electronegativity and Pauling's ionic-character estimate, `1 - exp(-ΔEN²/4)`. No bond comes out as exactly 0% or 100%. The polar/ionic cut-off is set at ΔEN 2.0 (books use 1.7 or 2.0, and 0.4 or 0.5 for nonpolar); the dial shows the curve under them is smooth. Atom sizes shrink for the cation and grow for the anion as an illustration, not a calculation.
- **The Well** simulates only the distance between two particles (a 1D relative coordinate with a 3D entropy term) under a thermostat. Depths and resting distances are textbook values for H–H, an Na⁺Cl⁻ pair, an O–H···O hydrogen bond, HCl···HCl, Na⁺···OH₂ and Ar···Ar. Vibration speeds are compressed so the eye can follow them (stiffer wells still move faster). The "room" a free pair can wander in is a fixed size, so the temperatures where pairs come apart are right in *order* and rough in *size*. Pulling uses a hand limited to 30 kJ/mol per angstrom.
- **Fast-forward.** Breaking a deep well by heat alone is rare on a human timescale, as in life. After a big change in heat the simulation runs 14× faster for about a second and a half, or any time **Fast time** is on. The chart under the stage shows the long-run answer.
- A two-particle model cannot show boiling, which is a collective effect. That is for the water instruments.

## Checks

```
node tools/check-physics.js
```

Prints each well's derived numbers, the temperature where each pair is together half the time, the long-run share together at familiar temperatures (liquid nitrogen, ice, boiling water, lava, the Sun's surface, lightning), confirms the thermostat gives the right kinetic energy, and confirms nothing blows up at 30,000 K.
