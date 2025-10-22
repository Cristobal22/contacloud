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
import { doc, setDoc, updateDoc, collection, deleteDoc, query, where } from "firebase/firestore"
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { add, format } from 'date-fns';

type NewUserInput = {
  email: string;
  displayName: string;
  plan: string;
};

export default function UserManagement() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(authUser?.uid);

    // Admins solo ven a los usuarios que ellos mismos han creado.
    const usersQuery = React.useMemo(() => {
        if (!firestore || !authUser || userProfile?.role !== 'Admin') return null;
        return query(collection(firestore, 'users'), where('createdBy', '==', authUser.uid));
    }, [firestore, authUser, userProfile]);

    const { data: users, loading: usersLoading, error } = useCollection<UserProfile>({ 
        query: usersQuery,
        disabled: !usersQuery
    });
    
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [newUser, setNewUser] = useState<NewUserInput>({email: '', displayName: '', plan: 'Individual'});
    const [selectedUser, setSelectedUser] = useState<Partial<UserProfile> | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

    const [subscriptionDuration, setSubscriptionDuration] = useState('30');
    const [customSubscriptionDate, setCustomSubscriptionDate] = useState('');

    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreateNew = () => {
        setNewUser({email: '', displayName: '', plan: 'Individual'});
        setSubscriptionDuration('30');
        setCustomSubscriptionDate('');
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
            let subscriptionEndDate: string;
            const today = new Date();

            if (subscriptionDuration === '30') {
                subscriptionEndDate = format(add(today, { days: 30 }), 'yyyy-MM-dd');
            } else if (subscriptionDuration === '60') {
                subscriptionEndDate = format(add(today, { days: 60 }), 'yyyy-MM-dd');
            } else {
                if (!customSubscriptionDate) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona una fecha de finalización personalizada.' });
                    setIsProcessing(false);
                    return;
                }
                subscriptionEndDate = customSubscriptionDate;
            }


            // This password is temporary. The user will be forced to reset it.
            const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
            const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, tempPassword);
            const user = userCredential.user;

            const newUserProfile: UserProfile = {
                uid: user.uid,
                email: user.email!,
                displayName: newUser.displayName || user.email!.split('@')[0],
                role: 'Accountant',
                plan: newUser.plan,
                subscriptionEndDate: subscriptionEndDate,
                photoURL: `https://i.pravatar.cc/150?u=${user.uid}`,
                companyIds: [],
                createdBy: authUser.uid, // Set the creator
            };

            await setDoc(doc(firestore, 'users', user.uid), newUserProfile);
            // Send a password reset email immediately
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
            // Admin can update displayName and plan
            await updateDoc(userRef, {
                displayName: selectedUser.displayName,
                plan: selectedUser.plan,
                subscriptionEndDate: selectedUser.subscriptionEndDate,
            });
            toast({ title: "Usuario actualizado", description: "Los cambios han sido guardados." });
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
                        <p className='text-xs text-muted-foreground'>Asegúrate de tener los permisos correctos en las reglas de Firestore para listar usuarios.</p>
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Invitar Nuevo Contador</DialogTitle>
                        <DialogDescription>
                            Completa los detalles y la duración de la suscripción. Se enviará un correo para que el usuario establezca su contraseña.
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
                            <Label htmlFor="new-plan" className="text-right">Plan</Label>
                            <Select value={newUser.plan} onValueChange={(value) => handleNewUserFieldChange('plan', value)}>
                                <SelectTrigger id="new-plan" className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Demo">Demo</SelectItem>
                                    <SelectItem value="Individual">Individual</SelectItem>
                                    <SelectItem value="Team">Equipo</SelectItem>
                                    <SelectItem value="Enterprise">Empresarial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="subscription-duration" className="text-right">Duración</Label>
                            <Select value={subscriptionDuration} onValueChange={setSubscriptionDuration}>
                                <SelectTrigger id="subscription-duration" className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 días</SelectItem>
                                    <SelectItem value="60">60 días</SelectItem>
                                    <SelectItem value="custom">Personalizado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {subscriptionDuration === 'custom' && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="custom-date" className="text-right">Fecha Fin</Label>
                                <Input
                                    id="custom-date"
                                    type="date"
                                    value={customSubscriptionDate}
                                    onChange={(e) => setCustomSubscriptionDate(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        )}
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
                            Modifica el nombre, el plan y la fecha de vencimiento de la suscripción del usuario.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="grid gap-6 py-4">
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-right">Nombre</Label>
                                <Input id="edit-name" value={selectedUser.displayName || ''} onChange={(e) => handleSelectedUserFieldChange('displayName', e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-plan" className="text-right">Plan</Label>
                                <p className="col-span-3 text-sm font-medium p-2 rounded-md bg-muted">{selectedUser.plan || 'No asignado'}</p>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-subscription-date" className="text-right">Fin Suscripción</Label>
                                <Input
                                    id="edit-subscription-date"
                                    type="date"
                                    value={selectedUser.subscriptionEndDate || ''}
                                    onChange={(e) => handleSelectedUserFieldChange('subscriptionEndDate', e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground col-span-4 text-center">Nota: El cambio de plan debe ser gestionado por el usuario a través de la página de facturación.</p>
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
