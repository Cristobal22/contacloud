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
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Switch } from "@/components/ui/switch"
  import { useCollection, useFirestore } from "@/firebase"
  import { collection, addDoc, setDoc, doc, deleteDoc } from "firebase/firestore"
  import type { Company } from "@/lib/types"
  import Link from "next/link"
  
  export default function CompaniesPage() {
    const firestore = useFirestore();
    const companiesCollection = firestore ? collection(firestore, 'companies') : null;
    const { data: companies, loading } = useCollection<Company>({ query: companiesCollection });

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedCompany, setSelectedCompany] = React.useState<Partial<Company> | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [companyToDelete, setCompanyToDelete] = React.useState<Company | null>(null);

    const handleCreateNew = () => {
        setSelectedCompany({ id: `new-${Date.now()}`, name: '', industry: '', active: true });
        setIsFormOpen(true);
    };

    const handleEdit = (company: Company) => {
        setSelectedCompany(company);
        setIsFormOpen(true);
    };
    
    const handleOpenDeleteDialog = (company: Company) => {
        setCompanyToDelete(company);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!firestore || !companyToDelete) return;
        try {
            const docRef = doc(firestore, 'companies', companyToDelete.id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting company:", error);
        } finally {
            setIsDeleteDialogOpen(false);
            setCompanyToDelete(null);
        }
    };

    const handleSave = async () => {
        if (!firestore || !selectedCompany) return;

        const isNew = selectedCompany.id?.startsWith('new-');
        const companyData = {
            name: selectedCompany.name || 'Sin Nombre',
            industry: selectedCompany.industry || 'No especificada',
            active: selectedCompany.active ?? true,
        };

        try {
            if (isNew) {
                await addDoc(collection(firestore, 'companies'), companyData);
            } else if (selectedCompany.id) {
                const docRef = doc(firestore, 'companies', selectedCompany.id);
                await setDoc(docRef, companyData, { merge: true });
            }
        } catch (error) {
            console.error("Error saving company:", error);
        } finally {
            setIsFormOpen(false);
            setSelectedCompany(null);
        }
    };

    const handleFieldChange = (field: keyof Omit<Company, 'id'>, value: string | boolean) => {
        if (selectedCompany) {
            setSelectedCompany({ ...selectedCompany, [field]: value });
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
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/companies/settings`}>Configuración</Link>
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
                    <DialogTitle>{selectedCompany?.id?.startsWith('new-') ? 'Crear Nueva Empresa' : 'Editar Empresa'}</DialogTitle>
                    <DialogDescription>
                        Rellena los detalles de la empresa.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nombre</Label>
                        <Input id="name" value={selectedCompany?.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="industry" className="text-right">Industria</Label>
                        <Input id="industry" value={selectedCompany?.industry || ''} onChange={(e) => handleFieldChange('industry', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="active" className="text-right">Activa</Label>
                        <div className="col-span-3">
                           <Switch id="active" checked={selectedCompany?.active || false} onCheckedChange={(checked) => handleFieldChange('active', checked)} />
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
    