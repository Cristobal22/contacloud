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
  import type { Account, Fee } from "@/lib/types";
  import { errorEmitter } from '@/firebase/error-emitter'
  import { FirestorePermissionError } from '@/firebase/errors'
import { SelectedCompanyContext } from "../layout";
import { AccountSearchInput } from "@/components/account-search-input";

  export default function FeesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;

    const firestore = useFirestore();
    const { data: fees, loading } = useCollection<Fee>({ 
      path: companyId ? `companies/${companyId}/fees` : undefined,
      companyId: companyId 
    });
    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
      path: companyId ? `companies/${companyId}/accounts` : undefined,
      companyId
    });

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedFee, setSelectedFee] = React.useState<Partial<Fee> | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [feeToDelete, setFeeToDelete] = React.useState<Fee | null>(null);

    const handleCreateNew = () => {
        setSelectedFee({
            id: `new-${Date.now()}`,
            date: new Date().toISOString().substring(0,10),
            documentType: 'Boleta de Honorarios',
            documentNumber: '',
            issuer: '',
            grossAmount: 0,
            retention: 0.1375, // Default retention
            netAmount: 0,
            total: 0,
            status: 'Pendiente',
            companyId: companyId,
            serviceDescription: '',
            expenseAccount: ''
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
        
        const feeData: Omit<Fee, 'id'> = {
          date: selectedFee.date || new Date().toISOString().substring(0,10),
          documentType: selectedFee.documentType || 'Boleta de Honorarios',
          documentNumber: selectedFee.documentNumber || '',
          issuer: selectedFee.issuer || '',
          grossAmount: selectedFee.grossAmount || 0,
          retention: selectedFee.retention || 0,
          netAmount: selectedFee.netAmount || 0,
          total: selectedFee.total || 0,
          status: selectedFee.status || 'Pendiente',
          companyId: companyId,
          serviceDescription: selectedFee.serviceDescription || '',
          expenseAccount: selectedFee.expenseAccount || ''
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
        let updatedFee = { ...selectedFee, [field]: value };
    
        if (field === 'grossAmount' || field === 'retention') {
          const grossAmount = field === 'grossAmount' ? Number(value) : updatedFee.grossAmount || 0;
          const retention = field === 'retention' ? Number(value) : updatedFee.retention || 0;
          
          const retentionAmount = Math.round(grossAmount * retention);
          const netAmount = grossAmount - retentionAmount;
    
          updatedFee = { ...updatedFee, netAmount, total: netAmount };
        }
    
        setSelectedFee(updatedFee);
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
                    <TableHead>Monto Bruto</TableHead>
                    <TableHead>Retención</TableHead>
                    <TableHead>Monto Líquido</TableHead>
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
                        <TableCell colSpan={9} className="text-center">Cargando...</TableCell>
                    </TableRow>
                )}
                {!loading && fees?.map((fee) => (
                    <TableRow key={fee.id}>
                    <TableCell>{new Date(fee.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</TableCell>
                    <TableCell className="font-medium">{fee.documentNumber}</TableCell>
                    <TableCell>{fee.issuer}</TableCell>
                    <TableCell>${Math.round(fee.grossAmount).toLocaleString('es-CL')}</TableCell>
                    <TableCell>${Math.round(fee.grossAmount * fee.retention).toLocaleString('es-CL')}</TableCell>
                    <TableCell>${Math.round(fee.netAmount).toLocaleString('es-CL')}</TableCell>
                    <TableCell>
                        <Badge variant={
                            fee.status === 'Pagada' ? 'default' :
                            fee.status === 'Vencida' ? 'destructive' : 'secondary'
                        }>
                            {fee.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">${Math.round(fee.total).toLocaleString('es-CL')}</TableCell>
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
                        <TableCell colSpan={9} className="text-center">
                             {!companyId ? "Selecciona una empresa para ver sus honorarios." : "No se encontraron boletas de honorarios."}
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{selectedFee?.id?.startsWith('new-') ? 'Agregar Boleta' : 'Editar Boleta'}</DialogTitle>
                    <DialogDescription>
                        Rellena los detalles del documento.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="documentType">Tipo de Documento</Label>
                          <Select value={selectedFee?.documentType || ''} onValueChange={(value) => handleFieldChange('documentType', value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Boleta de Honorarios">Boleta de Honorarios</SelectItem>
                                  <SelectItem value="Boleta de Prestación de Servicios de Terceros">Boleta de Prestación de Servicios de Terceros</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="date">Fecha</Label>
                          <Input id="date" type="date" value={selectedFee?.date || ''} onChange={(e) => handleFieldChange('date', e.target.value)} />
                      </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="documentNumber">Nº Documento</Label>
                            <Input id="documentNumber" value={selectedFee?.documentNumber || ''} onChange={(e) => handleFieldChange('documentNumber', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="issuer">Emisor/Receptor</Label>
                            <Input id="issuer" value={selectedFee?.issuer || ''} onChange={(e) => handleFieldChange('issuer', e.target.value)} />
                        </div>
                     </div>
                      <div className="space-y-2">
                          <Label htmlFor="serviceDescription">Descripción del Servicio</Label>
                          <Input id="serviceDescription" value={selectedFee?.serviceDescription || ''} onChange={(e) => handleFieldChange('serviceDescription', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label htmlFor="grossAmount">Monto Bruto</Label>
                              <Input id="grossAmount" type="number" value={selectedFee?.grossAmount ?? ''} onChange={(e) => handleFieldChange('grossAmount', parseFloat(e.target.value))} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="retention">Retención (%)</Label>
                              <Input id="retention" type="number" step="0.0001" value={selectedFee?.retention ?? ''} onChange={(e) => handleFieldChange('retention', parseFloat(e.target.value))} />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label>Monto Retenido</Label>
                              <p className="font-medium">${Math.round((selectedFee?.grossAmount || 0) * (selectedFee?.retention || 0)).toLocaleString('es-CL')}</p>
                          </div>
                          <div className="space-y-2">
                              <Label>Monto Líquido</Label>
                              <p className="font-medium">${Math.round(selectedFee?.netAmount || 0).toLocaleString('es-CL')}</p>
                          </div>
                      </div>
                     <AccountSearchInput 
                        label="Cuenta de Gasto" 
                        value={selectedFee?.expenseAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleFieldChange('expenseAccount', value)}
                    />
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
