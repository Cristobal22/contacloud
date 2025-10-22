
import * as admin from 'firebase-admin';

// This file is safe to modify and will not be overwritten by the system.
// It is intended for initializing the Firebase Admin SDK.

if (!admin.apps.length) {
  try {
    // This credential will be sourced from the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable in your local environment. In a deployed Google
    // Cloud environment, it will automatically use the service account from
    // the metadata server.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error('Firebase admin initialization error', error);
    // You might want to re-throw the error or handle it in a way
    // that stops the server from starting if Firebase Admin is essential.
    // For now, we log it.
  }
}

// These are safe to export because they will only be initialized once.
export const adminApp = admin.apps[0]!;
export const adminFirestore = admin.firestore();
export const adminAuth = admin.auth();
