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
import { SelectedCompanyContext } from "../layout";

type BalanceSheetData = {
    assets: AccountWithBalance[];
    liabilities: AccountWithBalance[];
    equity: AccountWithBalance[];
    periodResult: number;
    totalAssets: number;
    totalLiabilitiesAndEquity: number;
};

type AccountWithBalance = Account & { finalBalance: number };

export default function GeneralBalancePage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;

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
        query: companyId ? (collection, query, where) => query(collection(`companies/${companyId}/vouchers`), where('status', '==', 'Contabilizado')) : undefined,
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
            return voucherDate >= startDate && voucherDate <= endDate;
        });

        const balanceMap = new Map<string, { initialBalance: number; debit: number; credit: number; finalBalance: number }>();
        
        accounts.forEach(acc => {
            balanceMap.set(acc.code, {
                initialBalance: acc.balance || 0,
                debit: 0,
                credit: 0,
                finalBalance: acc.balance || 0
            });
        });

        filteredVouchers.forEach(voucher => {
            voucher.entries.forEach(entry => {
                if (balanceMap.has(entry.account)) {
                    const mov = balanceMap.get(entry.account)!;
                    mov.debit += Number(entry.debit) || 0;
                    mov.credit += Number(entry.credit) || 0;
                }
            });
        });

        balanceMap.forEach((mov, code) => {
            const accountInfo = accounts.find(a => a.code === code);
            if (accountInfo?.type === 'Activo' || accountInfo?.type === 'Resultado') {
                mov.finalBalance = mov.initialBalance + mov.debit - mov.credit;
            } else { 
                mov.finalBalance = mov.initialBalance + mov.credit - mov.debit;
            }
        });
        
        const sortedCodes = Array.from(balanceMap.keys()).sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));

        for (let i = sortedCodes.length - 1; i >= 0; i--) {
            const code = sortedCodes[i];
            const parts = code.split('.');
            if (parts.length > 1) {
                const parentCode = parts.slice(0, -1).join('.');
                if (balanceMap.has(parentCode)) {
                    balanceMap.get(parentCode)!.finalBalance += balanceMap.get(code)!.finalBalance;
                }
            }
        }
        
        const accountsWithBalance: AccountWithBalance[] = sortedCodes.map(code => ({
            ...accounts.find(a => a.code === code)!,
            finalBalance: balanceMap.get(code)!.finalBalance
        }));

        const assets = accountsWithBalance.filter(a => a.code.startsWith('1') && a.finalBalance !== 0);
        const liabilities = accountsWithBalance.filter(a => a.code.startsWith('2') && a.finalBalance !== 0);
        const equity = accountsWithBalance.filter(a => a.code.startsWith('3') && a.finalBalance !== 0);

        const income = accountsWithBalance.find(a => a.code === '4')?.finalBalance || 0;
        const costs = accountsWithBalance.find(a => a.code === '5')?.finalBalance || 0;
        const expenses = accountsWithBalance.find(a => a.code === '6')?.finalBalance || 0;
        const periodResult = income - costs - expenses;
        
        const totalAssets = accountsWithBalance.find(a => a.code === '1')?.finalBalance || 0;
        const totalLiabilities = accountsWithBalance.find(a => a.code === '2')?.finalBalance || 0;
        const totalEquityFromAccounts = accountsWithBalance.find(a => a.code === '3')?.finalBalance || 0;
        const totalLiabilitiesAndEquity = totalLiabilities + totalEquityFromAccounts + periodResult;


        setGeneratedBalance({
            assets,
            liabilities,
            equity,
            periodResult,
            totalAssets,
            totalLiabilitiesAndEquity,
        });
    };

    return (
      <div className="grid gap-6">
        <Card>
            <CardHeader>
            <CardTitle>Balance General</CardTitle>
            <CardDescription>Consulta el balance general de la empresa para un período específico. Solo se considerarán comprobantes contabilizados.</CardDescription>
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
                            </Table>
                        </div>
                         <Table>
                             <TableFooterOriginal>
                                <TableRow className="font-bold text-base bg-muted"><TableCell>Total Pasivo y Patrimonio</TableCell><TableCell className="text-right">${(generatedBalance.totalLiabilitiesAndEquity).toLocaleString('es-CL')}</TableCell></TableRow>
                            </TableFooterOriginal>
                         </Table>
                    </div>
                </CardContent>
                 <CardFooter>
                    <p className={`text-sm font-bold ${Math.round(generatedBalance.totalAssets) === Math.round(generatedBalance.totalLiabilitiesAndEquity) ? 'text-green-600' : 'text-destructive'}`}>
                        {Math.round(generatedBalance.totalAssets) === Math.round(generatedBalance.totalLiabilitiesAndEquity) ? 'La Ecuación Contable está balanceada.' : 'La Ecuación Contable no está balanceada.'}
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
