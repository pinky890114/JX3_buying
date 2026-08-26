import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import firebaseConfigGenerated from '../../firebase-applet-config.json';

const metaEnv = (import.meta as any).env || {};

// Merge generated config with runtime env variables
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfigGenerated.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigGenerated.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfigGenerated.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigGenerated.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigGenerated.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfigGenerated.appId,
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
  
  const databaseId = firebaseConfigGenerated.firestoreDatabaseId;
  db = databaseId && databaseId !== '(default)' 
    ? getFirestore(app, databaseId) 
    : getFirestore(app);

  auth = getAuth(app);
  console.log('✅ Firebase initialized successfully with Firestore database:', databaseId || '(default)');
} catch (err) {
  console.warn('Firebase initialized with fallback:', err);
  if (app) {
    db = getFirestore(app);
    auth = getAuth(app);
  }
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
