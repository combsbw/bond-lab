# Guidelines for building the next lab

This is the philosophy and pedagogy behind Bond Lab (Chapter 2) and the Life Lab (Chapter 3), **extracted from the labs themselves** — from each instrument's design header, lede and check-offs, the two hub configs, and the challenge banks — and written down so the next chapter starts from what was learned instead of from a blank page.

The README says *what exists* and *how the code is laid out*. This says *why it is the way it is*, and what to do when a new chapter arrives and the answer is not obvious. When a guideline here and a clever idea collide, the guideline wins unless you can say in one sentence what it costs the learner to follow it. Several rules exist because the first version broke them and the learner paid.

**How to use it.** Read §1–§4 before you read the chapter you are about to build; they are the thinking. Read §5–§6 when you plan the lab and its modules. Read §12 before you write a line of code and §14 before you call anything done. §13 is the list of mistakes already made.

Contents: 1 Who it is for · 2 The stance · 3 The moves (a catalogue) · 4 How a lab is shaped · 5 From a chapter to a lab · 6 Anatomy of a module · 7 Interaction · 8 Honesty about models · 9 Language · 10 Challenges · 11 Visual design · 12 Engineering · 13 Mistakes already made · 14 Verification and done · 15 Decision log

---

## 1. Who it is for, and what "done" means

The learner is in middle school, usually on a tablet or a phone, often in a classroom with poor wifi. They did not choose to love chemistry. They have a textbook chapter that arrives as a wall of vocabulary — Chapter 3 "looks like forty new facts" — and the usual way to survive it is to memorise.

The goal is **intuition that transfers**: a learner should come away with a feel for *why* things behave as they do, so that a situation they have never seen is something they can reason about rather than something they must recall. A module is done when a learner can **predict** what it will do in a case they have not touched, and can say **why** in a sentence of their own. It is not done when it is accurate, impressive or complete. A beautiful, correct simulation that a learner watches without expecting anything teaches nothing while feeling as if it did.

The standing brief, in the user's words: **highly interactive, highly visual, highly intuitive, with built-in exercises and check-offs.**

---

## 2. The stance: eight commitments

These recur in every instrument header in both labs. They are the load-bearing ideas; the catalogue in §3 is how they are put into practice.

### 2.1 Perturb, do not present
An idea is reached by changing something and watching what answers: pull, heat, charge, swap an atom, drag a block. The instrument is never a diagram with a caption. If you are writing a paragraph to explain what a picture shows, the picture should have been something the learner could push on. (Rungs: tune the light. Shells: pull the electron. Cling: tilt the surface. Hurry Up: carry the enzyme yourself.)

### 2.2 Predict before you poke
Watching something happen is not the same as having expected it. A learner who only watches finds out nothing while feeling they did. So the Life Lab's check-offs (`BL.protocol`) have two halves: `how` (the exact move) and `ask`/`opts`/`right` (a call to commit to *first*, one click, no going back). Whether the call held is shown only once the instrument has **seen the thing happen**, not when the learner clicks. The same logic frames the challenges: "Commit to an answer, then go into the instrument named underneath and settle it for yourself."

### 2.3 One quantity, many phenomena — find the spine
A chapter that arrives as forty names is nearly always one mechanism wearing forty hats. Find it, build the lab around it, and make every instrument visibly that mechanism at a different setting.

- **Bond Lab's spine — one dial:** *how unevenly do two atoms share their electrons?* Covalent, polar, ionic, hydrogen bond, dipole–dipole, ion–dipole and van der Waals are not seven things; they are one quantity at different settings, and the between-molecule holds are "the leftovers of the same unevenness, acting outside the molecule instead of inside it." The Spectrum is a rail with no seams; the names appear over whichever stretch you are standing on.
- **Life Lab's spine — one reaction:** *remove a water to join, add a water to split.* Proteins, sugars, fats and DNA "are not four chemistries"; they are the same move on four sets of parts. The Template runs one slider and, when you switch family, "nothing else on the screen changes except the shapes of the parts and the name somebody decided to give the bond."

The hub says the spine **before** the learner reads a word of vocabulary (`spine` in the lab config; the hub card shows the four or five rows that collapse into one).

### 2.4 Reverse the usual story
The textbook order is often backwards, and the lab's job is to put it the right way round — and to say so.

- **Meet:** "Atoms are said to bond *in order to fill their outer shell*, as if an atom could want something. Nothing in the universe wants a full shell." Bonding is an accounting question — *can one of these two afford to hand an electron over?* — and the full shell is "the receipt, not the reason." Nothing in the instrument counts shells, and it still gets salt, water, magnesium oxide and methane right. (Fill, the octet puzzle, is kept — and says to its face that it is bookkeeping, then points at Meet.)
- **Four Hands:** carbon is the backbone not because of chemistry folklore but because the reason is "boring and complete": two hands make a line, three branch but have nothing left over, four can chain, branch *and* carry something.
- **Letters:** base pairing is given as a rule to memorise; "it is not a rule at all, it is a shape." Two conditions — width, and hydrogen-bond donors facing acceptors — leave exactly two of ten pairs standing.

