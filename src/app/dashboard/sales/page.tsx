
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { DocumentMagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { useToast } from '@/hooks/use-toast';
import type { Sale, OtherTax, Company } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { SelectedCompanyContext } from '../layout';
import { columns } from './columns';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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


export default function SalesPage() {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [isParsing, setIsParsing] = React.useState(false);
    const [sales, setSales] = React.useState<Sale[]>([]);
    const [summaryFile, setSummaryFile] = React.useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [summaryData, setSummaryData] = React.useState<any[]>([]);
    const [documentTypes, setDocumentTypes] = React.useState<string[]>([]);
    const [selectedDocumentTypes, setSelectedDocumentTypes] = React.useState<Set<string>>(new Set());
    const [isGenerating, setIsGenerating] = React.useState(false);
    
    const { toast } = useToast();
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const router = useRouter();
    const firestore = useFirestore();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };
    
    const handleSummaryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSummaryFile(event.target.files[0]);
            // Reset previous analysis
            setSummaryData([]);
            setDocumentTypes([]);
            setSelectedDocumentTypes(new Set());
        }
    };

    const handleAnalyze = () => {
        if (!summaryFile) {
            toast({ variant: 'destructive', description: 'Por favor, selecciona un archivo CSV para analizar.' });
            return;
        }

        setIsAnalyzing(true);
        Papa.parse(summaryFile, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            encoding: 'UTF-8',
            complete: (results) => {
                const requiredFields = ['Tipo Documento', 'Monto Exento', 'Monto Neto', 'Monto IVA', 'Monto Total'];
                const missingFields = requiredFields.filter(field => !results.meta.fields?.includes(field));

                if (missingFields.length > 0) {
                    toast({
                        variant: 'destructive',
                        title: 'Error en el archivo de resumen',
                        description: `Faltan las siguientes columnas obligatorias: ${missingFields.join(', ')}.`,
                    });
                    setIsAnalyzing(false);
                    return;
                }

                const types = new Set(results.data.map((row: any) => row['Tipo Documento']).filter(Boolean));
                setDocumentTypes(Array.from(types));
                setSelectedDocumentTypes(types as Set<string>); // Select all by default
                setSummaryData(results.data);
                setIsAnalyzing(false);
                toast({ title: 'Análisis completado', description: 'Selecciona los documentos a consolidar.' });
            },
            error: (error) => {
                toast({ variant: 'destructive', title: 'Error al analizar', description: error.message });
                setIsAnalyzing(false);
            },
        });
    };

    const handleDocumentTypeChange = (type: string, checked: boolean) => {
        const newSelection = new Set(selectedDocumentTypes);
        if (checked) {
            newSelection.add(type);
        } else {
            newSelection.delete(type);
        }
        setSelectedDocumentTypes(newSelection);
    };

    const handleGenerateSummary = async () => {
        if (!firestore || !selectedCompany) {
            toast({ variant: 'destructive', description: 'Error de conexión o empresa no seleccionada.' });
            return;
        }

        setIsGenerating(true);

        let totalNeto = 0;
        let totalIva = 0;
        let totalExento = 0;
        let totalFinal = 0;
        
        summaryData.forEach((row: any) => {
            if (selectedDocumentTypes.has(row['Tipo Documento'])) {
                totalExento += parseFloat(row['Monto Exento']) || 0;
                totalNeto += parseFloat(row['Monto Neto']) || 0;
                totalIva += parseFloat(row['Monto IVA']) || 0;
                totalFinal += parseFloat(row['Monto Total']) || 0;
            }
        });

        if (totalFinal === 0) {
            toast({
                variant: 'destructive',
                title: 'No se generó el resumen',
                description: 'El total es cero. Asegúrate de seleccionar al menos un tipo de documento con montos válidos.',
            });
            setIsGenerating(false);
            return;
        }
        
        // Use end of current month for the date
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const formattedDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

        const consolidatedSale: Sale = {
            id: '',
            date: formattedDate,
            documentType: 'Resumen de Ventas (SII)',
            documentNumber: `${lastDay.getFullYear()}${String(lastDay.getMonth() + 1).padStart(2, '0')}`,
            customer: 'Clientes Varios',
            customerRut: '99999999-9',
            exemptAmount: totalExento,
            netAmount: totalNeto,
            taxAmount: totalIva,
            otherTaxes: [],
            total: totalFinal,
            status: 'Pendiente',
            companyId: selectedCompany.id,
            isSummary: true,
        };

        try {
            const salesCollection = collection(firestore, 'companies', selectedCompany.id, 'sales');
            await addDoc(salesCollection, consolidatedSale);

            toast({
                title: 'Éxito',
                description: 'Se ha generado la venta consolidada y está lista para centralizar.',
            });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error al guardar', description: 'No se pudo guardar el resumen en la base de datos.' });
        } finally {
            // Reset state
            setSummaryFile(null);
            setSummaryData([]);
            setDocumentTypes([]);
            setSelectedDocumentTypes(new Set());
            setIsGenerating(false);
        }
    };


    const handleFileUpload = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', description: 'Error de conexión con la base de datos. Inténtalo de nuevo.' });
            return;
        }

        if (!selectedFile) {
            toast({ variant: 'destructive', description: 'Por favor, selecciona un archivo CSV para continuar.' });
            return;
        }

        if (!selectedCompany) {
            toast({ variant: 'destructive', description: 'No hay ninguna empresa seleccionada.' });
            return;
        }
        
        const company = selectedCompany as Company;
        const definedTaxes = company.salesOtherTaxesAccounts || [];

        setIsParsing(true);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            encoding: 'UTF-8',
            complete: async (results) => {
                const requiredFields = ['Fecha Docto', 'Tipo Doc', 'Folio', 'Razon Social', 'RUT Cliente', 'Monto Exento', 'Monto Neto', 'Monto IVA Recuperable', 'Monto Total'];
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

                const newSales: Sale[] = [];
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

                    newSales.push({
                        id: '', // Firestore will generate this
                        date: parseDate(row['Fecha Docto']),
                        documentType: row['Tipo Doc'],
                        documentNumber: row['Folio'],
                        customer: row['Razon Social'],
                        customerRut: row['RUT Cliente'],
                        exemptAmount: parseFloat(row['Monto Exento']) || 0,
                        netAmount: parseFloat(row['Monto Neto']) || 0,
                        taxAmount: parseFloat(row['Monto IVA Recuperable']) || 0,
                        otherTaxes,
                        total: parseFloat(row['Monto Total']) || 0,
                        status: 'Pendiente',
                        companyId: selectedCompany.id
                    });
                }

                // Firestore batch write
                const salesCollection = collection(firestore, 'companies', selectedCompany.id, 'sales');
                const batch = writeBatch(firestore);
                let operationsCount = 0;

                for (const sale of newSales) {
                    const docRef = doc(salesCollection);
                    batch.set(docRef, sale);
                    operationsCount++;
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
                    description: `${newSales.length} documentos de venta han sido cargados y guardados.`
                });
                setSales(newSales);
                setIsParsing(false);
                setSelectedFile(null); 
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
        router.push('/dashboard/sales/centralize');
    };

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Libro de Ventas</CardTitle>
                    <CardDescription>Carga y visualización de documentos de venta.</CardDescription>
                </div>
                <Button onClick={goToCentralize}>Centralizar Ventas</Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 border rounded-lg bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <DocumentMagnifyingGlassIcon className="h-10 w-10 text-gray-500" />
                            <div>
                                <h3 className="text-lg font-medium">Cargar Libro de Ventas (archivo DETALLES RCV)</h3>
                                <p className="text-sm text-muted-foreground">
                                    Sube el archivo "Detalles RCV" en formato CSV exportado desde el SII para importar tus ventas.
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

                {/* New Summary Upload Section */}
                <div className="p-6 border rounded-lg bg-slate-50/50 space-y-4">
                    <div className="flex items-center space-x-4">
                        <CheckCircleIcon className="h-10 w-10 text-gray-500" />
                        <div>
                            <h3 className="text-lg font-medium">Cargar Resumen de Ventas del SII</h3>
                            <p className="text-sm text-muted-foreground">
                                Consolida boletas y otros documentos en una sola venta mensual.
                            </p>
                        </div>
                    </div>

                    {documentTypes.length === 0 ? (
                        // Step 1: Analyze
                        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                             <p className="text-sm text-muted-foreground flex-1">
                                Sube el archivo de resumen mensual (CSV) del SII. El sistema lo analizará para que elijas qué documentos consolidar.
                            </p>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleSummaryFileChange}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                />
                                <Button onClick={handleAnalyze} disabled={isAnalyzing || !summaryFile}>
                                    {isAnalyzing ? 'Analizando...' : 'Analizar Archivo'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // Step 2: Select and Generate
                        <div className='space-y-4'>
                            <p className='text-sm font-medium'>Paso 2: Selecciona los tipos de documento que deseas consolidar.</p>
                            <div className="space-y-2 p-4 border rounded-md">
                                {documentTypes.map((type) => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={type}
                                            checked={selectedDocumentTypes.has(type)}
                                            onCheckedChange={(checked) => handleDocumentTypeChange(type, !!checked)}
                                        />
                                        <Label htmlFor={type} className="font-normal text-sm">{type}</Label>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => { setDocumentTypes([]); setSummaryFile(null); }}>Cancelar</Button>
                                <Button onClick={handleGenerateSummary} disabled={isGenerating || selectedDocumentTypes.size === 0}>
                                    {isGenerating ? 'Generando...' : 'Generar Venta Consolidada'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-4">Ventas Cargadas Recientemente</h3>
                    {sales.length > 0 ? (
                        <DataTable columns={columns} data={sales} />
                    ) : (
                        <p className="text-sm text-muted-foreground">No hay ventas para mostrar. Sube un archivo CSV para empezar.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
