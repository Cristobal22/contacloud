'use client';
import { useEffect, useState } from 'react';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    Query,
    DocumentData,
    CollectionReference,
    FirestoreDataConverter,
    QueryConstraint,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const getConverter = <T extends { id: string },>(): FirestoreDataConverter<T> => ({
    toFirestore: (data: Partial<T>): DocumentData => {
        const { id, ...rest } = data as any;
        return rest as DocumentData;
    },
    fromFirestore: (snapshot: any, options: any): T => {
        const data = snapshot.data(options);
        return { ...data, id: snapshot.id } as T;
    },
});

interface UseCollectionOptions {
    path?: string; // Path to the collection
    query?: Query<DocumentData> | QueryConstraint[] | null; // Can be a full query object or an array of constraints
    disabled?: boolean;
    orderBy?: any;
}

export const useCollection = <T extends { id: string },>(options: UseCollectionOptions) => {
    const { path, query: queryOrConstraints, disabled, orderBy: orderByConstraint } = options;
    const [data, setData] = useState<T[] | null>(null);
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();

    const optionsString = JSON.stringify(options);

    useEffect(() => {
        if (disabled || !firestore) {
            setData(null);
            setLoading(false);
            return;
        }

        let finalQuery: Query<T> | null = null;
        const converter = getConverter<T>();

        try {
            // --- FINAL, ROBUST IMPLEMENTATION ---
            // Case 1: A full, pre-constructed Query object is provided.
            // This is used by the CompaniesPage.
            if (queryOrConstraints && typeof (queryOrConstraints as any).withConverter === 'function') {
                finalQuery = (queryOrConstraints as Query<DocumentData>).withConverter(converter);
            }
            // Case 2: A path is provided, with or without an array of constraints.
            // This is used by the EmployeeFormPage.
            else if (path) {
                const collectionRef = collection(firestore, path);
                const allConstraints: QueryConstraint[] = [];

                if (Array.isArray(queryOrConstraints)) {
                    allConstraints.push(...queryOrConstraints);
                }

                if (orderByConstraint) {
                    if (Array.isArray(orderByConstraint) && orderByConstraint.length > 0) {
                        allConstraints.push(orderBy(orderByConstraint[0], orderByConstraint[1]));
                    } else if (typeof orderByConstraint === 'string') {
                        allConstraints.push(orderBy(orderByConstraint));
                    }
                }
                finalQuery = query(collectionRef, ...allConstraints).withConverter(converter);
            }
            // --- END OF FIX ---

        } catch (e: any) {
            console.error("Error building Firestore query:", e);
            setData(null);
            setLoading(false);
            return;
        }

        if (!finalQuery) {
            setData(null);
            setLoading(false);
            return;
        }
        
        const unsubscribe = onSnapshot(finalQuery, (snapshot) => {
            const dataMap = new Map<string, T>();
            snapshot.docs.forEach(doc => {
                const docData = doc.data();
                if (docData) {
                   dataMap.set(doc.id, docData);
                }
            });
            const result = Array.from(dataMap.values());

            setData(result);
            setLoading(false);
        }, (error) => {
            console.error(`Error fetching collection:`, error);
            setData(null);
            setLoading(false);
        });

        return () => unsubscribe();

    }, [firestore, disabled, optionsString]);

    return { data, loading };
};
