# Mario Kart integration

Codex's implementation (`339339e`) was merged into `main` as `607f4a4`, retaining the existing main history and both remote README commits through `c2f5f94`. The accepted main history is published to `origin/main`; no history was rewritten.

## Working directories

- **Continue development:** `/Users/patricksun/GitHub/OpenWii`, branch `main`. Run `npm start` here for HTTPS and real phone sensors.
- **Claude archive:** `/Users/patricksun/GitHub/OpenWii-claude`, branch `archive/claude-mario-kart`, snapshot commit `8bf3d9b`. All 20 modified/new source paths were committed unchanged, including unfinished edits to other games. They were not merged into main.
- **Original Codex checkout:** the fully merged `codex/mario-kart` branch and `.worktrees/codex` directory were removed after verification. Commit `339339e` remains in main history. Models and evidence were preserved in the main checkout; older evidence variants are under ignored `games/mario-kart/evidence/original-codex-worktree/`.

Claude's ignored assets, audio and development certificates were copied to the archive and byte-verified (275 files). A local checksum manifest is in [evidence/migration-archive-manifest.json](evidence/migration-archive-manifest.json). The archive's dependencies can be installed with `npm install` if it needs to be run later.

Main uses Codex's exact generated Mario Kart model pack. Existing audio, certificates and the unused Kenney folder remain intact. Original browser evidence was also copied into main. Generated assets, audio, certificates and evidence remain untracked.

## Verification

- Existing game directories, shared core and README match the previous `origin/main` byte-for-byte in Git.
- Runtime changes outside Mario Kart are limited to its controller support, launcher entry, static routes, build/test dependencies and ignore rules.
- All pre-existing commits, the two README updates and Codex's original implementation commit remain ancestors of main. Claude's archive commit is separate.
- All 149 tests pass from the main checkout: [test log](evidence/migration-tests.log).
- Browser verification from main: [browser log](evidence/migration-browser.log), [structured results](evidence/browser-report.json).

The current phone instructions are in [REPORT.md](REPORT.md). Physical phone steering remains an acceptance check; simulated touch and sensor tests cannot establish real-hand feel.
