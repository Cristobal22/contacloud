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
  import { Switch } from "@/components/ui/switch"
  import { useCollection, useFirestore } from "@/firebase"
  import { collection, addDoc, setDoc, doc, deleteDoc } from "firebase/firestore"
  import type { Company } from "@/lib/types"
  import Link from "next/link"
  import { useRouter } from 'next/navigation'
  import { SelectedCompanyContext } from '../layout'
  import { errorEmitter } from '@/firebase/error-emitter'
  import { FirestorePermissionError } from '@/firebase/errors'

  
  export default function CompaniesPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { setSelectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companiesCollection = firestore ? collection(firestore, 'companies') : null;
    const { data: companies, loading } = useCollection<Company>({ query: companiesCollection });

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedCompanyLocal, setSelectedCompanyLocal] = React.useState<Partial<Company> | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [companyToDelete, setCompanyToDelete] = React.useState<Company | null>(null);

    const handleCreateNew = () => {
        setSelectedCompanyLocal({ id: `new-${Date.now()}`, name: '', industry: '', active: true });
        setIsFormOpen(true);
    };

    const handleEdit = (company: Company) => {
        setSelectedCompanyLocal(company);
        setIsFormOpen(true);
    };
    
    const handleOpenDeleteDialog = (company: Company) => {
        setCompanyToDelete(company);
        setIsDeleteDialogOpen(true);
    };

    const handleGoToSettings = (company: Company) => {
      if (setSelectedCompany) {
        setSelectedCompany(company);
        router.push('/dashboard/companies/settings');
      }
    };

    const handleDelete = () => {
        if (!firestore || !companyToDelete) return;
        const docRef = doc(firestore, 'companies', companyToDelete.id);
        
        setIsDeleteDialogOpen(false);
        setCompanyToDelete(null);

        deleteDoc(docRef)
            .catch(err => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                }));
            });
    };

    const handleSave = () => {
        if (!firestore || !selectedCompanyLocal) return;

        const isNew = selectedCompanyLocal.id?.startsWith('new-');
        const companyData = {
            name: selectedCompanyLocal.name || 'Sin Nombre',
            industry: selectedCompanyLocal.industry || 'No especificada',
            active: selectedCompanyLocal.active ?? true,
        };
        
        setIsFormOpen(false);
        setSelectedCompanyLocal(null);

        if (isNew) {
            addDoc(collection(firestore, 'companies'), companyData)
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: 'companies',
                        operation: 'create',
                        requestResourceData: companyData,
                    }));
                });
        } else if (selectedCompanyLocal.id) {
            const docRef = doc(firestore, 'companies', selectedCompanyLocal.id);
            setDoc(docRef, companyData, { merge: true })
                .catch(err => {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: companyData,
                    }));
                });
        }
    };

    const handleFieldChange = (field: keyof Omit<Company, 'id'>, value: string | boolean) => {
        if (selectedCompanyLocal) {
            setSelectedCompanyLocal({ ...selectedCompanyLocal, [field]: value });
        }
    };


    return (
      <>
        <Card>
          <CardHeader>
              <div className="flex items-center justify-between">
                  <div>
                      <CardTitle>Empresas</CardTitle>
                      <CardDescription>Gestiona tus empresas cliente.</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1" onClick={handleCreateNew}>
                      <PlusCircle className="h-4 w-4" />
                      Agregar Empresa
                  </Button>
              </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre de Empresa</TableHead>
                  <TableHead>Industria</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                  </TableRow>
                ) : companies && companies.length > 0 ? (
                  companies.map((company) => (
                      <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.industry}</TableCell>
                      <TableCell>
                          <Badge variant={company.active ? "default" : "outline"}>
                          {company.active ? "Activa" : "Inactiva"}
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
                              <DropdownMenuItem onClick={() => handleEdit(company)}>Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleGoToSettings(company)}>
                                Configuración
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(company)}>
                                Eliminar
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                      </TableRow>
                  ))
                ) : (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center">No se encontraron empresas.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{selectedCompanyLocal?.id?.startsWith('new-') ? 'Crear Nueva Empresa' : 'Editar Empresa'}</DialogTitle>
                    <DialogDescription>
                        Rellena los detalles de la empresa.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nombre</Label>
                        <Input id="name" value={selectedCompanyLocal?.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="industry" className="text-right">Industria</Label>
                        <Input id="industry" value={selectedCompanyLocal?.industry || ''} onChange={(e) => handleFieldChange('industry', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="active" className="text-right">Activa</Label>
                        <div className="col-span-3">
                           <Switch id="active" checked={selectedCompanyLocal?.active || false} onCheckedChange={(checked) => handleFieldChange('active', checked)} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleSave}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente la empresa <span className="font-bold">{companyToDelete?.name}</span> y todos sus datos asociados (cuentas, comprobantes, etc.).
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
      </>
    )
  }
    