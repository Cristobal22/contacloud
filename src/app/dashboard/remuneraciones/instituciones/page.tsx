'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function InstitucionesRedirectPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Página Movida</CardTitle>
                <CardDescription>
                    La gestión de instituciones se ha centralizado en el menú de Parámetros de Remuneraciones.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Por favor, utiliza las opciones "Entidades de Salud" y "Entidades AFP" en el submenú de Parámetros para gestionar estas instituciones.
                </p>
            </CardContent>
        </Card>
    )
}
