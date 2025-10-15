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
  import type { Voucher, Account } from "@/lib/types";

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
    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({ 
      path: `companies/${companyId}/vouchers`,
      companyId: companyId 
    });
     const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: `companies/${companyId}/accounts`,
        companyId: companyId,
    });

    const journalEntries = React.useMemo(() => {
        if (!vouchers || !accounts) return [];
        const entries: JournalEntry[] = [];
        const accountMap = new Map(accounts.map(acc => [acc.code, acc.name]));

        vouchers.forEach(voucher => {
            voucher.entries.forEach((entry, index) => {
                entries.push({
                    id: `${voucher.id}-${index}`,
                    date: voucher.date,
                    accountCode: entry.account,
                    accountName: accountMap.get(entry.account) || 'N/A',
                    description: entry.description || voucher.description,
                    debit: Number(entry.debit) || 0,
                    credit: Number(entry.credit) || 0,
                });
            });
        });
        return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [vouchers, accounts]);

    const loading = vouchersLoading || accountsLoading;

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
                        <TableCell>{new Date(entry.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</TableCell>
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
  
