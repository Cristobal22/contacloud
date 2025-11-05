
import admin from 'firebase-admin';

/**
 * Initializes the Firebase Admin SDK.
 * This function is smart and handles different environments:
 * 1. Google Cloud / Firebase Environment (like Cloud Functions when deployed):
 *    It uses Application Default Credentials. `initializeApp()` is called with no arguments.
 * 2. Local Development or other environments:
 *    It expects a `FIREBASE_ADMIN_CREDENTIALS` environment variable with the JSON key.
 */
function initializeAdminApp() {
    // If the app is already initialized, return it.
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    // When running inside a Google Cloud environment, the SDK automatically finds the credentials.
    // The `FIREBASE_CONFIG` variable is automatically set by the Firebase environment.
    if (process.env.FIREBASE_CONFIG) {
        console.log('Initializing Firebase Admin SDK with Application Default Credentials.');
        return admin.initializeApp();
    }

    // For local development, we rely on the service account JSON in the environment variable.
    const credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS;
    if (!credentialsJson) {
        console.error('FATAL: Firebase credentials not found. The FIREBASE_ADMIN_CREDENTIALS environment variable is not set. This is required for local development.');
        // In a real app, you might want to throw an error to prevent startup.
        // For this interactive session, we'll log and continue, but it will likely fail.
        throw new Error('FIREBASE_ADMIN_CREDENTIALS is not set.');
    }

    try {
        console.log('Initializing Firebase Admin SDK from FIREBASE_ADMIN_CREDENTIALS variable.');
        const serviceAccount = JSON.parse(credentialsJson);
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (e) {
        console.error('FATAL: Could not parse FIREBASE_ADMIN_CREDENTIALS. Make sure it is a valid, single-line JSON string.', e);
        throw new Error('Failed to parse Firebase credentials.');
    }
}

const adminApp = initializeAdminApp();
const db = admin.firestore();
const auth = admin.auth();

export function getAdminApp() {
    return adminApp;
}

export function getAdminFirestore() {
    return db;
}

export function getAdminAuth() {
    return auth;
}
