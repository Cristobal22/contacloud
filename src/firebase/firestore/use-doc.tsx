'use client';

import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, DocumentReference } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use the path as a stable dependency key
  const docPath = useMemo(() => docRef?.path, [docRef]);

  useEffect(() => {
    // Robust Guard: Only proceed if docPath is a valid, non-empty string.
    // This prevents attempts to listen to undefined, null, or empty paths,
    // which is the likely cause of the internal Firestore error.
    if (!docPath) {
      setData(null);
      setLoading(false);
      return; // Stop execution, no subscription is made, no cleanup needed.
    }

    // If docPath is valid, docRef must have been valid to create it.
    setLoading(true);
    const unsubscribe = onSnapshot(
      docRef!, // We can safely assert docRef is not null here because docPath is valid.
      (docSnap) => {
        setLoading(false);
        if (docSnap.exists()) {
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
          path: docRef!.path,
          operation: 'get',
        }));
      }
    );

    // This cleanup function is only registered if a subscription was successfully created.
    return () => unsubscribe();
  }, [docPath]); // Re-run effect only if the document path string changes

  return { data, loading, error };
}
