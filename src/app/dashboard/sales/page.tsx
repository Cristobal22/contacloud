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
  import type { Sale } from "@/lib/types";
  import { errorEmitter } from '@/firebase/error-emitter'
  import { FirestorePermissionError } from '@/firebase/errors'
import { SelectedCompanyContext } from "../layout";

  export default function SalesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;

    const firestore = useFirestore();
    const { data: sales, loading } = useCollection<Sale>({ 
      path: companyId ? `companies/${companyId}/sales` : undefined,
      companyId: companyId 
    });

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedSale, setSelectedSale] = React.useState<Partial<Sale> | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [saleToDelete, setSaleToDelete] = React.useState<Sale | null>(null);

    const handleCreateNew = () => {
        setSelectedSale({
            id: `new-${Date.now()}`,
            date: new Date().toISOString().substring(0,10),
            documentNumber: '',
            customer: '',
            total: 0,
            status: 'Pendiente',
            companyId: companyId,
        });
        setIsFormOpen(true);
    };

    const handleEdit = (sale: Sale) => {
        setSelectedSale(sale);
        setIsFormOpen(true);
    };

    const handleOpenDeleteDialog = (sale: Sale) => {
        setSaleToDelete(sale);
        setIsDeleteDialogOpen(true);
    };

     const handleSave = () => {
        if (!firestore || !companyId || !selectedSale) return;

        const isNew = selectedSale.id?.startsWith('new-');
        const collectionPath = `companies/${companyId}/sales`;
        const collectionRef = collection(firestore, collectionPath);
        
        const saleData = {
          date: selectedSale.date || new Date().toISOString().substring(0,10),
          documentNumber: selectedSale.documentNumber || '',
          customer: selectedSale.customer || '',
          total: selectedSale.total || 0,
          status: selectedSale.status || 'Pendiente',
          companyId: companyId
        };
        
        setIsFormOpen(false);
        setSelectedSale(null);

        if (isNew) {
            addDoc(collectionRef, saleData)
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: collectionPath,
                        operation: 'create',
                        requestResourceData: saleData,
                    }));
                });
        } else if (selectedSale.id) {
            const docRef = doc(firestore, collectionPath, selectedSale.id);
            setDoc(docRef, saleData, { merge: true })
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: saleData,
                    }));
                });
        }
    };

    const handleDelete = () => {
        if (!firestore || !companyId || !saleToDelete) return;
        const docRef = doc(firestore, `companies/${companyId}/sales`, saleToDelete.id);
        
        setIsDeleteDialogOpen(false);
        setSaleToDelete(null);

        deleteDoc(docRef)
            .catch(err => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                }));
            });
    };
    
    const handleFieldChange = (field: keyof Sale, value: string | number) => {
        if (selectedSale) {
            setSelectedSale({ ...selectedSale, [field]: value });
        }
    };

    return (
      <>
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Ventas</CardTitle>
                    <CardDescription>Gestiona tus documentos de venta.</CardDescription>
                </div>
                <Button size="sm" className="gap-1" onClick={handleCreateNew} disabled={!companyId}>
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
                {loading && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
                    </TableRow>
                )}
                {!loading && sales?.map((sale) => (
                    <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleEdit(sale)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(sale)}>Anular</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                {!loading && sales?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">
                            {!companyId ? "Selecciona una empresa para ver sus ventas." : "No se encontraron documentos de venta."}
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
                    <DialogTitle>{selectedSale?.id?.startsWith('new-') ? 'Agregar Venta' : 'Editar Venta'}</DialogTitle>
                    <DialogDescription>
                        Rellena los detalles del documento.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Fecha</Label>
                        <Input id="date" type="date" value={selectedSale?.date || ''} onChange={(e) => handleFieldChange('date', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="documentNumber" className="text-right">Nº Documento</Label>
                        <Input id="documentNumber" value={selectedSale?.documentNumber || ''} onChange={(e) => handleFieldChange('documentNumber', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="customer" className="text-right">Cliente</Label>
                        <Input id="customer" value={selectedSale?.customer || ''} onChange={(e) => handleFieldChange('customer', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="total" className="text-right">Total</Label>
                        <Input id="total" type="number" value={selectedSale?.total ?? ''} onChange={(e) => handleFieldChange('total', parseFloat(e.target.value))} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Estado</Label>
                        <Select value={selectedSale?.status || 'Pendiente'} onValueChange={(value) => handleFieldChange('status', value)}>
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
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el documento de venta.
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
