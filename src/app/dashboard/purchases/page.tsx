
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { DocumentMagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { collection, writeBatch, doc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { useToast } from '@/hooks/use-toast';
import type { Purchase, PurchaseIvaClassification, Company } from '@/lib/types';
import { useFirestore, useCollection } from '@/firebase';
import { SelectedCompanyContext } from '../layout';
import { columns } from './columns';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Converts DD/MM/YYYY or DD-MM-YYYY to a Firestore-compatible timestamp
const parseDateToTimestamp = (dateString: string) => {
    if (!dateString) return serverTimestamp();
    const parts = dateString.split(/[\/-]/);
    if (parts.length !== 3) return serverTimestamp();
    const [day, month, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    // new Date(year, monthIndex, day)
    return new Date(Number(fullYear), Number(month) - 1, Number(day));
};

const getIvaClassification = (row: any): PurchaseIvaClassification => {
    if (parseFloat(row['Monto IVA Recuperable']) > 0) return 'Recuperable';
    if (parseFloat(row['Monto IVA No Recuperable']) > 0) return 'No Recuperable';
    if (parseFloat(row['Monto IVA de Uso Comun']) > 0) return 'Uso Común';
    return 'No Recuperable'; // Default case if no IVA amount is found
}

export default function PurchasesPage() {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const { toast } = useToast();
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const router = useRouter();
    const firestore = useFirestore();

    // Adjusted to query the root `purchases` collection
    const purchasesQuery = React.useMemo(() => {
        if (!firestore || !selectedCompany?.id) return null;
        return query(
            collection(firestore, 'purchases'), 
            where('companyId', '==', selectedCompany.id),
            where('status', '==', 'Pendiente') // Example status filter
        );
    }, [firestore, selectedCompany?.id]);

    const { data: pendingPurchases, loading: purchasesLoading } = useCollection<Purchase>({ query: purchasesQuery });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleFileUpload = async () => {
        if (!firestore || !selectedFile || !selectedCompany) {
            toast({ variant: 'destructive', description: 'Error de sistema o falta de datos (archivo, empresa).' });
            return;
        }

        setIsProcessing(true);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            encoding: 'latin1', // Use latin1 for files from SII
            complete: async (results) => {
                const requiredFields = ['Fecha Docto', 'Tipo Doc', 'Folio', 'RUT Proveedor', 'Razon Social', 'Monto Exento', 'Monto Neto', 'Monto IVA Recuperable', 'Monto IVA No Recuperable', 'Monto IVA de Uso Comun', 'Monto Total'];
                const missingFields = requiredFields.filter(field => !results.meta.fields?.includes(field));

                if (missingFields.length > 0) {
                    toast({ 
                        variant: 'destructive', 
                        title: 'Error en el archivo CSV',
                        description: `Faltan las siguientes columnas obligatorias: ${missingFields.join(', ')}.` 
                    });
                    setIsProcessing(false);
                    return;
                }

                const newPurchases: Omit<Purchase, 'id'>[] = [];

                for (const row of results.data as any[]) {
                    const ivaRecuperable = parseFloat(row['Monto IVA Recuperable']) || 0;
                    const ivaNoRecuperable = parseFloat(row['Monto IVA No Recuperable']) || 0;
                    const ivaUsoComun = parseFloat(row['Monto IVA de Uso Comun']) || 0;

                    newPurchases.push({
                        companyId: selectedCompany.id,
                        documentType: parseInt(row['Tipo Doc'], 10),
                        documentNumber: parseInt(row['Folio'], 10),
                        issueDate: parseDateToTimestamp(row['Fecha Docto']),
                        providerRut: row['RUT Proveedor'],
                        providerName: row['Razon Social'] || '',
                        netAmount: parseFloat(row['Monto Neto']) || 0,
                        taxAmount: ivaRecuperable + ivaNoRecuperable + ivaUsoComun, // Total tax
                        totalAmount: parseFloat(row['Monto Total']) || 0,
                        ivaClassification: getIvaClassification(row), // Set the classification
                        // status: 'Pendiente', // You might manage status differently
                    });
                }

                try {
                    const batch = writeBatch(firestore);
                    // Save to the root `purchases` collection
                    const purchasesCollectionRef = collection(firestore, 'purchases');
                    
                    for (const purchase of newPurchases) {
                        const docRef = doc(purchasesCollectionRef);
                        batch.set(docRef, { ...purchase, id: docRef.id });
                    }
                    await batch.commit();

                    toast({ 
                        title: 'Carga completada',
                        description: `${newPurchases.length} nuevos documentos de compra han sido cargados.`
                    });
                } catch (error: any) {
                    toast({ variant: 'destructive', title: 'Error al guardar', description: `No se pudieron guardar los datos: ${error.message}` });
                }

                // Reset UI
                setIsProcessing(false);
                setSelectedFile(null); 
                const fileInput = document.getElementById('file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            },
            error: (error) => {
                toast({ variant: 'destructive', title: 'Error al procesar el archivo', description: error.message });
                setIsProcessing(false);
            }
        });
    };
    
    const handleDiscardPending = async () => {
        // This function may need adjustment depending on the new data structure and status logic
    };

    const goToCentralize = () => {
        // This function may need adjustment
    };

    const hasPendingPurchases = false; // Placeholder, adjust based on new logic

    return (
        <Card>
            <CardHeader>
              <CardTitle>Importar Registro de Compras (RCV)</CardTitle>
              <CardDescription>Sube el archivo CSV exportado desde el SII para registrar tus compras.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 border rounded-lg bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <DocumentMagnifyingGlassIcon className="h-10 w-10 text-gray-500" />
                            <div>
                                <h3 className="text-lg font-medium">Cargar Libro de Compras (CSV)</h3>
                                <p className="text-sm text-muted-foreground">
                                    El archivo debe incluir las columnas de IVA recuperable, no recuperable y de uso común.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input 
                                id="file-input"
                                type="file" 
                                accept=".csv"
                                onChange={handleFileChange} 
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                            <Button onClick={handleFileUpload} disabled={isProcessing || !selectedFile}>
                                {isProcessing ? 'Procesando...' : 'Subir y Procesar'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* The display of pending purchases can be revisited or removed if the concept of 'pending' changes */}
                <div>
                    <h3 className="text-lg font-medium mb-4">Compras Registradas en el Período</h3>
                    {purchasesLoading ? (
                        <p className="text-sm text-muted-foreground">Cargando documentos...</p>
                    ) : pendingPurchases && pendingPurchases.length > 0 ? (
                        <DataTable columns={columns} data={pendingPurchases} /> // Ensure columns are adapted to the new data structure
                    ) : (
                        <p className="text-sm text-muted-foreground">No hay compras para el período seleccionado o no se han cargado documentos.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
