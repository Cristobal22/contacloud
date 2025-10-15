'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCollection, useFirestore } from "@/firebase"
import type { Institution } from "@/lib/types"
import { collection } from "firebase/firestore";

export default function InstitucionesPage() {
    const firestore = useFirestore();
    const institutionsCollection = firestore ? collection(firestore, 'institutions') : null;
    const { data: institutions, loading } = useCollection<Institution>({ query: institutionsCollection });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Instituciones Previsionales y de Salud</CardTitle>
                        <CardDescription>Gestiona las instituciones para el cálculo de remuneraciones.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-4 w-4" />
                        Agregar Institución
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        )}
                        {!loading && institutions?.map((inst) => (
                            <TableRow key={inst.id}>
                                <TableCell className="font-medium">{inst.name}</TableCell>
                                <TableCell><Badge variant="secondary">{inst.type}</Badge></TableCell>
                            </TableRow>
                        ))}
                         {!loading && institutions?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">
                                    No se encontraron instituciones.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
