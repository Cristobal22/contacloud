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
  import type { Account, Voucher } from "@/lib/types"
  
  export default function LedgerPage({ companyId }: { companyId?: string }) {
    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: `companies/${companyId}/accounts`,
        companyId: companyId,
    });
    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({
      path: `companies/${companyId}/vouchers`,
      companyId: companyId 
    });

    const ledgerBalances = React.useMemo(() => {
        if (!accounts) return [];

        const accountMovements = new Map<string, { debit: number; credit: number }>();

        vouchers?.forEach(voucher => {
            voucher.entries.forEach(entry => {
                const current = accountMovements.get(entry.account) || { debit: 0, credit: 0 };
                current.debit += Number(entry.debit) || 0;
                current.credit += Number(entry.credit) || 0;
                accountMovements.set(entry.account, current);
            });
        });

        return accounts.map(account => {
            const movements = accountMovements.get(account.code);
            let finalBalance = account.balance;
            if (movements) {
                finalBalance += movements.debit - movements.credit;
            }
            return {
                ...account,
                finalBalance: finalBalance,
            };
        });

    }, [accounts, vouchers]);

    const loading = accountsLoading || vouchersLoading;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Libro Mayor</CardTitle>
          <CardDescription>Consulta los saldos de las cuentas en el libro mayor.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre de Cuenta</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Saldo Final</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                        </TableRow>
                    )}
                    {!loading && ledgerBalances.map((account) => (
                        <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.code}</TableCell>
                            <TableCell>{account.name}</TableCell>
                            <TableCell>{account.type}</TableCell>
                            <TableCell className="text-right font-medium">
                                ${account.finalBalance.toLocaleString('es-CL')}
                            </TableCell>
                        </TableRow>
                    ))}
                    {!loading && ledgerBalances.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">
                                No hay cuentas para mostrar en el libro mayor.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    )
  }
  
