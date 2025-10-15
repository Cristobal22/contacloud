'use client'

import React from "react"
import Link from "next/link"
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
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  } from "@/components/ui/dialog"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
   import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  import { mockVouchers } from "@/lib/data"
  
  export default function VouchersPage() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

    return (
      <>
        <Card>
          <CardHeader>
              <div className="flex items-center justify-between">
                  <div>
                      <CardTitle>Comprobantes Contables</CardTitle>
                      <CardDescription>Gestiona los comprobantes de la empresa.</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1" onClick={() => setIsCreateDialogOpen(true)}>
                      <PlusCircle className="h-4 w-4" />
                      Agregar Comprobante
                  </Button>
              </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockVouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell>{voucher.date}</TableCell>
                    <TableCell>
                      <Badge variant={
                          voucher.type === 'Ingreso' ? 'default' : 
                          voucher.type === 'Egreso' ? 'destructive' : 'secondary'
                      }>{voucher.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{voucher.description}</TableCell>
                    <TableCell>
                      <Badge variant={voucher.status === 'Posteado' ? 'outline' : 'secondary'}>
                        {voucher.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${voucher.total.toLocaleString('es-CL')}</TableCell>
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
                           <DropdownMenuItem asChild>
                                <Link href={`/dashboard/vouchers/${voucher.id}`}>Editar</Link>
                           </DropdownMenuItem>
                          <DropdownMenuItem>Anular</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Comprobante</DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles para crear un nuevo comprobante.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Fecha
                        </Label>
                        <Input id="date" type="date" defaultValue={new Date().toISOString().substring(0, 10)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Tipo
                        </Label>
                         <Select>
                            <SelectTrigger id="type" className="col-span-3">
                                <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ingreso">Ingreso</SelectItem>
                                <SelectItem value="egreso">Egreso</SelectItem>
                                <SelectItem value="traspaso">Traspaso</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Descripción
                        </Label>
                        <Input id="description" placeholder="Ej: Pago de factura #101" className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button asChild>
                        <Link href="/dashboard/vouchers/new">Continuar</Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
    )
  }