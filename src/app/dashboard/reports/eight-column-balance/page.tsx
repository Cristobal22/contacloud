'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useCollection } from '@/firebase';
import type { Account, Voucher } from '@/lib/types';
import { SelectedCompanyContext } from '@/app/dashboard/layout';
import { generateEightColumnBalance, type EightColumnBalanceData } from '@/lib/eight-column-balance-generator';
import { format, startOfMonth, endOfMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
    if (value === 0) return '-';
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.round(value));
};

export default function EightColumnBalancePage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const { toast } = useToast();

    const { data: accounts, loading: accountsLoading } = useCollection<Account>({ path: `companies/${companyId}/accounts`, companyId });
    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({ path: `companies/${companyId}/vouchers`, companyId });

    const [balanceData, setBalanceData] = React.useState<EightColumnBalanceData | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const [startDate, setStartDate] = React.useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = React.useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    React.useEffect(() => {
        if (selectedCompany?.periodStartDate && selectedCompany?.periodEndDate) {
            const start = new Date(selectedCompany.periodStartDate);
            const end = new Date(selectedCompany.periodEndDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                setStartDate(format(start, 'yyyy-MM-dd'));
                setEndDate(format(end, 'yyyy-MM-dd'));
            }
        }
    }, [selectedCompany]);

    const handleGenerateBalance = () => {
        if (!accounts || !vouchers) return;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (getYear(start) !== getYear(end)) {
            toast({
                variant: "destructive",
                title: "Rango de Fechas Inválido",
                description: "La fecha de inicio y término deben pertenecer al mismo año para generar el balance.",
            });
            return;
        }

        setIsLoading(true);

        const filteredVouchers = vouchers.filter(v => {
            const voucherDate = new Date(v.date);
            start.setUTCHours(0, 0, 0, 0);
            end.setUTCHours(23, 59, 59, 999);
            voucherDate.setUTCHours(0, 0, 0, 0);

            return voucherDate >= start && voucherDate <= end && v.status === 'Contabilizado';
        });

        const data = generateEightColumnBalance(accounts, filteredVouchers);
        setBalanceData(data);
        setIsLoading(false);
    };

    const periodIsDefined = selectedCompany?.periodStartDate && selectedCompany?.periodEndDate;
    const resultado = balanceData?.resultadoDelEjercicio ?? 0;
    const esUtilidad = resultado >= 0;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Balance de 8 Columnas</CardTitle>
                    <CardDescription>
                        {periodIsDefined && !isNaN(new Date(startDate).getTime())
                            ? `Selecciona un período dentro del mismo año para generar el balance. Período de trabajo actual: ${format(new Date(startDate), 'dd-MM-yyyy')} al ${format(new Date(endDate), 'dd-MM-yyyy')}.`
                            : "Por favor, define un período de trabajo en la configuración de la empresa para generar reportes."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Fecha de Inicio</Label>
                            <Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={!periodIsDefined} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">Fecha de Término</Label>
                            <Input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={!periodIsDefined} />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleGenerateBalance} disabled={isLoading || accountsLoading || vouchersLoading || !periodIsDefined} className="w-full">
                                {isLoading ? 'Generando...' : (accountsLoading || vouchersLoading ? 'Cargando datos...' : 'Generar Balance')}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {balanceData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados del Balance</CardTitle>
                        <CardDescription>{`Período del ${format(new Date(startDate), 'P', {locale: es})} al ${format(new Date(endDate), 'P', {locale: es})}`}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead rowSpan={2} className="align-bottom sticky left-0 bg-background z-10">Código</TableHead>
                                    <TableHead rowSpan={2} className="align-bottom sticky left-[80px] bg-background z-10">Cuenta Contable</TableHead>
                                    <TableHead colSpan={2} className="text-center">Sumas</TableHead>
                                    <TableHead colSpan={2} className="text-center">Saldos</TableHead>
                                    <TableHead colSpan={2} className="text-center">Inventario</TableHead>
                                    <TableHead colSpan={2} className="text-center">Resultados</TableHead>
                                </TableRow>
                                <TableRow>
                                    <TableHead className="text-right">Debe</TableHead>
                                    <TableHead className="text-right">Haber</TableHead>
                                    <TableHead className="text-right">Deudor</TableHead>
                                    <TableHead className="text-right">Acreedor</TableHead>
                                    <TableHead className="text-right">Activo</TableHead>
                                    <TableHead className="text-right">Pasivo</TableHead>
                                    <TableHead className="text-right">Pérdida</TableHead>
                                    <TableHead className="text-right">Ganancia</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {balanceData.rows.map(row => (
                                    <TableRow key={row.code}>
                                        <TableCell className="font-mono text-xs sticky left-0 bg-background z-10">{row.code}</TableCell>
                                        <TableCell className="sticky left-[80px] bg-background z-10">{row.name}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.sumasDebe)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.sumasHaber)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(row.saldoDeudor)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(row.saldoAcreedor)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.activo)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.pasivo)}</TableCell>
                                        <TableCell className="text-right text-red-600">{formatCurrency(row.perdida)}</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(row.ganancia)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="font-bold bg-muted/50">
                                    <TableCell colSpan={2}>Sub-Totales</TableCell>
                                    <TableCell className="text-right">{formatCurrency(balanceData.totals.sumasDebe)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(balanceData.totals.sumasHaber)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(balanceData.totals.saldoDeudor)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(balanceData.totals.saldoAcreedor)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(balanceData.totals.activo)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(balanceData.totals.pasivo)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(balanceData.totals.perdida)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(balanceData.totals.ganancia)}</TableCell>
                                </TableRow>
                                <TableRow className="font-bold">
                                     <TableCell colSpan={6}></TableCell>
                                     <TableCell >{esUtilidad ? 'Utilidad del Ejercicio' : 'Pérdida del Ejercicio'}</TableCell>
                                     <TableCell className="text-right">{formatCurrency(Math.abs(resultado))}</TableCell>
                                     <TableCell className="text-right">{formatCurrency(esUtilidad ? Math.abs(resultado) : 0)}</TableCell>
                                     <TableCell className="text-right">{formatCurrency(!esUtilidad ? Math.abs(resultado) : 0)}</TableCell>
                                </TableRow>
                                <TableRow className="bg-secondary font-extrabold text-secondary-foreground">
                                     <TableCell colSpan={6}></TableCell>
                                     <TableCell colSpan={2} className="text-center">Sumas Iguales</TableCell>
                                     <TableCell className="text-right">{formatCurrency(balanceData.totals.activo)}</TableCell>
                                     <TableCell className="text-right">{formatCurrency(balanceData.totals.pasivo + resultado)}</TableCell>
                                </TableRow>
                                 <TableRow className="bg-secondary font-extrabold text-secondary-foreground">
                                     <TableCell colSpan={8}></TableCell>
                                     <TableCell className="text-right">{formatCurrency(balanceData.totals.perdida + (esUtilidad ? resultado : 0))}</TableCell>
                                     <TableCell className="text-right">{formatCurrency(balanceData.totals.ganancia + (!esUtilidad ? resultado : 0))}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                     <CardFooter className="flex justify-center pt-8">
                         <Card className="w-fit p-6 shadow-lg">
                            <p className="text-center text-lg font-semibold">Resultado del Ejercicio</p>
                            <p className={`text-center text-3xl font-bold ${esUtilidad ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(resultado)}
                            </p>
                            <p className="text-center text-sm text-muted-foreground">
                                {esUtilidad ? "(Utilidad)" : "(Pérdida)"}
                            </p>
                        </Card>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
