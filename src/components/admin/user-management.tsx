
'use client';

import React from 'react';
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
import { useFirestore, useAuth, useCollection } from "@/firebase"
import type { UserProfile, Company } from "@/lib/types"
import { doc, setDoc, updateDoc, collection } from "firebase/firestore"
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '../ui/skeleton';
import { setUserRole } from '@/ai/flows/set-user-role-flow';


type NewUserInput = {
  email: string;
  displayName: string;
};

export default function UserManagement() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();

    const { data: users, loading: usersLoading, error } = useCollection<UserProfile>({ path: 'users' });
    const { data: companies, loading: companiesLoading } = useCollection<Company>({ path: 'companies' });
    
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);

    const [newUser, setNewUser] = useState<NewUserInput>({email: '', displayName: ''});
    const [selectedUser, setSelectedUser] = useState<Partial<UserProfile> | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreateNew = () => {
        setNewUser({email: '', displayName: ''});
        setIsCreateFormOpen(true);
    };

     const handleEditUser = (user: UserProfile) => {
        setSelectedUser({
            ...user,
            companyIds: user.companyIds || [] // Ensure companyIds is an array
        });
        setIsEditFormOpen(true);
    };

    const handleCreateUser = async () => {
        if (!auth || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Servicios de Firebase no disponibles.' });
            return;
        }
        if (!newUser.email) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, complete el correo electrónico.' });
            return;
        }

        setIsProcessing(true);

        try {
            // This is a temporary password, user will be forced to reset it.
            const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
            const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, tempPassword);
            const user = userCredential.user;

            const newUserProfile: UserProfile = {
                uid: user.uid,
                email: user.email!,
                displayName: newUser.displayName || user.email!.split('@')[0],
                role: 'Accountant', // All users created here are Accountants by default
                photoURL: `https://i.pravatar.cc/150?u=${user.uid}`,
                companyIds: []
            };

            // Set the user profile in Firestore
            await setDoc(doc(firestore, 'users', user.uid), newUserProfile);
            
            // Send password reset email
            await sendPasswordResetEmail(auth, user.email!);

            toast({
                title: 'Usuario Creado y Correo Enviado',
                description: `Se ha enviado un correo a ${user.email} para que establezca su contraseña.`,
            });
            
            setIsCreateFormOpen(false);

        } catch (error: any) {
            console.error('Error creating user:', error);
            if (error.code === 'auth/email-already-in-use') {
                toast({ variant: 'destructive', title: 'Error al Crear Usuario', description: 'El correo electrónico ya está en uso.' });
            } else {
                toast({ variant: 'destructive', title: 'Error al Crear Usuario', description: 'Ocurrió un error inesperado.' });
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!firestore || !selectedUser || !selectedUser.uid) return;

        setIsProcessing(true);
        const userRef = doc(firestore, 'users', selectedUser.uid);

        try {
            await updateDoc(userRef, {
                displayName: selectedUser.displayName,
                companyIds: selectedUser.companyIds || []
            });
            toast({ title: "Usuario actualizado", description: "Los datos del usuario han sido actualizados." });
            setIsEditFormOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error al actualizar', description: 'No se pudieron guardar los cambios.' });
            console.error('Error updating user:', error);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleNewUserFieldChange = (field: keyof NewUserInput, value: string) => {
        setNewUser(prev => ({...prev, [field]: value}));
    };

     const handleSelectedUserFieldChange = (field: keyof UserProfile, value: string | string[]) => {
        setSelectedUser(prev => prev ? ({...prev, [field]: value}) : null);
    };

    const handleCompanyCheckboxChange = (companyId: string, checked: boolean) => {
        setSelectedUser(prev => {
            if (!prev) return null;
            const currentCompanyIds = prev.companyIds || [];
            const newCompanyIds = checked 
                ? [...currentCompanyIds, companyId] 
                : currentCompanyIds.filter(id => id !== companyId);
            return { ...prev, companyIds: newCompanyIds };
        });
    }
    
    const handleChangeRole = async (uid: string, role: 'Admin' | 'Accountant') => {
        setIsProcessing(true);
        const result = await setUserRole({ uid, role });
        if (result.success) {
            toast({
                title: "Rol Actualizado",
                description: `El rol del usuario ha sido cambiado a ${role}. El usuario debe volver a iniciar sesión para que los cambios surtan efecto.`,
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Error al Cambiar Rol',
                description: result.message,
            });
        }
        setIsProcessing(false);
    }
    
    const loading = usersLoading || companiesLoading;

    const renderTableContent = () => {
        if (loading) {
            return (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <p>Cargando usuarios...</p>
                    </TableCell>
                </TableRow>
            );
        }

        if (error) {
             return (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-destructive">
                        <p>Error de permisos: No se pueden listar los usuarios.</p>
                        <p className='text-xs text-muted-foreground'>Asegúrate de que las reglas de Firestore permitan la operación 'list' en la colección 'users' para administradores.</p>
                    </TableCell>
                </TableRow>
            );
        }

        if (!users || users.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No se encontraron usuarios.
                    </TableCell>
                </TableRow>
            );
        }

        return users.map(user => (
            <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.displayName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.companyIds?.length || 0}</TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isProcessing}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleEditUser(user)}>Editar / Asignar Empresas</DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>Cambiar Rol</DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem disabled={user.role === 'Admin'} onSelect={() => handleChangeRole(user.uid, 'Admin')}>
                                            Hacer Administrador
                                        </DropdownMenuItem>
                                        <DropdownMenuItem disabled={user.role === 'Accountant'} onSelect={() => handleChangeRole(user.uid, 'Accountant')}>
                                            Hacer Contador
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
        ));
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Gestión de Usuarios</CardTitle>
                            <CardDescription>Invita nuevos contadores y asígnales empresas.</CardDescription>
                        </div>
                         <Button size="sm" className="gap-1" onClick={handleCreateNew}>
                            <PlusCircle className="h-4 w-4" />
                            Agregar Usuario
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Empresas Asignadas</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {renderTableContent()}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Invitar Nuevo Contador</DialogTitle>
                        <DialogDescription>
                            Ingresa el correo y nombre del nuevo usuario. Se enviará un correo para que establezca su contraseña.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-name" className="text-right">Nombre</Label>
                            <Input id="new-name" value={newUser.displayName || ''} onChange={(e) => handleNewUserFieldChange('displayName', e.target.value)} className="col-span-3" placeholder="Alex Doe" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-email" className="text-right">Email</Label>
                            <Input id="new-email" type="email" value={newUser.email} onChange={(e) => handleNewUserFieldChange('email', e.target.value)} className="col-span-3" placeholder="usuario@contador.com" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" disabled={isProcessing}>Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" onClick={handleCreateUser} disabled={isProcessing}>
                            {isProcessing ? 'Creando...' : 'Crear e Invitar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             {/* Edit User Dialog */}
            <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Usuario</DialogTitle>
                        <DialogDescription>
                            Modifica el nombre y asigna las empresas a las que este usuario tiene acceso.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="grid gap-6 py-4">
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-right">Nombre</Label>
                                <Input id="edit-name" value={selectedUser.displayName || ''} onChange={(e) => handleSelectedUserFieldChange('displayName', e.target.value)} className="col-span-3" />
                            </div>
                            <div>
                                <Label>Empresas Asignadas</Label>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 rounded-lg border p-4 max-h-60 overflow-y-auto">
                                    {companiesLoading && (
                                        <div className="col-span-full space-y-2">
                                            <Skeleton className="h-5 w-3/4" />
                                            <Skeleton className="h-5 w-1/2" />
                                            <Skeleton className="h-5 w-2/3" />
                                        </div>
                                    )}
                                    {companies?.map(company => (
                                        <div key={company.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`company-${company.id}`}
                                                checked={(selectedUser.companyIds || []).includes(company.id)}
                                                onCheckedChange={(checked) => handleCompanyCheckboxChange(company.id, !!checked)}
                                            />
                                            <Label htmlFor={`company-${company.id}`} className="font-normal">{company.name}</Label>
                                        </div>
                                    ))}
                                    {!companiesLoading && companies?.length === 0 && <p className="text-sm text-muted-foreground">No hay empresas para asignar.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" disabled={isProcessing}>Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" onClick={handleUpdateUser} disabled={isProcessing}>
                            {isProcessing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
