
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
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// This is a placeholder for a secure way to get service account credentials
// In a real production environment, use environment variables or a secret manager.
function getServiceAccount() {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
  }
  // Fallback for local development if the env var is not set
  // IMPORTANT: This path is for demonstration. Do not commit serviceAccountKey.json to git.
  try {
      return require('../../../serviceAccountKey.json');
  } catch (e) {
      return null;
  }
}

if (getApps().length === 0) {
    const serviceAccount = getServiceAccount();
    if(serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount)
        });
    } else {
        console.warn("Firebase Admin SDK not initialized. Service account key is missing.");
    }
}

const setUserRoleFlow = ai.defineFlow(
  {
    name: 'setUserRoleFlow',
    inputSchema: SetUserRoleInputSchema,
    outputSchema: SetUserRoleOutputSchema,
  },
  async ({ uid, role }) => {
    try {
        if (getApps().length === 0) {
            throw new Error("Firebase Admin SDK is not initialized.");
        }
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
