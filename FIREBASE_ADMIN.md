# Velocity Legends - Firebase player controls

Open Firebase Console -> Firestore Database -> Data -> users -> choose the player's UID document.

Fields you can add/edit from Firebase Console:

- `blocked` (boolean): `true` blocks the player, `false` allows them.
- `creditsOverride` (number): exact credit balance, e.g. `10000`.
- `creditGrant` (number): add/remove credits, e.g. `500` or `-500`.
- `creditGrantId` (string): change this every time a creditGrant should run, e.g. `grant-001`, then `grant-002`.
- `unlockedCars` (array of strings): exact list of unlocked car IDs. Keep `vortex` as the starter car.
- `lockedCars` (array of strings): car IDs to force-lock.
- `unlockedAchievements` (array of strings): exact achievement IDs that should show as earned.

Car IDs and achievement IDs are defined in `src/data.js`.

The player app can read these admin fields but the included Firestore rules do not allow the player client to write them. Firebase Console/admin access can edit them.
