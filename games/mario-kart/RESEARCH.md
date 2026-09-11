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

No code, track mesh, or character asset from those projects is copied. Techniques are reimplemented in vanilla Three.js. Procedural asphalt/sign textures, original generated turf artwork and local character models avoid remote runtime dependencies. The turf generation prompt and tool provenance are in [art/README.md](art/README.md).

## Control decision

Reuse `captureTray`, `trayRead`, `SteerFilter` and `STEER_FULL` directly from Alien Attack. Keep its existing `openwii.chargeInvert2` preference. Capture only a stable, near-level landscape tray during the countdown; ambiguous/wrong-time capture yields neutral steering plus visible recenter guidance. During racing do not silently learn a deliberate held corner. Input is absolute steering, never integrated angular sensor rate. Race simulation uses a fixed 120 Hz step, independent from rendering and packet cadence.

## Visual iteration 2

Revisited Stadium, SNES Rainbow Road, Mario Circuit 3, Excitebike Arena and Moo Moo Meadows against Patrick's own recording and MK8 reference. The [comparison](VISUAL-GOALS.md) retains Stadium for the shared camera/material/asset upgrade; SNES Rainbow Road is the recommended alternate, subject to actual phone review.

Applied physically distinct clear-coated paint, metal, rubber and cloth following [Three.js MeshPhysicalMaterial documentation](https://threejs.org/docs/pages/MeshPhysicalMaterial.html). Baked self-occlusion from the local Blender sculpture into vertex colors, preserved by the optional GLB loader. New procedural pavement provides diffuse, normal and roughness maps; source images are not sampled into game assets.


## Creator model assessment — overnight pass 32

- [Angelo Argyrides’ Standard Kart](https://sketchfab.com/3d-models/standard-kart-from-mario-kart-8-558b8a7a423743ddada08585403d4fc1): creator describes a university recreation; current page has no download option.
- [Corpanther202’s Standard Kart recreation](https://sketchfab.com/3d-models/mario-kart8-standard-kart-aec3cb4abc784bcb90981e63d020d355): 74.2k triangles; no download listed in the inspected page text.
- [Mario Rig uploaded by plumbear106](https://sketchfab.com/3d-models/mario-rig-8e647915b47a41bf8432eb06d5ed19a4): page displays CC Attribution and “model by atlas”; Download opens a login modal. Original creator/provenance unresolved.
- [Bradley’s Odyssey promo model](https://bradleyisgone.gumroad.com/l/SMOMario): detailed cap, hair and clothing visible in creator preview; $0+ checkout, 110 MB. Product description does not specify redistribution terms. Reference only for now.
- [Nicholas Sceusa’s Mario](https://blendswap.com/blend/14925): CC-BY-NC; not selected for this broadly shared project.

These are availability observations, not a license clearance. No assets from these pages were downloaded or copied into OpenWii.

### Local source course conversion (overnight pass 35 follow-on)

The Models Resource's [Mario Kart Stadium archive](https://models.spriters-resource.com/wii_u/mariokart8/asset/293504/) is a complete Nintendo MK8 course OBJ/MTL/texture bundle, submitted by RayK. Downloaded the ordinary public ZIP into ignored local evidence and preserved its SHA256/page URL in `evidence/asset-study/stadium-source.json`. It is not original OpenWii artwork or covered by the repository's software license.

A reproducible local conversion now yields an ignored 70-mesh GLB and a measured 3D route, independently checked against exported road triangles. Source-derived coordinates and converted textures stay under ignored assets/evidence; no course is selected for gameplay yet. See `OVERNIGHT-LOOP.md` and `pipeline/SOURCE-ASSETS.md` for the exact distinction between the verified playable Mario replacement and the course integration experiment.
