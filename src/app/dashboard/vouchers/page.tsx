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
  import { mockVouchers } from "@/lib/data"
  import type { Voucher, VoucherEntry } from "@/lib/types"
  import VoucherDetailForm from "./[id]/page"
  
  export default function VouchersPage() {
    const [vouchers, setVouchers] = React.useState<Voucher[]>(mockVouchers);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [selectedVoucher, setSelectedVoucher] = React.useState<Voucher | null>(null);

    const handleCreateNew = () => {
        setSelectedVoucher({
            id: `new-${Date.now()}`,
            date: new Date().toISOString().substring(0, 10),
            type: 'Traspaso',
            description: '',
            status: 'Borrador',
            total: 0
        });
        setIsCreateDialogOpen(true);
    };

    const handleEdit = (voucher: Voucher) => {
        setSelectedVoucher(voucher);
        setIsCreateDialogOpen(true);
    };

    const handleSaveVoucher = (voucher: Voucher, entries: VoucherEntry[]) => {
        const isNew = voucher.id.startsWith('new-');
        if (isNew) {
            const newVoucher = { ...voucher, id: `v-${Date.now()}` };
            setVouchers(prev => [newVoucher, ...prev]);
        } else {
            setVouchers(prev => prev.map(v => v.id === voucher.id ? voucher : v));
        }
        setIsCreateDialogOpen(false);
        setSelectedVoucher(null);
    };

    const handleCancel = () => {
        setIsCreateDialogOpen(false);
        setSelectedVoucher(null);
    }

    return (
      <>
        <Card>
          <CardHeader>
              <div className="flex items-center justify-between">
                  <div>
                      <CardTitle>Comprobantes Contables</CardTitle>
                      <CardDescription>Gestiona los comprobantes de la empresa.</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1" onClick={handleCreateNew}>
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
                {vouchers.map((voucher) => (
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
                           <DropdownMenuItem onClick={() => handleEdit(voucher)}>
                                Editar
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
            <DialogContent className="sm:max-w-4xl">
                 <VoucherDetailForm 
                    voucherData={selectedVoucher}
                    onSave={handleSaveVoucher}
                    onCancel={handleCancel}
                 />
            </DialogContent>
        </Dialog>
      </>
    )
  }