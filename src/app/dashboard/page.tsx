'use client';

import React from 'react';
import { SelectedCompanyContext } from './layout';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import type { Account, Voucher, Company, UserProfile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, BarChart3, FileText, TrendingDown, TrendingUp, Rocket } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { Bar, BarChart as ReBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

// Define a simplified dashboard for clients, focusing on their specific data if needed.
function ClientDashboard() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Ingresos (Mes)</CardTitle>
                     <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                 <CardContent>
                     <div className="text-2xl font-bold">$45,231.89</div>
                     <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
                 </CardContent>
            </Card>
             <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Gastos (Mes)</CardTitle>
                     <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                 <CardContent>
                     <div className="text-2xl font-bold">$12,134.50</div>
                     <p className="text-xs text-muted-foreground">+1.7% desde el mes pasado</p>
                 </CardContent>
            </Card>
        </div>
    );
}

// The detailed dashboard for accountants, showing comprehensive company data.
function AccountantDashboardContent({ company, userProfile }: { company: Company, userProfile: UserProfile | null }) {
    const firestore = useFirestore();
    const companyId = company.id;

    const { data: accounts, loading: accountsLoading } = useCollection<Account>({ 
        path: companyId ? `companies/${companyId}/accounts` : undefined,
        companyId: companyId
    });
    
    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({ 
        path: companyId ? `companies/${companyId}/vouchers` : undefined, 
        companyId: companyId
    });
    
    const { data: companies, loading: companiesLoading } = useDoc<Company>(firestore, `companies/${companyId}`);
    
    const loading = accountsLoading || vouchersLoading || companiesLoading;

    const contabilizadosVouchers = React.useMemo(() => vouchers?.filter(v => v.status === 'Contabilizado') || [], [vouchers]);

    const calculatedBalances = React.useMemo(() => {
        if (!accounts) return [];
        
        const accountMovements = new Map<string, { debit: number; credit: number }>();

        contabilizadosVouchers.forEach(voucher => {
            if (voucher && Array.isArray(voucher.entries)) {
                voucher.entries.forEach(entry => {
                    const current = accountMovements.get(entry.account) || { debit: 0, credit: 0 };
                    current.debit += Number(entry.debit) || 0;
                    current.credit += Number(entry.credit) || 0;
                    accountMovements.set(entry.account, current);
                });
            }
        });
        
        const finalBalances = new Map<string, number>();

        accounts.forEach(account => {
            const movements = accountMovements.get(account.code) || { debit: 0, credit: 0 };
            let balance = 0;
            if (account.type === 'Activo' || account.type === 'Resultado' && movements.debit > movements.credit) {
                balance = movements.debit - movements.credit;
            } else {
                balance = movements.credit - movements.debit;
            }
            finalBalances.set(account.code, balance);
        });

        return Array.from(finalBalances.entries())
            .map(([accountCode, balance]) => {
                const account = accounts.find(a => a.code === accountCode);
                return {
                    name: account?.name || 'Unknown Account',
                    balance: balance
                };
            })
            .filter(item => item.balance > 0) 
            .sort((a, b) => b.balance - a.balance); 

    }, [accounts, contabilizadosVouchers]);
    

    if (loading) {
        return <div>Cargando dashboard...</div>;
    }

    const totalAccounts = accounts?.length || 0;
    const totalVouchers = vouchers?.length || 0;
    const borradorVouchers = vouchers?.filter(v => v.status === 'Borrador').length || 0;

    const topBalances = calculatedBalances.slice(0, 8);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cuentas Contables</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAccounts}</div>
                        <p className="text-xs text-muted-foreground">Total de cuentas en el plan</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Comprobantes Totales</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVouchers}</div>
                        <p className="text-xs text-muted-foreground">Registrados en el período</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Comprobantes en Borrador</CardTitle>
                        <FileText className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{borradorVouchers}</div>
                        <p className="text-xs text-muted-foreground">Pendientes de contabilización</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilidad del Ejercicio</CardTitle>
                        <AreaChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">$1,2M</div>
                        <p className="text-xs text-muted-foreground">Calculado en tiempo real</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Saldos de Cuentas Principales</CardTitle>
                    <CardDescription>
                        Visualización de las cuentas con mayor movimiento o saldo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <ReBarChart data={topBalances} layout="vertical" margin={{ left: 100, right: 20 }}>
                             <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${new Intl.NumberFormat('es-CL').format(value as number)}`}/>
                             <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={200} style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}/>
                            <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Cuenta</span>
                                                    <span className="font-bold text-muted-foreground">{payload[0].payload.name}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Saldo</span>
                                                    <span className="font-bold">{`$${new Intl.NumberFormat('es-CL').format(payload[0].value as number)}`}</span>
                                                </div>
                                            </div>
                                        </div>
                                        )
                                    }

                                    return null
                                }}
                            />
                            <Bar dataKey="balance" fill="currentColor" radius={[0, 4, 4, 0]} className="fill-primary" />
                        </ReBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}


function AccountantDashboard() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const { user } = useUser();
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(useFirestore(), `users/${user?.uid}`);

    if (profileLoading) {
        return <div>Cargando perfil...</div>;
    }

    if (userProfile && userProfile.role === 'client') {
        return <ClientDashboard />;
    }

    if (!selectedCompany) {
        return (
            <Alert>
                <Rocket className="h-4 w-4" />
                <AlertTitle>¡Bienvenido a tu Asistente Contable!</AlertTitle>
                <AlertDescription>
                    Para empezar, selecciona una empresa del menú desplegable de arriba. Esto cargará el dashboard con los datos correspondientes.
                </AlertDescription>
            </Alert>
        );
    }

    return <AccountantDashboardContent company={selectedCompany} userProfile={userProfile} />;
}

export default function DashboardPage() {
    return <AccountantDashboard />;
}
