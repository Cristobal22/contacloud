
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
  import { mockTransactions } from "@/lib/data"
  
  export default function JournalPage() {
    // Usaremos mockTransactions para simular los asientos del libro diario
    const journalEntries = mockTransactions.flatMap(t => [
        { ...t, entryType: 'Debit', amount: t.type === 'Debit' ? t.amount : 0 },
        { ...t, entryType: 'Credit', amount: t.type === 'Credit' ? t.amount : 0 }
    ]).filter(e => e.amount > 0);


    return (
      <Card>
        <CardHeader>
          <CardTitle>Libro Diario</CardTitle>
          <CardDescription>Consulta los movimientos en el libro diario.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Debe</TableHead>
                <TableHead className="text-right">Haber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {mockTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.account}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="text-right text-red-600">
                            {transaction.type === 'Debit' ? `$${transaction.amount.toLocaleString('es-CL')}` : '$0'}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                            {transaction.type === 'Credit' ? `$${transaction.amount.toLocaleString('es-CL')}` : '$0'}
                        </TableCell>
                    </TableRow>
                ))}
                 {mockTransactions.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">
                            No hay movimientos en el libro diario.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }
  
