'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, doc, DocumentReference } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (docSnap) => {
        setLoading(false);
        if (docSnap.exists()) {
          setData(docSnap.data() as T);
        } else {
          setData(null);
        }
      },
      (err) => {
        setError(err);
        setLoading(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: ref.path,
          operation: 'get',
        }));
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
