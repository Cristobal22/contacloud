
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

const mockInstitutions = [
    { id: 'inst-1', name: 'AFP Capital', type: 'AFP' },
    { id: 'inst-2', name: 'Fonasa', type: 'Salud' },
    { id: 'inst-3', name: 'Isapre Colmena', type: 'Salud' },
    { id: 'inst-4', name: 'Mutual de Seguridad', type: 'Mutual' },
    { id: 'inst-5', name: 'Caja Los Andes', type: 'Caja de Compensación' },
];

export default function InstitucionesPage() {
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
                        {mockInstitutions.map((inst) => (
                            <TableRow key={inst.id}>
                                <TableCell className="font-medium">{inst.name}</TableCell>
                                <TableCell><Badge variant="secondary">{inst.type}</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