A purposive verb ("wants", "needs to", "in order to") is a flag: ask what is actually cheaper, what actually holds, what actually fits.

### 2.5 Names are leftovers
Vocabulary is what you call something *after* you have been standing on it. The labs are built so the names arrive late and attach to a region the learner has already explored:

- Spectrum/Tug: "the learner turns that dial, watches the cloud lean, and meets the words afterwards."
- Handles: the four bond names — peptide, glycosidic, ester, phosphodiester — "are not four separate facts to learn. They are just the names for which two handles happened to be facing each other."
- Chain: monosaccharide, disaccharide, oligosaccharide, polysaccharide "sound like four different substances and are four different lengths of the same one"; the name on the readout changes while nothing else does.
- Fold: the four levels of protein structure "are easy to misread as four kinds of protein. They are four things true of one molecule at once."

The course's own words are used (see §9) — but as the label for something already felt, with a plain gloss beside it.

### 2.6 Emergent, not scripted
The strongest moment in either lab is when a thing happens that nobody programmed. Two Faces: "nobody builds a membrane" — there is no force pulling lipids into a sheet; the water refuses the tails and the sheet is what is left over. Fold: "nothing tells the chain what shape to be." Float: the molecules settle into the pattern where every hand shakes, and that pattern is a honeycomb with holes — so the sheet gets *less* dense as it freezes. When a model can be built from a few honest rules, build it that way and then **measure the result off the screen** (compactness, burial, shape, parts count, contact angle) rather than asserting it. Readouts say what actually formed on *this* run, not what was intended. If a result has to be faked with a phase jog, a lookup of the right answer, or a hard-coded animation, it is a diagram — say so (§8).

### 2.7 Say what the model is not
Every model simplifies. Where an instrument teaches a shortcut that is useful but not a cause — the octet puzzle, Meet's round-number payback, Float's relative axes, Climb's calculation-not-simulation — it says so on the page, in plain words, and points at the instrument that shows the real cause. A learner who later finds out they were told a story learns to distrust the whole lab.

### 2.8 Connect — the course is one thing too
Each lab leans on the one before and hands off to the next, by name, inside the instruments: Cloud "comes from the rungs you met in Rungs"; Fill ends "then go to Meet and find out why this works at all"; Tug is "a close-up of one stretch of the rail you met in The Spectrum"; The Well's depths "line up with the wells in `physics.js` on purpose" so a learner meets the same numbers again; the Template's energy hill "is deliberate and is the hand-off to Hurry Up"; Hurry Up previews "Chapter 4's catalase lab in advance"; Fold's irreversible cooking "is the same result as boiling the pineapple juice two instruments ago." Build for the third time a learner meets an idea, not the first.

---

## 3. The moves: a catalogue

Each of these is a reusable pedagogical device, with where it is already used. When you design a module, say which moves it uses and why.

| Move | What it does for the learner | Where it is used |
|---|---|---|
| **Remove it and watch it vanish** (necessity test) | Shows an ingredient is *necessary*, not just present. | The Molecule: straighten the angle and the pull collapses to nothing; wind oxygen's greed down to hydrogen's and the charges fade. Two Faces: take the head off and there is no membrane. Fill/Meet: no shell counting, same answers. |
| **Turn one thing; change one thing** | Isolates a single cause. "Nothing was added. One ring was turned over." | Sweet (starch ↔ cellulose is one flipped ring); Twins (same parts list, oxygen elsewhere); Handles (bolt a group on). |
| **A control that should *not* work** | Makes the cause visible by its absence. | CO₂ in The Molecule: just as lopsided bond-for-bond as water, and straight, so no pull — a gas you breathe out vs a liquid you are mostly made of. The "no hands" crowd in Handshake, Float and Slow. |
| **The same machine, two substrates** | Shows the mechanism is general. | Sweet: the same gut enzyme dropped on starch and on cellulose. Fold: all-polar vs all-non-polar vs "a real one". |
| **Small, then crowd** | Links the particle to the property. | Handshake and Flicker each have "Two molecules" then "A crowd"; Skin, Slow and Float scale up to a pond or a tank. |
| **Pin the invariant to the screen** | Makes what *does not* change the thing to notice. | Twins' parts counter never moves. Chain's receipts: n blocks, n−1 bonds, n−1 waters, in every family. |
| **A scale that does the arguing** | Lets the picture make the point. | The Well's linear depth bars: van der Waals is a sliver, and that is the point. Shells: the saw-tooth builds itself. |
| **The receipt, not the reason** | Corrects a cause/effect inversion (§2.4). | Meet and Fill. |
| **Fix the wrong direction** | Teaches by contrast with the folk version. | Skin: the edge is pulled *in*, nothing pulls it up. Climb: thin tubes win because the pull is along the rim and the weight fills the width. |
| **Measure, don't assert** | Builds trust; makes the learner a scientist. | Cling's contact angle is measured off the molecules; Fold's four levels are measured off the chain; Two Faces reports what formed. |
| **Irreversibility, felt** | Makes a one-way event unforgettable. | Hurry Up (boil the enzyme; cooling does not bring it back) and Fold (cook it; the chains have got hold of each other). |
| **The bench lab, rehearsed** | Ties the screen to the worksheet. | Hurry Up *is* Chapter 3's Fruity Enzymes with the bowl on the screen; Float and Slow reproduce results a real tray would show. |
| **Hand-hold the surprising answer** | The prediction is a real fork whose answer is not the obvious one. | "After one enzyme has cut a hundred chains, how many enzymes are left?" (all of them). "Is the water that leaves a peptide bond the same stuff as the water that leaves a phosphodiester bond?" |
| **An everyday anchor** | Connects to a life the learner already has. | A sparkler, a snowflake, a paperclip floating, a pie filling that burns when the pastry does not (Bond Lab); tinned pineapple in a jelly, a perm vs a blow-dry, why washing-up liquid works (Life Lab). |

