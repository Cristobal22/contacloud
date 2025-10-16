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

  const finalQuery = useMemo(() => {
    if (disabled) return null;
    if (manualQuery) return manualQuery;

    if (!path) return null;

    // Path requires a companyId, but it's not available
    if (path.includes('{companyId}') && !companyId) {
        return null;
    }
    
    const resolvedPath = path.replace('{companyId}', companyId || '');

    if (!firestore || resolvedPath.includes('undefined')) {
        return null;
    }
    
    // For collections that are not company-specific, but depend on a companyId to be present
    if (companyId && path.includes('{companyId}')) {
        return collection(firestore, resolvedPath);
    }
    
    // For global collections
    if (!path.includes('{companyId}')) {
        return collection(firestore, resolvedPath);
    }

    return null;

  }, [firestore, path, companyId, manualQuery, disabled]);

  const refetch = useCallback(() => {
    if (!finalQuery) {
      setData([]);
      setLoading(false);
      return () => {};
    }
    
    setLoading(true);

    const unsubscribe = onSnapshot(
      finalQuery as Query<T>,
      (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
        setData(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        let queryPath = path;
        if (finalQuery && 'path' in finalQuery) {
          queryPath = (finalQuery as CollectionReference).path;
        } else if (finalQuery && (finalQuery as any)._query) {
           queryPath = (finalQuery as any)._query.path.segments.join('/');
        }
        
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: queryPath || 'unknown',
          operation: 'list',
        }));
      }
    );
    return unsubscribe;
  }, [finalQuery, path]);


  useEffect(() => {
    const unsubscribe = refetch();
    return () => {
      if(unsubscribe) unsubscribe();
    };
  }, [refetch]);

  return { data, loading, error, refetch };
}
