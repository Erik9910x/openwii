# Current demo iteration — user scope, September 11

**Status: ready for Patrick’s review. Implementation and verification completed through pass65a. STOP this iteration; do not spend more quota on deferred work without new feedback.**

Review: [focused recordings](evidence/overnight/current-demo-review.html), [decision and limits](evidence/overnight/65a-demo-iteration/review-notes.md).

This replaces the open-ended polish target for the current goal loop. The user's latest instructions take precedence over older goal text and the historical overnight journal. Work only on these five visible demo priorities; stop for Patrick's review when these are verified. Do not keep polishing unrelated items or require phone validation to finish this iteration.

## Required outcomes and evidence

1. **Item animation and throwing.** Make the supported inventory items readable in the driver's use/throw motion and as traveling/dropped objects, following native MK8 footage. Show pickup/roulette, equipped state, use, release, flight/drop, hit/expiry as applicable. Keep input responsive and phone buttons compatible. Record controlled item sequences and a real race.
2. **Obvious boost feedback.** Match native visible acceleration cues, including their onset, duration and fade. Coordinate exhaust, speed/camera response and any screen-space animation. Do not invent a large BOOST label unless native footage supports it. Record pad and item/drift boost cases.
3. **CPUs stay visible.** Reproduce unexpected rival disappearance and fix its cause. Preserve legitimate geometry occlusion and hit effects. Record close following, overtakes, collisions and bank/flight transitions; inspect actual visible rivals as well as visibility telemetry.
4. **Small ramp before the finish.** Locate the actual small silver ramp on the landing straight. Show continuous approach, launch, visible airborne arc, touchdown and recovery. Fix any snapping to ground. Record slow motion and normal playback; distinguish this jump from the long glider launch.
5. **Faithful HUD text and animation.** Compare the native font/glyph shapes, colors, outlines, proportions, position and timing for countdown/GO, lap/final-lap, position, item slot and finish overlays. Use matching local assets where available, otherwise reproduce the visible lettering faithfully and disclose approximations. Capture the transitions in motion.

## Working loop and stopping condition

- Inspect native MK8 reference at relevant timestamps; save observations and links.
- Preserve a baseline, then fix a specific failure or complete a related group of these five items. Use targeted recordings while iterating.
- Run one combined full-race recording and relevant regression checks once the changes stabilize. Inspect representative motion for all five requirements; save loaded-file hashes and decisions. Repeat a broad run only if new changes or failures justify it.
- Finish this iteration when all five outcomes have direct visual evidence, no conspicuous reported failure remains in reviewed playback, and checks show no regression to existing input/other games. Report remaining small approximations honestly and STOP for Patrick's review.
- Do not substitute test success for visual fidelity. Do not pursue general emulator equivalence as an extra completion gate in this iteration.

## Deferred

General driver motion unrelated to item use, further glider construction/folding, flight wheel refinement (unfinished pass61), track/material/scenery polish, further unrelated camera changes, sound and hands-on phone validation. Preserve previous work; do not commit or push. Stay on main and keep other games/shared phone mapping intact.
