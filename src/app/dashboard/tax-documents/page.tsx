
'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TaxDocumentsPage() {
    const { toast } = useToast();

    const handlePlaceholderClick = () => {
        toast({
            title: "Función en desarrollo",
            description: "La centralización de documentos tributarios desde el SII aún no está implementada.",
        });
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Centralización de Documentos Tributarios</CardTitle>
                    <CardDescription>
                        Importa y centraliza automáticamente tus documentos tributarios desde el SII.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Conectar con el SII</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Esta funcionalidad futura te permitirá conectar tu cuenta del SII para descargar y procesar automáticamente tus documentos de compra y venta.
                        </p>
                        <Button onClick={handlePlaceholderClick}>
                            Iniciar Proceso (Próximamente)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
