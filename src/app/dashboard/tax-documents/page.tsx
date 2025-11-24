
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
import { ArrowRight } from "lucide-react";
import Link from 'next/link';

export default function TaxDocumentsPage() {

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Centralización de Libros de Compras y Ventas</CardTitle>
                    <CardDescription>
                        Accede a los módulos de compras y ventas para cargar y centralizar tus documentos tributarios del SII.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Libro de Compras</CardTitle>
                            <CardDescription>Gestiona la carga de tu Registro de Compras y Ventas (RCV) y prepara los documentos para la centralización contable.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-end">
                            <Link href="/dashboard/purchases" passHref>
                                <Button>
                                    Ir a Compras <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Libro de Ventas</CardTitle>
                            <CardDescription>Carga el detalle de tus ventas o el resumen mensual del SII para consolidar boletas y generar el asiento de ventas.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-end">
                            <Link href="/dashboard/sales" passHref>
                                <Button>
                                    Ir a Ventas <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
}
