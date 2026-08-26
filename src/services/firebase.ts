import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Optional Firebase configuration fallback
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyDummyConfigForDevPreview_SeasunProxy",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "seasun-proxy.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "seasun-proxy",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "seasun-proxy.appspot.com",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

let app: ReturnType<typeof initializeApp> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  db = getFirestore(app);
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase initialized in client demo mode:', err);
}

export { app, db, auth };

export async function signInWithGoogleDirect() {
  if (!auth) {
    throw new Error('Firebase Auth not available');
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: any) {
    console.warn('Google sign-in popup notice:', err.message);
    throw err;
  }
}
