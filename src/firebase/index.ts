'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions'; // Import Functions
import { firebaseConfig } from './config';

import { FirebaseProvider } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useFirebase, useFirebaseApp, useFirestore, useAuth, useFunctions } from './provider'; // Import useFunctions
import { useUser } from './auth/use-user';
import { useUserProfile } from './auth/use-user-profile';
import { useDoc } from './firestore/use-doc';
import { useCollection } from './firestore/use-collection';

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;
let functions: Functions | undefined; // Add Functions

function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  functions: Functions; // Add Functions
} {
  if (!firebaseApp) {
    const apps = getApps();
    if (apps.length > 0) {
      firebaseApp = apps[0];
    } else {
      firebaseApp = initializeApp(firebaseConfig);
    }
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
    functions = getFunctions(firebaseApp); // Initialize Functions
  }
  return { firebaseApp, auth: auth!, firestore: firestore!, functions: functions! }; // Return Functions
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
  useFunctions, // Export useFunctions
  useUser,
  useUserProfile,
  useDoc,
  useCollection,
};
