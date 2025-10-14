'use client'

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
  import { mockAccounts, mockTransactions, mockCompanies } from "@/lib/data"
  import { DollarSign, Landmark, Building, ArrowRightLeft } from "lucide-react"
  import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
  
  export default function DashboardPage() {
    const totalBalance = mockAccounts
        .filter(acc => acc.type === 'Asset' || acc.type === 'Revenue')
        .reduce((sum, acc) => sum + acc.balance, 0);

    const totalLiabilities = mockAccounts
        .filter(acc => acc.type === 'Liability' || acc.type === 'Expense')
        .reduce((sum, acc) => sum + acc.balance, 0);
  
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
                +25% desde el mes pasado
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
                +10% desde el mes pasado
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Empresas</CardDescription>
              <CardTitle className="text-4xl">{mockCompanies.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                +1 desde el mes pasado
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Transacciones</CardDescription>
              <CardTitle className="text-4xl">{mockTransactions.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                +20 desde el mes pasado
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
                        <BarChart data={mockAccounts}>
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
            <CardTitle>Transacciones Recientes</CardTitle>
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
                {mockTransactions.slice(0, 5).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="font-medium">{transaction.account}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${transaction.amount.toLocaleString('es-CL')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.status === 'Completed' ? 'default' : transaction.status === 'Pending' ? 'secondary' : 'destructive'} className="text-xs" >
                          {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }
  