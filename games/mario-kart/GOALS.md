# Mario Kart — verification goal loop

Implemented in `.worktrees/codex` on `codex/mario-kart`, based on `20392be`. The comparison working tree was not inspected or changed. No push. Generated models, optional audio and browser evidence remain ignored.

**T** = headless test with independent behavioral or geometric expectations. **S** = browser screenshot/live check. Hardware claims are explicitly excluded where no physical phone was available.

| Concrete criterion | Proof | Result and evidence |
|---|---|---|
| Research actual stadium layout/palette/landmarks and open-source rendering before implementation | S | Complete: [RESEARCH.md](RESEARCH.md), viewed reference screenshot and overhead map. Night stadium, right colored hairpin, elevated banked hairpin, glider return, pits, MKTV boards, Mario monument, city, stands, lighting/fireworks implemented. |
| Eight classic racers, selectable player, local Blender pack and no-asset fallback | T + S | Complete: `input.test.mjs` model geometry/name checks; `npm run build:kart-assets` succeeded; `evidence/blender-build.log`; browser loaded all eight GLBs and independently rendered eight fallbacks with asset requests blocked. [Fallback](evidence/procedural-fallback.png). |
| Seven opponents with distinct skills, bounded rubber band and three-lap finish through sequential checkpoints | T + S | Complete: `logic.test.mjs` full races across seeds, gate/reversal and rubber-band tests; browser simulation plus real-time keyboard race produce eight finish times with 24 passed gates each. [Results](evidence/results.png), `evidence/keyboard-race.json`. |
| Acceleration, coast, braking/reverse, off-road slowdown, walls, boost pads, capped coins increasing top speed | T | Complete: separate behavioral tests in `logic.test.mjs`; speed comparisons, containment and spatial overlap expectations. Keyboard acceleration/braking also checked in Chromium. |
| No-input world-space straightness; no spontaneous yaw; bounded invalid inputs and consistent 30/60/144 Hz simulation | T | Complete: independent cross-track displacement/yaw assertion; timestep equivalence, malformed-data and stall tests. |
| Reuse Alien Attack's tray mapping and pinned sign; held/released 2/1/B, up item, A confirm; do not break legacy controls | T + S | Complete for software: imports original tray functions; independent rotation-matrix fixtures for both grips; Chromium multi-touch and release tests, profile expiration and legacy button-2 diagnostics. [Wheel UI](evidence/phone-wheel.png). Physical grip/feel **unproven**. |
| Wrong-time capture, resting bias and lost input cannot silently lock in a broken wheel | T + S | Complete for tested inputs: wrong 7° capture rejected in headless test; browser wrong-pose packets hold countdown at LEVEL; stable level packets arm it. NaN/non-unit quaternions rejected, stale steering/buttons expire, disconnect pauses. Hardware latency and sensor behavior **unproven**. |
| Hop/drift and blue/orange/purple charge with increasing release mini-turbos; timed rocket start and early burnout | T + S | Complete: edge-triggered hop, tier progression/release and start-window tests. Real keyboard drift and rocket start observed. [Purple sparks](evidence/drift-sparks.png). |
| Delayed position-weighted roulette, banana, green/red/blue shells, mushroom, star, spin-outs and immunity | T + S | Complete: deterministic distribution comparisons; each item's effect; banana collision, green ricochet/swept collision, red homing hit, blue leader hit and star immunity. Keyboard Space consumes item. [Hit](evidence/item-hit.png). |
| Banked anti-gravity with rotated/glowing wheels and contact boost | T + S | Complete: section flags, bank geometry, contact boost tests; [anti-gravity](evidence/anti-gravity.png), plus normal keyboard traversal capture. |
| Glider launch, flight, landing and safe slow-speed launch | T + S | Complete: genuine gap in road; trajectory/landing tests and low-speed launch regression. [Glider](evidence/glider.png), plus normal keyboard traversal capture. |
| 3–2–1–GO lights; item/lap/coin/position HUD, minimap, rocket/final-lap/finish notices and standings | S | Complete: [start grid](evidence/start-grid.png), state captures and complete race results; browser asserts finish state and actual final times. |
| Synth cues for every simulation event, imported file override, speed-responsive engine, mute and pause lifecycle | T + S | Complete for software: every event registered; actual oscillator pitch increases with speed; browser WAV fixture decoded via real override route; mute before unlock tested. [AUDIO.md](AUDIO.md). Speaker mix/listening **unproven**. |
| Keyboard arrows/Z/X/Shift/Space and pause work in a real browser | S | Complete: `browser-evidence.mjs` exercises real event handlers. `keyboard-race.mjs` completes three laps using only key events from an independent geometric driver, with no player state writes. |
| Save six requested screenshots and distinguish staged states from normal play | S | Complete: start-grid, drift-sparks, anti-gravity, glider, item-hit, results PNGs in ignored `evidence/`. `browser-report.json` records provenance. Start grid is normal play; drift/anti/glider/hit are staged; results run actual simulation. Additional `keyboard-*` captures come from a real-time complete race. |
| Second launcher tile with distinct cyan/indigo art; static model and Three examples routes | T + S | Complete: browser API checks actual launcher order and successful GLB/examples fetches; source palette in `public/menu.js`; [launcher screenshot](evidence/launcher.png). |
| Preserve whole existing game suite | T | Complete: **149 tests pass, 0 fail** (114 pre-existing + 35 Mario Kart), `evidence/full-tests.log`. |
| Final reviewer reread, edge-case fixes, regression suite and morning instructions | T + S | Complete: review below and [REPORT.md](REPORT.md); final suite/browser rerun recorded in evidence. |

