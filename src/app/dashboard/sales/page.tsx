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
  import { Badge } from "@/components/ui/badge"
  import { MoreHorizontal, PlusCircle } from "lucide-react"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import type { Sale } from "@/lib/types";
  import React from "react";

  export default function SalesPage() {
    const [mockSales, setMockSales] = React.useState<Sale[]>([
        { id: '1', date: '2023-10-02', documentNumber: 'B-501', customer: 'Cliente X', total: 50000, status: 'Pagada' },
        { id: '2', date: '2023-10-10', documentNumber: 'B-502', customer: 'Cliente Y', total: 120000, status: 'Pendiente' },
    ]);
    return (
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Ventas</CardTitle>
                    <CardDescription>Gestiona tus documentos de venta.</CardDescription>
                </div>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Agregar Venta
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Nº Documento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell className="font-medium">{sale.documentNumber}</TableCell>
                  <TableCell>{sale.customer}</TableCell>
                  <TableCell>
                    <Badge variant={
                        sale.status === 'Pagada' ? 'default' :
                        sale.status === 'Vencida' ? 'destructive' : 'secondary'
                    }>
                        {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${sale.total.toLocaleString('es-CL')}</TableCell>
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
                        <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                        <DropdownMenuItem>Registrar Pago</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Anular</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {mockSales.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">
                        No se encontraron documentos de venta.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }