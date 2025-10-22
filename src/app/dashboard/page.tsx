'use client'

import React from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import { Badge } from "@/components/ui/badge"
  import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
  import { useCollection, useFirestore } from "@/firebase"
  import type { Account, Company, Voucher } from "@/lib/types"
  import { useUser } from "@/firebase"
  import { useUserProfile } from "@/firebase/auth/use-user-profile"
  import UserManagement from "@/components/admin/user-management"
import { SelectedCompanyContext } from "./layout"
import { collection, query, where, documentId, Query } from "firebase/firestore"
  
function AccountantDashboardContent({ companyId }: { companyId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);

    const companiesQuery = React.useMemo(() => {
        if (!firestore || !userProfile || userProfile.role !== 'Accountant' || !userProfile.companyIds || userProfile.companyIds.length === 0) {
            return null;
        }
        return query(collection(firestore, 'companies'), where(documentId(), 'in', userProfile.companyIds.slice(0, 30))) as Query<Company>;
    }, [firestore, userProfile]);

    const { data: companies, loading: companiesLoading } = useCollection<Company>({ query: companiesQuery });
    
    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: `companies/${companyId}/accounts`,
        companyId,
    });
    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({
        path: `companies/${companyId}/vouchers`,
        companyId,
    });

    const loading = accountsLoading || vouchersLoading || companiesLoading || profileLoading;

    const contabilizadosVouchers = React.useMemo(() => vouchers?.filter(v => v.status === 'Contabilizado') || [], [vouchers]);

    const calculatedBalances = React.useMemo(() => {
        if (!accounts) return [];
        
        const accountMovements = new Map<string, { debit: number; credit: number }>();

        contabilizadosVouchers.forEach(voucher => {
            voucher.entries.forEach(entry => {
                const current = accountMovements.get(entry.account) || { debit: 0, credit: 0 };
                current.debit += Number(entry.debit) || 0;
                current.credit += Number(entry.credit) || 0;
                accountMovements.set(entry.account, current);
            });
        });
        
        const finalBalances = new Map<string, number>();

        accounts.forEach(account => {
            const movements = accountMovements.get(account.code);
            let finalBalance = account.balance || 0;
            if (movements) {
                 if (account.type === 'Activo' || (account.type === 'Resultado' && movements.debit > movements.credit)) {
                     finalBalance += (movements.debit - movements.credit);
                 } else { // Pasivo, Patrimonio y Resultado (Ingresos)
                     finalBalance += (movements.credit - movements.debit);
                 }
            }
            finalBalances.set(account.code, finalBalance);
        });
        
        // Aggregate balances up the hierarchy after calculating individual final balances
        const sortedCodes = accounts.map(a => a.code).sort((a,b) => b.length - a.length);

        sortedCodes.forEach(code => {
            let parentCode = '';
            if (code.length > 1) {
                 if (code.length > 5) parentCode = code.substring(0, 5);
                 else if (code.length === 5) parentCode = code.substring(0, 3);
                 else if (code.length === 3) parentCode = code.substring(0, 1);
            }
            if (parentCode && finalBalances.has(parentCode)) {
                const childBalance = finalBalances.get(code) || 0;
                // Only add children to parents, don't double add from initial balance
                const parentAccount = accounts.find(a => a.code === parentCode);
                const childAccount = accounts.find(a => a.code === code);
                if (parentAccount && childAccount) {
                    finalBalances.set(parentCode, (finalBalances.get(parentCode) || 0) + childBalance);
                }
            }
        });


        return accounts.map(account => ({
            ...account,
            balance: finalBalances.get(account.code) || 0,
        }));


    }, [accounts, contabilizadosVouchers]);

    const totalActives = calculatedBalances
        ?.find(acc => acc.code === '1')?.balance || 0;

    const totalLiabilities = calculatedBalances
        ?.find(acc => acc.code === '2')?.balance || 0;
    
    const totalEquity = calculatedBalances
        ?.find(acc => acc.code === '3')?.balance || 0;

    const resultAccounts = React.useMemo(() => {
        if (!calculatedBalances) return [];
        const income = calculatedBalances.filter(acc => acc.code.startsWith('4')).reduce((sum, acc) => sum + acc.balance, 0);
        const expenses = calculatedBalances.filter(acc => acc.code.startsWith('5') || acc.code.startsWith('6')).reduce((sum, acc) => sum + acc.balance, 0);
        return [
            { name: 'Ingresos', total: income },
            { name: 'Gastos', total: expenses },
        ];
    }, [calculatedBalances]);


    const recentVouchers = vouchers?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5) || [];


    if (loading) {
        return (
            <div className="flex min-h-[400px] w-full items-center justify-center">
                <p>Cargando datos del dashboard...</p>
            </div>
        )
    }

    return (
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Activos</CardDescription>
              <CardTitle className="text-3xl">${Math.round(totalActives).toLocaleString('es-CL')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Suma de saldos de cuentas de activo.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Pasivos</CardDescription>
              <CardTitle className="text-3xl">${Math.round(totalLiabilities).toLocaleString('es-CL')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Suma de saldos de cuentas de pasivo.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Patrimonio</CardDescription>
              <CardTitle className="text-3xl">${Math.round(totalEquity).toLocaleString('es-CL')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Suma de saldos de cuentas de patrimonio.
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="pb-2">
              <CardDescription>Comprobantes</CardDescription>
              <CardTitle className="text-3xl">{vouchers?.length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Total de comprobantes para esta empresa.
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Resultados del Período</CardTitle>
                    <CardDescription>Comparación entre ingresos y gastos del período.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={resultAccounts}>
                            <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            />
                            <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${Number(value).toLocaleString('es-CL', { maximumFractionDigits: 0 })}`}
                            />
                             <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                            {payload[0].payload.name}
                                            </span>
                                            <span className="font-bold text-muted-foreground">
                                             ${Number(payload[0].value).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                        </div>
                                    </div>
                                    )
                                }
                                return null
                                }}
                            />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
          <CardHeader>
            <CardTitle>Comprobantes Recientes</CardTitle>
            <CardDescription>
              Un resumen de las últimas actividades financieras.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell>
                      <div className="font-medium">{voucher.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(voucher.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })} - {voucher.type}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${Math.round(voucher.total).toLocaleString('es-CL')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={voucher.status === 'Contabilizado' ? 'outline' : 'secondary'} className="text-xs" >
                          {voucher.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                 {recentVouchers.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center">
                            No hay comprobantes recientes para esta empresa.
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
      </div>
    )
}

function AccountantDashboard() {
    const context = React.useContext(SelectedCompanyContext);

    if (!context) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <p>Cargando contexto de empresa...</p>
        </div>
      );
    }
    
    const { selectedCompany } = context;

    if (!selectedCompany) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Bienvenido a Guardián del Tesoro</CardTitle>
                    <CardDescription>Por favor, selecciona una empresa desde el menú superior para empezar a trabajar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No hay ninguna empresa seleccionada.</p>
                </CardContent>
            </Card>
        );
    }
    
    return <AccountantDashboardContent companyId={selectedCompany.id} />;
}

export default function DashboardPage() {
  const { user } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);

  if (profileLoading) {
      return (
          <div className="flex min-h-[400px] w-full items-center justify-center">
              <p>Cargando dashboard...</p>
          </div>
      )
  }

  if (userProfile?.role === 'Admin') {
      return <UserManagement />;
  }

  return <AccountantDashboard />;
}