## Review fixes

- Corrected Blender sRGB-to-linear material export after the first screenshot showed washed-out racers.
- Moved the player to the back of the grid and staggered tied rows, keeping CPU models out of the chase camera and showing eighth place correctly.
- Corrected downward road-decal winding: colored lanes, starting stripes, boost pads and anti-grav strips were missing despite working physics.
- Matched the banked surface slope to the kart's rotation using the tangent of the bank angle; added visible wheel transforms, rolling tires and cyan anti-grav hubs.
- Finished racers stop accumulating checkpoint gates; malformed character selections preserve eight unique racers.
- Very slow forward launches deploy and accelerate the glider instead of crawling across invisible road in the gap.
- Neutral capture requires a stable, nearly level long axis. The countdown waits for this when a phone streams; a tilted capture cannot become permanent steering bias. Deliberate held corners are not healed away.
- Held controls expire; pointer capture, cancel, visibility/disconnect cleanup and snapshots prevent stuck gas/drift. Releasing a second touch on the same button does not release the remaining touch.
- Fixed mute-before-unlock and imported music lifecycle; paused audio remains suspended when the tab becomes visible.
- Kept the Home and sound controls above the intro panel; final browser hit-testing confirms Home is clickable.
- Dispose replaced model resources and discard late model loads after a character/race change.
- Replaced an initially incorrect browser multi-touch test: CDP `touchEnd` lists the ended finger, not the surviving one. Recorded real pointer events diagnosed the fixture, rather than changing correct controller code to satisfy it.

## Decisions and limits

- The explicit worktree/branch instruction overrides the inherited main-only agreement for this task.
- Course geometry, character sculptures, physics and item probabilities are original approximations. Movement is a planar arcade kart constrained by course projection; banking and vertical flight are layered on top. Shell travel uses course coordinates, with lateral ricochet/homing. These are deliberate browser-scale choices, not Nintendo physics or assets.
- No physical phone was available. The software has packet and touch-event evidence, **not proof of real-hand steering feel, sensor sign on additional devices, LAN latency, iOS permission behavior or simultaneous-thumb ergonomics**. The morning check in REPORT.md is the acceptance test for those.
- Frame rate evidence applies to this Mac and Chrome at the recorded viewport. It is not a promise for every PC/GPU.
