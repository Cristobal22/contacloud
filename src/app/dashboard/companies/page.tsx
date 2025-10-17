
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
  import { useFirestore, useUser, useCollection } from "@/firebase"
  import { collection, addDoc, setDoc, doc, deleteDoc, updateDoc, arrayUnion, query, where, documentId, writeBatch } from "firebase/firestore"
  import type { Company } from "@/lib/types"
  import { useRouter } from 'next/navigation'
  import { SelectedCompanyContext } from '../layout'
  import { errorEmitter } from '@/firebase/error-emitter'
  import { FirestorePermissionError } from '@/firebase/errors'
  import { useToast } from '@/hooks/use-toast';
  import { useUserProfile } from '@/firebase/auth/use-user-profile';

  const planLimits: { [key: string]: number } = {
    'Individual': 5,
    'Team': 25,
    'Enterprise': Infinity,
  };
  
  export default function CompaniesPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);
    const router = useRouter();
    const { setSelectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const { toast } = useToast();

    const companiesQuery = React.useMemo(() => {
        if (!firestore || !userProfile) return null;

        // Admins should not see any companies. Return null to prevent any query.
        if (userProfile.role === 'Admin') {
            return null;
        }

        // Accountants see only their assigned companies.
        if (userProfile.role === 'Accountant' && userProfile.companyIds && userProfile.companyIds.length > 0) {
            // Firestore 'in' queries are limited to 30 elements. We slice to stay within limits.
            return query(collection(firestore, 'companies'), where(documentId(), 'in', userProfile.companyIds.slice(0, 30)));
        }

        return null; // For accountants with no companies or if no role is matched
    }, [firestore, userProfile]);

    const { data: companies, loading: companiesLoading, error } = useCollection<Company>({ 
      query: companiesQuery,
      // Disable query if the user profile is loading or if there's no valid query
      disabled: profileLoading || !companiesQuery
    });
    
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedCompanyLocal, setSelectedCompanyLocal] = React.useState<Partial<Company> | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [companyToDelete, setCompanyToDelete] = React.useState<Company | null>(null);
    
    const loading = profileLoading || (userProfile?.role !== 'Admin' && companiesLoading);

    const handleCreateNew = () => {
        const currentPlan = userProfile?.plan || 'Individual';
        const limit = planLimits[currentPlan] ?? 5;
        const currentCompanyCount = userProfile?.companyIds?.length || 0;

        if (currentCompanyCount >= limit) {
            toast({
                variant: "destructive",
                title: "Límite de Empresas Alcanzado",
                description: `Has alcanzado el límite de ${limit} empresas para tu plan actual. Considera mejorar tu plan.`,
            });
            return;
        }

        setSelectedCompanyLocal({ id: `new-${Date.now()}`, name: '', rut: '', address: '', giro: '', active: true, ownerId: user?.uid });
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
        
        deleteDoc(docRef)
            .then(() => {
                toast({ title: "Empresa eliminada", description: "La empresa ha sido eliminada exitosamente." });
                setIsDeleteDialogOpen(false);
                setCompanyToDelete(null);
            })
            .catch(err => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                }));
            });
    };

    const handleSave = async () => {
        if (!firestore || !user || !selectedCompanyLocal || !userProfile) return;

        const isNew = selectedCompanyLocal.id?.startsWith('new-');

        if(isNew) {
            const currentPlan = userProfile.plan || 'Individual';
            const limit = planLimits[currentPlan] ?? 5;
            const currentCompanyCount = userProfile.companyIds?.length || 0;
            if (currentCompanyCount >= limit) {
                 toast({
                    variant: "destructive",
                    title: "Límite Alcanzado",
                    description: `No puedes agregar más empresas con tu plan actual.`,
                });
                setIsFormOpen(false);
                return;
            }
        }

        if (!selectedCompanyLocal.name || !selectedCompanyLocal.rut) {
            toast({
                variant: "destructive",
                title: "Campos requeridos",
                description: "Por favor, complete al menos el Nombre y el RUT de la empresa.",
            });
            return;
        }

        setIsFormOpen(false);
        
        const companyData: Omit<Company, 'id'> = {
            name: selectedCompanyLocal.name,
            rut: selectedCompanyLocal.rut,
            active: true,
            giro: selectedCompanyLocal.giro || "No especificado",
            address: selectedCompanyLocal.address || '',
            ownerId: user.uid,
        };

        if (isNew) {
            try {
                const batch = writeBatch(firestore);
                const newCompanyRef = doc(collection(firestore, 'companies'));

                // Set the company data in the batch
                batch.set(newCompanyRef, companyData);
                
                // If creator is an accountant, add company to their list
                if (userProfile?.role === 'Accountant') {
                    const userProfileRef = doc(firestore, 'users', user.uid);
                    batch.update(userProfileRef, {
                        companyIds: arrayUnion(newCompanyRef.id)
                    });
                }
                
                await batch.commit();

                toast({
                    title: "Empresa Creada",
                    description: `${companyData.name} ha sido creada. Redirigiendo a configuración...`,
                });
                
                const newCompany: Company = { id: newCompanyRef.id, ...companyData };
                
                if (setSelectedCompany) {
                    setSelectedCompany(newCompany);
                }
                router.push('/dashboard/companies/settings');

            } catch (err) {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: 'companies',
                    operation: 'create',
                    requestResourceData: companyData,
                }));
            }
        } else if (selectedCompanyLocal.id) {
            const docRef = doc(firestore, 'companies', selectedCompanyLocal.id);
            const { ownerId, ...updateData } = companyData; 

            setDoc(docRef, updateData, { merge: true })
                .then(() => {
                    toast({ title: "Empresa actualizada", description: "Los cambios han sido guardados."});
                })
                .catch(err => {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: updateData,
                    }));
                });
        }
        setSelectedCompanyLocal(null);
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
                      <CardDescription>
                        {userProfile?.role === 'Admin' ? 'Los administradores no gestionan empresas.' : 'Gestiona tus empresas cliente.'}
                      </CardDescription>
                  </div>
                  {userProfile?.role === 'Accountant' && (
                    <Button size="sm" className="gap-1" onClick={handleCreateNew}>
                        <PlusCircle className="h-4 w-4" />
                        Agregar Empresa
                    </Button>
                  )}
              </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre de Empresa</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Giro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
                  </TableRow>
                ) : userProfile?.role === 'Admin' ? (
                   <TableRow>
                      <TableCell colSpan={5} className="text-center">La gestión de empresas no está disponible para administradores.</TableCell>
                  </TableRow>
                ) : companies && companies.length > 0 ? (
                  companies.map((company) => (
                      <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.rut}</TableCell>
                      <TableCell>{company.giro}</TableCell>
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
                          </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                      </TableRow>
                  ))
                ) : (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center">No se encontraron empresas.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{selectedCompanyLocal?.id?.startsWith('new-') ? 'Crear Nueva Empresa' : 'Editar Empresa'}</DialogTitle>
                    <DialogDescription>
                        Rellena los detalles de la empresa.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre/Razón Social</Label>
                        <Input id="name" value={selectedCompanyLocal?.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="rut">RUT</Label>
                        <Input id="rut" value={selectedCompanyLocal?.rut || ''} onChange={(e) => handleFieldChange('rut', e.target.value)} />
                    </div>
                    {/* Hide detailed fields on creation dialog */}
                    {!selectedCompanyLocal?.id?.startsWith('new-') && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input id="address" value={selectedCompanyLocal?.address || ''} onChange={(e) => handleFieldChange('address', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="giro">Giro o Actividad Comercial</Label>
                                <Input id="giro" value={selectedCompanyLocal?.giro || ''} onChange={(e) => handleFieldChange('giro', e.target.value)} />
                                <p className="text-xs text-muted-foreground">
                                    Consulte los códigos de actividad en el <a href="https://www.sii.cl/ayudas/ayudas_por_servicios/1956-codigos-1959.html" target="_blank" rel="noopener noreferrer" className="text-primary underline">sitio del SII</a>.
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <Switch id="active" checked={selectedCompanyLocal?.active || false} onCheckedChange={(checked) => handleFieldChange('active', checked)} />
                                <Label htmlFor="active">Activa</Label>
                            </div>
                        </>
                    )}
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

    

