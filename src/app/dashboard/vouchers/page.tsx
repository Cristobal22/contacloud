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
  import { useCollection } from "@/firebase/firestore/use-collection"
  import { doc, updateDoc, deleteDoc, writeBatch, collection, query, where, getDocs, Timestamp } from "firebase/firestore"
  import type { Voucher, Purchase } from "@/lib/types"
  import Link from "next/link"
  import { errorEmitter } from '@/firebase/error-emitter'
  import { FirestorePermissionError } from '@/firebase/errors'
import { SelectedCompanyContext } from "../../layout"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/firebase/config"
  
  export default function VouchersPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;

    const { toast } = useToast();
    const { data: vouchers, loading } = useCollection<Voucher>({ 
      path: companyId ? `companies/${companyId}/vouchers` : undefined,
    });

    const [isContabilizarDialogOpen, setIsContabilizarDialogOpen] = React.useState(false);
    const [voucherToContabilizar, setVoucherToContabilizar] = React.useState<Voucher | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [voucherToDelete, setVoucherToDelete] = React.useState<Voucher | null>(null);

    const [isUndoDialogOpen, setIsUndoDialogOpen] = React.useState(false);
    const [voucherToUndo, setVoucherToUndo] = React.useState<Voucher | null>(null);

    const handleOpenContabilizarDialog = (voucher: Voucher) => {
        setVoucherToContabilizar(voucher);
        setIsContabilizarDialogOpen(true);
    }
    
    const handleOpenDeleteDialog = (voucher: Voucher) => {
        setVoucherToDelete(voucher);
        setIsDeleteDialogOpen(true);
    };

    const handleOpenUndoDialog = (voucher: Voucher) => {
        setVoucherToUndo(voucher);
        setIsUndoDialogOpen(true);
    };

    const handleContabilizarVoucher = () => {
        if (!companyId || !voucherToContabilizar) return;

        const docRef = doc(db, `companies/${companyId}/vouchers`, voucherToContabilizar.id);
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

    const handleDelete = () => {
        if (!companyId || !voucherToDelete) return;
        const docRef = doc(db, `companies/${companyId}/vouchers`, voucherToDelete.id);

        setIsDeleteDialogOpen(false);
        setVoucherToDelete(null);

        deleteDoc(docRef)
            .catch(err => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                }));
            });
    };

    const handleUndoCentralization = async () => {
        if (!companyId || !voucherToUndo) return;

        const voucherRef = doc(db, `companies/${companyId}/vouchers`, voucherToUndo.id);
        const isPurchase = voucherToUndo.description.includes('Compras');
        const collectionName = isPurchase ? 'purchases' : 'sales';
        
        try {
            const docsQuery = query(
                collection(db, `companies/${companyId}/${collectionName}`),
                where('voucherId', '==', voucherToUndo.id)
            );
            const docsSnapshot = await getDocs(docsQuery);

            const batch = writeBatch(db);

            // Revert associated documents status
            docsSnapshot.forEach(docToUpdate => {
                const docRef = doc(db, `companies/${companyId}/${collectionName}`, docToUpdate.id);
                batch.update(docRef, { status: 'Pendiente', voucherId: '' });
            });

            // Delete the voucher
            batch.delete(voucherRef);

            await batch.commit();

            toast({
                title: "Centralización Anulada",
                description: `El comprobante ha sido eliminado y los documentos asociados han vuelto al estado 'Pendiente'.`,
            });

        } catch (error) {
            console.error("Error undoing centralization:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo anular la centralización." });
        } finally {
            setIsUndoDialogOpen(false);
            setVoucherToUndo(null);
        }
    };

    const formatDate = (date: any) => {
      if (date instanceof Timestamp) {
        return date.toDate().toLocaleDateString('es-CL', { timeZone: 'UTC' });
      }
      return new Date(date).toLocaleDateString('es-CL', { timeZone: 'UTC' });
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
                  <Button size="sm" className="gap-1" disabled={!companyId} asChild>
                    <Link href={`/dashboard/vouchers/edit/new`}>
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
                {!loading && vouchers?.map((voucher) => {
                  const isCentralizationVoucher = voucher.description.startsWith('Centralización');

                  return (
                    <TableRow key={voucher.id}>
                        <TableCell>{formatDate(voucher.date)}</TableCell>
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
                        <TableCell className="text-right">${Math.round(voucher.total).toLocaleString('es-CL')}</TableCell>
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
                                    <Link href={`/dashboard/vouchers/edit/${voucher.id}`}>Editar</Link>
                              </DropdownMenuItem>
                              {voucher.status === 'Borrador' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleOpenContabilizarDialog(voucher)}>
                                        Contabilizar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(voucher)}>
                                        Eliminar
                                    </DropdownMenuItem>
                                </>
                              )}
                              {isCentralizationVoucher && voucher.status === 'Contabilizado' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleOpenUndoDialog(voucher)}>
                                    Anular Centralización
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                    </TableRow>
                  );
                })}
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

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el comprobante <span className="font-bold">{voucherToDelete?.description}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className={buttonVariants({ variant: "destructive" })}
                        onClick={handleDelete}
                    >
                        Sí, eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        
        <AlertDialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de anular la centralización?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción es irreversible. Se eliminará el comprobante de centralización <span className="font-bold">{voucherToUndo?.description}</span> y todos los documentos asociados volverán al estado 'Pendiente'.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className={buttonVariants({ variant: "destructive" })}
                        onClick={handleUndoCentralization}
                    >
                        Sí, anular centralización
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }
