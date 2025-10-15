
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
import { useCollection, useFirestore, useAuth } from "@/firebase"
import type { UserProfile } from "@/lib/types"
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth";
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type NewUserInput = {
  email: string;
  password: string;
  displayName: string;
};

export default function UserManagement() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    
    const usersCollection = useMemo(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: users, loading } = useCollection<UserProfile>({ query: usersCollection });

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [selectedUser, setSelectedUser] = React.useState<Partial<UserProfile> | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [userToDelete, setUserToDelete] = React.useState<UserProfile | null>(null);

    const [newUser, setNewUser] = useState<NewUserInput>({email: '', password: '', displayName: ''});
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateNew = () => {
        setNewUser({email: '', password: '', displayName: ''});
        setIsCreateFormOpen(true);
    };

    const handleEdit = (user: UserProfile) => {
        setSelectedUser(user);
        setIsFormOpen(true);
    };
    
    const handleOpenDeleteDialog = (user: UserProfile) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const handleSaveRole = () => {
        if (!firestore || !selectedUser || !selectedUser.uid) return;

        const { uid, ...userData } = selectedUser;
        const docRef = doc(firestore, 'users', uid);

        const dataToSave = {
            ...userData,
            role: userData.role || 'Accountant',
        };

        setDoc(docRef, dataToSave, { merge: true })
            .catch(err => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: dataToSave,
                }));
            });
        
        setIsFormOpen(false);
        setSelectedUser(null);
    };

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, complete todos los campos obligatorios.' });
            return;
        }
        if (!auth || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'La base de datos o el servicio de autenticación no están disponibles.' });
            return;
        }

        setIsCreating(true);
        try {
            // Step 1: Create the auth user directly
            const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
            const authUser = userCredential.user;
            
            // Step 2: Create the user profile object for Firestore
            const newUserProfile: UserProfile = {
                uid: authUser.uid,
                email: newUser.email,
                displayName: newUser.displayName || newUser.email.split('@')[0],
                role: 'Accountant', // All users created by Admin are Accountants
                photoURL: `https://i.pravatar.cc/150?u=${authUser.uid}`
            };
            
            // Step 3: Save the profile to Firestore
            const userDocRef = doc(firestore, "users", authUser.uid);
            await setDoc(userDocRef, newUserProfile);

            toast({ title: 'Usuario Creado', description: `La cuenta y el perfil para ${newUser.email} han sido creados.` });
            
            setIsCreateFormOpen(false);
        } catch (error: any) {
            console.error('Error creating user:', error);
            const errorMessage = error.code === 'auth/email-already-in-use' 
                ? 'El correo electrónico ya está en uso.' 
                : (error.message || 'No se pudo completar el proceso.');
            toast({ variant: 'destructive', title: 'Error al Crear Usuario', description: errorMessage });
        } finally {
            setIsCreating(false);
        }
    };


    const handleDelete = () => {
        if (!firestore || !userToDelete) return;
        const docRef = doc(firestore, 'users', userToDelete.uid);
        
        // This only deletes the Firestore document, not the auth user.
        // In a real app, this should be a Cloud Function.
        deleteDoc(docRef)
            .then(() => {
                toast({ title: 'Perfil Eliminado', description: `El perfil de ${userToDelete.email} fue eliminado de Firestore.` });
            })
            .catch(err => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                }));
            });

        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const handleFieldChange = (field: keyof Omit<UserProfile, 'uid'>, value: string) => {
        if (selectedUser) {
            setSelectedUser({ ...selectedUser, [field]: value });
        }
    };
    
    const handleNewUserFieldChange = (field: keyof NewUserInput, value: string) => {
        setNewUser(prev => ({...prev, [field]: value}));
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Gestión de Usuarios</CardTitle>
                            <CardDescription>Administra los usuarios y sus roles en el sistema.</CardDescription>
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
                                <TableHead>UID</TableHead>
                                <TableHead>
                                    <span className="sr-only">Acciones</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">Cargando usuarios...</TableCell>
                                </TableRow>
                            )}
                            {!loading && users?.map((user) => (
                                <TableRow key={user.uid}>
                                    <TableCell className="font-medium">{user.displayName || 'N/A'}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.uid}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Menú de usuario</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(user)}>Editar Rol</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(user)}>
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && users?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No se encontraron usuarios.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Role Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Usuario</DialogTitle>
                        <DialogDescription>
                            Modifica el rol del usuario.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" value={selectedUser?.email || ''} readOnly disabled className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">Rol</Label>
                            <Select value={selectedUser?.role || 'Accountant'} onValueChange={(v) => handleFieldChange('role', v)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="Accountant">Accountant</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" onClick={handleSaveRole}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             {/* Create User Dialog */}
            <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Usuario Contador</DialogTitle>
                        <DialogDescription>
                            Ingresa los datos para la nueva cuenta. Se creará con el rol de "Contador".
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
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-password" className="text-right">Contraseña</Label>
                            <Input id="new-password" type="password" value={newUser.password} onChange={(e) => handleNewUserFieldChange('password', e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" disabled={isCreating}>Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" onClick={handleCreateUser} disabled={isCreating}>
                            {isCreating ? 'Creando...' : 'Crear Usuario'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta acción eliminará el documento de perfil del usuario de la base de datos, pero NO eliminará al usuario del sistema de autenticación de Firebase por razones de seguridad. Deberás eliminarlo manualmente desde la Consola de Firebase. ¿Deseas continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={handleDelete}
                        >
                            Sí, eliminar perfil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
