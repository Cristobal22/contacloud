
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { DocumentMagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { collection, writeBatch, doc, query, where, getDocs } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { useToast } from '@/hooks/use-toast';
import type { Purchase, OtherTax, Company } from '@/lib/types';
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

const parseDate = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split(/[-/]/);
  if (parts.length !== 3) return '';
  // Assuming DD/MM/YYYY or DD-MM-YYYY
  const [day, month, year] = parts;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};


export default function PurchasesPage() {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const { toast } = useToast();
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const router = useRouter();
    const firestore = useFirestore();

    const purchasesQuery = React.useMemo(() => {
        if (!firestore || !selectedCompany?.id) return null;
        return query(collection(firestore, `companies/${selectedCompany.id}/purchases`), where('status', '==', 'Pendiente'));
    }, [firestore, selectedCompany?.id]);

    const { data: pendingPurchases, loading: purchasesLoading } = useCollection<Purchase>({ query: purchasesQuery });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleFileUpload = async () => {
        if (!firestore || !selectedFile || !selectedCompany) {
            toast({ variant: 'destructive', description: 'Error de sistema o falta de datos (archivo, empresa).'
            });
            return;
        }

        const company = selectedCompany as Company;
        const definedTaxes = company.purchasesOtherTaxesAccounts || [];

        setIsProcessing(true);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            encoding: 'UTF-8',
            complete: async (results) => {
                const requiredFields = ['Fecha Docto', 'Tipo Doc', 'Folio', 'Razon Social', 'RUT Proveedor', 'Monto Exento', 'Monto Neto', 'Monto IVA Recuperable', 'Monto Total'];
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
                const otherTaxHeaders = results.meta.fields?.filter(h => h.startsWith('Codigo Otro Impuesto')) || [];
                const otherTaxValueHeaders = results.meta.fields?.filter(h => h.startsWith('Valor Otro Impuesto')) || [];

                for (const row of results.data as any[]) {
                    const otherTaxes: OtherTax[] = [];

                    otherTaxHeaders.forEach((header, i) => {
                        const taxCode = row[header];
                        const valueHeader = otherTaxValueHeaders[i];
                        if (taxCode && valueHeader && row[valueHeader]){
                            const taxAmount = parseFloat(row[valueHeader]);
                            if (!isNaN(taxAmount) && taxAmount !== 0) {
                                const taxDefinition = definedTaxes.find(t => t.taxCode === taxCode);
                                otherTaxes.push({
                                    code: taxCode,
                                    name: taxDefinition?.name || 'Impuesto Desconocido',
                                    amount: taxAmount,
                                });
                            }
                        }
                    });

                    newPurchases.push({
                        date: parseDate(row['Fecha Docto']),
                        documentType: row['Tipo Doc'],
                        documentNumber: row['Folio'],
                        supplier: row['Razon Social'],
                        supplierRut: row['RUT Proveedor'],
                        exemptAmount: parseFloat(row['Monto Exento']) || 0,
                        netAmount: parseFloat(row['Monto Neto']) || 0,
                        taxAmount: parseFloat(row['Monto IVA Recuperable']) || 0,
                        otherTaxes,
                        total: parseFloat(row['Monto Total']) || 0,
                        status: 'Pendiente',
                        companyId: selectedCompany.id
                    });
                }

                try {
                    const purchasesCollection = collection(firestore, 'companies', selectedCompany.id, 'purchases');
                    const batch = writeBatch(firestore);
                    
                    for (const purchase of newPurchases) {
                        const docRef = doc(purchasesCollection);
                        batch.set(docRef, purchase);
                    }
                    await batch.commit();

                    toast({ 
                        title: 'Carga completada',
                        description: `${newPurchases.length} nuevos documentos de compra han sido cargados.`
                    });
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error al guardar', description: 'No se pudieron guardar los datos en la base de datos.' });
                }

                setIsProcessing(false);
                setSelectedFile(null); 
                if (document.getElementById('file-input')) {
                    (document.getElementById('file-input') as HTMLInputElement).value = '';
                }
            },
            error: (error) => {
                toast({ variant: 'destructive', title: 'Error al procesar el archivo', description: error.message });
                setIsProcessing(false);
            }
        });
    };
    
    const handleDiscardPending = async () => {
        if (!firestore || !selectedCompany?.id) return;
        if (!pendingPurchases || pendingPurchases.length === 0) {
            toast({ description: 'No hay documentos pendientes para descartar.' });
            return;
        }

        setIsProcessing(true);
        try {
            const purchasesCollectionRef = collection(firestore, `companies/${selectedCompany.id}/purchases`);
            const q = query(purchasesCollectionRef, where('status', '==', 'Pendiente'));
            const querySnapshot = await getDocs(q);
            
            const batch = writeBatch(firestore);
            querySnapshot.forEach(document => {
                batch.delete(document.ref);
            });
            
            await batch.commit();
            toast({ title: 'Limpieza Exitosa', description: `Se han descartado ${querySnapshot.size} documentos pendientes.` });
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error al descartar los documentos.' });
        }
        setIsProcessing(false);
    };

    const goToCentralize = () => {
        router.push('/dashboard/purchases/centralize');
    };

    const hasPendingPurchases = pendingPurchases && pendingPurchases.length > 0;

    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between">
                <div>
                    <CardTitle>1. Carga y Revisión del Libro de Compras</CardTitle>
                    <CardDescription>Carga el CSV del SII. Los documentos con estado 'Pendiente' serán usados en la centralización.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive" disabled={!hasPendingPurchases || isProcessing}>
                                <ExclamationTriangleIcon className="h-4 w-4 mr-2"/>
                                Descartar Carga Pendiente
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción eliminará permanentemente <strong>{pendingPurchases?.length || 0}</strong> documentos de compra que están en estado 'Pendiente'.
                                    Esta operación no se puede deshacer.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDiscardPending}>Sí, descartar todo</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                   
                    <Button onClick={goToCentralize} disabled={!hasPendingPurchases || isProcessing}>Centralizar Compras</Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 border rounded-lg bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <DocumentMagnifyingGlassIcon className="h-10 w-10 text-gray-500" />
                            <div>
                                <h3 className="text-lg font-medium">Cargar Libro de Compras (CSV)</h3>
                                <p className="text-sm text-muted-foreground">
                                    Sube el archivo exportado desde el SII para añadir compras a la lista de pendientes.
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
                                {isProcessing ? 'Procesando...' : 'Subir y Añadir'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-4">Documentos Pendientes de Centralización</h3>
                    {purchasesLoading ? (
                        <p className="text-sm text-muted-foreground">Cargando documentos...</p>
                    ) : hasPendingPurchases ? (
                        <DataTable columns={columns} data={pendingPurchases} />
                    ) : (
                        <p className="text-sm text-muted-foreground">No hay compras pendientes para mostrar. Sube un archivo CSV para empezar.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
