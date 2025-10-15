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
import { useCollection, useFirestore } from "@/firebase"
import type { AccountGroup } from "@/lib/types"
import { collection } from "firebase/firestore";

export default function AccountGroupsPage() {
    const firestore = useFirestore();
    const accountGroupsCollection = firestore ? collection(firestore, 'account-groups') : null;
    const { data: accountGroups, loading } = useCollection<AccountGroup>({ query: accountGroupsCollection });

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
                            <TableHead>ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        )}
                        {!loading && accountGroups?.map((group) => (
                            <TableRow key={group.id}>
                                <TableCell className="font-medium">{group.name}</TableCell>
                                <TableCell>{group.id}</TableCell>
                            </TableRow>
                        ))}
                         {!loading && accountGroups?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">
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
