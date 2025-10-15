
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
  import { mockAccounts } from "@/lib/data"
  
  export default function LedgerPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Libro Mayor</CardTitle>
          <CardDescription>Consulta los saldos de las cuentas en el libro mayor.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre de Cuenta</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Saldo Final</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockAccounts.map((account) => (
                        <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.code}</TableCell>
                            <TableCell>{account.name}</TableCell>
                            <TableCell>{account.type}</TableCell>
                            <TableCell className="text-right font-medium">
                                ${account.balance.toLocaleString('es-CL')}
                            </TableCell>
                        </TableRow>
                    ))}
                    {mockAccounts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">
                                No hay cuentas para mostrar en el libro mayor.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    )
  }
  
