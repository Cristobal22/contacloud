'use client';

import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { SelectedCompanyContext } from './layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, FileText, Users, BookCopy, PlusCircle } from 'lucide-react';

const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function DashboardPage() {
    const router = useRouter();
    const context = useContext(SelectedCompanyContext);

    if (!context || !context.selectedCompany) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Cargando Dashboard</CardTitle>
                        <CardDescription>Por favor, espere mientras cargamos la información de su empresa.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const { selectedCompany, periodYear, periodMonth } = context;
    const monthName = months[periodMonth - 1];

    const quickAccessItems = [
        { title: 'Nuevo Comprobante', href: '/dashboard/vouchers/edit/new', icon: PlusCircle, description: 'Registra una nueva transacción contable.' },
        { title: 'Plan de Cuentas', href: '/dashboard/accounts', icon: BookCopy, description: 'Gestiona la estructura de tus cuentas.' },
        { title: 'Gestión de Empleados', href: '/dashboard/employees', icon: Users, description: 'Administra la información de tu personal.' },
        { title: 'Libro Diario', href: '/dashboard/journal', icon: FileText, description: 'Revisa los movimientos contables del período.' },
    ];

    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">{selectedCompany.legalName}</CardTitle>
                            <CardDescription>RUT: {selectedCompany.rut} | Período de Trabajo: {monthName} {periodYear}</CardDescription>
                        </div>
                        <Briefcase className="h-8 w-8 text-muted-foreground" />
                    </div>
                </CardHeader>
            </Card>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Accesos Rápidos</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {quickAccessItems.map((item) => (
                        <Card key={item.href} className="flex flex-col">
                            <CardHeader className="flex-row items-center gap-4 pb-4">
                                <item.icon className="h-8 w-8 text-primary" />
                                <CardTitle>{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </CardContent>
                            <CardContent>
                                <Button onClick={() => router.push(item.href)} className="w-full">Ir ahora</Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
