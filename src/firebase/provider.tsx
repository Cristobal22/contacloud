
'use client';

import React from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Functions } from 'firebase/functions';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  functions: Functions | null;
}

const FirebaseContext = React.createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
  functions,
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  functions: Functions;
}) {
  const contextValue = React.useMemo(
    () => ({
      firebaseApp,
      auth,
      firestore,
      functions,
    }),
    [firebaseApp, auth, firestore, functions]
  );

  // The global loading screen was blocking the entire app. 
  // The auth state should be managed by specific hooks like useAuth, not by this provider.

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = React.useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => {
    const context = React.useContext(FirebaseContext);
    if (!context || !context.firebaseApp) {
        throw new Error('useFirebaseApp must be used within a FirebaseProvider');
    }
    return context.firebaseApp;
}

export const useAuth = () => {
    const context = React.useContext(FirebaseContext);
    if (!context || !context.auth) {
        throw new Error('useAuth must be used within a FirebaseProvider');
    }
    return context.auth;
}

export const useFirestore = () => {
    const context = React.useContext(FirebaseContext);
    if (!context || !context.firestore) {
        throw new Error('useFirestore must be used within a FirebaseProvider');
    }
    return context.firestore;
}

export const useFunctions = () => {
    const context = React.useContext(FirebaseContext);
    if (!context || !context.functions) {
        throw new Error('useFunctions must be used within a FirebaseProvider');
    }
    return context.functions;
}
