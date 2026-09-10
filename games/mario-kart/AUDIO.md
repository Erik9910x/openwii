# Sound slots

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
