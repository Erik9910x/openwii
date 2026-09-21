# Mario Kart — visual iteration 2

This is the historical iteration-2 record. The active overnight fidelity target, subsequent rejected/accepted changes and current evidence are in [OVERNIGHT-LOOP.md](OVERNIGHT-LOOP.md). Passing the checks below does not mean the emulator-like visual target has been reached.

This pass improves the existing **Mario Kart Stadium** implementation on `main`. It responds to Patrick's screen recording and MK8 reference. Sound and phone-input mappings were left alone. Changes are uncommitted for review.

## What changed on screen

- **The driving camera:** closer to the kart, follows road pitch and most of the banking, and looks slightly into corners. Clearance correction prevents the camera from dropping below pavement. The kart now pitches with the road instead of staying horizontal on a slope.
- **The road:** granular diffuse/normal/roughness maps, rubber wear, textured colored lanes, continuous paved shoulders, fitted curbs and cyan inset guides. Banked support piers no longer poke white wedges through the road.
- **The stadium:** a layered, illuminated Mario/Stadium tower; continuous glass-and-metal pit garages; nearer grandstands with foundations and roof trusses; two-sided MKTV displays; team trucks, awnings and flags in the infield; high clouds and searchlight haze.
- **The karts:** rounded bodywork, fenders and sidepods, exposed rear engines/cooling fins, wider exhausts, axles, inlets and lamps. Paint, rubber, cloth and metal use different finishes. The local Blender pack has baked self-shadowing in vertex colors, so the cap, neck, overalls and mechanical recesses retain depth under broad lighting. The no-assets fallback still works.
- **The presentation:** smaller race HUD, empty item slot disappears, gameplay speed/debug labels removed, fullscreen with **F** and a clean filming view with **C**. Phone Home still works in clean view.

The same driving rules and phone-control modules remain in place. The shared track centreline is unchanged; interpolated tangents remove segment-by-segment orientation jumps, so rendered road offsets and surface frames are smooth. Very tight inside offsets use the centreline direction for their camera normal to avoid an upside-down view.

## Why keep Stadium for this pass?

I compared it with SNES Rainbow Road, Mario Circuit 3, Excitebike Arena and Moo Moo Meadows. **SNES Rainbow Road is my strongest alternate recommendation**: an immediately identifiable visual theme with less architectural work. A faithful playable version still needs its actual corners, Thwomps, edge falls and rescue behavior. Switching tonight would replace the tested route before fixing the materials, kart presentation and camera problems that would follow us to any course.

Stadium keeps the anti-gravity/glider showcase and matches your supplied reference. The [track comparison and sources](VISUAL-GOALS.md) record this decision. This is my implementation judgment, not a claim about measured audience recognition.

## Evidence

- [48-second gameplay preview](evidence/visual-v2/visual-demo.mp4), [full race recording](evidence/visual-v2/keyboard-demo.webm) — silent, actual browser gameplay driven through keyboard events by a geometric driver. **It is not footage of a real phone session.** Playwright records the page at 25 fps; gameplay rendering was measured separately from animation frames.
- [Starting grid](evidence/visual-v2/grid.png), [colored bend](evidence/visual-v2/bend.png), [climbing road / tower](evidence/visual-v2/climb.png), [banked section](evidence/visual-v2/bank.png), [glider](evidence/visual-v2/glider.png). These are staged views for visual comparison.
- [Original recording contact sheet](evidence/visual-v2/user-recording-contact.png), [original grid](evidence/visual-v2/before/start-grid.png), [original banked section](evidence/visual-v2/before/anti-gravity.png).
- [Full real-time race telemetry](evidence/visual-v2/demo-report.json): all eight racers finish through 24 gates, with camera clearance checks and browser frame timings. The 118-second run averaged **60.0 fps**, with **16.7 ms median / 16.7 ms p95 / 16.8 ms p99** animation-frame intervals at 1440×900 in local headless Chrome. This is a local browser measurement, not a GPU benchmark or a guarantee for other devices.
- [Whole-suite test log](evidence/visual-v2/tests.log): **152 pass, 0 fail**, including independent road-frame and camera-clearance tests.
- [Browser regression log](evidence/visual-v2/browser.log): GLBs and asset-free fallback, actual key events, simultaneous phone-page gas/drift touches, individual release, neutral-capture gate, profile expiry and legacy diagnostics. WebGL shader errors are now collected as failures as well as JavaScript exceptions.
- [Visual checks](evidence/visual-v2/visual-checks.json): eight staged views, all eight GLBs carrying baked vertex shading, fullscreen entry/exit, clean capture mode and model-free fallback; no collected browser/shader errors.
- [Local Blender rebuild log](evidence/visual-v2/blender-build.log). Models and evidence remain ignored.

## Reproduce the evidence

With the game served on port 8080:

```bash
npm run test:unit
npm run test:kart-browser
node games/mario-kart/visual-review.mjs
node games/mario-kart/visual-demo.mjs
```

The review script stages poses; the demo script drives through real keyboard events. Both close their browsers on completion. The MP4 is a silent H.264 excerpt of the full WebM.

## Morning review

```bash
cd /Users/patricksun/GitHub/OpenWii
npm start
```

Use HTTPS on the phone, as before. Open Mario Kart; press **F** for fullscreen and **C** to hide utility controls while filming. Race HUD remains visible. **2** gas, **1** brake, **B** drift, **up** item, **A** confirm. **− / R** recenters; **I** retains the existing invert setting; **Esc** pauses.

Please judge the first banked climb, the tight hairpin and the glider landing from your actual phone session. The new camera is closer and rolls more than the previous draft, so its comfort and visibility at the edges are the most important next feedback. The recorded tests cannot establish real-hand feel or LAN latency.

## Remaining gap to the reference

This is a substantial presentation pass, **not Nintendo-level asset fidelity**. The characters remain original simplified sculptures, the stadium architecture is an approximation, and the crowd, foliage, signage and environmental detail still need an artist-level pass to match MK8 closely. Close-up faces, animation and wheel detail are the next asset priority. The full recording also reveals occasional foreground occlusion near other racers/scenery; the new road-clearance checks do not solve every camera obstruction. A camera-obstruction pass remains necessary before the final social recording. Track choice can still change after you compare this iteration with the reference; the camera/material/model improvements are reusable.

The final phone-controlled social demo has not been filmed, and subjective sound remains deferred. No other game, shared phone control, or audio file was changed. No commit or push was made in this iteration.
