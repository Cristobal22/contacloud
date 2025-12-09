
'use client';

import React from 'react';
import Papa from 'papaparse';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { collection, writeBatch, doc, query, where, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { useToast } from '@/hooks/use-toast';
import type { Sale, SaleIvaClassification } from '@/lib/types';
import { useFirestore, useCollection } from '@/firebase';
import { SelectedCompanyContext } from '../layout';
import { columns } from './columns';

const parseDateToTimestamp = (dateString: string) => {
    if (!dateString) return serverTimestamp();
    const parts = dateString.split(/[\/-]/);
    if (parts.length !== 3) return serverTimestamp();
    const [day, month, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(Number(fullYear), Number(month) - 1, Number(day));
};

const getSaleIvaClassification = (row: any): SaleIvaClassification => {
    const docType = parseInt(row['Tipo Doc'], 10);
    // Document types for exempt sales (34: exenta, 111: nota de credito exenta, etc.)
    const exemptDocTypes = [34, 111, 112]; 
    if (exemptDocTypes.includes(docType) || (parseFloat(row['Monto Exento']) > 0 && parseFloat(row['Monto Neto']) === 0)) {
        return 'Exenta';
    }
    return 'Afecta';
};

export default function SalesPage() {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const { toast } = useToast();
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const firestore = useFirestore();

    const salesQuery = React.useMemo(() => {
        if (!firestore || !selectedCompany?.id) return null;
        return query(collection(firestore, 'sales'), where('companyId', '==', selectedCompany.id));
    }, [firestore, selectedCompany?.id]);

    const { data: sales, loading: salesLoading } = useCollection<Sale>({ query: salesQuery });

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
            encoding: 'latin1', // SII files often use latin1 encoding
            complete: async (results) => {
                const requiredFields = ['Fecha Docto', 'Tipo Doc', 'Folio', 'RUT Cliente', 'Razon Social', 'Monto Exento', 'Monto Neto', 'Monto IVA', 'Monto Total'];
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

                const newSales: Omit<Sale, 'id'>[] = [];

                for (const row of results.data as any[]) {
                    const netAmount = parseFloat(row['Monto Neto']) || 0;
                    const taxAmount = parseFloat(row['Monto IVA']) || 0;

                    // Skip rows that are likely summaries or don't have a valid document number
                    if (!row['Folio'] || isNaN(parseInt(row['Folio'], 10))) continue;

                    newSales.push({
                        companyId: selectedCompany.id,
                        documentType: parseInt(row['Tipo Doc'], 10),
                        documentNumber: parseInt(row['Folio'], 10),
                        issueDate: parseDateToTimestamp(row['Fecha Docto']),
                        clientRut: row['RUT Cliente'],
                        clientName: row['Razon Social'] || '',
                        netAmount: netAmount,
                        taxAmount: taxAmount,
                        totalAmount: parseFloat(row['Monto Total']) || 0,
                        ivaClassification: getSaleIvaClassification(row), // Set the classification
                    });
                }

                try {
                    const batch = writeBatch(firestore);
                    const salesCollectionRef = collection(firestore, 'sales');
                    
                    for (const sale of newSales) {
                        const docRef = doc(salesCollectionRef);
                        batch.set(docRef, { ...sale, id: docRef.id });
                    }
                    await batch.commit();

                    toast({ 
                        title: 'Carga completada',
                        description: `${newSales.length} nuevos documentos de venta han sido cargados.`
                    });
                } catch (error: any) {
                    toast({ variant: 'destructive', title: 'Error al guardar', description: `No se pudieron guardar los datos: ${error.message}` });
                }

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

    return (
        <Card>
            <CardHeader>
              <CardTitle>Importar Registro de Ventas (RCV)</CardTitle>
              <CardDescription>Sube el archivo CSV de "Detalle" exportado desde el SII para registrar tus ventas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 border rounded-lg bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <DocumentMagnifyingGlassIcon className="h-10 w-10 text-gray-500" />
                            <div>
                                <h3 className="text-lg font-medium">Cargar Libro de Ventas (CSV)</h3>
                                <p className="text-sm text-muted-foreground">
                                    Usa el archivo de detalle para asegurar la correcta clasificación de IVA.
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

                <div>
                    <h3 className="text-lg font-medium mb-4">Ventas Registradas en el Período</h3>
                    {salesLoading ? (
                        <p className="text-sm text-muted-foreground">Cargando documentos...</p>
                    ) : sales && sales.length > 0 ? (
                        <DataTable columns={columns} data={sales} />
                    ) : (
                        <p className="text-sm text-muted-foreground">No hay ventas para el período seleccionado o no se han cargado documentos.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
