# Reference and rendering notes — 2026-09-10

## Course

Viewed the [Nintendo course screenshot reproduced by Super Mario Wiki](https://mario.wiki.gallery/images/thumb/2/22/MK8_Mario_Kart_Stadium.png/1200px-MK8_Mario_Kart_Stadium.png) and the [overhead course guide](https://toragame.com/mario_cart8/course/kino_mario.php). Local reference images are in ignored `evidence/`.

[Course description](https://www.mariowiki.com/Mario_Kart_Stadium): short pit straight, right turn into a three-color hairpin (inner blue, middle yellow, outer red with pads), then anti-gravity entrance and elevated hairpin, gliding return, final left bend. The stadium is surrounded by a city and advertising. The reconstruction follows this sequence and the map silhouette. It is an approximation, not a surveyed copy of Nintendo geometry.

Visual observations from the actual screenshot: navy night sky, cool white floodlights, warm windows, red/white rumble strips, cyan rails on the rising road, densely speckled grandstands, large MKTV screens, pit roofs, sponsor fascia, spotlights/fireworks, a Mario monument above the arena. Road remains bright and readable despite the night setting. Those are the renderer's priorities.

## Open-source techniques inspected before renderer implementation

- [Mario-Kart-3.js lighting source](https://github.com/mustache-dev/Mario-Kart-3.js/blob/main/src/misc/Lighting.jsx): player-following directional shadow camera, 2048 shadow map, environment illumination. Apply focused moving shadows and environment reflections.
- [Its color grading](https://github.com/mustache-dev/Mario-Kart-3.js/blob/main/src/ColorGradingEffect.jsx): filmic mapping, saturation/contrast control and boost presentation. Apply restrained bloom, ACES exposure and speed-dependent camera FOV; keep HUD crisp outside the post stack.
- [pmndrs racing-game track](https://github.com/pmndrs/racing-game/blob/main/src/models/track/Track.tsx): authored GLB/environment pack with explicit roughness and shadow flags. Build our own Blender pack and preserve material/mesh names for animated wheel transforms.
- [pmndrs skids](https://github.com/pmndrs/racing-game/blob/main/src/effects/Skid.tsx) and [boost](https://github.com/pmndrs/racing-game/blob/main/src/effects/Boost.tsx): bounded instanced pools. Apply instanced crowd, pooled sparks to avoid growing scene allocations.

No code, track mesh, or character asset from those projects is copied. Techniques are reimplemented in vanilla Three.js. Procedural asphalt/grass/sign textures and local character models avoid remote runtime dependencies.

## Control decision

Reuse `captureTray`, `trayRead`, `SteerFilter` and `STEER_FULL` directly from Alien Attack. Keep its existing `openwii.chargeInvert2` preference. Capture only a stable, near-level landscape tray during the countdown; ambiguous/wrong-time capture yields neutral steering plus visible recenter guidance. During racing do not silently learn a deliberate held corner. Input is absolute steering, never integrated angular sensor rate. Race simulation uses a fixed 120 Hz step, independent from rendering and packet cadence.
