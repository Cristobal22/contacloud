
import * as admin from 'firebase-admin';

// This file is safe to modify and will not be overwritten by the system.
// It is intended for initializing the Firebase Admin SDK.

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // The GOOGLE_APPLICATION_CREDENTIALS environment variable will be used
      // by default if it's set. Otherwise, the SDK will try to use a
      // service account from the metadata server if deployed in a Google Cloud environment.
      credential: admin.credential.applicationDefault(),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminApp = admin.apps[0]!;
export const adminFirestore = admin.firestore();
export const adminAuth = admin.auth();
