# Mario Kart — overnight build report

The **Mario Kart** channel was built on `codex/mario-kart` and is now integrated into `main` at `/Users/patricksun/GitHub/OpenWii`. It is the second launcher tile after Fruit Ninja. Claude's alternative is preserved separately; see [MIGRATION.md](MIGRATION.md). Nothing was pushed.

## What was built

A three-lap race at an original reconstruction of Mario Kart Stadium: a night arena with colored lanes, curbs, pits, sponsor boards, MKTV screens, city buildings, packed grandstands, floodlights, fireworks, an elevated banked hairpin and a glider return. Three.js uses environment reflections, focused moving shadows, textured surfaces, instanced spectators, batched scenery and restrained bloom.

Mario, Luigi, Peach, Yoshi, Toad, Bowser, Donkey Kong and Koopa have original local character/kart models. Select a player on the opening screen; the other seven race with different skills and bounded catch-up speed. The Blender build generated eight GLBs under ignored `assets/mario-kart/`. The game also works without that folder using procedural versions of the sculptures.

The DOM-free simulation includes acceleration/coasting, brake/reverse, hopping and three drift tiers, rocket starts/burnout, grass slowdown, wall glances, pads, coins, position-weighted item roulette, all six requested items, shell collisions/homing, star immunity, spin-outs, anti-gravity contact boosts, glider launch/landing, sequential lap gates, positions and ordered finish times. HUD, start lights, notices, minimap, finish/results, keyboard controls, pause and event sound slots are wired.

## What is proven

- **149 headless tests pass, 0 fail**, including the existing 114 tests. The new tests derive expected behavior from independent geometry/rotations, comparative experiments, seeded distributions and complete race outcomes. See [test log](evidence/full-tests.log), [logic tests](logic.test.mjs), and [input/audio/model tests](input.test.mjs).
- [Browser evidence](evidence/browser-report.json) checks actual keyboard input, rocket acceleration, drift, braking, item use, pause, all eight GLB loads, asset-free fallback, routes/menu order, mute-before-unlock, actual engine oscillator pitch, and a known WAV fixture through the real optional-file decode path. No JavaScript errors were reported.
- The same browser run sends actual simultaneous touchscreen events through the shared phone page and Socket.io: gas+B arrive together, releasing B preserves gas, and releasing gas clears it. A wrong-pose sensor packet sequence holds countdown at LEVEL; a stable level sequence arms the wheel. The profile expires after the game closes and legacy button 2 still opens diagnostics.
- An independent geometric driver completed an entire real-time race using **only Z and arrow key events**, without writing player state. It traversed anti-gravity and gliding, passed 24 gates, and reached results alongside seven actual CPU finish times. The final run took 118.975 seconds at a measured 60.00 frames/second in Chrome on this Mac. [Run telemetry](evidence/keyboard-race.json) contains the measured frame rate and timings; [normal-play results](evidence/keyboard-results.png) and section screenshots preserve the run.
- The local Blender pipeline was run successfully: [build log](evidence/blender-build.log). Optional models/audio/evidence are excluded from commits.

## Visual evidence

| Capture | Provenance |
|---|---|
| [Launcher](evidence/launcher.png), [character selection](evidence/intro.png) | Actual launcher and eight-model selection screen |
| [Start grid](evidence/start-grid.png) | Normal Enter-to-start browser flow |
| [Drift with purple sparks](evidence/drift-sparks.png) | Explicitly staged charged drift |
| [Anti-gravity and transformed wheels](evidence/anti-gravity.png) | Explicitly staged on the banked section |
| [Glider](evidence/glider.png) | Explicitly staged flight |
| [Item hit / spin-out](evidence/item-hit.png) | Simulation hit triggered in a staged scene |
| [Results](evidence/results.png) | Real simulation completes all eight racers; player driven by CPU planner for this capture |
| [Keyboard anti-gravity](evidence/keyboard-antigravity.png), [keyboard glider](evidence/keyboard-glider.png), [keyboard results](evidence/keyboard-results.png) | Full real-time keyboard race; no state teleport |
| [Phone wheel layout](evidence/phone-wheel.png) | Chromium touch viewport; permission overlay bypassed only for the hardware-free DOM test |
| [Procedural fallback](evidence/procedural-fallback.png) | Optional model requests deliberately returned 404 |

