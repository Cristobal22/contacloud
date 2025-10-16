'use client';

import React from "react";
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
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
   import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
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
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { useCollection, useFirestore } from "@/firebase"
  import { collection, addDoc, setDoc, doc, deleteDoc } from "firebase/firestore"
  import type { Purchase } from "@/lib/types";
  import { errorEmitter } from '@/firebase/error-emitter'
  import { FirestorePermissionError } from '@/firebase/errors'
import { SelectedCompanyContext } from "../layout";

  export default function PurchasesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;

    const firestore = useFirestore();
    const { data: purchases, loading } = useCollection<Purchase>({ 
      path: companyId ? `companies/${companyId}/purchases` : undefined,
      companyId: companyId 
    });

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedPurchase, setSelectedPurchase] = React.useState<Partial<Purchase> | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [purchaseToDelete, setPurchaseToDelete] = React.useState<Purchase | null>(null);

    const handleCreateNew = () => {
        setSelectedPurchase({
            id: `new-${Date.now()}`,
            date: new Date().toISOString().substring(0,10),
            documentNumber: '',
            supplier: '',
            total: 0,
            status: 'Pendiente',
            companyId: companyId,
        });
        setIsFormOpen(true);
    };

    const handleEdit = (purchase: Purchase) => {
        setSelectedPurchase(purchase);
        setIsFormOpen(true);
    };

    const handleOpenDeleteDialog = (purchase: Purchase) => {
        setPurchaseToDelete(purchase);
        setIsDeleteDialogOpen(true);
    };

     const handleSave = () => {
        if (!firestore || !companyId || !selectedPurchase) return;

        const isNew = selectedPurchase.id?.startsWith('new-');
        const collectionPath = `companies/${companyId}/purchases`;
        const collectionRef = collection(firestore, collectionPath);
        
        const purchaseData = {
          date: selectedPurchase.date || new Date().toISOString().substring(0,10),
          documentNumber: selectedPurchase.documentNumber || '',
          supplier: selectedPurchase.supplier || '',
          total: selectedPurchase.total || 0,
          status: selectedPurchase.status || 'Pendiente',
          companyId: companyId
        };
        
        setIsFormOpen(false);
        setSelectedPurchase(null);

        if (isNew) {
            addDoc(collectionRef, purchaseData)
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: collectionPath,
                        operation: 'create',
                        requestResourceData: purchaseData,
                    }));
                });
        } else if (selectedPurchase.id) {
            const docRef = doc(firestore, collectionPath, selectedPurchase.id);
            setDoc(docRef, purchaseData, { merge: true })
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: purchaseData,
                    }));
                });
        }
    };

    const handleDelete = () => {
        if (!firestore || !companyId || !purchaseToDelete) return;
        const docRef = doc(firestore, `companies/${companyId}/purchases`, purchaseToDelete.id);
        
        setIsDeleteDialogOpen(false);
        setPurchaseToDelete(null);

        deleteDoc(docRef)
            .catch(err => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                }));
            });
    };
    
    const handleFieldChange = (field: keyof Purchase, value: string | number) => {
        if (selectedPurchase) {
            setSelectedPurchase({ ...selectedPurchase, [field]: value });
        }
    };

    return (
      <>
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Compras</CardTitle>
                        <CardDescription>Gestiona tus documentos de compra.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-1" onClick={handleCreateNew} disabled={!companyId}>
                        <PlusCircle className="h-4 w-4" />
                        Agregar Compra
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Nº Documento</TableHead>
                    <TableHead>Proveedor</TableHead>
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
                {!loading && purchases?.map((purchase) => (
                    <TableRow key={purchase.id}>
                    <TableCell>{new Date(purchase.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</TableCell>
                    <TableCell className="font-medium">{purchase.documentNumber}</TableCell>
                    <TableCell>{purchase.supplier}</TableCell>
                    <TableCell>
                        <Badge variant={
                            purchase.status === 'Pagada' ? 'default' :
                            purchase.status === 'Vencida' ? 'destructive' : 'secondary'
                        }>
                            {purchase.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">${purchase.total.toLocaleString('es-CL')}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleEdit(purchase)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(purchase)}>Anular</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                {!loading && purchases?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">
                            {!companyId ? "Selecciona una empresa para ver sus compras." : "No se encontraron documentos de compra."}
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{selectedPurchase?.id?.startsWith('new-') ? 'Agregar Compra' : 'Editar Compra'}</DialogTitle>
                    <DialogDescription>
                        Rellena los detalles del documento.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Fecha</Label>
                        <Input id="date" type="date" value={selectedPurchase?.date || ''} onChange={(e) => handleFieldChange('date', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="documentNumber" className="text-right">Nº Documento</Label>
                        <Input id="documentNumber" value={selectedPurchase?.documentNumber || ''} onChange={(e) => handleFieldChange('documentNumber', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="supplier" className="text-right">Proveedor</Label>
                        <Input id="supplier" value={selectedPurchase?.supplier || ''} onChange={(e) => handleFieldChange('supplier', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="total" className="text-right">Total</Label>
                        <Input id="total" type="number" value={selectedPurchase?.total ?? ''} onChange={(e) => handleFieldChange('total', parseFloat(e.target.value))} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Estado</Label>
                        <Select value={selectedPurchase?.status || 'Pendiente'} onValueChange={(value) => handleFieldChange('status', value)}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="Pagada">Pagada</SelectItem>
                                <SelectItem value="Vencida">Vencida</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button type="submit" onClick={handleSave}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el documento de compra.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={handleDelete}>
                        Sí, eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }
