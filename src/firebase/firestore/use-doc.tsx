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

    return () => unsubscribe();
  }, [docPath]); // Re-run effect only if the document path string changes

  return { data, loading, error };
}
