'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, doc, DocumentReference } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If the docRef is null (e.g., dependencies not ready), do nothing.
    if (!docRef) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        setLoading(false);
        if (docSnap.exists()) {
          // IMPORTANT: Ensure you spread the data and include the id
          setData({ id: docSnap.id, ...docSnap.data() } as T);
        } else {
          setData(null);
        }
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        }));
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [docRef]); // Re-run effect if the docRef object itself changes

  return { data, loading, error };
}
