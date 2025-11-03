import { useEffect, useReducer, useMemo } from 'react';
import {
  collection,
  query,
  onSnapshot,
  Query,
  DocumentData,
  FirestoreError,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/firebase/config';

interface State<T> {
  loading: boolean;
  error: FirestoreError | null;
  data: T[] | null;
}

type Action<T> =
  | { type: 'start' }
  | { type: 'error'; payload: FirestoreError }
  | { type: 'success'; payload: T[] };

const initialState = {
  loading: true,
  error: null,
  data: null,
};

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'start':
      return { ...state, loading: true, error: null };
    case 'error':
      return { ...state, loading: false, error: action.payload };
    case 'success':
      return { ...state, loading: false, data: action.payload };
    default:
      return state;
  }
}

interface UseCollectionProps<T> {
  path: string | undefined;
  converter?: {
    toFirestore: (data: T) => DocumentData;
    fromFirestore: (snapshot: DocumentData) => T;
  };
}

export function useCollection<T>({
  path,
  converter,
}: UseCollectionProps<T>) {
  const [state, dispatch] = useReducer(reducer<T>, initialState);

  const memoizedQuery = useMemo(() => {
    if (!path) {
      return null;
    }
    let q: Query<DocumentData> = collection(db, path);

    if (converter) {
      q = q.withConverter(converter);
    }

    return q as Query<T>;
  }, [path, converter]);

  useEffect(() => {
    dispatch({ type: 'start' });

    if (!memoizedQuery) {
      dispatch({ type: 'success', payload: [] });
      return;
    }

    const unsubscribe: Unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot) => {
        const data: T[] = snapshot.docs.map((doc) => doc.data());
        dispatch({ type: 'success', payload: data });
      },
      (error) => {
        dispatch({ type: 'error', payload: error });
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  return state;
}
