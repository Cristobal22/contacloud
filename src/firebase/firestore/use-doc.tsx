'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, doc, DocumentReference, getFirestore } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { useFirebaseApp } from '../provider';

export function useDoc<T>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // We serialize the ref's path to use it as a stable dependency
  const path = docRef?.path;

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }
    
    // The docRef object itself might be a new instance on every render,
    // so we can't use it as a dependency. Instead, we depend on its path.
    // We get the firestore instance from the app, which is stable.
    const firestore = getFirestore(useFirebaseApp()!);
    const stableRef = doc(firestore, path) as DocumentReference<T>;

    setLoading(true);
    const unsubscribe = onSnapshot(
      stableRef,
      (docSnap) => {
        setLoading(false);
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() } as T);
        } else {
          setData(null);
        }
      },
      (err) => {
        setError(err);
        setLoading(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: path,
          operation: 'get',
        }));
      }
    );

    return () => unsubscribe();
  }, [path, useFirebaseApp]); // Depend on the stable path and the app hook

  return { data, loading, error };
}
