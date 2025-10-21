'use client';

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableFooterOriginal } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCollection, useFirestore } from "@/firebase";
import type { Voucher } from "@/lib/types";
import { SelectedCompanyContext } from "../layout";
import { collection, query, where } from "firebase/firestore";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

type CashFlowEntry = {
    id: string;
    date: string;
    description: string;
    type: 'Ingreso' | 'Egreso';
    total: number;
};

export default function CashFlowPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    });
    const [generatedReport, setGeneratedReport] = React.useState<{ entries: CashFlowEntry[], totals: { income: number, outcome: number, net: number } } | null>(null);

    const vouchersQuery = React.useMemo(() => {
        if (!firestore || !companyId) return null;
        return query(
            collection(firestore, `companies/${companyId}/vouchers`),
            where('status', '==', 'Contabilizado'),
            where('type', 'in', ['Ingreso', 'Egreso'])
        );
    }, [firestore, companyId]);

    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({
        query: vouchersQuery,
        disabled: !vouchersQuery
    });
    
    const loading = vouchersLoading;

    const handleGenerate = () => {
        if (!vouchers || !date?.from || !date?.to) {
            setGeneratedReport(null);
            return;
        }

        const startDate = date.from;
        const endDate = date.to;

        const filteredVouchers = vouchers.filter(v => {
            const voucherDate = new Date(v.date);
            return voucherDate >= startDate && voucherDate <= endDate;
        });

        const entries: CashFlowEntry[] = filteredVouchers.map(v => ({
            id: v.id,
            date: v.date,
            description: v.description,
            type: v.type,
            total: v.total,
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const totalIncome = entries.filter(e => e.type === 'Ingreso').reduce((sum, e) => sum + e.total, 0);
        const totalOutcome = entries.filter(e => e.type === 'Egreso').reduce((sum, e) => sum + e.total, 0);
        const netFlow = totalIncome - totalOutcome;

        setGeneratedReport({
            entries,
            totals: {
                income: totalIncome,
                outcome: totalOutcome,
                net: netFlow,
            }
        });
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Informe de Flujo de Caja</CardTitle>
                <CardDescription>Selecciona un período para analizar los ingresos y egresos de efectivo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                        <div className="flex-1">
                             <DateRangePicker date={date} onDateChange={setDate} />
                        </div>
                        <Button onClick={handleGenerate} disabled={loading || !companyId}>
                            {loading ? 'Cargando...' : 'Generar Informe'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            {generatedReport && (
                <Card>
                    <CardHeader>
                        <CardTitle>Flujo de Caja del Período</CardTitle>
                        <CardDescription>
                            {date?.from && date.to ? `Resultados para el período del ${format(date.from, "P", { locale: es })} al ${format(date.to, "P", { locale: es })}.` : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Ingresos</TableHead>
                                    <TableHead className="text-right">Egresos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {generatedReport.entries.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center">No hay movimientos de caja en el período seleccionado.</TableCell></TableRow>
                                )}
                                {generatedReport.entries.map(entry => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{new Date(entry.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            {entry.type === 'Ingreso' ? <ArrowUpCircle className="h-4 w-4 text-green-500"/> : <ArrowDownCircle className="h-4 w-4 text-red-500"/>}
                                            {entry.description}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">
                                            {entry.type === 'Ingreso' ? `$${Math.round(entry.total).toLocaleString('es-CL')}` : ''}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600 font-medium">
                                            {entry.type === 'Egreso' ? `$${Math.round(entry.total).toLocaleString('es-CL')}` : ''}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooterOriginal>
                                <TableRow className="text-base">
                                    <TableCell colSpan={2} className="font-bold">Totales</TableCell>
                                    <TableCell className="text-right font-bold text-green-600">${Math.round(generatedReport.totals.income).toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right font-bold text-red-600">${Math.round(generatedReport.totals.outcome).toLocaleString('es-CL')}</TableCell>
                                </TableRow>
                            </TableFooterOriginal>
                        </Table>
                    </CardContent>
                    <CardFooter className="flex justify-end pt-4">
                        <div className="text-right p-4 rounded-lg bg-muted">
                            <p className="text-sm text-muted-foreground">Flujo de Caja Neto del Período</p>
                            <p className={`text-2xl font-bold ${generatedReport.totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${Math.round(generatedReport.totals.net).toLocaleString('es-CL')}
                            </p>
                        </div>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
