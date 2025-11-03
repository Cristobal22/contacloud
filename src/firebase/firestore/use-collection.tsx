'use client';

import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, collection, query, Query, CollectionReference, DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

type UseCollectionProps<T> = {
    path?: string;
    companyId?: string | null;
    query?: Query<T> | CollectionReference<T> | Query<DocumentData> | CollectionReference<DocumentData> | null;
    disabled?: boolean;
};

// Helper function to generate a stable key from a query
function getQueryKey(q: Query | CollectionReference | null | undefined): string {
    if (!q) return 'null';
    if ('path' in q) { // It's a CollectionReference
        return q.path;
    }
    // It's a Query, build a key from its internal properties
    const internalQuery = (q as any)._query;
    if (!internalQuery || !internalQuery.path) {
        return 'invalid-query';
    }
    
    const queryParts: string[] = [internalQuery.path.segments.join('/')];
    internalQuery.explicitOrderBy.forEach((orderBy: any) => {
        queryParts.push(`orderBy:${orderBy.field.segments.join('.')}:${orderBy.dir}`);
    });
    internalQuery.filters.forEach((filter: any) => {
        const filterStr = `${filter.field.segments.join('.')}${filter.op}${filter.value}`;
        queryParts.push(`filter:${filterStr}`);
    });
    return queryParts.join('|');
}


export function useCollection<T>({ path, companyId, query: manualQuery, disabled = false }: UseCollectionProps<T>) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const finalQuery = useMemo(() => {
    if (disabled) return null;
    if (manualQuery) return manualQuery;
    if (!firestore || !path) return null;
    // If the path needs a companyId but it's not provided, don't create the query.
    if (path.includes('{companyId}') && !companyId) {
        return null; 
    }
    // Make sure we don't have dangling 'undefined' in paths.
    const resolvedPath = path.replace('{companyId}', companyId || '');
    if (resolvedPath.includes('undefined')) {
        return null;
    }
    return collection(firestore, resolvedPath) as Query<T>;
  }, [disabled, manualQuery, firestore, path, companyId]);

  // Use a serialized key of the query for the useEffect dependency
  const queryKey = useMemo(() => getQueryKey(finalQuery as Query | CollectionReference | null | undefined), [finalQuery]);

  useEffect(() => {
    // If there's no valid query, set state to empty and not loading.
    if (!finalQuery) {
        setData([]);
        setLoading(false);
        return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      finalQuery as Query,
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
    // Re-run effect only if the stable query key changes
  }, [queryKey]); 

  return { data, loading, error };
}
