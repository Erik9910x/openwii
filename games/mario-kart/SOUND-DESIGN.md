# Sound, item-box contact, and drift — next iteration

Prepared September 12, 2026. The combined implementation is now in place: 97 prepared original cues, music/engine/effect states, layered box glass and three drift-spark stages. Isolated item-effect gaps remain explicitly labelled placeholders. See [the iteration review](evidence/overnight/68-sound-box-drift/review.html) and [runtime audio notes](AUDIO.md). The source collection below is preserved separately from the prepared runtime pack.

## Source collection

Open the [local listening catalog](../../assets/mario-kart/audio-source/index.html). It includes search, individual playback, source links and technical manifests.

- 17 original sound packs, containing **2,283 WAVs**, covering common effects, race/menu cues, engines, kart bodies, terrain, course ambience/objects, the eight current drivers, and Lakitu.
- **55 FLAC music/cue files**, including all four Mario Kart Stadium variants (normal, frontrunning, final lap, final lap frontrunning), title/selection/grid music, lap and finish fanfares, results, Star music, and the album's SFX tracks. This is the current course/global selection, not the entire all-course soundtrack.
- ZIP integrity checks passed; WAV headers were parsed without errors; all 55 FLACs fully decoded successfully. 454 WAVs have loop metadata. These checks verify readable files, not that every candidate has been listened to and matched to its gameplay role.
- About 783 MB locally including original ZIPs and extracted files. Sources remain in the gitignored `assets/mario-kart/audio-source/` folder. Only the selected, prepared runtime cues should be loaded by the browser.

