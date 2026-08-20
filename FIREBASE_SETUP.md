# Firebase setup

I use Firebase for player accounts, basic player records and Analytics.

## 1. Create the Firebase project

1. Open Firebase Console and create a project.
2. Add a Web app to the project.
3. Copy the Firebase web configuration values.
4. In Authentication > Settings > Authorized domains, add:

```text
moinmalik2589.github.io
```

## 2. Turn on login providers

Open Authentication > Sign-in method.

Enable:

- Google
- Phone

The game requires Google sign-in and then one-time phone OTP verification for a new player account.

Firebase does not give a website somebody's phone number automatically. The player has to enter the number and verify the OTP.

## 3. Create Firestore

Open Firestore Database and create the database.

Copy the rules from `firestore.rules` into Firestore > Rules and publish them.

The player can update only normal profile/game-status fields. The app cannot edit the admin fields used for blocking and credit grants.

## 4. Add the Firebase values locally

Copy `.env.example` to `.env` and fill in the values from Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Then run:

```bash
npm install
npm run dev
```

## 5. Add the same values to GitHub

GitHub repository > Settings > Secrets and variables > Actions > New repository secret.

Add these seven secrets:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

The included GitHub Actions file already passes them to the Vite build.

## Player records

After somebody finishes Google + phone verification, Firestore creates:

```text
users/{firebase uid}
```

The document shows fields such as:

```text
email
phoneNumber
displayName
createdAt
lastSeenAt
lastDevice
installed
lastKnownCredits
selectedCar
careerCompleted
```

## Block a player

In Firestore open the player's `users/{uid}` document and add:

```text
blocked = true
```

The game locks the player as soon as the document update reaches the device.

To unblock:

```text
blocked = false
```

You can also disable the account from Firebase Authentication > Users.

## Delete a player account

Open Firebase Authentication > Users, select the user and delete the account.

If you also want the Firestore record gone, delete the matching `users/{uid}` document from Firestore.

## Give a player credits

Open the user's Firestore document and add/change these two fields:

```text
creditGrant = 5000
creditGrantId = "grant-001"
```

The next time the player's app receives the update it adds 5,000 credits once.

For another grant, change both values, for example:

```text
creditGrant = 10000
creditGrantId = "grant-002"
```

Always use a new `creditGrantId`. Reusing the same ID will not give the same grant twice on that device.

A negative `creditGrant` can also remove credits, down to zero.

## Analytics

Firebase Analytics records normal app/game events such as app opens, screen views, cars selected, races started and races completed.

Firebase Authentication/Firestore is where I see the actual signed-in player account. Analytics should not be used to store phone numbers or email addresses.
