'use client';

import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, collection, query, where, Query } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

type UseCollectionProps<T> = {
    path?: string;
    companyId?: string | null;
    query?: Query<T> | null;
};

export function useCollection<T>({ path, companyId, query: manualQuery }: UseCollectionProps<T>) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const finalQuery = useMemo(() => {
    if (manualQuery) {
        return manualQuery;
    }
    if (!firestore || !path || companyId === undefined) {
        return null;
    }
    if (companyId) {
        return query(collection(firestore, path), where('companyId', '==', companyId));
    }
    return collection(firestore, path);
  }, [firestore, path, companyId, manualQuery]);

  useEffect(() => {
    if (finalQuery === null) {
      setData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const unsubscribe = onSnapshot(
      finalQuery as Query<T>,
      (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        const q = finalQuery as Query;
        const queryPath = (q as any)._query?.path.segments.join('/') || path;
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: queryPath || 'unknown',
          operation: 'list',
        }));
      }
    );

    return () => unsubscribe();
  }, [finalQuery, path]);

  return { data, loading, error };
}
