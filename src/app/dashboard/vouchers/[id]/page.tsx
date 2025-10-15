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
import { PlusCircle, Trash2 } from "lucide-react";
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
import { useCollection } from '@/firebase';
import type { Voucher, VoucherEntry, Account } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { SelectedCompanyContext } from '../../layout';

interface VoucherDetailProps {
    voucherData?: Voucher | null;
    onSave: (voucher: Voucher, entries: VoucherEntry[]) => void;
    onCancel: () => void;
}

export default function VoucherDetailForm({ voucherData, onSave, onCancel }: VoucherDetailProps) {
    const isNew = !voucherData?.id || voucherData.id.startsWith('new');
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};

    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: selectedCompany ? `companies/${selectedCompany.id}/accounts` : undefined,
        companyId: selectedCompany?.id,
    });

    const [voucher, setVoucher] = React.useState<Voucher | null>(null);
    const [entries, setEntries] = React.useState<VoucherEntry[]>([]);
     const router = useRouter();

    React.useEffect(() => {
        if (voucherData) {
            setVoucher(voucherData);
             if (isNew) {
                setEntries([]);
            } else {
                // Example entries for a non-new voucher
                 setEntries([
                    { id: Date.now() + 1, account: '1101-01', description: 'Inicio de actividades', debit: voucherData.total, credit: 0 },
                    { id: Date.now() + 2, account: '3101-01', description: 'Aporte inicial', debit: 0, credit: voucherData.total },
                ]);
            }
        }
    }, [voucherData, isNew]);

    const handleAddEntry = () => {
        setEntries([
            ...entries,
            { id: Date.now(), account: '', description: '', debit: 0, credit: 0 }
        ]);
    };

    const handleRemoveEntry = (entryId: number) => {
        setEntries(entries.filter(entry => entry.id !== entryId));
    };

    const handleEntryChange = (entryId: number, field: keyof VoucherEntry, value: string | number) => {
        const newEntries = entries.map(entry => {
            if (entry.id === entryId) {
                if (field === 'debit' || field === 'credit') {
                    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0 : value;
                    return { ...entry, [field]: numericValue };
                }
                return { ...entry, [field]: value };
            }
            return entry;
        });
        setEntries(newEntries);
    };

     const handleHeaderChange = (field: keyof Omit<Voucher, 'id' | 'total'>, value: string) => {
        if (voucher) {
            setVoucher({ ...voucher, [field]: value });
        }
    };

    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;
    const canSave = isBalanced && entries.length > 1 && voucher?.description;
    
    const handleSaveClick = () => {
        if (voucher && canSave) {
            onSave({ ...voucher, total: totalDebit }, entries);
        }
    };

    if (!voucher) {
        return (
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Cargando...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Buscando detalles del comprobante...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }


    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>
                                {isNew ? 'Nuevo Comprobante' : `Editar Comprobante #${voucher.id.substring(0, 6)}`}
                            </CardTitle>
                            <CardDescription>
                                Gestiona los detalles y asientos del comprobante contable.
                            </CardDescription>
                        </div>
                        <Badge variant={voucher.status === 'Posteado' ? 'outline' : 'secondary'}>
                            {voucher.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3 mb-8">
                        <div className="space-y-2">
                            <Label htmlFor="voucher-date">Fecha</Label>
                            <Input 
                                id="voucher-date" 
                                type="date" 
                                value={voucher.date}
                                onChange={(e) => handleHeaderChange('date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="voucher-type">Tipo</Label>
                            <Select value={voucher.type} onValueChange={(value) => handleHeaderChange('type', value)}>
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
                                value={voucher.description}
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
                                            onValueChange={(value) => handleEntryChange(entry.id, 'account', value)}
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
                                            onChange={(e) => handleEntryChange(entry.id, 'description', e.target.value)}
                                            placeholder="Descripción del asiento"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="text-right"
                                            value={entry.debit}
                                            onChange={(e) => handleEntryChange(entry.id, 'debit', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="text-right"
                                            value={entry.credit}
                                            onChange={(e) => handleEntryChange(entry.id, 'credit', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveEntry(entry.id)}>
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
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button disabled={!canSave} onClick={handleSaveClick}>Guardar Comprobante</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
