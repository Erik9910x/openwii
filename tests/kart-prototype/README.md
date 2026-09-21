# Test

One silent, standalone prototype for filming steering, drifting, boosts, and a parachute jump. This is a simplified demonstration scene, not a historical checkout of the finished game.

From the repository root:

```sh
npm run test
```

It starts its own HTTPS process on **8444**, opens the scene, and shows a phone-pairing QR code. The normal OpenWii server and launcher are not required.

1. Keep the computer and phone on the same Wi-Fi.
2. Scan the QR. Accept the local certificate warning, then enable motion on the phone.
3. Hold the remote sideways with the crosspad on the left and 1/2 on the right. Hold still and level briefly to calibrate. The QR hides when the phone connects.
4. Hold **2** for gas and tilt to steer. **1** brakes. Hold **A** while turning, build charge, then release **A** for boost.
5. After the first broad left curve, drive up the ramp on the next straight. The parachute deploys automatically after takeoff. Tilt to steer in the air; it folds away on landing. Forward momentum is retained throughout flight.
6. Press **Home** on the remote or **R** on the computer to reset for another take. **−** recenters the wheel. **P** toggles the QR; **F** toggles fullscreen. **I** reverses steering if your existing invert preference needs changing.
7. Stop with **Ctrl+C**.

Keyboard fallback: **Z** gas, **X** brake, **←/→** steer, **Shift** drift. The track loops indefinitely. Both the phone speaker and scene are silent.

The visual treatment is deliberately basic: a box kart, blank mannequin, gray road, colored boundaries, survey grid, low-poly parachute and live developer readouts. Tire marks, sparks, a charge meter, exhaust burst and boost timer make each mechanic visible. Altitude and parachute status show the jump and glide.

## Graphics progression

Use the computer's number keys in the same browser window:

| Key | Scene |
| --- | --- |
| **1** | The exact test mannequin and box kart, viewed from the front three-quarter angle. |
| **2** | Rough Mario made from basic shapes, with a red/blue kart and simple details. |
| **3** | Current finished Mario and kart model with flat, basic lighting. |
| **4** | The same model and framing, with authored materials, polished lighting, reflections and contact shadows. |
| **5** | A looping 36-second stadium tour: wide establishing shot, low finish-straight dolly, overhead curve and antigravity climb. |
| **0** | Return to phone-controlled driving. |

Top-row numbers and the numeric keypad both work. Space does not advance stages. All four character stages sit stationary on the same test track. After a brief hold, the camera makes one smooth eight-second 360° orbit around the kart, then stops at the original viewing angle. Press the same number again to replay the orbit. All showcase scenes hide the HUD and remain silent; use **F** for fullscreen. Driving pauses during the showcase. After returning with **0**, release and press the phone's gas button again to resume.

The finished local Mario and stadium assets load on first selection, then remain cached for quick switches. Before recording, visit **4** and **5** once, then return to **1**. The finished stages need the existing ignored local source pack in `assets/mario-kart/`; missing assets show a recoverable message. The simple driving test and stages 1–2 do not require it.

These are reconstructed demonstration stages for the build video, not recovered historical versions. Stages 3–5 reuse the project's current local source assets; stages 1–2 are built from basic geometry.

## Implementation

`server.cjs` is a dedicated HTTPS relay and file allowlist. It reuses the controller layout, local certificate helper, and calibrated `WheelInput`; it never starts or imports root `server.js`. Controller audio is disabled in the test server's served response, leaving production controller files unchanged. The driving geometry and fixed-step `physics.mjs` are independent of the full game's visuals. `showcase.mjs` lazily loads the finished model and the production stadium visual helpers, without loading gameplay or audio. The test does not appear in the OpenWii launcher.

```sh
NO_OPEN=1 npm run test       # Print URLs without opening a browser
PORT=8555 npm run test       # Use another port
```

HTTPS is required for phone motion. If certificate creation fails, the runner exits instead of silently using insecure HTTP.

## Automated checks

The automated suite now has a separate command because `test` launches the interactive prototype:

```sh
npm run test:unit
```

With the prototype running, capture a continuous controller-driven browser review:

```sh
node tests/kart-prototype/review.mjs
```

The review uses actual controller-page touch events and Socket.IO with synthetic orientation input. It drives through the curve, drift release, ramp launch, canopy deployment and landing without changing simulation state. It also checks release/stale-input handling, zero audio contexts, and absence of full-game routes or source assets. Recordings and screenshots are saved in ignored `games/mario-kart/evidence/prototype-test-combined/`. Physical phone feel remains a live-play check.

Capture and verify the graphics progression separately:

```sh
node tests/kart-prototype/review-showcase.mjs
```

This uses public keyboard controls, records all stages and one full camera loop, and checks silence, resize, returning to driving, cancellation during loading, and recovery from missing assets. Its screenshots, browser recording and report go into ignored `games/mario-kart/evidence/prototype-showcase/`.
