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
  import { doc, updateDoc } from "firebase/firestore"
  import type { Voucher } from "@/lib/types"
  import Link from "next/link"
  import { errorEmitter } from '@/firebase/error-emitter'
  import { FirestorePermissionError } from '@/firebase/errors'
import { SelectedCompanyContext } from "../layout"
  
  export default function VouchersPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;

    const firestore = useFirestore();
    const { data: vouchers, loading } = useCollection<Voucher>({ 
      path: `companies/${companyId}/vouchers`,
      companyId: companyId 
    });

    const [isContabilizarDialogOpen, setIsContabilizarDialogOpen] = React.useState(false);
    const [voucherToContabilizar, setVoucherToContabilizar] = React.useState<Voucher | null>(null);

    const handleOpenContabilizarDialog = (voucher: Voucher) => {
        setVoucherToContabilizar(voucher);
        setIsContabilizarDialogOpen(true);
    }

    const handleContabilizarVoucher = () => {
        if (!firestore || !companyId || !voucherToContabilizar) return;

        const docRef = doc(firestore, `companies/${companyId}/vouchers`, voucherToContabilizar.id);
        const updateData = { status: 'Contabilizado' };

        setIsContabilizarDialogOpen(false);
        setVoucherToContabilizar(null);

        updateDoc(docRef, updateData)
          .catch(err => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: docRef.path,
              operation: 'update',
              requestResourceData: updateData,
            }));
          });
    };

    return (
      <>
        <Card>
          <CardHeader>
              <div className="flex items-center justify-between">
                  <div>
                      <CardTitle>Comprobantes Contables</CardTitle>
                      <CardDescription>Gestiona los comprobantes de la empresa.</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1" disabled={!companyId} asChild>
                    <Link href="/dashboard/vouchers/edit/new">
                      <PlusCircle className="h-4 w-4" />
                      Agregar Comprobante
                    </Link>
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
                           <DropdownMenuItem asChild disabled={voucher.status === 'Contabilizado'}>
                                <Link href={`/dashboard/vouchers/edit/${voucher.id}`}>Editar</Link>
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
