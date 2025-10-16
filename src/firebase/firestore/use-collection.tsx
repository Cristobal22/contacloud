'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { onSnapshot, collection, query, where, Query, CollectionReference } from 'firebase/firestore';
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
    if (path.includes('{companyId}') && !companyId) {
        return null; 
    }
    const resolvedPath = path.replace('{companyId}', companyId || '');
    if (resolvedPath.includes('undefined')) {
        return null;
    }
    return collection(firestore, resolvedPath) as Query<T>;
  }, [disabled, manualQuery, firestore, path, companyId]);

  useEffect(() => {
    if (!finalQuery) {
        setData([]);
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
        if ('path' in finalQuery) {
          queryPath = (finalQuery as CollectionReference).path;
        } else if ((finalQuery as any)._query) {
           queryPath = (finalQuery as any)._query.path.segments.join('/');
        }
        
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: queryPath,
          operation: 'list',
        }));
      }
    );

    return () => unsubscribe();
  }, [finalQuery]); 

  const refetch = useCallback(() => {
    // The hook now refetches automatically when `finalQuery` changes.
    // This function can be kept for components that might need an explicit manual refetch trigger in the future,
    // though its primary logic is now handled by useEffect.
  }, []);

  return { data, loading, error, refetch };
}
