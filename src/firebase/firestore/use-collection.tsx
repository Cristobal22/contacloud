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

// Helper to create a stable, serializable key from a Firestore query for use in useEffect dependencies.
function getQueryKey(q: Query | null | undefined): string {
    if (!q) return 'null';
    
    // The internal _query property is not part of the public API but is the most reliable way
    // to build a stable key that represents the query's path, filters, and ordering.
    const internalQuery = (q as any)._query;
    if (!internalQuery) {
        return 'invalid-query';
    }

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

/**
 * A custom React hook to listen for real-time updates to a Firestore collection.
 * It handles loading and error states automatically.
 * @template T The expected type of the documents in the collection.
 * @param {UseCollectionProps<T>} props The properties to configure the collection listener.
 * @returns {{ data: T[] | null; loading: boolean; error: Error | null; }}
 */
export function useCollection<T extends { id: string }>({ path, query: manualQuery, disabled = false }: UseCollectionProps<T>) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Determine the final query to use, either the one provided manually or one constructed from the path.
  const finalQuery = useMemo(() => {
    if (disabled) return null;
    if (manualQuery) return manualQuery;
    if (!firestore || !path) return null;
    
    return query(collection(firestore, path));
  }, [disabled, manualQuery, firestore, path]);

  // Generate a stable key from the query to use as a dependency in useEffect.
  const queryKey = useMemo(() => getQueryKey(finalQuery as Query | undefined), [finalQuery]);

  useEffect(() => {
    if (!finalQuery) {
        setData([]);
        setLoading(false);
        return () => {};
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      finalQuery as Query<DocumentData>, // Listen using the base DocumentData type for broader compatibility.
      (querySnapshot) => {
        // Safely map the Firestore documents to the expected type T.
        // This ensures the 'id' field is explicitly included in the final object.
        const items = querySnapshot.docs.map(doc => {
          return { ...doc.data(), id: doc.id } as T;
        });
        setData(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        setError(err);
        setLoading(false);
        
        const queryPath = finalQuery ? getQueryKey(finalQuery) : 'unknown path';
        
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: queryPath,
          operation: 'list',
        }));
      }
    );

    // Unsubscribe from the listener when the component unmounts or the query changes.
    return () => unsubscribe();
  }, [queryKey]); // Re-run the effect only when the query key changes.

  return { data, loading, error };
}
