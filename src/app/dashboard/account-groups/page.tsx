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
import { MoreHorizontal, PlusCircle } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Example data for account groups
const mockAccountGroups = [
    { id: 'grp-1', name: 'Activos Circulantes', type: 'Asset' },
    { id: 'grp-2', name: 'Activos Fijos', type: 'Asset' },
    { id: 'grp-3', name: 'Pasivos Circulantes', type: 'Liability' },
    { id: 'grp-4', name: 'Ingresos Operacionales', type: 'Revenue' },
];

export default function AccountGroupsPage() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Grupos de Cuentas Contables</CardTitle>
                        <CardDescription>Gestiona los grupos de cuentas contables.</CardDescription>
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
                            <TableHead>Tipo de Cuenta Principal</TableHead>
                            <TableHead>
                                <span className="sr-only">Acciones</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockAccountGroups.map((group) => (
                            <TableRow key={group.id}>
                                <TableCell className="font-medium">{group.name}</TableCell>
                                <TableCell>{group.type}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuItem>Editar</DropdownMenuItem>
                                            <DropdownMenuItem>Ver Cuentas</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                         {mockAccountGroups.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">
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