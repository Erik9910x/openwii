# Visual iteration 2 — goal loop

This is the historical iteration-2 record. The active overnight fidelity target, subsequent rejected/accepted changes and current evidence are in [OVERNIGHT-LOOP.md](OVERNIGHT-LOOP.md). Passing the checks below does not mean the emulator-like visual target has been reached.

Scope: Patrick's recorded play and MK8 Stadium screenshot. Improve the capture people will see in a phone-controlled demo. Sound is deferred. Existing phone input and race rules are the baseline; no new track or handling rewrite in this pass.

## Diagnosis and track decision

The recording shows flat asphalt, broad empty lawns, disconnected billboard pieces, primitive rear kart geometry, an overly distant unbanked camera and occasional road/camera clipping. The reference has a close grounded kart, fine rough pavement, specular paint, dense architectural layers, a dominant Stadium/Mario tower, cyan road lamps and a camera that rotates with the road. More props alone will not resolve this.

| Candidate | Recognition / implementation tradeoff |
|---|---|
| Mario Kart Stadium | Existing tested route, original MK8 opening course and exact user reference. Most demanding architecture, but road/camera/material upgrades transfer to every future course. **Selected for this iteration.** |
| SNES Rainbow Road | Strongest alternative: unmistakable colored road and simpler setting; requires faithful sharp corners, Thwomps, edge falls/rescue and ground far below. Recommended alternate if Stadium still misses the desired look after review. |
| SNES Mario Circuit 3 | Simple flat geometry, but removing detail is unlikely to produce the requested MK8 showcase. |
| Excitebike Arena | Easy oval, but convincing arena, ramps/tricks and mud remain substantial work; less specifically Mario-identifiable without characters. |
| Moo Moo Meadows | Friendly recognizable setting, but convincing organic terrain, cows, foliage and sunset are a new asset pipeline. |

Sources: [Stadium reference](https://www.mariowiki.com/Mario_Kart_Stadium), [SNES Rainbow Road](https://www.mariowiki.com/SNES_Rainbow_Road), [Mario Circuit 3](https://www.mariowiki.com/SNES_Mario_Circuit_3), [Excitebike Arena](https://www.mariowiki.com/Excitebike_Arena), [Nintendo on Moo Moo Meadows](https://www.nintendo.com/us/whatsnew/meet-some-udderly-adorable-residents-in-mario-kart-8-deluxe/). The tradeoff ranking is my design judgment, not a popularity survey.

## Acceptance checks

| Criterion | Proof | Status |
|---|---|---|
| Inspect user recording and reference, identify visible defects | Contact sheet + specific diagnosis above | Done |
| Granular asphalt, tire wear, painted lanes, continuous shoulders/rail profiles | Same-pose browser captures at grid, colored bend and banked climb | Verified in linked [report and evidence](VISUAL-REPORT.md). |
| Close chase view, road-following pitch/roll and no camera below the road | Independent geometry tests + full real-time race telemetry/video | Verified in linked [report and evidence](VISUAL-REPORT.md). |
| More recognizable standard-kart body, tires, rear engine/exhaust and character silhouettes | Local Blender build + rear/front/detail browser captures + fallback | Verified in linked [report and evidence](VISUAL-REPORT.md). |
| Stadium tower, layered grandstands/pits, lit fascia and floodlight atmosphere | Browser screenshots at multiple route positions | Verified in linked [report and evidence](VISUAL-REPORT.md). |
| Smaller MK8-like gameplay HUD; optional clean capture view and fullscreen | Browser keyboard/touch regression and screenshot | Verified in linked [report and evidence](VISUAL-REPORT.md). |
| No regression in established input, race rules or other games | Whole test suite + browser evidence | Verified in linked [report and evidence](VISUAL-REPORT.md). |
| Sustained browser performance with new graphics | Full race recorded frame timing, report median/p95/FPS and GPU scope | Verified in linked [report and evidence](VISUAL-REPORT.md). |
| Honest reviewable result: gameplay demo and before/after screenshots | Local files linked in VISUAL-REPORT.md; no real-phone claims | Verified in linked [report and evidence](VISUAL-REPORT.md). |

Real-phone feel, final art acceptance and occasional camera obstruction remain open; these automated checks do not establish them.

All generated media, reference captures and models stay ignored. Work remains on main without committing or pushing unless requested.
