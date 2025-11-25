import * as admin from 'firebase-admin';

// This pattern prevents redeclaration in development hot-reloads.
global.declareFirestore = global.declareFirestore || {};

// A function to initialize and get the Firestore database instance.
export const initializeFirebaseAdmin = (): admin.firestore.Firestore => {
  // If the app is already initialized, return the existing db instance.
  if (admin.apps.length) {
    // Check if the db instance is cached in our global declaration.
    if (global.declareFirestore.db) {
      return global.declareFirestore.db;
    }
    const db_instance = admin.firestore();
    global.declareFirestore.db = db_instance;
    return db_instance;
  }

  // If not initialized, create a new instance.
  try {
    const serviceAccountString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!serviceAccountString) {
      throw new Error('CRITICAL: GOOGLE_APPLICATION_CREDENTIALS_JSON env var is not set.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin SDK has been successfully initialized.');
    const db_instance = admin.firestore();
    global.declareFirestore.db = db_instance; // Cache the instance
    return db_instance;

  } catch (error: any) {
    console.error('FATAL: FIREBASE ADMIN SDK INITIALIZATION FAILED.', error.message);
    // Re-throw a more generic error to avoid leaking implementation details.
    throw new Error('Server configuration error: Firebase initialization failed.');
  }
};

// For legacy parts of the app that might still import `db` directly,
// we can try to provide it, but using the function is the robust way.
let db: admin.firestore.Firestore;
try {
  db = initializeFirebaseAdmin();
} catch (e) {
  console.error("Failed to initialize db on module load. This might be expected in some environments. API routes should call initializeFirebaseAdmin() explicitly.");
}

export { db };
