'use client';
import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, BookOpen, AlertCircle } from "lucide-react"
import { SelectedCompanyContext } from "../../layout";
import { useFirestore, useCollection } from "@/firebase";
import { doc, updateDoc, collection, addDoc, writeBatch, Timestamp, getDocs, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { format, endOfYear, startOfYear, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Account, Voucher, VoucherEntry } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

export default function AnnualClosingPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [year, setYear] = React.useState(new Date().getFullYear());
    const currentYear = new Date().getFullYear();

    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: companyId ? `companies/${companyId}/accounts` : undefined,
    });
    
    const vouchersQuery = React.useMemo(() => {
        if (!firestore || !companyId) return null;
        return query(
            collection(firestore, `companies/${companyId}/vouchers`),
            where('status', '==', 'Contabilizado')
        );
    }, [firestore, companyId]);

    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({ query: vouchersQuery });

    const loading = accountsLoading || vouchersLoading;

    const calculateBalances = React.useCallback(() => {
        if (!accounts || !vouchers) return new Map();

        const yearStartDate = startOfYear(new Date(year, 0, 1));
        const yearEndDate = endOfYear(new Date(year, 11, 31));

        const relevantVouchers = vouchers.filter(v => {
            const voucherDate = parseISO(v.date);
            return voucherDate >= yearStartDate && voucherDate <= yearEndDate;
        });
        
        const balances = new Map<string, number>();
        accounts.forEach(acc => balances.set(acc.code, acc.balance));

        relevantVouchers.forEach(v => {
            v.entries.forEach(entry => {
                const currentBalance = balances.get(entry.account) || 0;
                const accountType = accounts.find(a => a.code === entry.account)?.type;
                if (accountType === 'Activo' || accountType === 'Resultado') {
                     balances.set(entry.account, currentBalance + entry.debit - entry.credit);
                } else {
                     balances.set(entry.account, currentBalance + entry.credit - entry.debit);
                }
            });
        });
        return balances;
    }, [accounts, vouchers, year]);

    const handleGenerateClosingVoucher = async () => {
        if (!accounts || !selectedCompany || !firestore) return;

        setIsProcessing(true);

        const balances = calculateBalances();
        const resultAccounts = accounts.filter(a => a.type === 'Resultado');
        
        const entries: Omit<VoucherEntry, 'id'>[] = [];
        let netResult = 0;

        resultAccounts.forEach(acc => {
            const balance = balances.get(acc.code) || 0;
            if (balance === 0) return;
            // Ingresos (saldo acreedor) se debitan para saldar
            if (acc.code.startsWith('4')) {
                entries.push({ account: acc.code, description: `Saldo Cierre ${acc.name}`, debit: balance, credit: 0 });
                netResult -= balance;
            } 
            // Egresos (saldo deudor) se acreditan para saldar
            else {
                entries.push({ account: acc.code, description: `Saldo Cierre ${acc.name}`, debit: 0, credit: balance });
                netResult += balance;
            }
        });

        if (entries.length === 0) {
            toast({ title: 'Sin movimiento', description: 'No hay cuentas de resultado con saldo para cerrar.' });
            setIsProcessing(false);
            return;
        }

        const profitAccountCode = selectedCompany.profitAccount || '30203'; // 'Resultado del Ejercicio'
        if (netResult > 0) { // Pérdida
            entries.push({ account: profitAccountCode, description: `Pérdida del Ejercicio ${year}`, debit: netResult, credit: 0 });
        } else { // Ganancia
            entries.push({ account: profitAccountCode, description: `Utilidad del Ejercicio ${year}`, debit: 0, credit: -netResult });
        }

        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);

        const voucherData = {
            date: format(endOfYear(new Date(year, 11, 31)), 'yyyy-MM-dd'),
            type: 'Traspaso' as const,
            description: `Comprobante de Cierre Ejercicio ${year}`,
            status: 'Contabilizado' as const,
            total: totalDebit,
            entries,
            companyId,
        };

        try {
            await addDoc(collection(firestore, `companies/${companyId}/vouchers`), voucherData);
            toast({ title: 'Cierre Generado', description: `Se creó el comprobante de cierre para el año ${year}.` });
            router.push('/dashboard/vouchers');
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `companies/${companyId}/vouchers`, operation: 'create' }));
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
      <div className="space-y-6">
        <Card>
            <CardHeader>
            <CardTitle>Cierre Anual</CardTitle>
            <CardDescription>Genera los asientos de cierre de fin de año y prepara la apertura del siguiente período.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed p-8 text-center max-w-2xl mx-auto">
                    <Lock className="h-12 w-12 text-primary"/>
                    <h3 className="text-lg font-semibold">Proceso de Cierre y Apertura para <span className="text-primary">{selectedCompany?.name || '...'}</span></h3>
                    
                    <div className="space-y-2 w-full max-w-xs">
                        <Label htmlFor="year-select">Selecciona el año a cerrar</Label>
                        <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
                            <SelectTrigger id="year-select"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Alert>
                        <BookOpen className="h-4 w-4" />
                        <AlertTitle>Pasos del Proceso</AlertTitle>
                        <AlertDescription className="text-left">
                            <ol className="list-decimal list-inside space-y-1">
                                <li><b>1. Cierre Anual:</b> Saldará las cuentas de resultado y transferirá la utilidad o pérdida al patrimonio.</li>
                                <li><b>2. Apertura Anual:</b> Creará el asiento inicial para el próximo año con los saldos de activo, pasivo y patrimonio. (Función Próximamente).</li>
                            </ol>
                        </AlertDescription>
                    </Alert>

                     <Button 
                        onClick={handleGenerateClosingVoucher}
                        disabled={!companyId || loading || isProcessing}
                        className="w-full"
                    >
                        {loading ? "Cargando..." : (isProcessing ? "Procesando Cierre..." : `Generar Asiento de Cierre ${year}`)}
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Asiento de Apertura</CardTitle>
                <CardDescription>Genera el comprobante de apertura para el siguiente período fiscal.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">Esta funcionalidad estará disponible próximamente.</p>
                    <Button disabled>Generar Asiento de Apertura {year + 1}</Button>
                </div>
            </CardContent>
        </Card>
      </div>
    )
  }
