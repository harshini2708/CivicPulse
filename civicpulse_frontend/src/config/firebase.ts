import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Firebase config — your project: civicpulse-90ad0
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyCUiapothTi8r5GnDIRJ7H25R4u8H3ebZU',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'civicpulse-90ad0.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'civicpulse-90ad0',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'civicpulse-90ad0.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '366781753213',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:366781753213:web:a44790948fb06b19c3ce14',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || 'G-1V5T5GW3HV',
};

export const isFirebaseConfigured = true; // config is always present now

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  app     = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth    = getAuth(app);
  db      = getFirestore(app);
  storage = getStorage(app);
  console.info('[CityResolve] ✅ Firebase connected → project: civicpulse-90ad0');
} catch (err) {
  console.warn('[CityResolve] Firebase init error — running in Demo Mode:', err);
}

export { app, auth, db, storage };
