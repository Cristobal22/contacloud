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
import { useCollection, useFirestore } from "@/firebase";
import type { Account, Voucher } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableFooterOriginal } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SelectedCompanyContext } from "../layout";
import { collection, query, where } from "firebase/firestore";

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
    const firestore = useFirestore();

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(new Date().getFullYear(), 11, 31),
    });
    
    const [generatedBalance, setGeneratedBalance] = React.useState<BalanceSheetData | null>(null);

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
            setGeneratedBalance(null);
            return;
        }

        const startDate = date.from;
        const endDate = date.to;

        const filteredVouchers = vouchers.filter(v => {
            const voucherDate = new Date(v.date);
            return voucherDate >= startDate && voucherDate <= endDate;
        });

        const balanceMap = new Map<string, { initialBalance: number; debit: number; credit: number; }>();
        
        accounts.forEach(acc => {
            balanceMap.set(acc.code, {
                initialBalance: acc.balance || 0,
                debit: 0,
                credit: 0
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
        
        const accountsWithBalance: AccountWithBalance[] = accounts.map(acc => {
            const mov = balanceMap.get(acc.code)!;
            let finalBalance = mov.initialBalance;

            if (acc.type === 'Activo' || (acc.type === 'Resultado' && mov.debit > mov.credit)) {
                finalBalance += (mov.debit - mov.credit);
            } else {
                finalBalance += (mov.credit - mov.debit);
            }
            
            return {
                ...acc,
                finalBalance
            };
        });

        const finalBalanceMap = new Map(accountsWithBalance.map(acc => [acc.code, acc.finalBalance]));
        const sortedCodes = Array.from(finalBalanceMap.keys()).sort((a,b) => b.length - a.length);

        sortedCodes.forEach(code => {
            let parentCode = '';
            if (code.length > 1) { 
                 if (code.length > 5) parentCode = code.substring(0, 5);
                 else if (code.length === 5) parentCode = code.substring(0, 3);
                 else if (code.length === 3) parentCode = code.substring(0, 1);
            }
            if (parentCode && finalBalanceMap.has(parentCode)) {
                const currentParentBalance = finalBalanceMap.get(parentCode)!;
                finalBalanceMap.set(parentCode, currentParentBalance + finalBalanceMap.get(code)!);
            }
        });

        const finalAccountsWithBalance = accountsWithBalance.map(acc => ({
            ...acc,
            finalBalance: finalBalanceMap.get(acc.code)!
        }));


        const assets = finalAccountsWithBalance.filter(a => a.code.startsWith('1') && a.finalBalance !== 0);
        const liabilities = finalAccountsWithBalance.filter(a => a.code.startsWith('2') && a.finalBalance !== 0);
        const equity = finalAccountsWithBalance.filter(a => a.code.startsWith('3') && a.finalBalance !== 0);

        const incomeAccounts = finalAccountsWithBalance.filter(a => a.code.startsWith('4'));
        const expenseAccounts = finalAccountsWithBalance.filter(a => a.code.startsWith('5') || a.code.startsWith('6'));

        const totalIncome = incomeAccounts.reduce((sum, acc) => sum + acc.finalBalance, 0);
        const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.finalBalance, 0);
        const periodResult = totalIncome - totalExpenses;
        
        const totalAssets = finalAccountsWithBalance.find(a => a.code === '1')?.finalBalance || 0;
        const totalLiabilities = finalAccountsWithBalance.find(a => a.code === '2')?.finalBalance || 0;
        const totalEquityFromAccounts = finalAccountsWithBalance.find(a => a.code === '3')?.finalBalance || 0;
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
                                    <TableRow key={acc.id}><TableCell>{acc.code} - {acc.name}</TableCell><TableCell className="text-right">${Math.round(acc.finalBalance).toLocaleString('es-CL')}</TableCell></TableRow>
                                ))}
                            </TableBody>
                            <TableFooterOriginal>
                                <TableRow className="font-bold text-base"><TableCell>Total Activos</TableCell><TableCell className="text-right">${Math.round(generatedBalance.totalAssets).toLocaleString('es-CL')}</TableCell></TableRow>
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
                                        <TableRow key={acc.id}><TableCell>{acc.code} - {acc.name}</TableCell><TableCell className="text-right">${Math.round(acc.finalBalance).toLocaleString('es-CL')}</TableCell></TableRow>
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
                                        <TableRow key={acc.id}><TableCell>{acc.code} - {acc.name}</TableCell><TableCell className="text-right">${Math.round(acc.finalBalance).toLocaleString('es-CL')}</TableCell></TableRow>
                                    ))}
                                    <TableRow><TableCell>Resultado del Período</TableCell><TableCell className="text-right">${Math.round(generatedBalance.periodResult).toLocaleString('es-CL')}</TableCell></TableRow>
                                </TableBody>
                            </Table>
                        </div>
                         <Table>
                             <TableFooterOriginal>
                                <TableRow className="font-bold text-base bg-muted"><TableCell>Total Pasivo y Patrimonio</TableCell><TableCell className="text-right">${Math.round(generatedBalance.totalLiabilitiesAndEquity).toLocaleString('es-CL')}</TableCell></TableRow>
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
