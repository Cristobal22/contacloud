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
  import type { Fee } from "@/lib/types";
  import React from "react";

  export default function FeesPage() {
    const [mockFees, setMockFees] = React.useState<Fee[]>([
        { id: '1', date: '2023-10-31', documentNumber: 'H-1', issuer: 'Profesional Independiente', total: 500000, status: 'Pendiente' },
    ]);
    return (
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Honorarios</CardTitle>
                    <CardDescription>Gestiona tus boletas de honorarios emitidas y recibidas.</CardDescription>
                </div>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Agregar Boleta
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Nº Documento</TableHead>
                <TableHead>Emisor/Receptor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockFees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>{fee.date}</TableCell>
                  <TableCell className="font-medium">{fee.documentNumber}</TableCell>
                  <TableCell>{fee.issuer}</TableCell>
                  <TableCell>
                    <Badge variant={
                        fee.status === 'Pagada' ? 'default' :
                        fee.status === 'Vencida' ? 'destructive' : 'secondary'
                    }>
                        {fee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${fee.total.toLocaleString('es-CL')}</TableCell>
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
               {mockFees.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">
                        No se encontraron boletas de honorarios.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }