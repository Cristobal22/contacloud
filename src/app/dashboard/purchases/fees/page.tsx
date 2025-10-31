
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/data-table';
import { columns } from './columns'; // We will create this file next
import { Honorarium } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


// Mock data for now, we will replace this with real data later
const sampleHonorarios: Honorarium[] = [
  {
    id: '1',
    companyId: '123',
    date: '2025-02-17',
    documentNumber: '22',
    issuerRut: '20.028.823-8',
    issuerName: 'CRISTOBAL ALBERTO VILLALOBOS N',
    isProfessionalSociety: false,
    grossAmount: 2000000,
    retentionAmount: 290000,
    netAmount: 1710000,
    status: 'Vigente',
    accountingPeriod: '2025-02',
  },
  {
    id: '2',
    companyId: '123',
    date: '2025-02-20',
    documentNumber: '25',
    issuerRut: '19.123.456-7',
    issuerName: 'SOCIEDAD DE PROFESIONALES XYZ SPA',
    isProfessionalSociety: true,
    grossAmount: 1500000,
    retentionAmount: 217500,
    netAmount: 1282500,
    status: 'Vigente',
    accountingPeriod: '2025-02',
  },
    {
    id: '3',
    companyId: '123',
    date: '2025-02-18',
    documentNumber: '23',
    issuerRut: '12.345.678-9',
    issuerName: 'JOHN DOE SERVICES',
    isProfessionalSociety: false,
    grossAmount: 500000,
    retentionAmount: 72500,
    netAmount: 427500,
    status: 'NULA',
    accountingPeriod: '2025-02',
  },
];

export default function FeesPage() {

  const { toast } = useToast();
  const [honorarios, setHonorarios] = React.useState<Honorarium[]>(sampleHonorarios);
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: 'No se seleccionó ningún archivo.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    toast({ title: 'Procesando archivo...' });

    // Here we would call the AI flow to process the file.
    // For now, we'll just simulate it.
    setTimeout(() => {
        // The real implementation will return the processed data
        // and a link to the generated voucher.
        setHonorarios(prev => [...prev, ...sampleHonorarios]);
        setIsLoading(false);
        toast({
            title: 'Archivo procesado con éxito',
            description: 'Se importaron 3 boletas y se generó el comprobante de centralización.',
            action: <Button onClick={() => alert('Ir al comprobante')}>Revisar</Button>,
        });
    }, 2000);

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
            <div className="flex gap-4">
                 <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv,.xls,.xlsx"
                    className="max-w-xs"
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    {isLoading ? 'Procesando...' : 'Cargar Archivo'}
                </Button>
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
