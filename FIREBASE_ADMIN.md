# Velocity Legends - Firebase player controls

Open **Firebase Console -> Firestore Database -> Data -> users -> player's UID**.

The game listens to that document live. You can edit these fields:

## Account
- `blocked` (boolean) - `true` blocks the account, `false` allows it.

## Credits
- `lastKnownCredits` (number) - exact visible credit balance.
- `creditsOverride` (number) - also sets exact balance and takes priority.
- `creditGrant` (number) + `creditGrantId` (string) - one-time add/remove. Change the ID each time.

## Selected car and garage
- `selectedCar` (string) - exact selected car ID. If necessary the app unlocks it.
- `unlockedCars` (array of strings) - exact unlocked car list.
- `lockedCars` (array of strings) - cars forced back to locked.
- `upgrades` (map/object) - per-car upgrade levels, 0 to 5.
- `carColors` (map/object) - saved car paint values.

Car IDs:
`vortex`, `comet`, `raijin`, `falcon`, `spectre`, `tempest`, `phantom`, `apex`,
`nova`, `zenith`, `eclipse`, `legend`.

Example upgrades:
```json
{
  "vortex": {"engine": 5, "handling": 4, "nitro": 3},
  "nova": {"engine": 5, "handling": 5, "nitro": 5}
}
```

## Career and level
- `careerCompleted` (number 0-15) - marks the first N career events complete.
- `level` (number 1-16) - convenient career-level control. Level 1 means no events cleared.
- `completedEvents` (array of event IDs) - exact completed events when you want non-linear control.
- `bestTimes` (map/object) - exact saved best-time data.

Event IDs are `e01` through `e15`.

## Achievements
- `unlockedAchievements` (array of strings) - exact earned achievement IDs.
- `achievements` (map/object of booleans) - alternative exact control.

Achievement IDs:
`firstwin`, `collector`, `speed250`, `drifter`, `career5`, `career15`.

## Notes
The Firestore snapshot is live. Changes normally appear in an open game without refreshing.
If you use both an override field and a last-known field, the override has priority.
