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
import { SelectedCompanyContext } from '../layout';
  
  export default function LedgerPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;

    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: `companies/${companyId}/accounts`,
        companyId: companyId,
    });
    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({
      path: `companies/${companyId}/vouchers`,
      companyId: companyId,
      query: companyId ? (collection, query, where) => query(collection(`companies/${companyId}/vouchers`), where('status', '==', 'Contabilizado')) : undefined,
    });

    const ledgerBalances = React.useMemo(() => {
        if (!accounts) return [];

        const balanceMap = new Map<string, { initialBalance: number; debit: number; credit: number; finalBalance: number }>();
        
        accounts.forEach(acc => {
            balanceMap.set(acc.code, {
                initialBalance: acc.balance || 0,
                debit: 0,
                credit: 0,
                finalBalance: acc.balance || 0
            });
        });

        vouchers?.forEach(voucher => {
            voucher.entries.forEach(entry => {
                if (balanceMap.has(entry.account)) {
                    const mov = balanceMap.get(entry.account)!;
                    mov.debit += Number(entry.debit) || 0;
                    mov.credit += Number(entry.credit) || 0;
                }
            });
        });

        balanceMap.forEach((mov, code) => {
            const accountInfo = accounts.find(a => a.code === code);
            if (accountInfo?.type === 'Activo' || accountInfo?.type === 'Resultado') {
                mov.finalBalance = mov.initialBalance + mov.debit - mov.credit;
            } else {
                mov.finalBalance = mov.initialBalance + mov.credit - mov.debit;
            }
        });
        
        const sortedCodes = Array.from(balanceMap.keys()).sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
        
        // Aggregate balances up the hierarchy
        for (let i = sortedCodes.length - 1; i >= 0; i--) {
            const code = sortedCodes[i];
            const parts = code.split('.');
            if (parts.length > 1) {
                const parentCode = parts.slice(0, -1).join('.');
                if (balanceMap.has(parentCode)) {
                    const child = balanceMap.get(code)!;
                    const parent = balanceMap.get(parentCode)!;
                    // For ledger, we just aggregate the final balance, not movements
                    parent.finalBalance += child.finalBalance;
                }
            }
        }

        return sortedCodes.map(code => {
            const account = accounts.find(a => a.code === code)!;
            const balance = balanceMap.get(code)!;
            return {
                ...account,
                finalBalance: balance.finalBalance
            };
        });

    }, [accounts, vouchers]);

    const loading = accountsLoading || vouchersLoading;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Libro Mayor</CardTitle>
          <CardDescription>Consulta los saldos de las cuentas en el libro mayor. Solo se consideran comprobantes contabilizados.</CardDescription>
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
                                {!companyId ? "Selecciona una empresa para ver el libro mayor." : "No hay cuentas para mostrar en el libro mayor."}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    )
  }
