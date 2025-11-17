import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore;

// This pattern ensures that the SDK is initialized only once.
if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!serviceAccountString) {
      throw new Error('CRITICAL: The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. The server cannot connect to the database.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin SDK has been successfully initialized.');

  } catch (error: any) {
    // Log a more detailed and critical error message to the server console.
    console.error('FATAL: FIREBASE ADMIN SDK INITIALIZATION FAILED. Server will not be able to connect to Firestore.', error.message);
  }
}

// Only assign the db object if the initialization was successful.
if (admin.apps.length > 0) {
  db = admin.firestore();
} else {
  // This will make it clear in the logs that db is not available.
  console.error('Firestore `db` object could not be initialized because Firebase Admin SDK failed to start.');
}

// Export the potentially undefined db object. Code using it must be resilient.
export { db };
