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
  import { Upload, ArrowLeft, CheckCircle2 } from "lucide-react"
  import { Input } from '@/components/ui/input';
  import { useCollection } from '@/firebase';
  import type { Voucher } from '@/lib/types';
  import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
  import { differenceInDays, parseISO } from 'date-fns';
  import { cn } from '@/lib/utils';
  import { ScrollArea } from '@/components/ui/scroll-area';
import { SelectedCompanyContext } from '../layout';

  type BankTransaction = {
    id: string;
    date: string;
    description: string;
    amount: number;
    isDeposit: boolean;
    matched: boolean;
  }
  
  type AccountingTransaction = {
    id: string;
    date: string;
    description: string;
    amount: number;
    isDeposit: boolean;
    matched: boolean;
  }

  export default function BankReconciliationPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [fileName, setFileName] = React.useState<string | null>(null);
    const [isReconciling, setIsReconciling] = React.useState(false);

    const [bankTransactions, setBankTransactions] = React.useState<BankTransaction[]>([]);
    const [accountingTransactions, setAccountingTransactions] = React.useState<AccountingTransaction[]>([]);

    const [selectedBankTx, setSelectedBankTx] = React.useState<BankTransaction | null>(null);
    const [selectedAccountTx, setSelectedAccountTx] = React.useState<AccountingTransaction | null>(null);

    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({ 
      path: `companies/${companyId}/vouchers`,
      companyId: companyId 
    });


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            setFile(selectedFile);
            setFileName(selectedFile.name);
        } else {
            setFile(null);
            setFileName(null);
        }
    };
    
    const handleStartReconciliation = () => {
        if (!file || !vouchers) return;

        // Process accounting transactions from vouchers
        const processedVouchers = vouchers
            .filter(v => (v.type === 'Ingreso' || v.type === 'Egreso') && v.status === 'Contabilizado')
            .map(v => ({
                id: v.id,
                date: v.date,
                description: v.description,
                amount: v.total,
                isDeposit: v.type === 'Ingreso',
                matched: false,
            }));
        
        // Process bank transactions from CSV
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').slice(1); 
            const transactions = rows.map((row, index) => {
                const columns = row.split(',');
                if (columns.length < 3) return null;
                const amount = parseFloat(columns[2]) || 0;
                return {
                    id: `bank-${index}`,
                    date: columns[0],
                    description: columns[1],
                    amount: Math.abs(amount),
                    isDeposit: amount >= 0,
                    matched: false,
                };
            }).filter(Boolean) as BankTransaction[];

            // Auto-matching logic
            const matchedVouchers = new Set<string>();
            const autoMatchedBankTxs = transactions.map(bankTx => {
                const potentialMatch = processedVouchers.find(accTx => 
                    !matchedVouchers.has(accTx.id) &&
                    accTx.amount === bankTx.amount &&
                    Math.abs(differenceInDays(parseISO(accTx.date), parseISO(bankTx.date))) <= 5
                );
                if (potentialMatch) {
                    matchedVouchers.add(potentialMatch.id);
                    return { ...bankTx, matched: true };
                }
                return bankTx;
            });

            const autoMatchedAccTxs = processedVouchers.map(accTx => 
                matchedVouchers.has(accTx.id) ? { ...accTx, matched: true } : accTx
            );

            setBankTransactions(autoMatchedBankTxs);
            setAccountingTransactions(autoMatchedAccTxs);
            setIsReconciling(true);
        };
        reader.readAsText(file);
    };

    const handleManualMatch = () => {
        if (!selectedBankTx || !selectedAccountTx) return;

        setBankTransactions(bankTransactions.map(tx => tx.id === selectedBankTx.id ? {...tx, matched: true} : tx));
        setAccountingTransactions(accountingTransactions.map(tx => tx.id === selectedAccountTx.id ? {...tx, matched: true} : tx));

        setSelectedBankTx(null);
        setSelectedAccountTx(null);
    }

    const handleFinishReconciliation = () => {
        setIsReconciling(false);
        setFile(null);
        setFileName(null);
        setBankTransactions([]);
        setAccountingTransactions([]);
        setSelectedBankTx(null);
        setSelectedAccountTx(null);
    };
    
    const bankBalance = bankTransactions.reduce((acc, tx) => acc + (tx.isDeposit ? tx.amount : -tx.amount), 0);
    const accountingBalance = accountingTransactions.reduce((acc, tx) => acc + (tx.isDeposit ? tx.amount : -tx.amount), 0);
    const matchedBankTxs = bankTransactions.filter(tx => tx.matched).length;
    const matchedAccTxs = accountingTransactions.filter(tx => tx.matched).length;

    if (isReconciling) {
        return (
            <div className="grid gap-6">
                 <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                           <Button variant="outline" size="icon" onClick={handleFinishReconciliation}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                           <div>
                                <CardTitle>Conciliando Movimientos</CardTitle>
                                <CardDescription>Compara los movimientos de tu banco con tus registros contables.</CardDescription>
                           </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Saldo según Banco</p>
                            <p className="text-lg font-bold">${bankBalance.toLocaleString('es-CL')}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Saldo según Contabilidad</p>
                            <p className="text-lg font-bold">${accountingBalance.toLocaleString('es-CL')}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Movimientos Conciliados</p>
                            <p className="text-lg font-bold">{Math.max(matchedBankTxs, matchedAccTxs)}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-3 gap-6 items-start">
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Movimientos Bancarios</CardTitle>
                            <CardDescription className="text-xs">{bankTransactions.length - matchedBankTxs} pendientes</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ScrollArea className="h-[400px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bankTransactions.filter(tx => !tx.matched).map((tx) => (
                                        <TableRow 
                                            key={tx.id} 
                                            onClick={() => setSelectedBankTx(tx)}
                                            className={cn("cursor-pointer", selectedBankTx?.id === tx.id && "bg-muted")}
                                        >
                                            <TableCell>{new Date(tx.date).toLocaleDateString('es-CL')}<br/><span className="text-xs text-muted-foreground truncate">{tx.description}</span></TableCell>
                                            <TableCell className={cn("text-right", tx.isDeposit ? 'text-green-600' : 'text-destructive')}>
                                                {tx.isDeposit ? '+' : '-'} ${tx.amount.toLocaleString('es-CL')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                           </ScrollArea>
                        </CardContent>
                    </Card>

                    <div className="col-span-1 flex flex-col items-center justify-center gap-4 h-full">
                        <Card className="w-full text-center p-4">
                            <h3 className="font-semibold">Conciliación Manual</h3>
                            <p className="text-sm text-muted-foreground mb-4">Selecciona un movimiento de cada lado para conciliarlos.</p>
                            <Button onClick={handleManualMatch} disabled={!selectedBankTx || !selectedAccountTx}>
                                <CheckCircle2 className="mr-2 h-4 w-4"/> Conciliar Seleccionados
                            </Button>
                        </Card>
                        <Card className="w-full text-center p-4">
                            <h3 className="font-semibold">Conciliados Automáticamente</h3>
                             <p className="text-2xl font-bold">{Math.max(matchedBankTxs, matchedAccTxs)}</p>
                             <p className="text-sm text-muted-foreground">Movimientos</p>
                        </Card>
                    </div>

                     <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Registros Contables</CardTitle>
                            <CardDescription className="text-xs">{accountingTransactions.length - matchedAccTxs} pendientes</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ScrollArea className="h-[400px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {accountingTransactions.filter(tx => !tx.matched).map(tx => (
                                         <TableRow 
                                            key={tx.id} 
                                            onClick={() => setSelectedAccountTx(tx)}
                                            className={cn("cursor-pointer", selectedAccountTx?.id === tx.id && "bg-muted")}
                                        >
                                            <TableCell>{new Date(tx.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}<br/><span className="text-xs text-muted-foreground truncate">{tx.description}</span></TableCell>
                                            <TableCell className={cn("text-right", tx.isDeposit ? 'text-green-600' : 'text-destructive')}>
                                                 {tx.isDeposit ? '+' : '-'} ${tx.amount.toLocaleString('es-CL')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                           </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
                 <CardFooter className="flex justify-end">
                    <Button onClick={handleFinishReconciliation}>Finalizar Conciliación</Button>
                </CardFooter>
            </div>
        )
    }
    
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Conciliación Bancaria</CardTitle>
                <CardDescription>Compara los movimientos de tu banco con tus registros contables.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-medium mb-2">Cargar Cartola Bancaria</h3>
                            <div className="flex items-center gap-2">
                                <Input id="file-upload" type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".csv"/>
                                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Cargar Archivo
                                </Button>
                                {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Sube el archivo de tu cartola bancaria en formato CSV (fecha,descripción,monto).</p>
                        </div>
                        <Button onClick={handleStartReconciliation} disabled={!file || !companyId || vouchersLoading}>
                            {vouchersLoading ? 'Cargando datos...' : 'Iniciar Conciliación'}
                        </Button>
                    </div>
                     {!companyId && (
                         <p className="text-sm text-destructive mt-2">Por favor, selecciona una empresa para poder iniciar la conciliación.</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Estado de Conciliación</CardTitle>
                    <CardDescription>Aún no se ha realizado ninguna conciliación.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Utiliza el cargador de archivos para iniciar tu primera conciliación.</p>
                </CardContent>
            </Card>
      </div>
    )
  }
