'use client';

import React, { useState, useContext, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user'; // Make sure this path is correct
import { collection, query, orderBy } from 'firebase/firestore';

import { DataTable } from '@/components/data-table';
import { columns } from './columns';
import { SelectedCompanyContext } from '../../layout';
import type { VatProportionalityRecord } from '@/lib/types';

interface CalculationResult {
  totalVentasAfectas: number;
  totalVentasExentas: number;
  totalVentas: number;
  proportionalityFactor: number;
  ivaRecuperable: number;
  ivaUsoComun: number;
  ivaNoRecuperable: number;
  creditoUsoComunRecuperable: number;
  totalCreditoFiscal: number;
}

const months = [
  { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' }, { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

export default function VatProportionalityPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth()).toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedCompany } = useContext(SelectedCompanyContext) || {};
  const { user, loading: userLoading } = useUser(); // Get user and auth loading state
  const firestore = useFirestore();

  // --- DEFINITIVE FIX: Wait for both user and company to be loaded ---
  const historyQuery = useMemo(() => {
    // Dont run query if auth is loading, user is null, or no company is selected
    if (userLoading || !user || !firestore || !selectedCompany?.id) {
      return null;
    }
    return query(
      collection(firestore, `companies/${selectedCompany.id}/vatProportionalityRecords`),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, selectedCompany?.id, user, userLoading]); // Add user and userLoading to dependencies

  const { data: history, loading: historyLoading } = useCollection<VatProportionalityRecord>({ query: historyQuery });
  // --- End of fix ---

  const handleCalculate = async () => {
    if (!selectedCompany) {
      setError('No se ha seleccionado una empresa.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/accounting/vat-proportionality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          year: parseInt(selectedYear),
          month: parseInt(selectedMonth),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ocurrió un error al calcular');
      }

      const data: CalculationResult = await response.json();
      setResults(data);

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  const formatPercentage = (value: number) => new Intl.NumberFormat('es-CL', { style: 'percent', minimumFractionDigits: 2 }).format(value);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cálculo de Proporcionalidad de IVA</h1>

      <Card>
        <CardHeader>
          <CardTitle>Selección de Período</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end space-x-4">
          <div className="space-y-2">
            <Label htmlFor="month-select">Mes</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select" className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="year-select">Año</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-select" className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleCalculate} disabled={isLoading}>
            {isLoading ? 'Calculando...' : 'Calcular y Guardar'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
          <CardContent><p>{error}</p></CardContent>
        </Card>
      )}

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Paso 1: Factor de Proporcionalidad</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span>Ventas Netas Afectas:</span> <strong>{formatCurrency(results.totalVentasAfectas)}</strong></div>
              <div className="flex justify-between"><span>Ventas Netas Exentas / No Gravadas:</span> <strong>{formatCurrency(results.totalVentasExentas)}</strong></div>
              <div className="flex justify-between border-t pt-2"><span>Ventas Totales del Período:</span> <strong>{formatCurrency(results.totalVentas)}</strong></div>
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Factor = Ventas Afectas / Ventas Totales</p>
                <p className="text-3xl font-bold text-primary">{formatPercentage(results.proportionalityFactor)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Paso 2: Crédito Fiscal a Utilizar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span>IVA por compras a ventas afectas:</span> <strong>{formatCurrency(results.ivaRecuperable)}</strong></div>
              <div className="flex justify-between"><span>IVA por compras de uso común:</span> <strong>{formatCurrency(results.ivaUsoComun)}</strong></div>
              <div className="flex justify-between text-destructive"><span>IVA por compras a ventas exentas:</span> <strong>{formatCurrency(results.ivaNoRecuperable)} (Gasto)</strong></div>
              <div className="border-t pt-4 space-y-2">
                <p className="text-center text-sm text-muted-foreground">Crédito de Uso Común Recuperable = IVA Uso Común x Factor</p>
                <p className="text-center text-xl font-semibold">{formatCurrency(results.creditoUsoComunRecuperable)}</p>
              </div>
              <div className="border-t-2 border-dashed pt-4 text-right">
                <p className="text-sm">Total Crédito Fiscal (F29)</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(results.totalCreditoFiscal)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historial de Cálculos</CardTitle>
          <CardDescription>Revisa los cálculos de proporcionalidad realizados anteriormente.</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <p>Cargando historial...</p>
          ) : history && history.length > 0 ? (
            <DataTable columns={columns} data={history} />
          ) : (
            <p>No hay registros históricos para mostrar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
