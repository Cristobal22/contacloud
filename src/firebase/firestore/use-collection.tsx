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

    if (manualQuery) {
        return manualQuery;
    }
    if (!firestore || !path) {
        return null;
    }
    // companyId can be explicitly undefined, which means don't filter by it.
    if (companyId) {
        return query(collection(firestore, path), where('companyId', '==', companyId));
    }
    return collection(firestore, path);
  }, [firestore, path, companyId, manualQuery, disabled]);

  const fetchData = useCallback(() => {
    if (finalQuery === null || disabled) {
      setData(null);
      setLoading(false);
      return () => {};
    }
    
    setLoading(true);

    const unsubscribe = onSnapshot(
      finalQuery as Query<T>,
      (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
        setData(items);
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
  }, [finalQuery, path, disabled]);


  useEffect(() => {
    const unsubscribe = fetchData();
    return () => unsubscribe();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
