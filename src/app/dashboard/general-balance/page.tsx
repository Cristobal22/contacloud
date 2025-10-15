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
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { useCollection } from "@/firebase";
import type { Account, Voucher } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableFooterOriginal } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type BalanceSheetData = {
    assets: AccountWithBalance[];
    liabilities: AccountWithBalance[];
    equity: AccountWithBalance[];
    periodResult: number;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
};

type AccountWithBalance = Account & { finalBalance: number };

export default function GeneralBalancePage({ companyId }: { companyId?: string }) {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(new Date().getFullYear(), 11, 31),
    });
    
    const [generatedBalance, setGeneratedBalance] = React.useState<BalanceSheetData | null>(null);

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
            setGeneratedBalance(null);
            return;
        }

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

        const accountsWithBalance: AccountWithBalance[] = accounts.map(account => {
            const movements = accountMovements.get(account.code) || { debit: 0, credit: 0 };
            let finalBalance = account.balance || 0; // Initial balance
             if (account.type === 'Activo' || (account.type === 'Resultado' && movements.debit > movements.credit)) {
                finalBalance += movements.debit - movements.credit;
            } else { 
                finalBalance += movements.credit - movements.debit;
            }
            return { ...account, finalBalance };
        });

        const assets = accountsWithBalance.filter(a => a.type === 'Activo' && a.finalBalance !== 0);
        const liabilities = accountsWithBalance.filter(a => a.type === 'Pasivo' && a.finalBalance !== 0);
        const equity = accountsWithBalance.filter(a => a.type === 'Patrimonio' && a.finalBalance !== 0);
        const resultAccounts = accountsWithBalance.filter(a => a.type === 'Resultado');

        const periodResult = resultAccounts.reduce((sum, acc) => sum + acc.finalBalance, 0);
        
        const totalAssets = assets.reduce((sum, a) => sum + a.finalBalance, 0);
        const totalLiabilities = liabilities.reduce((sum, l) => sum + l.finalBalance, 0);
        const totalEquityFromAccounts = equity.reduce((sum, e) => sum + e.finalBalance, 0);
        const totalEquity = totalEquityFromAccounts + periodResult;


        setGeneratedBalance({
            assets,
            liabilities,
            equity,
            periodResult,
            totalAssets,
            totalLiabilities,
            totalEquity,
        });
    };

    return (
      <div className="grid gap-6">
        <Card>
            <CardHeader>
            <CardTitle>Balance General</CardTitle>
            <CardDescription>Consulta el balance general de la empresa para un período específico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                    <div className="flex-1">
                        <DateRangePicker date={date} onDateChange={setDate} />
                    </div>
                    <Button onClick={handleGenerate} disabled={loading || !companyId}>
                        {loading ? 'Cargando...' : 'Generar Balance'}
                    </Button>
                </div>
            </CardContent>
        </Card>

        {generatedBalance && (
            <Card>
                <CardHeader>
                     <CardTitle>Balance General</CardTitle>
                     <CardDescription>
                        {date?.from && date.to ? `Para el período del ${format(date.from, "P", { locale: es })} al ${format(date.to, "P", { locale: es })}` : ''}
                     </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                    {/* Activos */}
                    <div>
                        <h3 className="font-bold text-lg mb-2">Activos</h3>
                        <Table>
                            <TableHeader><TableRow><TableHead>Cuenta</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {generatedBalance.assets.map(acc => (
                                    <TableRow key={acc.id}><TableCell>{acc.code} - {acc.name}</TableCell><TableCell className="text-right">${acc.finalBalance.toLocaleString('es-CL')}</TableCell></TableRow>
                                ))}
                            </TableBody>
                            <TableFooterOriginal>
                                <TableRow className="font-bold text-base"><TableCell>Total Activos</TableCell><TableCell className="text-right">${generatedBalance.totalAssets.toLocaleString('es-CL')}</TableCell></TableRow>
                            </TableFooterOriginal>
                        </Table>
                    </div>

                    {/* Pasivos y Patrimonio */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-lg mb-2">Pasivos</h3>
                            <Table>
                                <TableHeader><TableRow><TableHead>Cuenta</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {generatedBalance.liabilities.map(acc => (
                                        <TableRow key={acc.id}><TableCell>{acc.code} - {acc.name}</TableCell><TableCell className="text-right">${acc.finalBalance.toLocaleString('es-CL')}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                                <TableFooterOriginal>
                                    <TableRow className="font-bold"><TableCell>Total Pasivos</TableCell><TableCell className="text-right">${generatedBalance.totalLiabilities.toLocaleString('es-CL')}</TableCell></TableRow>
                                </TableFooterOriginal>
                            </Table>
                        </div>
                        <div>
                             <h3 className="font-bold text-lg mb-2">Patrimonio</h3>
                            <Table>
                                <TableHeader><TableRow><TableHead>Cuenta</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {generatedBalance.equity.map(acc => (
                                        <TableRow key={acc.id}><TableCell>{acc.code} - {acc.name}</TableCell><TableCell className="text-right">${acc.finalBalance.toLocaleString('es-CL')}</TableCell></TableRow>
                                    ))}
                                    <TableRow><TableCell>Resultado del Período</TableCell><TableCell className="text-right">${generatedBalance.periodResult.toLocaleString('es-CL')}</TableCell></TableRow>
                                </TableBody>
                                <TableFooterOriginal>
                                    <TableRow className="font-bold"><TableCell>Total Patrimonio</TableCell><TableCell className="text-right">${generatedBalance.totalEquity.toLocaleString('es-CL')}</TableCell></TableRow>
                                </TableFooterOriginal>
                            </Table>
                        </div>
                         <Table>
                             <TableFooterOriginal>
                                <TableRow className="font-bold text-base bg-muted"><TableCell>Total Pasivo y Patrimonio</TableCell><TableCell className="text-right">${(generatedBalance.totalLiabilities + generatedBalance.totalEquity).toLocaleString('es-CL')}</TableCell></TableRow>
                            </TableFooterOriginal>
                         </Table>
                    </div>
                </CardContent>
                 <CardFooter>
                    <p className={`text-sm font-bold ${generatedBalance.totalAssets === (generatedBalance.totalLiabilities + generatedBalance.totalEquity) ? 'text-green-600' : 'text-destructive'}`}>
                        {generatedBalance.totalAssets === (generatedBalance.totalLiabilities + generatedBalance.totalEquity) ? 'La Ecuación Contable está balanceada.' : 'La Ecuación Contable no está balanceada.'}
                    </p>
                </CardFooter>
            </Card>
        )}
        {!generatedBalance && !loading && (
             <Card>
                <CardHeader>
                    <CardTitle>Balance No Generado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Selecciona un período y haz clic en "Generar Balance" para visualizar el informe.</p>
                </CardContent>
            </Card>
        )}
      </div>
    )
  }
    