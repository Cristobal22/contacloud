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
import { useCollection, useFirestore } from "@/firebase";
import type { Account, Voucher } from "@/lib/types";
import { SelectedCompanyContext } from "../layout";
import { collection, query, where } from "firebase/firestore";

type BalanceRow = {
    code: string;
    name: string;
    initialBalance: number;
    debit: number;
    credit: number;
    finalBalance: number;
};

export default function BalancesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    });
    const [generatedBalance, setGeneratedBalance] = React.useState<BalanceRow[] | null>(null);

    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: companyId ? `companies/${companyId}/accounts` : undefined,
        companyId: companyId,
    });
    
    const vouchersQuery = React.useMemo(() => {
        if (!firestore || !companyId) return null;
        return query(
            collection(firestore, `companies/${companyId}/vouchers`), 
            where('status', '==', 'Contabilizado')
        );
    }, [firestore, companyId]);

    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({
        query: vouchersQuery,
        disabled: !vouchersQuery
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
            return voucherDate >= startDate && voucherDate <= endDate;
        });

        const balanceMap = new Map<string, BalanceRow>();
        
        accounts.forEach(acc => {
            balanceMap.set(acc.code, {
                code: acc.code,
                name: acc.name,
                initialBalance: acc.balance || 0,
                debit: 0,
                credit: 0,
                finalBalance: 0,
            });
        });

        filteredVouchers.forEach(voucher => {
            voucher.entries.forEach(entry => {
                if (balanceMap.has(entry.account)) {
                    const acc = balanceMap.get(entry.account)!;
                    acc.debit += Number(entry.debit) || 0;
                    acc.credit += Number(entry.credit) || 0;
                }
            });
        });

        const sortedCodes = Array.from(balanceMap.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        
        sortedCodes.forEach(code => {
            const acc = balanceMap.get(code)!;
            const accountInfo = accounts.find(a => a.code === code);
             if (accountInfo?.type === 'Activo' || (accountInfo?.type === 'Resultado' && acc.debit > acc.credit)) {
                acc.finalBalance = acc.initialBalance + acc.debit - acc.credit;
            } else {
                acc.finalBalance = acc.initialBalance + acc.credit - acc.debit;
            }
        });

        for (let i = sortedCodes.length - 1; i >= 0; i--) {
            const code = sortedCodes[i];
            
            let parentCode = '';
            if (code.length > 1) { 
                if (code.length > 5) parentCode = code.substring(0, 5);
                else if (code.length === 5) parentCode = code.substring(0, 3);
                else if (code.length === 3) parentCode = code.substring(0, 1);
            }
           
            if (parentCode && balanceMap.has(parentCode)) {
                const child = balanceMap.get(code)!;
                const parent = balanceMap.get(parentCode)!;
                parent.debit += child.debit;
                parent.credit += child.credit;
            }
        }
        
         sortedCodes.forEach(code => {
            if (code.length < 6) { 
                const acc = balanceMap.get(code)!;
                const accountInfo = accounts.find(a => a.code === code);
                 if (accountInfo?.type === 'Activo' || accountInfo?.type === 'Resultado') {
                    acc.finalBalance = acc.initialBalance + acc.debit - acc.credit;
                } else {
                    acc.finalBalance = acc.initialBalance + acc.credit - acc.debit;
                }
            }
        });

        const balanceData = sortedCodes.map(code => balanceMap.get(code)!);
        
        // Filter out rows where all monetary values are zero
        const filteredBalanceData = balanceData.filter(
            row => row.initialBalance !== 0 || row.debit !== 0 || row.credit !== 0 || row.finalBalance !== 0
        );

        setGeneratedBalance(filteredBalanceData);
    }

    const totals = React.useMemo(() => {
        if (!generatedBalance) return { debit: 0, credit: 0 };
        // The total is the sum of the top-level accounts (e.g., '1', '2', '3', etc.)
        return generatedBalance
            .filter(row => row.code.length === 1) // Only sum top-level classes
            .reduce((acc, row) => ({
                debit: acc.debit + row.debit,
                credit: acc.credit + row.credit,
            }), { debit: 0, credit: 0 });
    }, [generatedBalance]);

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Balance de Comprobación y Saldos</CardTitle>
                <CardDescription>Selecciona un período para generar un balance contable. Solo se considerarán comprobantes contabilizados.</CardDescription>
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
                                        <TableCell className={`text-right font-bold ${row.finalBalance < 0 ? 'text-destructive' : ''}`}>
                                            ${row.finalBalance.toLocaleString('es-CL')}
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
