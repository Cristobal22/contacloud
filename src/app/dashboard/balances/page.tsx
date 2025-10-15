
'use client';

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCollection } from "@/firebase";
import type { Account, Voucher } from "@/lib/types";
import { SelectedCompanyContext } from "../layout";

type BalanceRow = {
    code: string;
    name: string;
    debit: number;
    credit: number;
    balance: number;
};

export default function BalancesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    });
    const [generatedBalance, setGeneratedBalance] = React.useState<BalanceRow[] | null>(null);

    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: companyId ? `companies/${companyId}/accounts` : undefined,
        companyId: companyId,
    });
    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({
        path: companyId ? `companies/${companyId}/vouchers` : undefined,
        companyId: companyId,
    });

    const loading = accountsLoading || vouchersLoading;

    const handleGenerate = () => {
        if (!accounts || !vouchers || !date?.from || !date?.to) {
            setGeneratedBalance([]);
            return;
        };

        const startDate = date.from;
        const endDate = date.to;

        const filteredVouchers = vouchers.filter(v => {
            const voucherDate = new Date(v.date);
            return voucherDate >= startDate && voucherDate <= endDate && v.status === 'Contabilizado';
        });

        const accountMovements = new Map<string, { debit: number; credit: number }>();

        filteredVouchers.forEach(voucher => {
            voucher.entries.forEach(entry => {
                const current = accountMovements.get(entry.account) || { debit: 0, credit: 0 };
                current.debit += Number(entry.debit) || 0;
                current.credit += Number(entry.credit) || 0;
                accountMovements.set(entry.account, current);
            });
        });

        const balanceData = accounts.map(account => {
            const movements = accountMovements.get(account.code) || { debit: 0, credit: 0 };
            let finalBalance = account.balance || 0;

            if (account.type === 'Activo' || (account.type === 'Resultado' && movements.debit > movements.credit)) {
                finalBalance += movements.debit - movements.credit;
            } else {
                finalBalance += movements.credit - movements.debit;
            }
            
            return {
                code: account.code,
                name: account.name,
                debit: movements.debit,
                credit: movements.credit,
                balance: finalBalance,
            };
        }).filter(item => item.debit > 0 || item.credit > 0);

        setGeneratedBalance(balanceData);
    }

    const totals = React.useMemo(() => {
        if (!generatedBalance) return { debit: 0, credit: 0 };
        return generatedBalance.reduce((acc, row) => ({
            debit: acc.debit + row.debit,
            credit: acc.credit + row.credit,
        }), { debit: 0, credit: 0 });
    }, [generatedBalance]);

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Generador de Balances</CardTitle>
                <CardDescription>Selecciona un período para generar un balance contable.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1">
                             <DateRangePicker date={date} onDateChange={setDate} />
                        </div>
                        <Button onClick={handleGenerate} disabled={loading || !companyId}>
                            {loading ? 'Cargando...' : 'Generar Balance'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Último Balance Generado</CardTitle>
                    <CardDescription>
                         {generatedBalance && date?.from && date?.to ? 
                            `Balance para el período del ${format(date.from, "P", { locale: es })} al ${format(date.to, "P", { locale: es })}.` 
                            : !companyId ? "Por favor, selecciona una empresa." : "Aún no se ha generado ningún balance."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {!generatedBalance ? (
                        <p className="text-sm text-muted-foreground">Utiliza el generador para crear tu primer balance.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Cuenta</TableHead>
                                    <TableHead className="text-right">Debe</TableHead>
                                    <TableHead className="text-right">Haber</TableHead>
                                    <TableHead className="text-right font-bold">Saldo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {generatedBalance.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="text-center">No hay movimientos en el período seleccionado.</TableCell></TableRow>
                                )}
                                {generatedBalance.map(row => (
                                    <TableRow key={row.code}>
                                        <TableCell>{row.code}</TableCell>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell className="text-right">${row.debit.toLocaleString('es-CL')}</TableCell>
                                        <TableCell className="text-right">${row.credit.toLocaleString('es-CL')}</TableCell>
                                        <TableCell className={`text-right font-bold ${row.balance < 0 ? 'text-destructive' : ''}`}>
                                            ${row.balance.toLocaleString('es-CL')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="text-base">
                                    <TableCell colSpan={2} className="font-bold">Totales</TableCell>
                                    <TableCell className="text-right font-bold">${totals.debit.toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right font-bold">${totals.credit.toLocaleString('es-CL')}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    )}
                </CardContent>
            </Card>
      </div>
    )
  }
