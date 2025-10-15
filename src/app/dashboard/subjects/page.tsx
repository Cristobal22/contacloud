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
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { useCollection, useFirestore } from "@/firebase"
  import { collection, addDoc, setDoc, doc } from "firebase/firestore"
  import type { Subject } from "@/lib/types"
  import { errorEmitter } from '@/firebase/error-emitter'
  import { FirestorePermissionError } from '@/firebase/errors'

  export default function SubjectsPage({ companyId }: { companyId?: string }) {
    const firestore = useFirestore();
    const { data: subjects, loading } = useCollection<Subject>({ 
      path: `companies/${companyId}/subjects`,
      companyId: companyId 
    });

    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedSubject, setSelectedSubject] = React.useState<Partial<Subject> | null>(null);

    const handleCreateNew = () => {
        setSelectedSubject({
            id: `new-${Date.now()}`,
            name: '',
            rut: '',
            type: 'Cliente',
            status: 'Active',
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (subject: Subject) => {
        setSelectedSubject(subject);
        setIsDialogOpen(true);
    };

    const handleSaveSubject = () => {
        if (!firestore || !companyId || !selectedSubject) return;

        const isNew = selectedSubject.id?.startsWith('new-');
        const collectionPath = `companies/${companyId}/subjects`;
        const collectionRef = collection(firestore, collectionPath);
        
        const subjectData = {
          name: selectedSubject.name || '',
          rut: selectedSubject.rut || '',
          type: selectedSubject.type || 'Otro',
          status: selectedSubject.status || 'Inactive',
          companyId: companyId
        };
        
        setIsDialogOpen(false);
        setSelectedSubject(null);

        if (isNew) {
            addDoc(collectionRef, subjectData)
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: collectionPath,
                        operation: 'create',
                        requestResourceData: subjectData,
                    }));
                });
        } else {
            if (selectedSubject.id) {
                const docRef = doc(firestore, collectionPath, selectedSubject.id);
                setDoc(docRef, subjectData, { merge: true })
                    .catch(err => {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({
                            path: docRef.path,
                            operation: 'update',
                            requestResourceData: subjectData,
                        }));
                    });
            }
        }
    };
    
    const handleFieldChange = (field: keyof Subject, value: string) => {
        if (selectedSubject) {
            setSelectedSubject({ ...selectedSubject, [field]: value });
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Sujetos</CardTitle>
                            <CardDescription>Gestiona los sujetos (clientes, proveedores, etc.).</CardDescription>
                        </div>
                        <Button size="sm" className="gap-1" disabled={!companyId} onClick={handleCreateNew}>
                            <PlusCircle className="h-4 w-4" />
                            Agregar Sujeto
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>RUT</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>
                        <span className="sr-only">Acciones</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading && (
                        <TableRow>
                        <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
                        </TableRow>
                    )}
                    {!loading && subjects?.map((subject) => (
                        <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>{subject.rut}</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{subject.type}</Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant={subject.status === 'Active' ? "default" : "outline"}>
                            {subject.status === 'Active' ? "Activo" : "Inactivo"}
                            </Badge>
                        </TableCell>
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
                                <DropdownMenuItem onClick={() => handleEdit(subject)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem>Ver Movimientos</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))}
                    {!loading && subjects?.length === 0 && (
                        <TableRow>
                        <TableCell colSpan={5} className="text-center">
                            {!companyId ? "Selecciona una empresa para ver sus sujetos." : "No se encontraron sujetos para esta empresa."}
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
                        <DialogTitle>{selectedSubject?.id?.startsWith('new-') ? 'Crear Nuevo Sujeto' : 'Editar Sujeto'}</DialogTitle>
                        <DialogDescription>
                            Rellena los detalles del sujeto aquí. Haz clic en guardar cuando termines.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nombre</Label>
                            <Input id="name" value={selectedSubject?.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rut" className="text-right">RUT</Label>
                            <Input id="rut" value={selectedSubject?.rut || ''} onChange={(e) => handleFieldChange('rut', e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Tipo</Label>
                            <Select value={selectedSubject?.type || 'Otro'} onValueChange={(value) => handleFieldChange('type', value)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecciona un tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cliente">Cliente</SelectItem>
                                    <SelectItem value="Proveedor">Proveedor</SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Estado</Label>
                            <Select value={selectedSubject?.status || 'Inactive'} onValueChange={(value) => handleFieldChange('status', value)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecciona un estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Activo</SelectItem>
                                    <SelectItem value="Inactive">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" onClick={handleSaveSubject}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
  }
