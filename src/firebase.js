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
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC4SeLAbMLUzTuDmJbVPGjIz-7eR6GMpOU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'moin-malik-velocity-legends.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'moin-malik-velocity-legends',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'moin-malik-velocity-legends.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '237353728769',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:237353728769:web:d6c140bc1fca3a209ff900',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XBVYNE4Z7C'
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

  if (!auth) auth = getAuth(app);
  if (!db) db = getFirestore(app);

  return true;
}

export function firebaseConfigured() {
  return hasCoreConfig();
}

export async function startAnalytics(collectionEnabled = true) {
  analyticsEnabled = Boolean(collectionEnabled);

  if (!ensureFirebase() || !firebaseConfig.measurementId) return false;

  try {
    if (!(await isSupported())) return false;

    analytics = getAnalytics(app);
    setAnalyticsCollectionEnabled(analytics, analyticsEnabled);
    analyticsReady = true;

    if (analyticsEnabled) {
      logEvent(analytics, 'app_opened');
    }

    return true;
  } catch (error) {
    console.warn('Analytics could not start:', error);
    return false;
  }
}

export function setAnalyticsEnabled(value) {
  analyticsEnabled = Boolean(value);

  if (analytics) {
    setAnalyticsCollectionEnabled(analytics, analyticsEnabled);
  }
}

export function trackEvent(name, params = {}) {
  if (!analyticsReady || !analyticsEnabled || !analytics) return;
  logEvent(analytics, name, params);
}

export function trackScreen(screenName) {
  trackEvent('screen_view', {
    firebase_screen: screenName,
    firebase_screen_class: 'VelocityLegends'
  });
}

export function setPlayerProperties(properties = {}) {
  if (!analyticsReady || !analyticsEnabled || !analytics) return;
  setUserProperties(analytics, properties);
}

export function setAnalyticsUser(uid) {
  if (!analyticsReady || !analyticsEnabled || !analytics || !uid) return;
  setUserId(analytics, uid);
}

export function watchAuth(callback) {
  if (!ensureFirebase()) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export async function signInGoogle() {
  if (!ensureFirebase()) {
    throw new Error('Firebase is not configured.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// Phone authentication is disabled.
// These functions stay exported so older UI imports do not break.
export function hasPhoneProvider() {
  return true;
}

export function createPhoneVerifier() {
  return null;
}

export async function sendPhoneLinkCode() {
  throw new Error('Phone verification is disabled. Please continue with Google sign-in.');
}

export async function logoutPlayer() {
  if (!ensureFirebase()) return;
  await signOut(auth);
}

export function currentPlayer() {
  return auth?.currentUser || null;
}

export async function refreshPlayerToken() {
  if (!auth?.currentUser) return false;

  await auth.currentUser.getIdToken(true);
  return true;
}

export async function registerPlayer(user, installed = false) {
  if (!ensureFirebase() || !user) return;

  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);

  const data = {
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    provider: 'google',
    lastSeenAt: serverTimestamp(),
    lastDevice: navigator.userAgent.slice(0, 300),
    installed: Boolean(installed)
  };

  if (!existing.exists()) {
    data.createdAt = serverTimestamp();
  }

  await setDoc(ref, data, { merge: true });
}

export async function markInstalled(user) {
  if (!ensureFirebase() || !user) return;

  await setDoc(
    doc(db, 'users', user.uid),
    {
      installed: true,
      lastSeenAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function fetchPlayerAdmin(uid) {
  if (!ensureFirebase() || !uid) return null;

  try {
    const snap = await getDocFromServer(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : {};
  } catch (error) {
    // Offline: localStorage remains the source of truth until the next online refresh.
    return null;
  }
}

export async function syncPlayerStats(user, stats = {}) {
  if (!ensureFirebase() || !user) return;

  // Report device state without overwriting fields the admin edits.
  await setDoc(
    doc(db, 'users', user.uid),
    {
      deviceCredits: Number(stats.credits || 0),
      deviceSelectedCar: String(stats.selectedCar || ''),
      deviceCareerCompleted: Number(stats.careerCompleted || 0),
      lastSeenAt: serverTimestamp()
    },
    { merge: true }
  );
}
