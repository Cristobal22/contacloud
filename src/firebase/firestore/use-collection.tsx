'use client';

import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, collection, query, Query, CollectionReference } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

type UseCollectionProps<T> = {
    path?: string;
    companyId?: string | null;
    query?: Query<T> | CollectionReference<T> | null;
    disabled?: boolean;
};

export function useCollection<T>({ path, companyId, query: manualQuery, disabled = false }: UseCollectionProps<T>) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // This memoizes the final query object itself.
  // It will only be re-created if firestore, path, companyId, or manualQuery change.
  const finalQuery = useMemo(() => {
    if (disabled) return null;
    if (manualQuery) return manualQuery;
    if (!firestore || !path) return null;
    // Special case for paths that require a companyId
    if (path.includes('{companyId}') && !companyId) {
        return null; 
    }
    const resolvedPath = path.replace('{companyId}', companyId || '');
    // If after replacement, it's still undefined, then it's not ready.
    if (resolvedPath.includes('undefined')) {
        return null;
    }
    return collection(firestore, resolvedPath) as Query<T>;
  }, [disabled, manualQuery, firestore, path, companyId]);

  useEffect(() => {
    // If the query isn't ready, don't do anything
    if (!finalQuery) {
        setData([]); // Set to empty array to indicate "no data" state
        setLoading(false);
        return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      finalQuery,
      (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
        setData(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        
        let queryPath = 'unknown path';
        // Try to get path safely
        if ('path' in finalQuery) {
          queryPath = (finalQuery as CollectionReference).path;
        } else if ((finalQuery as any)._query) {
           // This is a more fragile way to get the path for a query, but it works for debugging
           queryPath = (finalQuery as any)._query.path.segments.join('/');
        }
        
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: queryPath,
          operation: 'list',
        }));
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [finalQuery]); // Only re-run the effect if the final query object changes

  return { data, loading, error };
}
