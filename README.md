# Velocity Legends

Velocity Legends is my browser-based 3D arcade racing game built with Three.js and Vite.

## Run it

```bash
npm install
npm run dev
```

Local URL:

```text
http://localhost:1807
```

## Build

```bash
npm run build
```

## GitHub Pages

The repository is set up for GitHub Pages under:

```text
/velocity-legends/
```

Push to `main` and the GitHub Actions workflow builds and deploys the `dist` folder.

## Player accounts

The published version uses Firebase Authentication. A new player signs in with Google and verifies a phone number once by OTP. Firebase stores the account record and the game listens for my admin controls.

See `FIREBASE_SETUP.md` for the setup and the fields I use to block users or give credits.

## Install behaviour

There is no Install button in the game menu. On the first browser launch, the game uses the browser's native PWA install prompt when it is available. The browser still controls the final install confirmation.

After installation the app uses the icon files in `public/icons` and opens in fullscreen landscape mode.
