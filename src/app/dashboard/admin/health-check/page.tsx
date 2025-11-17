
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthCheckLogic } from './components/HealthCheckLogic';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function HealthCheckPage() {
    const { user } = useUser();
    const { userProfile, loading } = useUserProfile(user?.uid);

    if (loading) {
        return <p>Verificando permisos...</p>;
    }

    if (userProfile?.role !== 'Admin') {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acceso Denegado</AlertTitle>
                <AlertDescription>
                    No tienes los permisos necesarios para ver esta página. Por favor, contacta a un administrador.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Diagnóstico del Sistema</CardTitle>
                <CardDescription>
                    Este panel revisa la disponibilidad de los datos maestros críticos para los procesos automáticos del sistema, como el cálculo de liquidaciones.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <HealthCheckLogic />
            </CardContent>
        </Card>
    );
}
