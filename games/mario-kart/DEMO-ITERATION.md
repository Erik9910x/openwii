# Current iteration — lap selection and immediate finish results

Pass73 implemented and validated for review, alongside the controller, audio and results refinements from passes69–72. Broader loop paused.

[Review recording and screenshots](evidence/overnight/73-lap-finish/review.html) · [Timing and controller checks](evidence/overnight/73-lap-finish/report.json).

- Driver menu offers 1 lap / 3 laps, defaults to three, and remembers the last choice locally. Mouse selection works directly. After confirming the driver, phone crosspad left/right selects length and 2 starts; 1 returns to driver selection.
- Lap HUD, finish checkpoints and race-again follow the selected length. One-lap races retain normal race music rather than immediately playing the accelerated final-lap music.
- Leaderboard reveals on the first rendered frame after the short finish cue ends, without waiting for the placement fanfare or other racers. The fanfare continues underneath. Standings are a fixed snapshot; unfinished rivals display an em dash rather than a fabricated time.
- The camera swings around immediately at the finish, then follows in front of the automatically driving racer, framed to the left of the leaderboard.
- Existing quiet results gameplay mix and entrance/tally/stop sounds remain. Original audible shell-hit fallback remains unchanged.

Validation: 218 unit tests; 23 browser checks; actual controller-page touch events over Socket.IO with synthetic IMU; recorded one- and three-lap final crossings with all seven opponents still unfinished. Results appear 12 ms and 1 ms after the decoded short cue ends. Recording audio has no clipped samples. Reviewed recorded filmstrips and menu/result screenshots. These staged finish clips are not a full manual race or a physical iPhone test.

Previous: [pass72](evidence/overnight/72-results-timing/review.html). Previous iteration baseline: e325ef5.
