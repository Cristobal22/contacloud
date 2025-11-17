
'use client';

import React from 'react';
import { useFirestore, useUser } from '@/firebase';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { initialAfpEntities, initialEconomicIndicators, initialTaxableCaps } from '@/lib/seed-data';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"


type DataType = 'economic-indicators' | 'taxable-caps' | 'afp-entities';

interface DataLoaderProps {
    dataType: DataType;
    filter: { year: number; month?: number };
    onSuccess?: () => void;
}

const dataSources = {
    'economic-indicators': initialEconomicIndicators,
    'taxable-caps': initialTaxableCaps,
    'afp-entities': initialAfpEntities,
};

const idGenerators = {
    'economic-indicators': (item: any) => `${item.year}-${String(item.month).padStart(2, '0')}`,
    'taxable-caps': (item: any) => item.year.toString(),
    'afp-entities': (item: any) => `${item.year}-${item.month}-${item.previredCode}`,
};

export function DataLoader({ dataType, filter, onSuccess }: DataLoaderProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { userProfile } = useUserProfile(user?.uid);
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const handleLoadData = async () => {
        if (!firestore || userProfile?.role !== 'Admin') {
            toast({ variant: 'destructive', title: 'Permiso denegado' });
            return;
        }

        setIsProcessing(true);
        const batch = writeBatch(firestore);
        const collectionRef = collection(firestore, dataType);
        const dataSource = dataSources[dataType];
        const generateId = idGenerators[dataType];

        let itemsToLoad = dataSource.filter(item => item.year === filter.year);
        if (filter.month) {
            itemsToLoad = itemsToLoad.filter(item => item.month === filter.month);
        }

        if (itemsToLoad.length === 0) {
            toast({ variant: 'destructive', title: 'Sin Datos', description: 'No hay datos semilla para este período.' });
            setIsProcessing(false);
            return;
        }

        itemsToLoad.forEach(item => {
            const id = generateId(item);
            const docRef = doc(collectionRef, id);
            batch.set(docRef, { ...item, id }, { merge: true });
        });

        try {
            await batch.commit();
            toast({ title: 'Datos Cargados', description: `Se cargaron ${itemsToLoad.length} registros en ${dataType}.` });
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error("Error loading data:", error);
            toast({ variant: 'destructive', title: 'Error al Cargar', description: error.message });
        } finally {
            setIsProcessing(false);
            setIsConfirmOpen(false);
        }
    };

    return (
        <>
            <Button onClick={() => setIsConfirmOpen(true)} disabled={isProcessing} className="w-full">
                {isProcessing ? 'Procesando...' : `Cargar Datos`}
            </Button>
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar la carga de datos?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esto cargará o actualizará los {dataType} para el período {filter.month ? `${filter.month}/` : ''}{filter.year}.
                            La operación utilizará los datos predefinidos en el sistema.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLoadData} disabled={isProcessing}>
                            {isProcessing ? 'Cargando...' : 'Sí, cargar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
