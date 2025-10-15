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
import { mockVouchers } from '@/lib/data';
import { useParams } from 'next/navigation';

export default function VoucherDetailPage() {
    const params = useParams();
    const { id } = params;

    // In a real app, you'd fetch voucher details and its lines from an API
    const voucher = mockVouchers.find(v => v.id === id) || {
        id: 'new',
        date: new Date().toISOString().substring(0, 10),
        type: 'Traspaso',
        description: 'Nuevo Comprobante',
        status: 'Borrador',
        total: 0
    };
    
    // Mock entries for demonstration. In a real app, this would be state managed.
    const [entries, setEntries] = React.useState([
        { id: 1, account: '1101-01 Caja', description: 'Inicio', debit: 100000, credit: 0 },
        { id: 2, account: '3101-01 Capital', description: 'Inicio', debit: 0, credit: 100000 },
    ]);

    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>
                                {id === 'new' ? 'Nuevo Comprobante' : `Editar Comprobante #${voucher.id}`}
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
                                <TableHead className="w-[300px]">Cuenta Contable</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="w-[150px] text-right">Debe</TableHead>
                                <TableHead className="w-[150px] text-right">Haber</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map(entry => (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-medium">{entry.account}</TableCell>
                                    <TableCell>{entry.description}</TableCell>
                                    <TableCell className="text-right">${entry.debit.toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right">${entry.credit.toLocaleString('es-CL')}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="text-destructive">
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
                                     <Button size="sm" variant="outline" className="gap-1">
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
                    <Button>Guardar Comprobante</Button>
                </CardFooter>
            </Card>
        </div>
    );
}