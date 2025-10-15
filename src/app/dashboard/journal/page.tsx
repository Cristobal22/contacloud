'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { useCollection } from "@/firebase"
  import type { Voucher, VoucherEntry } from "@/lib/types";

  type JournalEntry = {
    id: string;
    date: string;
    accountCode: string;
    accountName: string;
    description: string;
    debit: number;
    credit: number;
  };
  
  export default function JournalPage({ companyId }: { companyId?: string }) {
    const { data: vouchers, loading } = useCollection<Voucher>({ 
      path: `companies/${companyId}/vouchers`,
      companyId: companyId 
    });

    const journalEntries = React.useMemo(() => {
        if (!vouchers) return [];
        const entries: JournalEntry[] = [];
        vouchers.forEach(voucher => {
            voucher.entries.forEach((entry, index) => {
                entries.push({
                    id: `${voucher.id}-${index}`,
                    date: voucher.date,
                    accountCode: entry.account.split(' - ')[0],
                    accountName: entry.account.split(' - ')[1] || 'N/A',
                    description: entry.description || voucher.description,
                    debit: Number(entry.debit) || 0,
                    credit: Number(entry.credit) || 0,
                });
            });
        });
        return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [vouchers]);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Libro Diario</CardTitle>
          <CardDescription>Consulta los movimientos en el libro diario.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Debe</TableHead>
                <TableHead className="text-right">Haber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
                    </TableRow>
                )}
                {!loading && journalEntries.map((entry) => (
                    <TableRow key={entry.id}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.accountCode} - {entry.accountName}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right text-red-600">
                            {entry.debit > 0 ? `$${entry.debit.toLocaleString('es-CL')}` : '$0'}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                            {entry.credit > 0 ? `$${entry.credit.toLocaleString('es-CL')}` : '$0'}
                        </TableCell>
                    </TableRow>
                ))}
                 {!loading && journalEntries.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">
                            {!companyId ? "Selecciona una empresa para ver el libro diario." : "No hay movimientos en el libro diario para esta empresa."}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }
  
