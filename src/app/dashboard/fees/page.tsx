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
  import type { Fee } from "@/lib/types";
  import { errorEmitter } from '@/firebase/error-emitter'
  import { FirestorePermissionError } from '@/firebase/errors'
import { SelectedCompanyContext } from "../layout";

  export default function FeesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;

    const firestore = useFirestore();
    const { data: fees, loading } = useCollection<Fee>({ 
      path: `companies/${companyId}/fees`,
      companyId: companyId 
    });

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedFee, setSelectedFee] = React.useState<Partial<Fee> | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [feeToDelete, setFeeToDelete] = React.useState<Fee | null>(null);

    const handleCreateNew = () => {
        setSelectedFee({
            id: `new-${Date.now()}`,
            date: new Date().toISOString().substring(0,10),
            documentNumber: '',
            issuer: '',
            total: 0,
            status: 'Pendiente',
        });
        setIsFormOpen(true);
    };

    const handleEdit = (fee: Fee) => {
        setSelectedFee(fee);
        setIsFormOpen(true);
    };

    const handleOpenDeleteDialog = (fee: Fee) => {
        setFeeToDelete(fee);
        setIsDeleteDialogOpen(true);
    };

     const handleSave = () => {
        if (!firestore || !companyId || !selectedFee) return;

        const isNew = selectedFee.id?.startsWith('new-');
        const collectionPath = `companies/${companyId}/fees`;
        const collectionRef = collection(firestore, collectionPath);
        
        const feeData = {
          date: selectedFee.date || new Date().toISOString().substring(0,10),
          documentNumber: selectedFee.documentNumber || '',
          issuer: selectedFee.issuer || '',
          total: selectedFee.total || 0,
          status: selectedFee.status || 'Pendiente',
          companyId: companyId
        };
        
        setIsFormOpen(false);
        setSelectedFee(null);

        if (isNew) {
            addDoc(collectionRef, feeData)
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: collectionPath,
                        operation: 'create',
                        requestResourceData: feeData,
                    }));
                });
        } else if (selectedFee.id) {
            const docRef = doc(firestore, collectionPath, selectedFee.id);
            setDoc(docRef, feeData, { merge: true })
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: feeData,
                    }));
                });
        }
    };

    const handleDelete = () => {
        if (!firestore || !companyId || !feeToDelete) return;
        const docRef = doc(firestore, `companies/${companyId}/fees`, feeToDelete.id);

        setIsDeleteDialogOpen(false);
        setFeeToDelete(null);

        deleteDoc(docRef)
            .catch(err => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                }));
            });
    };
    
    const handleFieldChange = (field: keyof Fee, value: string | number) => {
        if (selectedFee) {
            setSelectedFee({ ...selectedFee, [field]: value });
        }
    };


    return (
      <>
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Honorarios</CardTitle>
                        <CardDescription>Gestiona tus boletas de honorarios emitidas y recibidas.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-1" onClick={handleCreateNew} disabled={!companyId}>
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
                {loading && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
                    </TableRow>
                )}
                {!loading && fees?.map((fee) => (
                    <TableRow key={fee.id}>
                    <TableCell>{new Date(fee.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleEdit(fee)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(fee)}>Anular</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                {!loading && fees?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">
                             {!companyId ? "Selecciona una empresa para ver sus honorarios." : "No se encontraron boletas de honorarios."}
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
                    <DialogTitle>{selectedFee?.id?.startsWith('new-') ? 'Agregar Boleta' : 'Editar Boleta'}</DialogTitle>
                    <DialogDescription>
                        Rellena los detalles del documento.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Fecha</Label>
                        <Input id="date" type="date" value={selectedFee?.date || ''} onChange={(e) => handleFieldChange('date', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="documentNumber" className="text-right">Nº Documento</Label>
                        <Input id="documentNumber" value={selectedFee?.documentNumber || ''} onChange={(e) => handleFieldChange('documentNumber', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="issuer" className="text-right">Emisor/Receptor</Label>
                        <Input id="issuer" value={selectedFee?.issuer || ''} onChange={(e) => handleFieldChange('issuer', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="total" className="text-right">Total</Label>
                        <Input id="total" type="number" value={selectedFee?.total ?? ''} onChange={(e) => handleFieldChange('total', parseFloat(e.target.value))} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Estado</Label>
                        <Select value={selectedFee?.status || 'Pendiente'} onValueChange={(value) => handleFieldChange('status', value)}>
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
                        Esta acción no se puede deshacer. Esto eliminará permanentemente la boleta de honorarios.
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
