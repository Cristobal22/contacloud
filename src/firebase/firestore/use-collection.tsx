'use client';

import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, collection, query, Query, CollectionReference, DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

type UseCollectionProps<T> = {
    path?: string;
    query?: Query<T> | null;
    disabled?: boolean;
};

function getQueryKey(q: Query | null | undefined): string {
    if (!q) return 'null';
    const internalQuery = (q as any)._query;
    if (!internalQuery) return 'invalid-query';
    const { path, explicitOrderBy = [], filters = [] } = internalQuery;
    const queryParts: string[] = [path.segments.join('/')];
    explicitOrderBy.forEach((orderBy: any) => {
        queryParts.push(`orderBy:${orderBy.field.segments.join('.')}:${orderBy.dir}`);
    });
    filters.forEach((filter: any) => {
        const filterStr = `${filter.field.segments.join('.')}${filter.op.toString()}${JSON.stringify(filter.value)}`;
        queryParts.push(`filter:${filterStr}`);
    });
    return queryParts.join('|');
}

export function useCollection<T extends { id: string }>({ path, query: manualQuery, disabled = false }: UseCollectionProps<T>) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const finalQuery = useMemo(() => {
    if (disabled) return null;
    if (manualQuery) return manualQuery;
    if (!firestore || !path) return null;
    return query(collection(firestore, path));
  }, [disabled, manualQuery, firestore, path]);

  const queryKey = useMemo(() => getQueryKey(finalQuery as Query | undefined), [finalQuery]);

  useEffect(() => {
    if (!finalQuery) {
        setData([]);
        setLoading(false);
        return () => {};
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      finalQuery as Query<DocumentData>,
      (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => {
          return { ...doc.data(), id: doc.id } as T;
        });
        setData(items);
        setError(null);
        setLoading(false);
      },
      (err: any) => {
        // Default behavior: log error and update local state
        console.error(`Firestore onSnapshot error on query: ${queryKey}`, err);
        setError(err);
        setLoading(false);
        
        // CORRECTED: Only emit a global 'permission-error' for actual permission issues.
        // Transient network errors will no longer be incorrectly broadcast as permission problems.
        if (err.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: queryKey,
              operation: 'list',
            }));
        }
      }
    );

    return () => unsubscribe();
  }, [queryKey]);

  return { data, loading, error };
}
