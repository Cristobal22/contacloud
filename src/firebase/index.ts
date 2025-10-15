'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

import { FirebaseProvider } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
import { useUser } from './auth/use-user';
import { useUserProfile } from './auth/use-user-profile';
import { useDoc } from './firestore/use-doc';
import { useCollection } from './firestore/use-collection';

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;

function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
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
  }
  return { firebaseApp, auth: auth!, firestore: firestore! };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
  useUser,
  useUserProfile,
  useDoc,
  useCollection,
};
