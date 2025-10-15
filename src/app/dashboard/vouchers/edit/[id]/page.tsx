
'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from "@/components/ui/table";
import { PlusCircle, Trash2, ArrowLeft } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { useCollection, useDoc, useFirestore } from '@/firebase';
import type { Voucher, VoucherEntry, Account } from '@/lib/types';
import { SelectedCompanyContext } from '@/app/dashboard/layout';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VoucherEditPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const isNew = id === 'new';
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const firestore = useFirestore();
    const router = useRouter();

    const voucherRef = !isNew && firestore && selectedCompany ? doc(firestore, `companies/${selectedCompany.id}/vouchers`, id) : null;
    const { data: existingVoucher, loading: voucherLoading } = useDoc<Voucher>(voucherRef);

    const [voucher, setVoucher] = React.useState<Partial<Voucher> | null>(null);
    const [entries, setEntries] = React.useState<Partial<VoucherEntry>[]>([]);

    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: selectedCompany ? `companies/${selectedCompany.id}/accounts` : undefined,
        companyId: selectedCompany?.id,
    });
    
    React.useEffect(() => {
        if (isNew) {
             setVoucher({
                date: new Date().toISOString().substring(0, 10),
                type: 'Traspaso',
                description: '',
                status: 'Borrador',
                total: 0,
                entries: []
            });
            setEntries([{ id: `new-entry-${Date.now()}`, account: '', description: '', debit: 0, credit: 0 }]);
        } else if (existingVoucher) {
            setVoucher(existingVoucher);
            setEntries(existingVoucher.entries);
        }
    }, [isNew, existingVoucher]);

    const handleAddEntry = () => {
        setEntries([
            ...entries,
            { id: `new-entry-${Date.now()}`, account: '', description: '', debit: 0, credit: 0 }
        ]);
    };

    const handleRemoveEntry = (entryId: string) => {
        setEntries(entries.filter(entry => entry.id !== entryId));
    };

    const handleEntryChange = (entryId: string, field: keyof VoucherEntry, value: string | number) => {
        const newEntries = entries.map(entry => {
            if (entry.id === entryId) {
                const updatedEntry = { ...entry, [field]: value };
                if (field === 'debit' && Number(value) > 0) updatedEntry.credit = 0;
                if (field === 'credit' && Number(value) > 0) updatedEntry.debit = 0;
                return updatedEntry;
            }
            return entry;
        });
        setEntries(newEntries);
    };

     const handleHeaderChange = (field: keyof Omit<Voucher, 'id' | 'total' | 'entries' | 'companyId'>, value: string) => {
        if (voucher) {
            setVoucher({ ...voucher, [field]: value });
        }
    };

    const totalDebit = entries.reduce((sum, entry) => sum + Number(entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + Number(entry.credit || 0), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;
    const canSave = isBalanced && entries.length > 1 && voucher?.description && entries.every(e => e.account);
    
    const handleSaveClick = async () => {
       if (!firestore || !selectedCompany || !voucher || !canSave) return;

        const collectionRef = collection(firestore, `companies/${selectedCompany.id}/vouchers`);
        
        const voucherData = {
          date: voucher.date || new Date().toISOString().substring(0, 10),
          type: voucher.type || 'Traspaso',
          description: voucher.description || '',
          status: 'Borrador',
          total: totalDebit,
          entries: entries.map(e => ({
            account: e.account || '',
            description: e.description || '',
            debit: e.debit || 0,
            credit: e.credit || 0,
            id: e.id && !e.id.startsWith('new-') ? e.id : `entry-${Date.now()}-${Math.random()}`,
          })),
          companyId: selectedCompany.id
        };

        try {
            if (isNew) {
                await addDoc(collectionRef, voucherData);
            } else {
                const docRef = doc(firestore, `companies/${selectedCompany.id}/vouchers`, id);
                await setDoc(docRef, voucherData, { merge: true });
            }
            router.push('/dashboard/vouchers');
        } catch (error) {
            console.error("Error saving voucher:", error);
        }
    };
    
    if (voucherLoading && !isNew) return <p>Cargando comprobante...</p>;
    if (!isNew && !voucher && !voucherLoading) return <p>No se encontró el comprobante.</p>;
    if (!voucher) return null;


    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/dashboard/vouchers"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>
                                        {isNew ? 'Nuevo Comprobante' : `Editar Comprobante #${id.substring(0, 6)}`}
                                    </CardTitle>
                                    <CardDescription>
                                        Gestiona los detalles y asientos del comprobante contable.
                                    </CardDescription>
                                </div>
                                <Badge variant={voucher.status === 'Contabilizado' ? 'outline' : 'secondary'}>
                                    {voucher.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="voucher-date">Fecha</Label>
                            <Input 
                                id="voucher-date" 
                                type="date" 
                                value={voucher.date || ''}
                                onChange={(e) => handleHeaderChange('date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="voucher-type">Tipo</Label>
                            <Select value={voucher.type} onValueChange={(value) => handleHeaderChange('type', value as 'Ingreso' | 'Egreso' | 'Traspaso')}>
                                <SelectTrigger id="voucher-type">
                                    <SelectValue placeholder="Selecciona un tipo"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ingreso">Ingreso</SelectItem>
                                    <SelectItem value="Egreso">Egreso</SelectItem>
                                    <SelectItem value="Traspaso">Traspaso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="voucher-description">Descripción</Label>
                            <Input 
                                id="voucher-description"
                                value={voucher.description || ''}
                                onChange={(e) => handleHeaderChange('description', e.target.value)}
                                placeholder="Ej: Pago de factura #101"
                            />
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">Cuenta Contable</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="w-[180px] text-right">Debe</TableHead>
                                <TableHead className="w-[180px] text-right">Haber</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map(entry => (
                                <TableRow key={entry.id}>
                                    <TableCell>
                                        <Select
                                            value={entry.account}
                                            onValueChange={(value) => handleEntryChange(entry.id!, 'account', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona una cuenta" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accountsLoading && <SelectItem value="loading" disabled>Cargando cuentas...</SelectItem>}
                                                {accounts?.map(account => (
                                                    <SelectItem key={account.id} value={account.code}>
                                                        {account.code} - {account.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            value={entry.description}
                                            onChange={(e) => handleEntryChange(entry.id!, 'description', e.target.value)}
                                            placeholder="Descripción del asiento"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="text-right"
                                            value={entry.debit}
                                            onChange={(e) => handleEntryChange(entry.id!, 'debit', parseFloat(e.target.value) || 0)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="text-right"
                                            value={entry.credit}
                                            onChange={(e) => handleEntryChange(entry.id!, 'credit', parseFloat(e.target.value) || 0)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveEntry(entry.id!)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {entries.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No hay asientos contables. Agrega uno para empezar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={2}>
                                     <Button size="sm" variant="outline" className="gap-1" onClick={handleAddEntry}>
                                        <PlusCircle className="h-4 w-4" />
                                        Agregar Línea
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right font-bold text-lg">${totalDebit.toLocaleString('es-CL')}</TableCell>
                                <TableCell className="text-right font-bold text-lg">${totalCredit.toLocaleString('es-CL')}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell colSpan={2}></TableCell>
                                <TableCell className="text-right font-bold" colSpan={2}>
                                    {!isBalanced || totalDebit === 0 ? (
                                         <span className="text-destructive">Diferencia: ${(totalDebit - totalCredit).toLocaleString('es-CL')}</span>
                                    ): (
                                        <span className="text-green-600">Comprobante Cuadrado</span>
                                    )}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-6">
                     <Button variant="outline" asChild>
                        <Link href="/dashboard/vouchers">Cancelar</Link>
                    </Button>
                    <Button disabled={!canSave} onClick={handleSaveClick}>Guardar Comprobante</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
