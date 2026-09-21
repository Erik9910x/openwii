# Mario Kart for OpenWii

A fan-made browser racing game with your phone as the steering wheel. Choose
one of eight drivers and race seven CPU opponents for one or three laps, with
items, drifting, mini-turbos, anti-gravity and gliding.

From the repository root:

```sh
npm ci
npm start
```

Open the launcher, scan its QR code with a phone on the same Wi-Fi, enable motion
and select the first tile. Hold the remote sideways: **2** accelerates, **1**
brakes, **A** drifts and **crosspad right** uses an item. Choose a driver with the
crosspad and press **2**, choose the lap count, then press **2** again to race.

See the main README for [requirements and setup](../../README.md#quick-start),
[all controls](#controls) and
[troubleshooting](../../README.md#troubleshooting).

## Controls

Hold the phone sideways with the **crosspad on the left and 1 / 2 on the right**,
screen mostly facing up. Roll it like a steering wheel to turn. The remote keeps
its physical button arrangement when the browser changes orientation; on iPad,
the controls scale up to fit the screen.

1. Choose a driver with the crosspad and press **2** to confirm.
2. Choose **1 lap or 3 laps** with left/right, then press **2** again to start.
   The game remembers your lap choice. Press **1** here to change driver.
3. Hold the phone level and still for a moment. The countdown waits until the
   steering wheel has a stable neutral position. Hold **2** after GO to accelerate.

| Action | Phone remote | Computer keyboard |
| --- | --- | --- |
| Steer | Tilt left / right | ← / → |
| Accelerate | Hold **2** | Hold **Z** |
| Brake / reverse | Hold **1** | Hold **X** |
| Drift | Hold **A** while turning | Hold **Shift** while turning |
| Release drift boost | Release **A** | Release **Shift** |
| Use item | Crosspad **→** | **Space** |
| Confirm / resume | **2** | **Enter** |
| Recenter steering | **−**, then level the phone and resume | **R** |
| Return to launcher | **Home** | Click **Channels** |

Choose a driver and race length with the mouse or keyboard if no phone is
connected. **Esc** pauses/resumes, **F** toggles fullscreen, **C** toggles a clean
view, and the **Sound** button mutes the game. If steering feels reversed, press
**I** on the computer to invert it. Hiding the game or losing the phone connection
pauses the race; reconnect and press **2 / Enter** to resume.

Drifting builds blue, orange, then purple sparks; release it for a mini-turbo.
Item boxes award power-ups, coins raise top speed, and ramps deploy the glider
automatically. The leaderboard appears after the finish cue, with the race
continuing behind it. Mario Kart currently supports **one phone driver** against
seven computer-controlled racers, using the first phone's player slot.


## What comes with the repository

The public game runs with a generated track, procedural models and synthesized
audio. No asset download or Blender build is required. Original-game models,
course data, fonts and recordings used in the polished video demo are optional
local files, excluded from Git; a fresh clone looks and sounds different.

- [Optional model/course conversion tools](pipeline/SOURCE-ASSETS.md)
- [Optional audio and synthesized fallback](AUDIO.md)
- [Silent development-video prototype and graphics showcase](../../tests/kart-prototype/README.md)

## Checks

```sh
npm run test:unit
# With npm start running and Google Chrome installed:
npm run test:kart-public
```

The public browser check runs a full race with optional assets unavailable.
`REPORT.md`, `VISUAL-REPORT.md` and iteration notes record development history;
their local evidence links and earlier test counts are not release requirements.

This is an independent fan project, not an official Nintendo game or emulator.
The repository's MIT license covers its software, not third-party artwork or
recordings supplied separately.
