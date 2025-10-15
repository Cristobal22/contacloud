'use client';

import React from 'react';
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
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Textarea } from '@/components/ui/textarea';
  import { useCollection, useFirestore } from "@/firebase"
  import { collection, addDoc, setDoc, doc, deleteDoc } from "firebase/firestore"
  import type { CostCenter } from "@/lib/types"
  
  export default function CostCentersPage({ companyId }: { companyId?: string }) {
    const firestore = useFirestore();
    const { data: costCenters, loading } = useCollection<CostCenter>({
        path: `companies/${companyId}/cost-centers`,
        companyId: companyId,
    });

    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedCenter, setSelectedCenter] = React.useState<Partial<CostCenter> | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [centerToDelete, setCenterToDelete] = React.useState<CostCenter | null>(null);


    const handleCreateNew = () => {
        setSelectedCenter({ id: `new-${Date.now()}`, name: '', description: '' });
        setIsDialogOpen(true);
    }

    const handleEdit = (center: CostCenter) => {
        setSelectedCenter(center);
        setIsDialogOpen(true);
    }

    const handleOpenDeleteDialog = (center: CostCenter) => {
        setCenterToDelete(center);
        setIsDeleteDialogOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!firestore || !companyId || !selectedCenter) return;

        const isNew = selectedCenter.id?.startsWith('new-');
        const collectionRef = collection(firestore, `companies/${companyId}/cost-centers`);

        const centerData = {
            name: selectedCenter.name || '',
            description: selectedCenter.description || '',
            companyId: companyId
        };

        try {
            if (isNew) {
                await addDoc(collectionRef, centerData);
            } else if (selectedCenter.id) {
                const docRef = doc(firestore, `companies/${companyId}/cost-centers`, selectedCenter.id);
                await setDoc(docRef, centerData, { merge: true });
            }
        } catch (error) {
            console.error("Error saving cost center:", error);
        } finally {
            setIsDialogOpen(false);
            setSelectedCenter(null);
        }
    };

    const handleDelete = async () => {
        if (!firestore || !companyId || !centerToDelete) return;
        try {
            const docRef = doc(firestore, `companies/${companyId}/cost-centers`, centerToDelete.id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting cost center:", error);
        } finally {
            setIsDeleteDialogOpen(false);
            setCenterToDelete(null);
        }
    };

    const handleFieldChange = (field: keyof Omit<CostCenter, 'id' | 'companyId'>, value: string) => {
        if (selectedCenter) {
            setSelectedCenter({ ...selectedCenter, [field]: value });
        }
    };
    
    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Centros de Costos</CardTitle>
                            <CardDescription>Gestiona los centros de costos de tu organización.</CardDescription>
                        </div>
                        <Button size="sm" className="gap-1" disabled={!companyId} onClick={handleCreateNew}>
                            <PlusCircle className="h-4 w-4" />
                            Agregar Centro de Costo
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>
                        <span className="sr-only">Acciones</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center">Cargando...</TableCell>
                        </TableRow>
                    )}
                    {!loading && costCenters?.map((center) => (
                        <TableRow key={center.id}>
                        <TableCell className="font-medium">{center.name}</TableCell>
                        <TableCell>{center.description}</TableCell>
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
                                <DropdownMenuItem onClick={() => handleEdit(center)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(center)}>
                                Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))}
                    {!loading && costCenters?.length === 0 && (
                        <TableRow>
                        <TableCell colSpan={3} className="text-center">
                            {!companyId ? "Selecciona una empresa para ver sus centros de costos." : "No se encontraron centros de costos para esta empresa."}
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{selectedCenter?.id?.startsWith('new-') ? 'Crear Centro de Costo' : 'Editar Centro de Costo'}</DialogTitle>
                        <DialogDescription>
                            Completa la información del centro de costo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nombre</Label>
                            <Input id="name" value={selectedCenter?.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2">Descripción</Label>
                            <Textarea id="description" value={selectedCenter?.description || ''} onChange={(e) => handleFieldChange('description', e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" onClick={handleSaveChanges}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Estás seguro?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el centro de costo <span className="font-bold">{centerToDelete?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDelete}>Sí, eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
  }

    