Not every module needs every move. Every module needs at least one that makes a *wrong* prediction possible.

---

## 4. How a lab is shaped

### 4.1 Hub → fields → instruments, ordered as an argument
A lab is not a menu. The hub states the spine first, then the fields, each with a lede that is itself one clear claim, then instruments in the order a learner would ask the questions.

**Bond Lab** (Chapter 2): *Atoms* — where the electrons are and what the outer ones cost → *Bonding* — what happens when two atoms meet (one dial) and how that dial acts between molecules → *Water* — one small bent molecule, and everything it does because of the way it holds on.

**Life Lab** (Chapter 3): *Carbon* — why it is carbon, and what a group bolted on does → *Building and breaking* — the one reaction, both directions, and what stops it being free (the hill) → *The four families* — four runs of the same reaction, each with its job explained by a shape.

Both fields lists are arguments in three beats: **the parts → the rule → what the rule explains.**

### 4.2 The map of the two labs

| Lab · field | Instrument | The claim it makes touchable | Main move(s) | Hands the learner on to |
|---|---|---|---|---|
| Bond · Atoms | **Rungs** | Electron energy comes in rungs, not a ramp; the wrong colour passes through. | Perturb (tune the light); the gaps *are* the rungs. | Cloud |
| | **Cloud** | An orbital is where an electron is likely to be *found*; thousands of snapshots fill in a shape. | Emergent; measure by counting. | Shells |
| | **Shells** | Pulling the outer electron costs a measurable amount; the saw-tooth builds itself. | Perturb; scale does the arguing. | Meet |
| | **Fill** | Octet bookkeeping predicts a shape — but it is bookkeeping. | Say what it is not. | **Meet** (explicitly) |
| Bond · Bonding | **The Spectrum** | *The spine.* One dial, from shared to handed over; holds between molecules are the same unevenness acting outside. | One quantity; names are leftovers. | Tug, The Well |
| | **Meet** | A bond is what electrons can *afford*; the full shell is the receipt. | Reverse the story; drag the electron across. | Fill's "why" |
| | **Tug** | Close-up of one stretch of the rail: pull → lean. | Perturb; a charged probe leans it further. | Spectrum |
| | **The Well** | How hard to pull a pair apart: depth vs heat, on one linear scale. | Scale argues; pull and heat. | Spectrum's numbers |
| | **Handshake** | Directional holds grip only when lined up; heat lets go; weaker hands let go sooner. | Small then crowd; a control. | Water field |
| | **Flicker** | Even neutral atoms stick, because clouds slosh. | Emergent; crowd; control by gas. | The Well's weakest well |
| Bond · Water | **The Molecule** | Two facts — lopsided bonds, bent shape — make water water. | Necessity test; CO₂ control. | Everything below |
| | **Cling** | Does water hold the surface, or itself? Contact angle as measured. | Measure, don't assert; tilt. | Skin, Climb |
| | **Skin** | A surface molecule has no neighbours above, so it is pulled *in*. | Fix the wrong direction; soap as a cheap edge. | Climb |
| | **Climb** | Thin tubes lift higher: rim pull vs weight. | Calculation, labelled as one. | Float |
| | **Float** | Cooling water opens into a honeycomb, so it gets *less* dense. | Emergent; a no-hands control; ice in 3D. | Slow |
| | **Slow** | The same heat, three boxes: handshakes soak it up. | Same heat, three substrates. | Life Lab |
| Life · Carbon | **Four Hands** | Carbon's four tetrahedral hands: chain, branch, ring; twist a single bond, a double locks. | 3D; necessity test (swap for fewer hands). | Handles |
| | **Handles** | A group bolted on gives a molecule a job; the four bond names fall out. | Names are leftovers. | The Template |
| | **Twins** | Same parts, different molecule. | Pin the invariant. | The families |
| Life · Build/break | **The Template** | *The spine.* One reaction, four families. Water out → bond; water in → gone. | One quantity; name is the only change. | Hurry Up |
| | **Chain** | n blocks → n−1 bonds, n−1 waters; size names are lengths, not substances. | Receipts; tap a bond to break (digestion). | Fold, Sweet |
| | **Hurry Up** | An enzyme lowers the hill and is not used up; it unfolds and does not come back. | Bench lab rehearsed; irreversibility. | Fold |
| Life · Four families | **Fold** | Order of beads in; water decides the shape; cook it and it does not come back. | Emergent; contrast cases; irreversibility. | Sweet |
| | **Sweet** | Starch vs cellulose: one ring turned over. | Turn one thing; same enzyme, two substrates. | Two Faces |
| | **Two Faces** | Nobody builds a membrane; change the molecule, change the answer. | Emergent; necessity (no head). | Letters |
| | **Letters** | Two of ten pairs survive two shape tests. | Reverse the story (a shape, not a rule). | (closes the lab) |

