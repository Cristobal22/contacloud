'use client';

import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setUserRole } from '@/ai/flows/set-user-role-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function AssignAdminRolePage() {
    const [uid, setUid] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleAssignRole = async () => {
        if (!uid.trim()) {
            toast({
                variant: 'destructive',
                title: 'UID Requerido',
                description: 'Por favor, ingresa el UID del usuario.',
            });
            return;
        }

        setIsProcessing(true);
        try {
            const result = await setUserRole({ uid, role: 'Admin' });

            if (result.success) {
                toast({
                    title: '¡Rol de Administrador Asignado!',
                    description: 'Cierra sesión y vuelve a iniciarla para que los cambios surtan efecto.',
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            console.error("Error al asignar el rol de admin:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'No se pudo asignar el rol. Revisa las credenciales de servicio.',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="grid gap-6">
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Página de Administración de Emergencia</AlertTitle>
                <AlertDescription>
                    Esta página es una herramienta temporal para configurar tu primer usuario Administrador. Una vez que hayas asignado el rol, esta página debe ser eliminada.
                </AlertDescription>
            </Alert>
            <Card>
                <CardHeader>
                    <CardTitle>Asignar Rol de Administrador</CardTitle>
                    <CardDescription>
                        Usa esta herramienta para otorgar permisos de administrador a un usuario. Esto establecerá el 'custom claim' necesario para que las reglas de seguridad funcionen.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="uid">User ID (UID) del Usuario</Label>
                        <Input
                            id="uid"
                            placeholder="Pega aquí el UID desde la Consola de Firebase"
                            value={uid}
                            onChange={(e) => setUid(e.target.value)}
                            disabled={isProcessing}
                        />
                         <p className="text-xs text-muted-foreground">
                            Puedes encontrar el UID en la sección de Authentication de tu proyecto de Firebase.
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleAssignRole} disabled={isProcessing}>
                        {isProcessing ? 'Procesando...' : 'Convertir en Administrador'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
