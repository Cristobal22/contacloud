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

// Main account groups as requested
const accountGroups = [
    { id: 'grp-1', name: 'Activo' },
    { id: 'grp-2', name: 'Pasivo' },
    { id: 'grp-3', name: 'Patrimonio' },
    { id: 'grp-4', name: 'Resultado' },
];

export default function AccountGroupsPage() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Grupos de Cuentas Contables</CardTitle>
                        <CardDescription>Los grupos principales que clasifican el plan de cuentas.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-4 w-4" />
                        Agregar Grupo
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre del Grupo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accountGroups.map((group) => (
                            <TableRow key={group.id}>
                                <TableCell className="font-medium">{group.name}</TableCell>
                            </TableRow>
                        ))}
                         {accountGroups.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={1} className="text-center">
                                    No se encontraron grupos de cuentas.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
