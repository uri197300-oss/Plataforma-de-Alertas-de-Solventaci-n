import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let firebaseApp: any = null;
let db: any = null;
let auth: any = null;

// Try to load from the static local config file, which is created by set_up_firebase
// and would also be bundled/deployed for the user!
try {
  // We use import.meta.glob or dynamic import to handle optional file presence or empty state smoothly
  const configModules = import.meta.glob("/firebase-applet-config.json", { eager: true });
  const configKeys = Object.keys(configModules);
  
  let firebaseConfig: any = null;
  if (configKeys.length > 0) {
    firebaseConfig = (configModules[configKeys[0]] as any).default || configModules[configKeys[0]];
  } else {
    // Look at env variables as fallback for standard public production deployments
    firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  if (firebaseConfig && firebaseConfig.projectId && (firebaseConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY)) {
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || undefined);
    auth = getAuth(firebaseApp);
    console.log("Firebase initialized successfully with Project ID:", firebaseConfig.projectId);
  }
} catch (error) {
  console.warn("Firebase not fully configured or failed to initialize, falling back to local Express server mode.", error);
}

export { firebaseApp, db, auth };
