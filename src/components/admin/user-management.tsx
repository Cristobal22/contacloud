
'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { useFirestore, useAuth, useCollection, useUser } from "@/firebase"
import type { UserProfile } from "@/lib/types"
import { doc, setDoc, updateDoc, collection, deleteDoc, query, where, writeBatch, arrayUnion } from "firebase/firestore"
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { useState, useEffect } from 'react';
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUserProfile } from '@/firebase/auth/use-user-profile';


type NewUserInput = {
  email: string;
  displayName: string;
};

export default function UserManagement() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(authUser?.uid);

    // This query is now safe: it fetches only the users whose UIDs are in the admin's `createdUserIds` array.
    const usersQuery = React.useMemo(() => {
        if (!firestore || !userProfile || userProfile.role !== 'Admin' || !userProfile.createdUserIds || userProfile.createdUserIds.length === 0) {
            return null;
        }
        return query(collection(firestore, 'users'), where('uid', 'in', userProfile.createdUserIds.slice(0, 30)));
    }, [firestore, userProfile]);

    const { data: users, loading: usersLoading, error } = useCollection<UserProfile>({ 
        query: usersQuery,
        disabled: profileLoading || !usersQuery
    });
    
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [newUser, setNewUser] = useState<NewUserInput>({email: '', displayName: ''});
    const [selectedUser, setSelectedUser] = useState<Partial<UserProfile> | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreateNew = () => {
        setNewUser({email: '', displayName: ''});
        setIsCreateFormOpen(true);
    };

     const handleEditUser = (user: UserProfile) => {
        setSelectedUser(user);
        setIsEditFormOpen(true);
    };

    const handleOpenDeleteDialog = (user: UserProfile) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };


    const handleCreateUser = async () => {
        if (!auth || !firestore || !authUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Servicios de Firebase no disponibles.' });
            return;
        }
        if (!newUser.email) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, complete el correo electrónico.' });
            return;
        }

        setIsProcessing(true);

        try {
            // This password is temporary. The user will be forced to reset it.
            const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
            const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, tempPassword);
            const user = userCredential.user;

            const newUserProfile: UserProfile = {
                uid: user.uid,
                email: user.email!,
                displayName: newUser.displayName || user.email!.split('@')[0],
                role: 'Accountant', 
                photoURL: `https://i.pravatar.cc/150?u=${user.uid}`,
                companyIds: [],
                createdBy: authUser.uid,
            };

            const batch = writeBatch(firestore);
            const userDocRef = doc(firestore, 'users', user.uid);
            const adminDocRef = doc(firestore, 'users', authUser.uid);

            batch.set(userDocRef, newUserProfile);
            batch.update(adminDocRef, {
                createdUserIds: arrayUnion(user.uid)
            });
            
            await batch.commit();
            
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
            // Admin can only update the displayName
            await updateDoc(userRef, {
                displayName: selectedUser.displayName,
            });
            toast({ title: "Usuario actualizado", description: "El nombre del usuario ha sido actualizado." });
            setIsEditFormOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error al actualizar', description: 'No se pudieron guardar los cambios.' });
            console.error('Error updating user:', error);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleDeleteUser = async () => {
        if (!firestore || !userToDelete) return;

        setIsProcessing(true);
        const userRef = doc(firestore, 'users', userToDelete.uid);

        try {
            // Note: This deletes the Firestore document, not the Firebase Auth user.
            // That needs to be done manually in the Firebase console for security reasons.
            await deleteDoc(userRef);
            toast({ title: "Perfil de usuario eliminado", description: `El perfil de ${userToDelete.displayName} ha sido eliminado de la aplicación.` });
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error al eliminar', description: 'No se pudo eliminar el perfil del usuario.' });
            console.error('Error deleting user:', error);
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
    
    const isReadyForAdminView = !profileLoading && userProfile?.role === 'Admin';


    const renderTableContent = () => {
        if (usersLoading) {
            return (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        <p>Cargando usuarios...</p>
                    </TableCell>
                </TableRow>
            );
        }

        if (error) {
             return (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-destructive">
                        <p className="font-bold">Error de permisos.</p>
                        <p className='text-xs text-muted-foreground'>No se pudieron cargar los perfiles de usuario. Revisa las reglas de seguridad.</p>
                    </TableCell>
                </TableRow>
            );
        }

        if (!users || users.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No has creado usuarios. ¡Agrega tu primer contador!
                    </TableCell>
                </TableRow>
            );
        }

        return users.map(user => (
            <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.displayName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
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
                            <DropdownMenuItem onSelect={() => handleEditUser(user)}>Editar Usuario</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleOpenDeleteDialog(user)} className="text-destructive">
                                Eliminar Perfil
                            </DropdownMenuItem>
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
                            <CardDescription>Invita nuevos contadores y gestiona sus perfiles.</CardDescription>
                        </div>
                         <Button size="sm" className="gap-1" onClick={handleCreateNew} disabled={!isReadyForAdminView}>
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
                            Modifica el nombre del usuario. El rol y la asignación de empresas no se pueden editar aquí.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="grid gap-6 py-4">
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-right">Nombre</Label>
                                <Input id="edit-name" value={selectedUser.displayName || ''} onChange={(e) => handleSelectedUserFieldChange('displayName', e.target.value)} className="col-span-3" />
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

            {/* Delete User Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de eliminar este perfil?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el perfil de <span className="font-bold">{userToDelete?.displayName}</span> de la base de datos de la aplicación.
                            No se puede deshacer. Para eliminar completamente la autenticación del usuario, deberás hacerlo desde la Consola de Firebase.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={handleDeleteUser}
                            disabled={isProcessing}
                        >
                             {isProcessing ? 'Eliminando...' : 'Sí, eliminar perfil'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
