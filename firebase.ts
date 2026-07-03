import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log("🔥 FIRBEASE CONFIG RUNTIME VERIFICATION:");
console.log("Project ID:", firebaseConfig.projectId);
console.log("Auth Domain:", firebaseConfig.authDomain);
console.log("API Key (first 8 chars):", firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 8) : 'undefined');
console.log("Database ID:", import.meta.env.VITE_FIREBASE_DATABASE_ID);
console.log("Current Window Hostname:", typeof window !== 'undefined' ? window.location.hostname : 'No window');


const databaseId = "ai-studio-civicconnectindi-c53a418c-26c1-4a27-ab98-34baed69d3f5";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, databaseId);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
