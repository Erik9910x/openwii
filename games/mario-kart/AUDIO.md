# Mario Kart audio

The game now prefers the optional original sample pack at `/assets/mario-kart/audio/manifest.json`. The original downloads remain under `assets/mario-kart/audio-source/`; neither folder is committed. [Browse the source collection](../../assets/mario-kart/audio-source/index.html).

Build the prepared pack with `python3 games/mario-kart/pipeline/prepare-audio.py` from the repository root. The builder uses NumPy, SciPy and ffmpeg (or imageio-ffmpeg), preserves the originals, records source SHA-256 hashes, uses exact WAV loop metadata and detects repeated musical passages for music loops. The current selection is 97 cues, approximately 24 MB on disk; all-course source banks are not browser dependencies.

`sample-audio.js` owns music, engine/road, effects, voices and ambience buses. The first Start gesture waits for preparation before countdown. Normal and frontrunning arrangements start at the same audio-clock timestamp, drift charge stops on release/cancellation, and roulette ends on item selection. Pause suspends the graph, mute controls the complete master mix, and race finish clears driving loops. Star music returns to the ongoing race arrangement's musical position. Relevant nearby rival impacts and item uses are attenuated and panned.

The glass transient and generic shell/banana item-use sounds remain explicitly labelled placeholders. Exact isolated item clips are still needed; see [the sound plan](SOUND-DESIGN.md). Optional uploads can be prepared as `audio-source/manual/box.wav`, `use-green.wav`, `use-red.wav`, `use-banana.wav`, `use-blue.wav`, and corresponding `hit-*.wav`. Rebuild and reload after adding them. Verify the original sound's role before assigning a filename.

For verification, run `node games/mario-kart/review-sound.mjs` against the HTTP server on port 8080. It captures the game tab including HTML HUD and the actual master audio bus in one MediaRecorder timeline. `RECORD_AUDIO=1 node games/mario-kart/visual-demo.mjs` records a full keyboard-driven race with sound. No desktop audio or unrelated tabs are captured. The test browser uses Chromium's current-tab capture test switch; it does not change the user's browser permissions.

## Asset-free fallback

Without a usable prepared pack, the existing synth engine and optional `/audio/mk-*` overrides below remain available. The source repository still runs without downloaded sound assets. These legacy slots apply to the fallback; the prepared pack uses its own explicit cue manifest.

The source includes original synth cues and an original short stadium groove. No audio binaries are required. Drop your own files in **the worktree's** `audio/` directory. `core/audio.js` tries `.mp3`, `.wav`, then `.ogg`. Reload the game after adding a file; the first cue may use its immediate synth while the optional file decodes.

| Files (without extension) | Event |
|---|---|
| `mk-countdown`, `mk-go`, `mk-rocket`, `mk-burnout` | Start lights and launch |
| `mk-hop`, `mk-drift`, `mk-turbo`, `mk-boost` | Hop, charge tier, drift release, track pad |
| `mk-coin`, `mk-box`, `mk-itemReady`, `mk-useItem` | Collection, roulette and item release |
| `mk-hit`, `mk-wall`, `mk-bump` | Spin-outs, wall glances and anti-grav contact |
| `mk-antigrav`, `mk-glider`, `mk-land` | Road mode transitions |
| `mk-lap`, `mk-finalLap`, `mk-finish`, `mk-results` | Lap notices and race finish |
| `mk-engine` | Continuous engine loop; playback rate follows speed |
| `mk-music` | Continuous background race music |

The engine loop should be a steady, seamlessly looped idle/rev sample. The game changes its playback rate. Without it, a filtered oscillator follows actual speed. Music and engine levels fade out on the results screen. The sound toggle controls the complete mix, including when toggled before the first gesture. Hiding/pausing the game suspends audio.

Verification: headless tests verify every event has a synth; the browser harness checks the actual oscillator frequency, mute-before-unlock behavior, and an in-memory WAV fixture through the real file override fetch/decode path. Subjective sound balance has not been evaluated by listening on Patrick's speakers.