Sources: [MK8 Deluxe sound packs](https://sounds.spriters-resource.com/nintendo_switch/mariokart8deluxe/), [MK8 Wii U sound packs](https://sounds.spriters-resource.com/wii_u/mariokart8/), and the [MK8 full gamerip album](https://downloads.khinsider.com/game-soundtracks/album/mario-kart-8-full-gamerip). Each downloaded archive/track has its source URL and SHA-256 recorded in the local manifests.

## Asset gaps to resolve

These isolated original cues have **not yet been identified and verified** in the downloaded collection:

1. Mystery-box glass break/contact transient. The album's `SFX - Item - Item Box` is a composite candidate; inspect it before deciding whether a clean transient can be extracted.
2. Green/red shell launch, travel, ricochet and break/impact. `SE_ITM_KAME_EQUIP_*` covers equip candidates, not confirmed throwing or impacts.
3. Banana placement/contact and slip. Generic kart spin/damage sounds are available but are not evidence of a complete banana-specific sequence.
4. Blue-shell flight, pre-explosion wind-up and detonation. A generic item alarm exists; its filename does not establish a blue-shell match.

A ZIP of extracted original MK8/MK8 Deluxe **item effects** is the most useful manual upload. Individual WAV/OGG/FLAC files without music or commentary also work; preserve original filenames. No need to re-download Stadium music, voices, engine banks, roulette or drift-tier sounds. If an existing personal extraction contains the raw `turbo_sound.bfsar` bank, that is another candidate for inspecting missing cues; the [documented Wii U audio layout](https://mk8.tockdom.com/wiki/Filesystem/Wii_U/content/audio) lists this bank. A full game image is unnecessary.

## Sound implementation

The current `KartAudio` interface mostly maps generic events to synths, one music loop and a single engine oscillator/override. Replace its internal orchestration with explicit race states and layered cues while preserving the public mute/pause controls.

| Gameplay phase | Available original candidates | Behavior to implement |
| --- | --- | --- |
| One-button menu | Title/selection music; menu pack | One coherent menu loop, confirm cue, transition to grid; no extra menu hierarchy |
| Race start | `SE_RC_321.wav`, `SE_RC_GO.wav`, standard kart pre-start/rocket-start engine | Countdown and start tied to race clock; avoid overlapping the combined album countdown with individual cues |
| Item pickup | Contact transient still unresolved; `SE_RC_ITEM_ROULETTE.wav`, `SE_RC_ITEM_DECIDE.wav` | Contact on collision frame, roulette during slot animation, stop and decide when selected item lands |
| Drift | Asphalt slip loop, `SE_KT_DRIFT_HIBANA_BLUE.wav`, `...RED.wav`, `...PURPLE.wav` | Tire friction during drift; one charge cue on each tier transition; terminate cleanly on cancel/spin/end |
| Boost release | `SE_KT_DASH_MINI.wav`, `SE_KT_DASH_MINI_ULTRA.wav`, standard kart dash-engine layers | Release transient and engine layer synchronized with boost onset; distinguish charge from release |
| Engine | `sfx/kart/Karts/K_Std/` idle, acceleration, pre-start, dash, mini-turbo and stop WAVs | Crossfade engine states; use exact sample loop metadata; tune pitch against speed without replaying attacks each frame |
| Road and collisions | Asphalt/grass/metal banks; `SE_KT_COL_CAR.wav`, crash/spin/landing candidates | Surface-dependent rolling/slip; impact intensity and cooldown; quieter nearby rivals |
| Hop, trick, landing | `SE_KT_MINI_JUMP.wav`, `SE_KT_JUMP_ACTION.wav`, `SE_KT_LAND_SKID_*` | Separate takeoff, trick and landing events; ground contact drives landing sound |
| Anti-gravity | Hover entry/exit/loop/dash candidates | Transition layers according to actual track state |
| Items and voices | Coin, Star, alarm, shell equip; all current driver voicebanks | Item-specific use/flight/hit mapping after audition; bounded voice variation and cooldown |
| Stadium ambience | `Courses/Gu_FirstCircuit/` audience loop/shot candidates | Verify course match by listening; keep ambience behind gameplay cues |
| Lap / finish | Lap fanfares, four Stadium arrangements, finish/results music | Music state transitions on actual lap and result; stop race layers at finish |

Preparation and mixing:

- Audition candidate clips first. Retain source originals, generate a small runtime manifest with cue role, source path/hash, trim, gain and loop points. Avoid indiscriminate volume normalization that flattens transients.
- The FLAC album files are rendered tracks: detect/verify musical loop boundaries and arrange intro-to-loop transitions. Do not simply repeat the entire album render or independently start frontrunning arrangements out of phase.
- Separate music, engine/road, gameplay effects, ambience and voice buses. Start with music below critical cues, short ducking for major fanfares, and limited simultaneous voices. Final levels are listening decisions, not yet measured native-game values.
- Preload the selected runtime set after the start gesture and before countdown. The current asynchronous override probing can emit synth audio on first use; the prepared set should be ready for the first pickup.
- Pause/resume all loops together; mute immediately; stop/reset sources on restart. Prevent duplicate loops and per-frame trigger spam. Give spatial/distance treatment to relevant nearby rival sounds.

## Item-box contact visuals

Reference: [native Stadium gameplay near the first pickup](https://www.youtube.com/watch?v=dra-cT-O83U&t=158s). Frame stepping shows a burst of visibly faceted, irregular glass pieces, cyan/purple highlights, small glints and a short multicolored glow around the kart. The existing small uniform triangle fragments and blurred point flash do not reproduce those layers.

Implement a short, readable sequence anchored at the actual contacted box:

1. Contact: remove the collected cube and produce a compact bright flash at its world position. Trigger the glass transient at this same event.
2. Break: emit varied polygon shards with translucent colored faces and bright edge facets. Mix a few larger readable pieces with smaller debris; use outward velocity, tumbling and fading rather than a cloud of identical triangles.
3. Afterglow: brief prismatic glints around the moving kart, then quick dissipation. Keep the driver silhouette readable; do not extend the burst into a persistent opaque trail.
4. Roulette: start immediately, continue through the existing item-selection period, and end with the isolated decide cue and settled icon. One pickup event must drive audio, world effect and HUD timing.

Durations, shard counts and intensity must be tuned from matched footage, not represented as exact native values before measurement. Pool geometry/material instances to preserve the current frame budget.

## Drift sparks

Reference: [Nintendo's MK8 Deluxe driving guide](https://www.nintendo.com/jp/ichikara/aabpa/index_en.html) documents blue, orange and pink charge stages and release boosts. Use Deluxe for the third tier; Wii U footage alone does not establish it.

- Emit dense, short sparks at the rear tire contact patches, aligned to the track surface even on banked sections.
- Layer a small bright core, irregular colored arcs/streaks, sparse trailing embers and restrained tire smoke. The visual should read as friction near the wheels, not straight detached beams or a uniform spray.
- At each charge threshold, add a clear brief flare and the corresponding original charge cue, once per transition. Color progression remains blue → orange → pink/purple.
- On release, stop the charging layer and produce a distinct boost flare/engine sound; preserve the existing boost flame work. Cancel cleanly for collisions, invalid drifts and race restart.
- Evaluate under the real chase camera at full race speed, including a banked section, rather than judging particle close-ups alone.

## Verifiable combined iteration

1. Prepare the available runtime samples and source manifest. Keep unresolved isolated item cues labelled and replaceable; their manual upload does not block this iteration.
2. Implement sound states, box sequence and drift layers together. Keep unrelated track/camera/physics tuning deferred.
3. Capture controlled box pickup → roulette → item reveal, each drift tier → release, cancelled drift, jump/landing, kart collision, item use/hit, and lap/finish transitions. Include sound in the recording.
4. Compare our pickup and drift recordings with the native references at normal speed and frame by frame. Check emission origin, phase order, visual density, relative cue timing and decay.
5. Existing browser `recordVideo` evidence is silent. Capture a Web Audio destination mixed with the gameplay canvas stream (or verified tab audio capture), and confirm the resulting recording contains an audible audio track. Do not present a silent clip as sound-design verification.
6. Inspect/listen to the recording, fix observed defects, then run one complete race with audio. Check pause/mute/restart and finish cleanup, no duplicate loops or clipping, and representative frame-time impact.
7. Publish local review links to the short audiovisual comparison, complete race, cue/source manifest and checks. Stop for Patrick's review once these scoped requirements pass. Do not commit without a request.

Completion means the combined experience has been heard and watched in captured gameplay. File availability, passing unit checks, or a visually plausible still image alone are insufficient.
