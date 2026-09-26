# Optional local source conversions

These tools convert locally supplied Nintendo Mario Kart 8 models. The source artwork is not original OpenWii artwork and is not covered by the repository's MIT software license. The selected converted GLBs, source-derived route data, prepared audio, and UI assets are included in `assets/mario-kart/` for normal play. Original download archives, extracted source folders, alternate packs, and review evidence remain ignored. The public repository also retains its procedural fallback.

The tools use the existing local HTTP server and installed Three.js/Playwright/Chrome. They do not download assets, publish anything or change a gameplay manifest. Start the normal development server before invoking them. Default conversion origin is `http://localhost:8080`; override with `KART_BUILD_ORIGIN`.

## Mario and Standard Kart

`node games/mario-kart/pipeline/build-source.mjs`

Inputs are the extracted Mario, Standard Kart and Standard Tire archives under `games/mario-kart/evidence/asset-study/`, or a corresponding server URL supplied as `KART_SOURCE_URL`. Source pages and submitter credits are recorded in the output provenance JSON. The converter corrects pupil overlays, poses the skeleton, assigns kart paint/emblem textures and makes four independent wheel pivots with the source tire emission mask. The runtime preserves source rim geometry and applies its own smooth antigravity material/tilt behavior. Outputs `assets/mario-kart/mario-source.glb` and a provenance/hash sidecar. The original generated models remain present as separate local files. The current local manifest selects source conversions for all eight racers.

## Seven additional racers

`node games/mario-kart/pipeline/build-source-rivals.mjs`

Optional arguments select individual IDs: `luigi peach yoshi toad bowser donkey-kong koopa`. Inputs are extracted local driver folders, plus the same kart/tire folders as Mario. The converter preserves the proven source chassis and independent tire pivots, selects each driver's paint and emblem, and fits an observed Y-up skeleton into a seated pose. Texture repetition is necessary: Luigi's body and Koopa's eye UVs extend outside the unit square. Pupil overlays are hidden because the eye atlases include pupils. Yoshi's extended rest-pose tongue is retracted; Peach's hair, skirt and hidden legs are fitted to the seat. These poses and proportions are art-directed, not Nintendo animations.

Outputs are `<id>-source.glb` and provenance sidecars with source-page/archive records, input and converter hashes, shared asset credits and output hashes. Conversion itself does not alter the manifest. The local manifest was selected after three-angle exported-model review; prior selection is preserved under ignored `evidence/asset-study/before-rivals-45/`.

`node games/mario-kart/pipeline/review-source-rivals.mjs` captures all eight exported models from front, rear and side and checks runtime head/wheel metadata. `EVIDENCE_DIR` overrides its output folder. A studio review is separate from the full keyboard race and its loaded-byte verification.

## Mario Kart Stadium

`node games/mario-kart/pipeline/build-source-stadium.mjs`

Defaults to the extracted OBJ, MTL and textures in `games/mario-kart/evidence/asset-study/stadium/`. Override its filesystem directory with `KART_STADIUM_DIR` and matching server URL with `KART_STADIUM_URL`. The folder must contain the archive's `Mario Kart Stadium.obj` and `.mtl` plus original textures.

The builder runs `source-road.py` using Python's standard library to recover the actual road center from mesh UV intersections. It validates unbranched topology and ordered landmark seams, preserves the explicit launch gap, and samples positions/normals. `source-surface.py` then attaches the actual indexed ground triangles, normals, road classification and boost-panel masks. Runtime support queries use these triangles through a spatial grid; width queries preserve separate road branches while joining narrow divider strips. `KART_STADIUM_ROUTE` may supply a precomputed route instead. The material conversion resolves filename capitalization, adds normal/emissive maps, preserves cutout alpha, and hides the opaque shadow-only proxy mesh and two misplaced light component groups through `source-visible.js`. Roof light geometry remains visible. The runtime applies the same exclusions to previously converted packs. GLB vertex welding preserves UV and normal seams.

Outputs `assets/mario-kart/stadium-source.glb`, `stadium-route.json` and `stadium-source.provenance.json`. Provenance includes all input file hashes, converter hashes, source page and credits. The ignored local manifest now selects this course through `course: {model: "stadium-source.glb", route: "stadium-route.json"}`. Runtime driving, contacts and the chase camera use its measured three-dimensional surface. `?sourceCourse=0` selects the original course; a missing or invalid optional pack falls back automatically.

`node games/mario-kart/pipeline/review-source-stadium.mjs` reloads the exported GLB, measures independent ray intersections for all non-air route samples, and captures 14 poses under `games/mario-kart/evidence/asset-study/stadium-converted/`. This is a geometry verification, not a race or controller test. The source course has also completed a separately recorded real-keyboard race; see `../OVERNIGHT-LOOP.md`. Geometry verification alone is not gameplay acceptance.

Source asphalt uses its normal maps at strength 1.1 and an art-directed roughness approximation from the original SPM scalar: `0.56 - 0.26 * sqrt(scalar / 255)`. These particular source textures repeat their scalar in RGBA; the converter reads alpha to avoid Canvas premultiplication loss. The exported green roughness channels were independently compared pixel-for-pixel against the original PNGs. This does not reproduce Nintendo’s shader. `source-materials.js` also applies emission levels to the original masked lamps and windows.

Physical ground includes the source `fc_shiba` turf banks as off-road surfaces. A recorded final-corner failure identified visible grass about 1.8 m above the old fallback plane. The corrected ground mesh contains 12,162 triangles and 12,056 vertices. Independent exported-mesh rays now verify the two actual failed contact positions as well as the ordinary route samples. Regenerating only route geometry leaves the GLB unchanged; its provenance sidecar records a separate route revision and hash.

## Stadium TV surfaces and branding

`source-screens.js` corrects V coordinates only on the imported `fc_TV_MKTV` and `fc_TV_capture` surfaces at runtime. Their physical upper vertices have source V=0, which inverted both the source bitmap and the GPU race feed. Other signs and the GLB on disk remain unchanged. `node games/mario-kart/source-screen-review.mjs` renders a labeled calibration card through bitmap and render-target paths, samples corners derived from physical world-space height, and verifies the correction is idempotent.

`python3 games/mario-kart/pipeline/build-source-tv.py` packs the 49 locally supplied `mktv.<n>.png` frames into an edge-padded atlas and writes input/output hashes and layout metadata. It does not select the atlas automatically. The ignored local manifest now supplies its descriptor through `course.tvBrand`. The runtime validates layout dimensions, uses one texture, plays the source introduction and loops the completed logo's signal animation. Timing is art-directed at 20 frames per second. Missing/invalid optional branding retains the source bitmap. Generated scenery is unaffected. The snapshot tool includes asset PNGs so browser-loaded atlas bytes are verified alongside code and GLBs.

`?sourceCourse=1` prefers the full local manifest descriptor, including optional branding, and uses the conventional source filenames only when no descriptor exists. `?sourceCourse=0` keeps the generated course. `node games/mario-kart/source-pack-review.mjs` exercises both selection paths and a deliberately unavailable atlas in actual browser sessions. New race reports retain the fetched asset manifest; verification requires any selected TV atlas to have been loaded successfully and to match the preserved hash.
