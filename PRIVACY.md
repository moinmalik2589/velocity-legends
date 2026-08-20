# Privacy

Velocity Legends uses Firebase Authentication, Cloud Firestore and Firebase Analytics.

A player is asked to sign in with Google and verify a phone number. The account record can contain the player's Firebase UID, Google account email, display name, profile photo URL, verified phone number, account timestamps, basic device/browser information and game status such as the selected car and last known credit balance.

The game also records normal gameplay analytics such as screens opened, cars selected, races started and races completed when Usage Analytics is enabled.

Email addresses and phone numbers are kept in Firebase Authentication/Firestore for account management and are not intentionally sent as Analytics event parameters.

The game administrator can block an account, delete an account and grant or remove in-game credits.
