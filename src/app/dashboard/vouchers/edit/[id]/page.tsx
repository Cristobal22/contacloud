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
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function VoucherEditPage() {
    const params = useParams();
    const id = params.id as string;
    const isNew = id === 'new';
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const router = useRouter();

    const voucherRef = !isNew && firestore && companyId ? doc(firestore, `companies/${companyId}/vouchers`, id) : null;
    const { data: existingVoucher, loading: voucherLoading } = useDoc<Voucher>(voucherRef);

    const [voucher, setVoucher] = React.useState<Partial<Voucher> | null>(null);
    const [entries, setEntries] = React.useState<Partial<VoucherEntry>[]>([]);
    const [dateError, setDateError] = React.useState<string | null>(null);


    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: companyId ? `companies/${companyId}/accounts` : undefined,
        companyId: companyId,
    });
    
    React.useEffect(() => {
        if (isNew) {
             setVoucher({
                date: new Date().toISOString().substring(0, 10),
                type: 'Traspaso',
                description: '',
                status: 'Borrador',
                total: 0,
                entries: [],
                companyId: companyId,
            });
            setEntries([{ id: `new-entry-${Date.now()}`, account: '', description: '', debit: 0, credit: 0 }]);
        } else if (existingVoucher) {
            setVoucher(existingVoucher);
            setEntries(existingVoucher.entries);
        }
    }, [isNew, existingVoucher, companyId]);

    React.useEffect(() => {
        if (voucher?.date) {
            validateDate(voucher.date);
        }
    }, [voucher?.date, selectedCompany]);


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

     const validateDate = (dateString: string) => {
        if (!selectedCompany?.periodStartDate || !selectedCompany?.periodEndDate) {
            setDateError('La empresa no tiene un período de trabajo configurado.');
            return;
        }
        const selectedDate = new Date(dateString + 'T00:00:00'); // Ensure local time interpretation
        const startDate = new Date(selectedCompany.periodStartDate + 'T00:00:00');
        const endDate = new Date(selectedCompany.periodEndDate + 'T00:00:00');

        if (selectedDate < startDate || selectedDate > endDate) {
            setDateError('La fecha está fuera del período de trabajo activo.');
        } else {
            setDateError(null);
        }
    };


     const handleHeaderChange = (field: keyof Omit<Voucher, 'id' | 'total' | 'entries' | 'companyId'>, value: string) => {
        if (voucher) {
            if (field === 'date') {
                validateDate(value);
            }
            setVoucher({ ...voucher, [field]: value });
        }
    };

    const totalDebit = entries.reduce((sum, entry) => sum + Number(entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + Number(entry.credit || 0), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;
    const canSave = isBalanced && !dateError && entries.length > 1 && voucher?.description && entries.every(e => e.account);
    
    const handleSaveClick = () => {
       if (!firestore || !companyId || !voucher || !canSave) return;

        const collectionPath = `companies/${companyId}/vouchers`;
        const collectionRef = collection(firestore, collectionPath);
        
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
          companyId: companyId
        };

        router.push('/dashboard/vouchers');
        
        if (isNew) {
            addDoc(collectionRef, voucherData)
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: collectionPath,
                        operation: 'create',
                        requestResourceData: voucherData,
                    }));
                });
        } else {
            const docRef = doc(firestore, collectionPath, id);
            setDoc(docRef, voucherData, { merge: true })
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: voucherData,
                    }));
                });
        }
    };
    
    if (voucherLoading && !isNew) return <p>Cargando comprobante...</p>;
    if (!isNew && !voucher && !voucherLoading) return <p>No se encontró el comprobante.</p>;
    if (!voucher) return null;

    const periodIsDefined = selectedCompany?.periodStartDate && selectedCompany?.periodEndDate;


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
                                        {periodIsDefined 
                                            ? `Período de trabajo activo: ${format(new Date(selectedCompany.periodStartDate + 'T00:00:00'), 'P', { locale: es })} - ${format(new Date(selectedCompany.periodEndDate + 'T00:00:00'), 'P', { locale: es })}`
                                            : "Define el período de trabajo en la configuración de la empresa."
                                        }
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
                                disabled={!periodIsDefined}
                            />
                            {dateError && <p className="text-sm text-destructive">{dateError}</p>}
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="voucher-type">Tipo</Label>
                            <Select value={voucher.type} onValueChange={(value) => handleHeaderChange('type', value as 'Ingreso' | 'Egreso' | 'Traspaso')} disabled={!periodIsDefined}>
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
                                disabled={!periodIsDefined}
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
                                            disabled={!periodIsDefined}
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
                                            disabled={!periodIsDefined}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="text-right"
                                            value={entry.debit}
                                            onChange={(e) => handleEntryChange(entry.id!, 'debit', parseFloat(e.target.value) || 0)}
                                            disabled={!periodIsDefined}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="text-right"
                                            value={entry.credit}
                                            onChange={(e) => handleEntryChange(entry.id!, 'credit', parseFloat(e.target.value) || 0)}
                                            disabled={!periodIsDefined}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveEntry(entry.id!)} disabled={!periodIsDefined}>
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
                                     <Button size="sm" variant="outline" className="gap-1" onClick={handleAddEntry} disabled={!periodIsDefined}>
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
