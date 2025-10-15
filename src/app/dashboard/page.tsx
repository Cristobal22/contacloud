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
  import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
  import { useCollection } from "@/firebase"
  import type { Account, Company, Voucher } from "@/lib/types"
  import { SelectedCompanyContext } from "./layout"
  
  export default function DashboardPage({ companyId }: { companyId?: string }) {
    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: `companies/${companyId}/accounts`,
        companyId: companyId,
    });
    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({
        path: `companies/${companyId}/vouchers`,
        companyId: companyId,
    });
    const { data: companies, loading: companiesLoading } = useCollection<Company>({
        path: 'companies',
    });

    const totalBalance = accounts
        ?.filter(acc => acc.type === 'Activo')
        .reduce((sum, acc) => sum + acc.balance, 0) || 0;

    const totalLiabilities = accounts
        ?.filter(acc => acc.type === 'Pasivo')
        .reduce((sum, acc) => sum + acc.balance, 0) || 0;

    const recentVouchers = vouchers?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5) || [];

    const loading = accountsLoading || vouchersLoading || companiesLoading;

    if (loading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <p>Cargando dashboard...</p>
            </div>
        )
    }
  
    return (
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Activos</CardDescription>
              <CardTitle className="text-4xl">${totalBalance.toLocaleString('es-CL')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Calculado desde las cuentas de la empresa.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Pasivos</CardDescription>
              <CardTitle className="text-4xl">${totalLiabilities.toLocaleString('es-CL')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Calculado desde las cuentas de la empresa.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Empresas</CardDescription>
              <CardTitle className="text-4xl">{companies?.length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Total de empresas gestionadas.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Comprobantes</CardDescription>
              <CardTitle className="text-4xl">{vouchers?.length || 0}</CardTitle>
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
                    <CardTitle>Saldos de Cuentas</CardTitle>
                    <CardDescription>Un resumen de los saldos entre tipos de cuenta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={accounts?.filter(a => a.balance > 0)}>
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
                            tickFormatter={(value) => `$${value}`}
                            />
                            <Bar dataKey="balance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                        {voucher.date} - {voucher.type}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${voucher.total.toLocaleString('es-CL')}
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
  

    