# Velocity Legends Architecture

## Current baseline

The playable client is a Vite + Phaser 3 application. Phaser owns current UI, input, offline save, race progression, and gameplay. This baseline remains runnable throughout the migration.

## Production direction

The project will move to a renderer-agnostic game domain and a Three.js racing renderer in staged releases. Phaser is retained only while the 3D renderer reaches feature parity; it will not own a second save, input, or race-progression system.

## Authoritative systems

- `PlayerManager` + `StorageManager`: offline profile persistence.
- `VehicleManager`: inventory, equipment, paint, upgrades.
- `RaceProgressManager`: ordered waypoint/lap completion.
- `RaceResults`: idempotent finish rewards.
- `EventBus`: cross-system events.

## Planned monorepo

`client/`, `server/`, `admin/`, `shared/`, `database/`, `docs/`, `tests/`, and `tools/` will be added incrementally without moving the working client until imports and CI are prepared.

## Known limitations

Current races are 2D and use procedural/temporary art. True 3D requires a staged renderer migration, original low-poly assets, mobile performance testing, and Android packaging.