## What remains unproven

**A real phone has not been driven.** The tray code directly reuses Alien Attack's device-pinned `captureTray`, `trayRead`, `SteerFilter` and full-lock setting, plus the existing invert preference. Packet/DOM tests cannot prove real-hand feel, end-to-end motion latency, Safari sensor permission behavior or comfort holding 2+B while steering. Those need your morning test. Audio routing is tested; subjective mix and speaker playback have not been assessed by listening.

This is an original stadium/character reconstruction with arcade physics and approximate item probabilities. It does not use Nintendo meshes, textures or audio. Anti-gravity and flight share the track geometry, while the core steering/collision system uses planar course projection. Green-shell ricochets and homing shells travel in course coordinates. The visual and handling match to MK8 Deluxe remains a subjective review, and this Mac's measured browser performance does not establish performance on other hardware.

## Phone test — use the main checkout

After the migration, run **from the repo root**:

```bash
cd /Users/patricksun/GitHub/OpenWii
npm start
```

1. Open the HTTPS launcher the server prints. Use the phone on the same Wi-Fi, scan its QR code, accept the development certificate and enable motion sensors. **Do not use `HTTP=1` for the phone**; the overnight HTTP server was for keyboard/browser checks only.
2. Open Mario Kart, the second tile. Pick a character on the PC. The phone should switch to its wide wheel face. Hold it flat in landscape, one hand on each end, with a slight comfortable lean toward your face. Its long edge should be level; unlock phone rotation if necessary.
3. Press **A**. If the screen says **LEVEL**, hold still and level for roughly half a second. The countdown waits for a trustworthy neutral. First test with **2 released** until GO, then hold **2** to accelerate normally.
4. On the starting straight, keep the phone level: the kart should go straight. Dip the **right end** a little: it should steer right. Return to level: steering should settle immediately, without continuous rotation. Repeat left. If your saved Alien Attack invert preference or device needs reversing, press **I** on the PC once; this uses the same saved preference as Alien Attack.
5. Hold **2**, then hold **B** while turning into a corner. You should hop, drift and build blue → orange → purple sparks. Release **B** while still holding **2**: the kart should keep accelerating and get its mini-turbo. This is the most important real multi-touch check.
6. Release **2**: coast. Hold **1**: brake, then reverse. Collect an item box, wait for roulette, then tap **d-pad up** to use the item. On another start, begin holding **2 during the latter part of the “2” count** for a rocket start; holding from “3” causes burnout.
7. Drive the rising anti-gravity road and glider ramp, then finish three laps. If centering feels wrong, press phone **−** or PC **R**. Racing pauses for recentering: level the wheel, then press **A/Enter**. **1 is brake in Mario Kart**, not recenter. Phone **⌂** returns to the launcher.
8. Briefly lock the phone or disconnect Wi-Fi while driving. The game should pause instead of keeping a stale steering/gas command. Reconnect and press A/Enter. If it still feels wrong, note the phone/browser, which end points right, the section, and whether the issue is sign, drift, lag or button release. The green tests do not overrule that observation.

PC fallback: **←/→ steer, Z gas, X brake, Shift drift, Space item, Enter confirm, Esc pause**.

## Rebuild and reproduce

From the main checkout:

```bash
npm run build:kart-assets  # installed Blender; BLENDER may override its path
npm test
HTTP=1 PORT=8080 NO_OPEN=1 npm start
```

In a second terminal in the main checkout:

```bash
npm run test:kart-browser
node games/mario-kart/keyboard-race.mjs
```

The browser scripts use installed Google Chrome via Playwright, close their browsers in `finally`, and write ignored `evidence/` files. Stop the server with Ctrl-C afterward. Optional audio filenames and override behavior are listed in [AUDIO.md](AUDIO.md). Full criteria, review fixes and decisions are in [GOALS.md](GOALS.md); sources and applied rendering techniques are in [RESEARCH.md](RESEARCH.md).
