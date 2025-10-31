
import admin from 'firebase-admin';

// Ensure the process.env values are defined. You should use a more robust validation in a real app.
const serviceAccount = {
    type: process.env.FIREBASE_ADMIN_TYPE!,
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID!,
    private_key: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n')!,
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    client_id: process.env.FIREBASE_ADMIN_CLIENT_ID!,
    auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI!,
    token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI!,
    auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL!,
    client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL!,
    universe_domain: process.env.FIREBASE_ADMIN_UNIVERSE_DOMAIN!,
};

/**
 * A singleton to get the Firebase Admin app instance.
 * If the app is not already initialized, it will be initialized.
 * @returns The Firebase Admin app instance.
 */
export async function getAdminApp() {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // If you have a databaseURL, add it here
        // databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}
