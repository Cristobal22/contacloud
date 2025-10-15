
'use server';
/**
 * @fileOverview A flow to manage user roles and set custom claims.
 * This is a critical administrative function.
 */

import { ai } from '@/ai/genkit';
import { SetUserRoleInputSchema, SetUserRoleOutputSchema } from './schemas';
import type { SetUserRoleInput, SetUserRoleOutput } from './schemas';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';

// Helper function to initialize Firebase Admin SDK idempotently.
function initializeFirebaseAdmin(): App {
    const apps = getApps();
    if (apps.length > 0) {
        return apps[0];
    }
    
    // In a production environment (like Netlify, Vercel, etc.),
    // the service account key should be stored in an environment variable.
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            return initializeApp({
                credential: cert(serviceAccount)
            });
        } catch(e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
            throw new Error("Firebase Admin SDK service account key is invalid.");
        }
    }
    
    // This part is for local development and should not run in production builds.
    // We check NODE_ENV to prevent webpack/turbopack from trying to bundle the local file.
    if (process.env.NODE_ENV !== 'production') {
        try {
            // The require is kept inside the try-catch and conditional block
            // to ensure it's not evaluated during production builds.
            const serviceAccount = require('../../../serviceAccountKey.json');
            return initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (e) {
            console.warn("Local serviceAccountKey.json not found. For local admin actions, place it in the root directory.");
        }
    }

    throw new Error("Firebase Admin SDK could not be initialized. Service account key is missing.");
}


const setUserRoleFlow = ai.defineFlow(
  {
    name: 'setUserRoleFlow',
    inputSchema: SetUserRoleInputSchema,
    outputSchema: SetUserRoleOutputSchema,
  },
  async ({ uid, role }) => {
    try {
        initializeFirebaseAdmin();
        const auth = getAuth();
        const firestore = getFirestore();

        // 1. Set the custom claim on the user's auth token
        await auth.setCustomUserClaims(uid, { role });

        // 2. Update the role in the user's Firestore document for consistency
        const userDocRef = firestore.collection('users').doc(uid);
        await userDocRef.update({ role });
      
        // Force user to re-authenticate to get the new token with the claim
        // This is often done on the client-side by signing out and in, or refreshing the token.
        // Here, we just return success.

        return {
            success: true,
            message: `Successfully set role to ${role} for user ${uid}.`,
        };
    } catch (error: any) {
        console.error('Error setting user role:', error);
        return {
            success: false,
            message: error.message || 'An unknown error occurred.',
        };
    }
  }
);


export async function setUserRole(input: SetUserRoleInput): Promise<SetUserRoleOutput> {
    return setUserRoleFlow(input);
}
