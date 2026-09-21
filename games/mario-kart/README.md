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
[all controls](../../README.md#playing-mario-kart) and
[troubleshooting](../../README.md#troubleshooting).

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
