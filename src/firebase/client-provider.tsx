'use client';

import React from 'react';
import { initializeFirebase, FirebaseProvider } from '.';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseApp, auth, firestore, functions } = initializeFirebase();

  return (
    <FirebaseProvider firebaseApp={firebaseApp} auth={auth} firestore={firestore} functions={functions}>
      {children}
    </FirebaseProvider>
  );
}
