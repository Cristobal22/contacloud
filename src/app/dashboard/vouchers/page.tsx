
'use client'

import React from "react"
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
  } from "@/components/ui/dialog"
  import { useCollection, useFirestore } from "@/firebase"
  import { collection, addDoc, setDoc, doc } from "firebase/firestore"
  import type { Voucher, VoucherEntry } from "@/lib/types"
  import VoucherDetailForm from "./[id]/page"
  
  export default function VouchersPage({ companyId }: { companyId?: string }) {
    const firestore = useFirestore();
    const { data: vouchers, loading } = useCollection<Voucher>({ 
      path: `companies/${companyId}/vouchers`,
      companyId: companyId 
    });

    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [selectedVoucher, setSelectedVoucher] = React.useState<Voucher | null>(null);

    const handleCreateNew = () => {
        setSelectedVoucher({
            id: `new-${Date.now()}`,
            date: new Date().toISOString().substring(0, 10),
            type: 'Traspaso',
            description: '',
            status: 'Borrador',
            total: 0,
            entries: []
        });
        setIsCreateDialogOpen(true);
    };

    const handleEdit = (voucher: Voucher) => {
        setSelectedVoucher(voucher);
        setIsCreateDialogOpen(true);
    };

    const handleSaveVoucher = async (voucher: Voucher) => {
        if (!firestore || !companyId) return;

        const isNew = voucher.id.startsWith('new-');
        const collectionRef = collection(firestore, `companies/${companyId}/vouchers`);

        const voucherData = {
          date: voucher.date,
          type: voucher.type,
          description: voucher.description,
          status: voucher.status,
          total: voucher.total,
          entries: voucher.entries.map(e => ({...e, id: e.id.toString()})),
          companyId: companyId
        };
        
        if (isNew) {
            await addDoc(collectionRef, voucherData);
        } else {
            const docRef = doc(firestore, `companies/${companyId}/vouchers`, voucher.id);
            await setDoc(docRef, voucherData, { merge: true });
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
                  <Button size="sm" className="gap-1" onClick={handleCreateNew} disabled={!companyId}>
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
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
                  </TableRow>
                )}
                {!loading && vouchers?.map((voucher) => (
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
                {!loading && vouchers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      {!companyId ? "Selecciona una empresa para ver sus comprobantes." : "No se encontraron comprobantes para esta empresa."}
                    </TableCell>
                  </TableRow>
                )}
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
