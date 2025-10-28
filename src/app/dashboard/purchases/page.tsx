
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { useToast } from '@/hooks/use-toast';
import type { Purchase, OtherTax, Company } from '@/lib/types';
import { firestore } from '@/firebase';
import { SelectedCompanyContext } from '../layout';
import { columns } from './columns';

const parseDate = (dateString: string): string => {
  if (!dateString) return '';

  const formats = [
    (str: string) => {
      const parts = str.split('/');
      return parts.length === 3 ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}` : '';
    },
    (str: string) => {
        const parts = str.split('-');
        return parts.length === 3 ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`: '';
    }
  ];

  for (const format of formats) {
    const formattedDate = format(dateString);
    if (formattedDate && !isNaN(new Date(formattedDate).getTime())) {
      return formattedDate;
    }
  }

  return ''; 
};


export default function PurchasesPage() {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [isParsing, setIsParsing] = React.useState(false);
    const [purchases, setPurchases] = React.useState<Purchase[]>([]);
    const { toast } = useToast();
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const router = useRouter();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            toast({ variant: 'destructive', description: 'Por favor, selecciona un archivo CSV para continuar.' });
            return;
        }

        if (!selectedCompany) {
            toast({ variant: 'destructive', description: 'No hay ninguna empresa seleccionada.' });
            return;
        }

        const company = selectedCompany as Company;
        const definedTaxes = company.purchasesOtherTaxesAccounts || [];

        setIsParsing(true);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            encoding: 'ISO-8859-1', // To handle special characters
            complete: async (results) => {
                const requiredFields = ['Fecha', 'Tipo', 'Folio', 'Proveedor', 'RUT Proveedor', 'Exento', 'Neto', 'IVA', 'Total'];
                const missingFields = requiredFields.filter(field => !results.meta.fields?.includes(field));

                if (missingFields.length > 0) {
                    toast({ 
                        variant: 'destructive', 
                        title: 'Error en el archivo CSV',
                        description: `Faltan las siguientes columnas obligatorias: ${missingFields.join(', ')}.` 
                    });
                    setIsParsing(false);
                    return;
                }

                const newPurchases: Purchase[] = [];
                const otherTaxHeaders = results.meta.fields?.filter(h => h.startsWith('Codigo Otro Impuesto')) || [];
                const otherTaxValueHeaders = results.meta.fields?.filter(h => h.startsWith('Valor Otro Impuesto')) || [];

                for (const row of results.data as any[]) {
                    const otherTaxes: OtherTax[] = [];

                    otherTaxHeaders.forEach((header, i) => {
                        const codeHeader = header;
                        const valueHeader = otherTaxValueHeaders[i];
                        
                        const taxCode = row[codeHeader];
                        const taxAmount = parseFloat(row[valueHeader]);

                        if (taxCode && !isNaN(taxAmount) && taxAmount !== 0) {
                            const taxDefinition = definedTaxes.find(t => t.taxCode === taxCode);
                            otherTaxes.push({
                                code: taxCode,
                                name: taxDefinition?.name || 'Impuesto Desconocido',
                                amount: taxAmount,
                            });
                        }
                    });

                    newPurchases.push({
                        id: '', // Firestore will generate this
                        date: parseDate(row['Fecha']),
                        documentType: row['Tipo'],
                        documentNumber: row['Folio'],
                        supplier: row['Proveedor'],
                        supplierRut: row['RUT Proveedor'],
                        exemptAmount: parseFloat(row['Exento']) || 0,
                        netAmount: parseFloat(row['Neto']) || 0,
                        taxAmount: parseFloat(row['IVA']) || 0,
                        otherTaxes,
                        total: parseFloat(row['Total']) || 0,
                        status: 'Pendiente',
                        companyId: selectedCompany.id
                    });
                }

                // Firestore batch write
                const purchasesCollection = collection(firestore, 'purchases');
                const batch = writeBatch(firestore);
                let operationsCount = 0;

                for (const purchase of newPurchases) {
                    const docRef = doc(purchasesCollection);
                    batch.set(docRef, purchase);
                    operationsCount++;
                    // Firestore batches have a limit of 500 operations.
                    if (operationsCount >= 499) {
                        await batch.commit();
                        operationsCount = 0;
                    }
                }

                if (operationsCount > 0) {
                    await batch.commit();
                }

                toast({ 
                    title: 'Carga completada',
                    description: `${newPurchases.length} documentos de compra han sido cargados y guardados.`
                });
                setPurchases(newPurchases);
                setIsParsing(false);
                setSelectedFile(null); // Reset file input
            },
            error: (error) => {
                toast({ 
                    variant: 'destructive', 
                    title: 'Error al procesar el archivo',
                    description: error.message 
                });
                setIsParsing(false);
            }
        });
    };

    const goToCentralize = () => {
        router.push('/dashboard/purchases/centralize');
    };

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Libro de Compras</CardTitle>
                    <CardDescription>Carga y visualización de documentos de compra.</CardDescription>
                </div>
                <Button onClick={goToCentralize}>Centralizar Compras</Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 border rounded-lg bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <DocumentMagnifyingGlassIcon className="h-10 w-10 text-gray-500" />
                            <div>
                                <h3 className="text-lg font-medium">Cargar Libro de Compras (RCC)</h3>
                                <p className="text-sm text-muted-foreground">
                                    Sube el archivo CSV exportado desde el SII para importar tus compras.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="file" 
                                accept=".csv" 
                                onChange={handleFileChange} 
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                            <Button onClick={handleFileUpload} disabled={isParsing || !selectedFile}>
                                {isParsing ? 'Procesando...' : 'Subir Archivo'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-4">Compras Cargadas Recientemente</h3>
                    {purchases.length > 0 ? (
                        <DataTable columns={columns} data={purchases} />
                    ) : (
                        <p className="text-sm text-muted-foreground">No hay compras para mostrar. Sube un archivo CSV para empezar.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
