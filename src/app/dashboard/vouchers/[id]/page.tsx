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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { mockVouchers, mockAccounts } from '@/lib/data';
import { useParams } from 'next/navigation';

interface VoucherEntry {
    id: number;
    account: string;
    description: string;
    debit: number;
    credit: number;
}

export default function VoucherDetailPage() {
    const params = useParams();
    const { id } = params;
    const isNew = id === 'new';

    const voucher = mockVouchers.find(v => v.id === id) || {
        id: 'new',
        date: new Date().toISOString().substring(0, 10),
        type: 'Traspaso',
        description: 'Nuevo Comprobante',
        status: 'Borrador',
        total: 0
    };
    
    const [entries, setEntries] = React.useState<VoucherEntry[]>(isNew ? [] : [
        { id: 1, account: '1101-01', description: 'Inicio de actividades', debit: 100000, credit: 0 },
        { id: 2, account: '3101-01', description: 'Aporte inicial', debit: 0, credit: 100000 },
    ]);

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
                    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
                    return { ...entry, [field]: numericValue };
                }
                return { ...entry, [field]: value };
            }
            return entry;
        });
        setEntries(newEntries);
    };

    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>
                                {isNew ? 'Nuevo Comprobante' : `Editar Comprobante #${voucher.id}`}
                            </CardTitle>
                            <CardDescription>
                                {voucher.description} - {new Date(voucher.date).toLocaleDateString('es-CL')}
                            </CardDescription>
                        </div>
                        <Badge variant={voucher.status === 'Posteado' ? 'outline' : 'secondary'}>
                            {voucher.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
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
                                                {mockAccounts.map(account => (
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
                                    {totalDebit !== totalCredit ? (
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
                    <Button variant="outline">Cancelar</Button>
                    <Button disabled={totalDebit !== totalCredit || entries.length === 0}>Guardar Comprobante</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
