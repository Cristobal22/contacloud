'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';
import { Honorarium } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { centralizeFees } from '@/lib/actions/fees';
import { useRouter } from 'next/navigation';
import { SelectedCompanyContext } from '@/app/dashboard/layout';
import { parseISO } from 'date-fns';

// Helper to read file as Base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

export default function FeesPage() {

  const { toast } = useToast();
  const router = useRouter();
  const companyContext = React.useContext(SelectedCompanyContext);
  
  const [honorarios, setHonorarios] = React.useState<Honorarium[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: 'No se seleccionó ningún archivo.', variant: 'destructive' });
      return;
    }

    const company = companyContext?.selectedCompany;
    if (!company) {
        toast({ title: 'Error', description: 'No hay una empresa seleccionada.', variant: 'destructive' });
        return;
    }
    
    // Corrected: Access properties directly from the company object
    if (!company.feesExpenseAccount || !company.feesWithholdingAccount || !company.feesPayableAccount) {
      toast({ title: 'Error de Configuración', description: 'Las cuentas de honorarios no están configuradas en la empresa.', variant: 'destructive' });
      return;
    }
    
    const periodDate = company.periodStartDate ? parseISO(company.periodStartDate) : new Date();
    const accountingPeriod = { month: periodDate.getMonth() + 1, year: periodDate.getFullYear() };

    setIsLoading(true);
    toast({ title: 'Procesando archivo...', description: 'Esto puede tardar unos segundos.' });

    try {
      const fileContent = await toBase64(file);

      const input = {
        fileContent,
        companyConfig: {
            id: company.id,
            // Corrected: Pass the flat properties
            feesExpenseAccount: company.feesExpenseAccount!,
            feesWithholdingAccount: company.feesWithholdingAccount!,
            feesPayableAccount: company.feesPayableAccount!,
        },
        accountingPeriod,
      };
      
      const result = await centralizeFees(input);
      const { summary, processedHonorarios } = result;

      setHonorarios(prev => [...processedHonorarios, ...prev]);

      toast({
        title: 'Proceso Completado Exitosamente',
        description: `Se procesaron ${summary.totalProcessed} boletas. ${summary.totalValid} válidas y ${summary.totalInvalid} inválidas. Comprobante creado.`,
        variant: 'success',
        action: <Button onClick={() => router.push(`/dashboard/vouchers/${summary.voucherId}`)}>Revisar</Button>,
      });

    } catch (error: any) {
        console.error("Error during fee centralization:", error);
        toast({ title: 'Ocurrió un error', description: error.message || 'No se pudo procesar el archivo.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Honorarios Recibidos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Importar y Centralizar REC</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sube el Registro de Honorarios (REC) del SII para importar las boletas y generar automáticamente el comprobante de centralización.
          </p>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                 <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv,.xls"
                    className="max-w-xs hidden"
                    id="file-upload"
                    disabled={isLoading}
                />
                <Button asChild>
                    <label htmlFor="file-upload" className={`cursor-pointer ${isLoading ? 'opacity-50' : ''}`}>
                        {isLoading ? 'Procesando...' : 'Seleccionar Archivo'}
                    </label>
                </Button>
                <p className="text-xs text-muted-foreground">
                    Archivos soportados: .csv, .xls (del SII)
                </p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Boletas de Honorarios Importadas</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={honorarios} />
        </CardContent>
      </Card>
    </div>
  );
}
