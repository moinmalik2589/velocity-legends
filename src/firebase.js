import { getApp, getApps, initializeApp } from 'firebase/app';

import {
  getAnalytics,
  isSupported,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId,
  setUserProperties
} from 'firebase/analytics';

import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';

import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app = null;
let auth = null;
let db = null;
let analytics = null;
let analyticsReady = false;
let analyticsEnabled = true;

function hasCoreConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

function ensureFirebase() {
  if (!hasCoreConfig()) return false;

  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }

  if (!auth) {
    auth = getAuth(app);
  }

  if (!db) {
    db = getFirestore(app);
  }

  return true;
}

export function firebaseConfigured() {
  return hasCoreConfig();
}

export async function startAnalytics(collectionEnabled = true) {
  analyticsEnabled = Boolean(collectionEnabled);

  if (!ensureFirebase() || !firebaseConfig.measurementId) {
    return false;
  }

  try {
    if (!(await isSupported())) {
      return false;
    }

    analytics = getAnalytics(app);

    setAnalyticsCollectionEnabled(
      analytics,
      analyticsEnabled
    );

    analyticsReady = true;

    if (analyticsEnabled) {
      logEvent(analytics, 'app_opened');
    }

    return true;
  } catch (error) {
    console.warn(
      'Analytics could not start:',
      error
    );

    return false;
  }
}

export function setAnalyticsEnabled(value) {
  analyticsEnabled = Boolean(value);

  if (analytics) {
    setAnalyticsCollectionEnabled(
      analytics,
      analyticsEnabled
    );
  }
}

export function trackEvent(name, params = {}) {
  if (
    !analyticsReady ||
    !analyticsEnabled ||
    !analytics
  ) {
    return;
  }

  logEvent(analytics, name, params);
}

export function trackScreen(screenName) {
  trackEvent('screen_view', {
    firebase_screen: screenName,
    firebase_screen_class: 'VelocityLegends'
  });
}

export function setPlayerProperties(properties = {}) {
  if (
    !analyticsReady ||
    !analyticsEnabled ||
    !analytics
  ) {
    return;
  }

  setUserProperties(
    analytics,
    properties
  );
}

export function setAnalyticsUser(uid) {
  if (
    !analyticsReady ||
    !analyticsEnabled ||
    !analytics ||
    !uid
  ) {
    return;
  }

  setUserId(analytics, uid);
}

export function watchAuth(callback) {
  if (!ensureFirebase()) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(
    auth,
    callback
  );
}

export async function signInGoogle() {
  if (!ensureFirebase()) {
    throw new Error(
      'Firebase is not configured.'
    );
  }

  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: 'select_account'
  });

  const result = await signInWithPopup(
    auth,
    provider
  );

  return result.user;
}

/*
  Phone authentication has been removed.

  These three functions are intentionally
  kept because another file in the game may
  still import them.

  Returning true from hasPhoneProvider()
  tells the old login flow that verification
  has already been completed.

  This prevents the OTP screen from opening.
*/

export function hasPhoneProvider() {
  return true;
}

export function createPhoneVerifier() {
  return null;
}

export async function sendPhoneLinkCode() {
  throw new Error(
    'Phone verification is disabled. Please use Google sign-in.'
  );
}

export async function logoutPlayer() {
  if (!ensureFirebase()) {
    return;
  }

  await signOut(auth);
}

export function currentPlayer() {
  return auth?.currentUser || null;
}

export async function refreshPlayerToken() {
  if (!auth?.currentUser) {
    return false;
  }

  await auth.currentUser.getIdToken(true);

  return true;
}

export async function registerPlayer(
  user,
  installed = false
) {
  if (!ensureFirebase() || !user) {
    return;
  }

  const ref = doc(
    db,
    'users',
    user.uid
  );

  const existing = await getDoc(ref);

  const data = {
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    provider: 'google',

    lastSeenAt: serverTimestamp(),

    lastDevice:
      navigator.userAgent.slice(0, 300),

    installed: Boolean(installed)
  };

  if (!existing.exists()) {
    data.createdAt = serverTimestamp();
  }

  await setDoc(
    ref,
    data,
    {
      merge: true
    }
  );
}

export async function markInstalled(user) {
  if (!ensureFirebase() || !user) {
    return;
  }

  await setDoc(
    doc(
      db,
      'users',
      user.uid
    ),
    {
      installed: true,
      lastSeenAt: serverTimestamp()
    },
    {
      merge: true
    }
  );
}

export function watchPlayerAdmin(
  uid,
  callback,
  onError = () => {}
) {
  if (!ensureFirebase() || !uid) {
    return () => {};
  }

  return onSnapshot(
    doc(
      db,
      'users',
      uid
    ),

    (snap) => {
      callback(
        snap.exists()
          ? snap.data()
          : {}
      );
    },

    onError
  );
}

export async function syncPlayerStats(
  user,
  stats = {}
) {
  if (!ensureFirebase() || !user) {
    return;
  }

  await setDoc(
    doc(
      db,
      'users',
      user.uid
    ),

    {
      lastKnownCredits:
        Number(stats.credits || 0),

      selectedCar:
        String(stats.selectedCar || ''),

      careerCompleted:
        Number(stats.careerCompleted || 0),

      lastSeenAt:
        serverTimestamp()
    },

    {
      merge: true
    }
  );
}