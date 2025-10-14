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
  import { Badge } from "@/components/ui/badge"
  import { MoreHorizontal, PlusCircle } from "lucide-react"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import { mockAccounts } from "@/lib/data"
  
  export default function AccountsPage() {
    return (
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Plan de Cuentas</CardTitle>
                    <CardDescription>Gestiona tus cuentas contables.</CardDescription>
                </div>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Agregar Cuenta
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre de Cuenta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.code}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{account.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">${account.balance.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
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
                        <DropdownMenuItem>Ver Movimientos</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }
  