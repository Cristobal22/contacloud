'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCollection, useFirestore } from '@/firebase';
import type { Purchase, Sale, Account } from '@/lib/types';
import { SelectedCompanyContext } from '../layout';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, doc, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { format, lastDayOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { AccountSearchInput } from '@/components/account-search-input';

export default function TreasuryPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [selectedPurchases, setSelectedPurchases] = React.useState<string[]>([]);
    const [selectedSales, setSelectedSales] = React.useState<string[]>([]);
    const [paymentAccount, setPaymentAccount] = React.useState<string>('1010102'); // Default to 'BANCOS'
    const [isProcessing, setIsProcessing] = React.useState(false);

    const { data: purchases, loading: purchasesLoading } = useCollection<Purchase>({
        path: companyId ? `companies/${companyId}/purchases` : undefined,
        query: companyId ? (c, q, w) => q(c, w('status', '==', 'Contabilizado')) : undefined,
    });

    const { data: sales, loading: salesLoading } = useCollection<Sale>({
        path: companyId ? `companies/${companyId}/sales` : undefined,
        query: companyId ? (c, q, w) => q(c, w('status', '==', 'Contabilizado')) : undefined,
    });
    
    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: companyId ? `companies/${companyId}/accounts` : undefined,
        query: companyId ? (c, q, w) => q(c, w('type', '==', 'Activo')) : undefined,
    });

    const loading = purchasesLoading || salesLoading || accountsLoading;

    const handleSelectPurchase = (id: string, checked: boolean) => {
        setSelectedPurchases(prev => checked ? [...prev, id] : prev.filter(pId => pId !== id));
    };

    const handleSelectSale = (id: string, checked: boolean) => {
        setSelectedSales(prev => checked ? [...prev, id] : prev.filter(sId => sId !== id));
    };

    const handleProcessPayments = async () => {
        if (!firestore || !companyId || !selectedCompany || selectedPurchases.length === 0 || !paymentAccount) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selecciona facturas y una cuenta de pago.'});
            return;
        }
        setIsProcessing(true);

        const batch = writeBatch(firestore);
        const purchasesToPay = purchases?.filter(p => selectedPurchases.includes(p.id)) || [];
        const totalToPay = purchasesToPay.reduce((sum, p) => sum + p.total, 0);

        // Create Egreso Voucher
        const voucherData = {
            date: new Date().toISOString().substring(0, 10),
            type: 'Egreso' as const,
            description: `Pago de ${purchasesToPay.length} factura(s) de compra`,
            status: 'Contabilizado' as const,
            total: totalToPay,
            entries: [
                { id: `entry-debit-${Date.now()}`, account: selectedCompany.purchasesInvoicesPayableAccount!, description: 'Pago a Proveedores', debit: totalToPay, credit: 0 },
                { id: `entry-credit-${Date.now()}`, account: paymentAccount, description: 'Salida de Fondos', debit: 0, credit: totalToPay },
            ],
            companyId,
        };
        const voucherRef = doc(collection(firestore, `companies/${companyId}/vouchers`));
        batch.set(voucherRef, voucherData);

        // Update purchases status
        purchasesToPay.forEach(p => {
            const purchaseRef = doc(firestore, `companies/${companyId}/purchases`, p.id);
            batch.update(purchaseRef, { status: 'Pagado', paymentVoucherId: voucherRef.id });
        });

        try {
            await batch.commit();
            toast({ title: 'Pago Registrado', description: 'Se ha generado el comprobante de egreso y actualizado las facturas.'});
            setSelectedPurchases([]);
            router.push('/dashboard/vouchers');
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `companies/${companyId}`, operation: 'update' }));
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleProcessCollections = async () => {
        if (!firestore || !companyId || !selectedCompany || selectedSales.length === 0 || !paymentAccount) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selecciona facturas y una cuenta de ingreso.'});
            return;
        }
        setIsProcessing(true);

        const batch = writeBatch(firestore);
        const salesToCollect = sales?.filter(s => selectedSales.includes(s.id)) || [];
        const totalToCollect = salesToCollect.reduce((sum, s) => sum + s.total, 0);

        const voucherData = {
            date: new Date().toISOString().substring(0, 10),
            type: 'Ingreso' as const,
            description: `Cobro de ${salesToCollect.length} factura(s) de venta`,
            status: 'Contabilizado' as const,
            total: totalToCollect,
            entries: [
                { id: `entry-debit-${Date.now()}`, account: paymentAccount, description: 'Ingreso de Fondos', debit: totalToCollect, credit: 0 },
                { id: `entry-credit-${Date.now()}`, account: selectedCompany.salesInvoicesReceivableAccount!, description: 'Cobro a Clientes', debit: 0, credit: totalToCollect },
            ],
            companyId,
        };
        const voucherRef = doc(collection(firestore, `companies/${companyId}/vouchers`));
        batch.set(voucherRef, voucherData);

        salesToCollect.forEach(s => {
            const saleRef = doc(firestore, `companies/${companyId}/sales`, s.id);
            batch.update(saleRef, { status: 'Cobrado', collectionVoucherId: voucherRef.id });
        });

        try {
            await batch.commit();
            toast({ title: 'Cobro Registrado', description: 'Se ha generado el comprobante de ingreso y actualizado las facturas.'});
            setSelectedSales([]);
            router.push('/dashboard/vouchers');
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `companies/${companyId}`, operation: 'update' }));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tesorería</CardTitle>
                <CardDescription>Gestiona los pagos a proveedores y los cobros a clientes.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="por-pagar">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="por-pagar">Cuentas por Pagar</TabsTrigger>
                        <TabsTrigger value="por-cobrar">Cuentas por Cobrar</TabsTrigger>
                    </TabsList>
                    <TabsContent value="por-pagar">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Facturas de Compra Pendientes de Pago</CardTitle>
                                        <CardDescription>Selecciona las facturas que deseas pagar.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <AccountSearchInput 
                                            label="Pagar desde:"
                                            value={paymentAccount}
                                            onValueChange={setPaymentAccount}
                                            accounts={accounts?.filter(a => a.code.startsWith('10101')) || []} // Only cash & bank
                                            loading={accountsLoading}
                                        />
                                        <Button onClick={handleProcessPayments} disabled={selectedPurchases.length === 0 || isProcessing}>
                                            {isProcessing ? 'Procesando...' : 'Registrar Pago'}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead className="w-[50px]">Sel.</TableHead><TableHead>Proveedor</TableHead><TableHead>Documento</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {loading && <TableRow><TableCell colSpan={4} className="text-center">Cargando...</TableCell></TableRow>}
                                        {!loading && purchases?.map(p => (
                                            <TableRow key={p.id}><TableCell><Checkbox onCheckedChange={(checked) => handleSelectPurchase(p.id, checked as boolean)} /></TableCell><TableCell>{p.supplier}</TableCell><TableCell>{p.documentType} {p.documentNumber}</TableCell><TableCell className="text-right font-bold">${p.total.toLocaleString('es-CL')}</TableCell></TableRow>
                                        ))}
                                        {!loading && purchases?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center h-24">No hay facturas de compra pendientes de pago.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="por-cobrar">
                         <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Facturas de Venta Pendientes de Cobro</CardTitle>
                                        <CardDescription>Selecciona las facturas que deseas marcar como cobradas.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <AccountSearchInput 
                                            label="Ingresar a:"
                                            value={paymentAccount}
                                            onValueChange={setPaymentAccount}
                                            accounts={accounts?.filter(a => a.code.startsWith('10101')) || []} // Only cash & bank
                                            loading={accountsLoading}
                                        />
                                        <Button onClick={handleProcessCollections} disabled={selectedSales.length === 0 || isProcessing}>
                                             {isProcessing ? 'Procesando...' : 'Registrar Cobro'}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                               <Table>
                                    <TableHeader><TableRow><TableHead className="w-[50px]">Sel.</TableHead><TableHead>Cliente</TableHead><TableHead>Documento</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {loading && <TableRow><TableCell colSpan={4} className="text-center">Cargando...</TableCell></TableRow>}
                                        {!loading && sales?.map(s => (
                                            <TableRow key={s.id}><TableCell><Checkbox onCheckedChange={(checked) => handleSelectSale(s.id, checked as boolean)} /></TableCell><TableCell>{s.customer}</TableCell><TableCell>{s.documentNumber}</TableCell><TableCell className="text-right font-bold">${s.total.toLocaleString('es-CL')}</TableCell></TableRow>
                                        ))}
                                        {!loading && sales?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center h-24">No hay facturas de venta pendientes de cobro.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
