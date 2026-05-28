import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent build-time crashes when environment variables are missing (e.g. in Cloud Build)
const hasConfig = !!firebaseConfig.apiKey;

const app = getApps().length > 0 
  ? getApp() 
  : (hasConfig ? initializeApp(firebaseConfig) : null);

const auth = app ? getAuth(app) : {} as any;
const db = app ? getFirestore(app) : {} as any;

export { app, auth, db };
