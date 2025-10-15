
'use client';
import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableFooterOriginal } from '@/components/ui/table';
import { useCollection } from '@/firebase';
import type { Purchase, Sale } from '@/lib/types';
import { startOfMonth, endOfMonth } from 'date-fns';
import { SelectedCompanyContext } from '../layout';
  
export default function VatSummaryPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(currentMonth);
    const [summary, setSummary] = React.useState<{debit: number, credit: number, total: number} | null>(null);

    const { data: sales, loading: salesLoading } = useCollection<Sale>({ 
        path: `companies/${companyId}/sales`, 
        companyId: companyId 
    });
    const { data: purchases, loading: purchasesLoading } = useCollection<Purchase>({ 
        path: `companies/${companyId}/purchases`, 
        companyId: companyId 
    });
    
    const loading = salesLoading || purchasesLoading;

    const handleGenerate = () => {
        const startDate = startOfMonth(new Date(year, month));
        const endDate = endOfMonth(new Date(year, month));

        const relevantSales = sales?.filter(s => {
            const saleDate = new Date(s.date);
            // Adjust for timezone issues if dates are stored as YYYY-MM-DD
            const saleUTCDate = new Date(saleDate.getUTCFullYear(), saleDate.getUTCMonth(), saleDate.getUTCDate());
            return saleUTCDate >= startDate && saleUTCDate <= endDate;
        }) || [];

        const relevantPurchases = purchases?.filter(p => {
            const purchaseDate = new Date(p.date);
            const purchaseUTCDate = new Date(purchaseDate.getUTCFullYear(), purchaseDate.getUTCMonth(), purchaseDate.getUTCDate());
            return purchaseUTCDate >= startDate && purchaseUTCDate <= endDate;
        }) || [];

        const totalSales = relevantSales.reduce((sum, s) => sum + s.total, 0);
        const totalPurchases = relevantPurchases.reduce((sum, p) => sum + p.total, 0);

        // Standard VAT rate in Chile is 19%
        const vatDebit = totalSales * 0.19;
        const vatCredit = totalPurchases * 0.19;

        setSummary({
            debit: vatDebit,
            credit: vatCredit,
            total: vatDebit - vatCredit,
        });
    }

    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen Mensual IVA</CardTitle>
            <CardDescription>Consulta el resumen mensual de IVA (Impuesto al Valor Agregado).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="month">Mes</Label>
                        <Select value={month.toString()} onValueChange={(val) => setMonth(parseInt(val))}>
                            <SelectTrigger id="month">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString()}>
                                        {new Date(0, i).toLocaleString('es-CL', { month: 'long' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="year">Año</Label>
                        <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
                            <SelectTrigger id="year">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => (
                                    <SelectItem key={currentYear-i} value={(currentYear-i).toString()}>
                                        {currentYear-i}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={handleGenerate} disabled={loading || !companyId}>
                    {loading ? 'Cargando...' : 'Generar Resumen'}
                </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Resumen de IVA</CardTitle>
                 <CardDescription>
                    {summary ? `Resumen para ${new Date(year, month).toLocaleString('es-CL', { month: 'long', year: 'numeric' })}` 
                    : !companyId ? "Por favor, selecciona una empresa." : "Aún no se ha generado ningún resumen."}
                 </CardDescription>
            </CardHeader>
            <CardContent>
                {!summary ? (
                    <p className="text-sm text-muted-foreground">Usa el generador para ver el resumen de IVA.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Concepto</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>IVA Débito Fiscal (Ventas)</TableCell>
                                <TableCell className="text-right">${Math.round(summary.debit).toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>IVA Crédito Fiscal (Compras)</TableCell>
                                <TableCell className="text-right">- ${Math.round(summary.credit).toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                        </TableBody>
                        <TableFooterOriginal>
                            <TableRow className="font-bold text-lg">
                                <TableCell>{summary.total >= 0 ? "IVA a Pagar" : "Remanente Crédito Fiscal"}</TableCell>
                                <TableCell className="text-right">${Math.round(Math.abs(summary.total)).toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                        </TableFooterOriginal>
                    </Table>
                )}
            </CardContent>
        </Card>
      </div>
    )
  }
