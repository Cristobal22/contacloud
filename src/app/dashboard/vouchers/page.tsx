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
  import { Button, buttonVariants } from "@/components/ui/button"
  import { Badge } from "@/components/ui/badge"
  import { MoreHorizontal, PlusCircle } from "lucide-react"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import {
    Dialog,
    DialogContent,
  } from "@/components/ui/dialog"
    import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
  import { useCollection, useFirestore } from "@/firebase"
  import { collection, addDoc, setDoc, doc, updateDoc } from "firebase/firestore"
  import type { Voucher } from "@/lib/types"
  import VoucherDetailForm from "./[id]/page"
  
  export default function VouchersPage({ companyId }: { companyId?: string }) {
    const firestore = useFirestore();
    const { data: vouchers, loading } = useCollection<Voucher>({ 
      path: `companies/${companyId}/vouchers`,
      companyId: companyId 
    });

    const [isDetailOpen, setIsDetailOpen] = React.useState(false);
    const [isContabilizarDialogOpen, setIsContabilizarDialogOpen] = React.useState(false);
    const [selectedVoucher, setSelectedVoucher] = React.useState<Voucher | null>(null);
    const [voucherToContabilizar, setVoucherToContabilizar] = React.useState<Voucher | null>(null);


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
        setIsDetailOpen(true);
    };

    const handleEdit = (voucher: Voucher) => {
        setSelectedVoucher(voucher);
        setIsDetailOpen(true);
    };

    const handleOpenContabilizarDialog = (voucher: Voucher) => {
        setVoucherToContabilizar(voucher);
        setIsContabilizarDialogOpen(true);
    }

    const handleContabilizarVoucher = async () => {
        if (!firestore || !companyId || !voucherToContabilizar) return;

        try {
            const docRef = doc(firestore, `companies/${companyId}/vouchers`, voucherToContabilizar.id);
            await updateDoc(docRef, { status: 'Contabilizado' });
        } catch (error) {
            console.error("Error posting voucher:", error);
        } finally {
            setIsContabilizarDialogOpen(false);
            setVoucherToContabilizar(null);
        }
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
          entries: voucher.entries.map(e => ({
            account: e.account,
            description: e.description,
            debit: e.debit,
            credit: e.credit,
            id: e.id.toString(), // ensure id is a string
          })),
          companyId: companyId
        };
        
        try {
            if (isNew) {
                await addDoc(collectionRef, voucherData);
            } else {
                const docRef = doc(firestore, `companies/${companyId}/vouchers`, voucher.id);
                await setDoc(docRef, voucherData, { merge: true });
            }
        } catch (error) {
            console.error("Error saving voucher:", error);
        } finally {
            setIsDetailOpen(false);
            setSelectedVoucher(null);
        }
    };

    const handleCancel = () => {
        setIsDetailOpen(false);
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
                    <TableCell>{new Date(voucher.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</TableCell>
                    <TableCell>
                      <Badge variant={
                          voucher.type === 'Ingreso' ? 'default' : 
                          voucher.type === 'Egreso' ? 'destructive' : 'secondary'
                      }>{voucher.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{voucher.description}</TableCell>
                    <TableCell>
                      <Badge variant={voucher.status === 'Contabilizado' ? 'outline' : 'secondary'}>
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
                           <DropdownMenuItem onClick={() => handleEdit(voucher)} disabled={voucher.status === 'Contabilizado'}>
                                Editar
                           </DropdownMenuItem>
                           {voucher.status === 'Borrador' && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleOpenContabilizarDialog(voucher)}>
                                    Contabilizar
                                </DropdownMenuItem>
                            </>
                           )}
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

        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="sm:max-w-4xl">
                 <VoucherDetailForm 
                    voucherData={selectedVoucher}
                    onSave={handleSaveVoucher}
                    onCancel={handleCancel}
                 />
            </DialogContent>
        </Dialog>

        <AlertDialog open={isContabilizarDialogOpen} onOpenChange={setIsContabilizarDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmas la acción?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Al contabilizar el comprobante, se registrará oficialmente en la contabilidad y no podrá ser editado.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleContabilizarVoucher}
                    >
                        Sí, contabilizar comprobante
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

    