When you plan a new lab, fill in this table *first*, before you write code. A row you cannot fill in is not an instrument yet.

### 4.3 Micro then macro; felt then named; many then one
The same three orders appear everywhere: the particle first and the property after; the experience first and the word after; many phenomena first and the one quantity after (or, in a spine instrument, the quantity first and every phenomenon as a setting of it).

---

## 5. From a chapter to a lab

The user supplies the chapter (and sometimes the lab handout and teaching notes) as the source of truth. The lab is built from it, not beside it.

1. **Read the chapter for its mechanism, not its headings.** What is the one thing that, once felt, makes the forty names fall out? Write it as a question a learner could answer by poking ("how evenly do two atoms share?"). Both labs began here.
2. **List what the chapter asserts that is a rule, a name, or a "because" the textbook gives without a mechanism** (the octet; "A pairs with T"; "carbon is special"). Each is a candidate for §2.4/§2.5: is there a version where the learner arrives at it?
3. **Keep the course's vocabulary — and introduce it late.** The learner will be tested in the course's words. Use them (*polar*, *non-polar*, *dehydration synthesis*, *hydrolysis*, *polymer*) but as the name for something already explored, with a one-line plain gloss at first use ("non-polar: no charged ends, so water has nothing to grip"). Never open a module with the term; never invent a friendlier synonym the course does not use and the learner will have to un-learn. (We shipped "greasy" and "water-loving" and replaced them with *non-polar* and *polar* on the user's instruction.)
4. **Choose three fields that tell the story** (§4.1: parts → rule → what the rule explains).
5. **Make the bench lab virtual.** If the chapter has a hands-on lab or a "lab in principles", build it as an instrument that reproduces the bench result, with numbers a real tray of tubes would give (`tools/check-enzyme.js` pins Fruity Enzymes). It is a rehearsal and an explanation, not a replacement.
6. **Decide what the model cannot support** and how the lab will say so (§8).
7. **Connect backward and forward** (§2.8): which instrument does this lean on, and which does it hand to? Put it in the lede or the readout, by name.
8. **Register unbuilt ideas in `planned`** in the lab config so the hub shows them as coming rather than missing.
9. **Scope discipline.** Cover only what the course needs: Bond Lab's atom data is the first twenty elements "which is all a first chemistry course needs and where the shell story is cleanest."

---

## 6. Anatomy of a module

Every instrument is built to the same skeleton (`BL.register`). A learner who has used three should know where everything is in the fourth.

| Slot | What goes there | Rules |
|---|---|---|
| **Tagline** (hub tile) | A provocation or a claim. | "Ice does something odd." "Turn one ring over and a potato becomes a tree." "Nobody builds a membrane" ⇒ "Water will not have the tails. The membrane is what is left over." Makes you curious; never explains. |
| **Lede** | What you are looking at, and the first thing to do. | Starts concrete ("A bowl of gelatin with fresh pineapple juice stirred into it."), then imperatives ("Drag…", "Pick up…", "Tap…"), then the question it is going to settle. One short paragraph. Points sideways when it should ("then go to Meet…"). |
| **Stage** | The thing itself, large, pinned. | Direct manipulation (§7). `aria-label` that describes the scene; focusable. |
| **Aux** | Wide readouts, a second view (often 3D), graphs. | Each panel has a heading that is a question or a plain noun, never a variable name. |
| **Dock** | Controls: presets, sliders, mode chips; then **Try**. | Sliders are words with ends ("loosely … tightly"); numbers live behind Display → Show the numbers. |
| **Try** | Check-offs. | See below. |
| **Ask** | "Why this matters · 3 everyday challenges", full-width, **collapsible, at the bottom**. | Below the controls and Try. Collapsed by default. |
| **Reset** | "Start this one over" per module; per lab in the hub/settings. | Two-tap confirm (`BL.confirmBtn`); progress is destructive. |

**Write Try items in the order a learner would want to do them:** (1) *touch it* — "Drag an electron from one atom to the other and see whether it can afford it"; (2) *find the extremes* — "Find a pair where the handover pays for itself", "…where it is far too expensive"; (3) *find the middle / the surprising case* — "Find a pair that lands in the middle, too close to call"; (4) *predict before testing* — "Predict a pair correctly before you test it"; (5) *test the generalisation* — "Test five different pairs"; (6) *read what the model never used* — "Open 'What about full shells?' and read what the arithmetic never used."

**Write Life Lab prediction questions as real forks.** The `ask` is a short question about what the learner is about to watch, with options whose right answer is not the lazy one: *the water that leaves — where do its atoms come from?* / *to take this bond apart, do you have to put something in or take something out?* / *half way between apart and joined, is the molecule at a higher or lower energy than at either end?* / *back at room temperature, does the enzyme work again?* The `how` says exactly what to do and what to watch ("Go slowly. Keep your eye on the two small atoms between the units, not on the units.").

**Mobile is the default, not the fallback.** Design at 390 px first. No horizontal scroll, ever (`tools/smoke.js` fails on it). Text must survive the XL size setting.

---

## 7. Interaction philosophy

> *"If an element looks like it should be interactive, make it interactive. If it looks like it should be able to be rotated by dragging with a finger to see the 3D geometry, make it 3D with rotational visualization."* — the user's standing instruction.

Treat it as a lint rule. After building a stage, look at it with fresh eyes and ask of **every drawn object**: *would a learner try to touch this?* If yes it must respond. A heater that looks like a button must toggle; a tube wall that looks like a handle must drag; a molecule in a crowd must be grabbable; a thermometer must be draggable; a tilt dial must tilt.

### 7.1 If it is a solid, it turns
Anything really three-dimensional — a molecule, crystal, chain, membrane, helix — is rendered in 3D and can be picked up. Use **`BL.view3d`** (`js/view3d.js`); never write a one-off camera. It gives, identically everywhere: one finger/mouse to orbit with momentum (no stale momentum if the learner held still before letting go); two fingers to pinch-zoom; wheel to zoom; double-tap/click to glide home; arrow keys and `+`/`-`/`0` for anyone who cannot drag; a corner cue that goes away once they have turned it; and **claim arbitration** — `pick(p)` can claim a press (to drag an atom or bead) before it becomes an orbit; an unclaimed press that does not move is a `tap(p)`. The same gesture must mean the same thing in every instrument, or each instrument is a new thing to learn. Use gentle perspective and one depth-sorted draw list (`V.add`/`V.flush`); with no depth cue a rotating molecule reads as a squashed flat thing.

Four Hands exists in 3D "and it has to be": the four hands point at the corners of a tetrahedron, not a flat plus-sign, a chain does not zigzag unless they do, and twisting a bond "turns into a flat squashing motion instead of a rotation you can see." The test for whether something should be 3D is whether a 2D drawing would *mislead* about the idea.

### 7.2 If it is flat, it is still touchable
For 2D stages use `BL.drag` (pointer capture; mouse, pen, touch).

- **Hover feedback**: the cursor changes when `pick` would claim the press; highlight what is under the pointer.
- **A tap must do something sensible** even where drag is the main gesture (tap a bond to break it; tap a gap to rejoin; tap a heater).
- **Direct manipulation beats a button.** If a slider's only job is to move a thing on screen, let the learner move the thing and keep the slider as the keyboard-reachable twin. Sync both ways; never let control and stage disagree.
- **Physics must not reward violence.** Pulls are bounded springs with force caps, so a hard yank cannot inject unlimited energy.
- **Everything reachable by touch is reachable by keyboard** where the interaction is a value.

### 7.3 Feedback is part of the instrument
Say what just happened in a sentence near where the learner is looking (status line, `aria-live="polite"`). A drag with no sentence afterwards is an unexplained event.

### 7.4 Calm
Idle motion (auto-spin) stops the moment a learner turns the thing and does not restart; `BL.reduced` (calm motion) disables it. Nothing competes with the learner's hand.

---

## 8. Honesty about models

A teaching tool that bluffs is worse than none.

1. **Every model file opens with a header** that says what it is, what rules it contains, and what it does not do. (Compare `water2d.js`: "Rigid molecules… a flat model"; `fold3.js`: "The only forces are the ones the chapter names"; `geom.js`: "It does not relax anything… a model of what the hands allow and not of what a molecule settles into".) Mirror it in the README's "What the models simplify", in the same commit.
2. **Pure models run in Node and have a `tools/check-*.js`.** The check pins the behaviour a teacher would sanity-check, over several seeds — "a real-looking sequence folds with non-polar beads inside"; "juice on ice sets, boiled-then-cooled juice sets, the rate peaks then falls off a cliff". A result that holds on one seed is an anecdote.
3. **Label drawings as drawings.** Climb's close-up is a drawing, not a simulation, and says so; Float's axes are relative, not degrees; the ice-melt slider is a picture of the lattice slumping into its holes, not a molecular-dynamics melt.
4. **Never assert what the model cannot support.** The first kink slider claimed it froze a membrane; the flat model cannot. It was reframed to packing and the limitation is in the README. When a claim cannot be earned, change the claim, not the apparent behaviour.
5. **Scale honestly where scale is the point** (The Well's linear bars).
6. **A demonstration must show something that can actually happen.** An early Meet screen offered a pairing that "will never ever ever happen"; the user rightly called it out. Defaults, presets and the opening state are plausible chemistry. Look at every default as a teacher would.
7. **Explain the cause, not the name.** "Hydrophobic" names a behaviour; it does not explain it. A readout or a question that stops at the name is a trap (one Bond Lab challenge exists to catch exactly this).
8. **Calibrate to real anchors and say so.** The water2d temperature scale is calibrated so the water-like crowd comes apart near 373 K and the other kinds "fall where they fall"; Slow's temperatures are read off a table `tools/gen-caloric.js` measured from the same simulation.

---

## 9. Language

- **Plain words first, numbers behind a switch.** Everything is measured, and every measurement is still there behind Display → Show the numbers. What the learner sees first is a word tied to something they have touched ("a hot kettle shakes it loose", "room warm", "sodium hands it over") and a bar, because *more than / less than* is usually the real question. Use the shared scales (`BL.words`, `BL.numv`), never inline strings.
- **Causes, not wants.** Atoms do not "want". Say what is cheaper, what holds, what slides.
- **One metaphor per thing, used everywhere.** Hydrogen bonds are "handshakes" in every instrument that has them; carbon's bonding capacity is "hands"; the group on a carbon is a "handle". The course's term is introduced beside the metaphor once, then the metaphor and the term both stay.
- **Short sentences, active verbs, one idea each.** Read the copy aloud; if you run out of breath it is two sentences.
- **Name things after they have been felt** (§2.5), inline, with a gloss; no glossary links.
- **Respect the reader.** No in-jokes, no condescension; middle schoolers detect both.

---

## 10. Everyday challenges: the standard

Every module carries **three** challenges about ordinary things it explains. They live in `js/quiz.js` / `js/life/quiz.js`; card, marking and storage are in `js/quizkit.js`. Each bank's header states the rule. The failure to avoid is subtle and happened once: if three options are folk explanations and the fourth is the only one that mentions a molecule, a learner who knows no chemistry scores full marks by choosing whichever *sounds like chemistry*. They have been tested on register, not understanding.

1. **All four options are real mechanisms, in the same voice** — each names real forces, particles, molecules, bonds.
2. **Each wrong option is wrong for a reason you could point at:** the right force at the wrong scale; the right idea with the sign flipped; the right process in the wrong direction; a true fact that does not answer this question; a real rule applied where it does not hold.
3. **No option is pickable by length, vocabulary or hedging.** Do not "fix" a long correct answer by shortening it; rewrite the distractors until they are as specific.
4. **Several distractors are things people say aloud, that textbooks still print, or that working scientists once believed.** Those are the valuable ones.
5. **Every option carries a `why`**, shown after answering, so a wrong pick teaches the specific thing wrong with it. The `after` explains the right answer by pointing back at the instrument ("Build a ring out of carbons in the instrument and count the hands…").
6. **Settleable by poking the named instrument.** If you cannot say which, it belongs elsewhere or is not yet a question.
7. **Open on an everyday scene** ("Hand gel disappears into water and takes the grease off your hands. Petrol does neither."), then ask *one* why-question.
8. **Measure it.** `node tools/check-challenges.js js/quiz.js js/life/quiz.js` reports how often the correct answer is strictly the longest, the shortest, the uniquely most technical or the only technical one. Chance is 25%. Aim to be near or below chance on every line — a correct answer that is *always* shortest is a tell too.

Answered challenges are spent (you cannot un-know the answer); `BL.quizReset` is how a teacher hands the bank to a fresh learner, and the reset UI says so.

---

## 11. Visual design

- **Electrons are small round balls; orbitals are filled, translucent volumes.** A single pixel per electron reads as noise. A cloud is a *body* (ray-marched small, smoothed and scaled up) with nodes visibly empty.
- **One meaning per colour, in every module of every lab.** Oxygen keeps the blue it had as water's δ−; hydrogen keeps the red it had as δ+ — "so a learner arriving from the chapter before recognises the parts on sight." The element tokens (`--e-c`, `--e-n`, `--e-p`, `--e-s`, `--e-tail`), hydrogen bonds and "the surface grabs" markers keep their colour. Never reuse a colour for a second idea; never encode meaning in colour alone.
- **One drawing kit per chapter.** The Life Lab's `draw.js` exists because "the fastest way to make it feel like forty separate facts is to draw each family differently." An atom is always a lettered sphere; a bond is always one, two or three lines; a leaving water is always the water Bond Lab drew. *Visual sameness is how the spine is felt.* Draw what the physics already says (`moldraw.js`: a disk with four rim sites becomes water without one number changing).
- **Four themes**, adjustable text size, calm motion. Use palette tokens (`BL.pal`, CSS custom properties), never hard-coded hex. `node tools/check-contrast.js` passes for every token pair in all four themes; add new tokens to it.
- **Shading wants hex** — `BL.mix` returns `rgb()` and breaks sphere shading; use `BL.mixHex` for anything going into `BL.sphere3`.
- **3D for solids; flat for flat things.** Do not extrude a 2D thing to look modern.
- **Labels never overlap what they label.** After every layout change, look at the screenshot at both sizes.
- **Softness.** Rounded corners, generous spacing, a calm palette; a place to play, not a dashboard. Hide the machinery — learners see molecules, never a "step" or a parameter.

---

## 12. Engineering conventions

- **Zero build, zero dependencies.** Plain `<script>` tags in fixed order: core → view3d → lab config → engines → instruments → quiz → app. Open the HTML and it works — GitHub Pages, a USB stick, a double-click. `tools/bundle.js [--life]` makes a single file.
- **One shell, many labs.** `BL.lab` drives the hub (fields, spine, sibling, version). A new chapter is a new HTML file plus `js/lab-<name>.js`, sharing core, view3d, quizkit, app and the store. Share storage namespaces deliberately (`bondlab.*`; `goals.<id>`, `predicts.<id>`, `quiz`, display settings) so progress pips and resets need no special case.
- **Models are pure and testable.** Physics lives in files that load in Node; drawing is separate. The frame loop uses time-budgeted stepping (≤ ~40 steps / 7 ms) so a slow tablet drops detail, not frames.
- **Reuse before writing.** `BL.view3d`, `BL.drag`, `BL.sphere3`, `BL.stick3`, `BL.geom.layout`, `BL.water2d`, `BL.meter`, `BL.fold`, `BL.confirmBtn`, `BL.protocol`. A second copy of any of them means you are fixing the wrong thing.
- **Accessibility is not optional.** Stages: `aria-label`, focusable; toggles `aria-pressed`; status `aria-live`; generous touch targets; `touch-action` set on interactive canvases.
- **Offline matters.** The service worker is *network-first* on purpose (a classroom must not keep seeing last term's page). GitHub Pages serves with `max-age=600`, so a change can take ten minutes to appear.
- **Deploy is from `main`.** A branch changes nothing live until merged. The user has asked for fast-forward merges to `main` after pushing the working branch.
- **Comments say why.** Headers explain the idea and the simplification; inline comments explain surprises; match the surrounding density.

---

## 13. Mistakes already made

| What happened | What to do instead |
|---|---|
| Electrons drawn as single pixels. | Small round balls; orbitals as filled volumes. |
| The octet framing ("atoms want a full shell") taught a non-cause. | Bonding as what electrons cost; keep octet bookkeeping but call it that (§2.4). |
| A meet-up pairing that "will never ever ever happen" shown as a demo. | Every preset and default is plausible chemistry. |
| Challenge options where only one sounded like chemistry. | Four real mechanisms in one voice; measure with `check-challenges`. |
| "Greasy" / "water-loving" in place of the course's words. | *Non-polar* / *polar*, with a plain gloss at first use. |
| "Twist the bond" showed no 3D rotation. | Solids turn; a twist rotates the far half about the bond's own axis. |
| "Why this matters" above the controls, not collapsible. | Bottom of the module, collapsible, collapsed. |
| A kink dial claimed to freeze a membrane (the model cannot). | Reframe to what the model supports (packing) and document the limit. |
| A "kinked" tail that was a phase jog, not a bend — copies never collided. | Build the geometry that produces the behaviour; confirm it appears. |
| Twins morph: hydrogens vanished (old and new layer were the same object). | Crossfade explicit `[layer, weight]` pairs; test both directions. |
| Morphing oxygen turned grey. | `BL.mixHex` for sphere colours. |
| Bond sticks drawn striped across the front of spheres. | Trim sticks to sphere surfaces (`ta`/`tb`). |
| Sweet helix looked like scattered slivers. | Tiles on a barrel with radial normals. |
| Fold's first tuning: all-non-polar overlap, hot chains not unfolding, an all-polar chain squeezed to a ball. | Scale attractions, pull as an equal-and-opposite pair (no anchor), calibrate compactness against reference coils, pin with `check-fold` over seeds. |
| A local `R` shadowed the R-group table; `parseFloat(ctx.font)` returned the weight. | Avoid short names in long files; parse pixel size with a regex. |
| Stale momentum fired on release. | Zero velocity if the pointer was still for ~90 ms. |
| 3D stages had no depth cue. | Gentle perspective and one depth-sorted draw list. |
| A tray overlapped a bottom label (Letters). | Reserve space in layout arithmetic; screenshot at both sizes. |
| Intermittent negative-radius `arc` in Meet. | Clamp canvas arithmetic at the call; smoothsteps can overshoot. |
| Bulk find-and-replace of a vocabulary word broke object keys in a test file. | After a rename sweep, run every check and syntax-check every file. |
| Work pushed to a branch but not live. | Fast-forward `main`; the site deploys from `main`. |

---

## 14. Verification and "done"

**A module is not finished until, on the real page:**

1. All `node tools/check-*.js` pass — physics, atoms, meet, water2d, drude, lattice, enzyme, fold, lipid, contrast — and `check-challenges` shows no tell. Add a check for any new pure model.
2. `tools/smoke.js` is clean for **both labs** at **1280×900 light** and **390×844 dark XL**: no console errors, no horizontal overflow, every route loads. (`NODE_PATH=<playwright> node tools/smoke.js <theme> <w> <h> <size> [page]`.)
3. **You have looked at the screenshots**, not only the exit code. Overlapping labels, an upside-down molecule and a "3D" view that was actually flat all passed automated checks at some point and were caught by eyes.
4. **You have used the interaction** with a scripted pointer (drag, tap, wheel, double-tap) and confirmed control and stage stay in sync, no stale momentum, and a goal completes exactly when it should.
5. Both bundles build.
6. **The README is updated in the same commit** (instrument table, layout, "What the models simplify", checks).

Commit messages say what changed *for the learner*. Push the branch, then fast-forward `main`.

**Definition of done for an instrument**
- Within thirty seconds a learner can predict, poke, and be surprised or confirmed, having read only the lede.
- It uses at least one move from §3 that makes a *wrong* prediction possible.
- Every drawn object that looks touchable is touchable; every solid turns.
- Words by default, numbers behind the switch.
- It says what it is not, and says where to go next.
- It survives 390 px, dark theme, XL text, calm motion and no network.
- Three challenges, measured, each settleable in this instrument.

### Starting a new chapter: the order of work
1. Get the source (chapter, lab handout, notes). Do not build from memory of the topic.
2. Find the spine (§5.1); write it as a poke-able question.
3. Fill in the §4.2 table for the new lab before any code.
4. List the course vocabulary and where each term is introduced with its gloss.
5. Write `js/lab-<name>.js` (fields, spine, sibling, `planned`).
6. Build shared pieces first (drawing kit, geometry, models) with their Node checks; then the instruments on top.
7. Build each instrument to the §6 skeleton; run the §7 lint ("what looks touchable that is not?").
8. Write Try items with predictions; write three challenges and measure them.
9. Write the model's honest header and the README simplification note.
10. Verify (above), commit, push, merge.
11. **Update this file** if the chapter taught you something not written here. This file is the memory; a lesson that lives only in a conversation is lost.

---

## 15. Decision log

Things the user decided, so they are not re-asked:

- **Audience:** middle school chemistry; intuition that transfers beats recall.
- **Structure:** one lab per chapter on one shared shell; each hub links to its neighbours; one spine per lab.
- **Numbers are off by default**; everything measurable is behind Display → Show the numbers.
- **Check-offs with predictions** in the Life Lab; goals in Bond Lab (upgradeable to `BL.protocol`).
- **Three everyday challenges per module**, all four options real mechanisms.
- **Reset progress** per module and per lab, two-tap confirm.
- **"Why this matters"** at the bottom of each module, collapsible.
- **Interactivity bar:** if it looks interactive, it is; if it is a solid, it turns.
- **Vocabulary:** *polar* / *non-polar*, not "greasy" / "water-loving".
- **Releases:** merge straight to `main` after pushing the working branch; commit messages end with the standard attribution lines.
- **The brief for every chapter:** highly interactive, highly visual, highly intuitive, with built-in exercises and check-offs.

When a decision here is wrong for a new chapter, change it *here* and say why.
