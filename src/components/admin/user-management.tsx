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
import { PlusCircle } from "lucide-react"
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
import { useFirestore, useAuth } from "@/firebase"
import type { UserProfile } from "@/lib/types"
import { doc, setDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type NewUserInput = {
  email: string;
  displayName: string;
};

export default function UserManagement() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [newUser, setNewUser] = useState<NewUserInput>({email: '', displayName: ''});
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateNew = () => {
        setNewUser({email: '', displayName: ''});
        setIsCreateFormOpen(true);
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

        setIsCreating(true);

        try {
            // NOTE: Firebase Admin SDK's createUser does not sign the user in.
            // For this client-side implementation, we create the user with a temporary password
            // and immediately send a password reset email. This is a common pattern when
            // an admin SDK is not available.
            const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
            const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, tempPassword);
            const user = userCredential.user;

            const newUserProfile: UserProfile = {
                uid: user.uid,
                email: user.email!,
                displayName: newUser.displayName || user.email!.split('@')[0],
                role: 'Accountant',
                photoURL: `https://i.pravatar.cc/150?u=${user.uid}`,
                companyIds: []
            };

            await setDoc(doc(firestore, 'users', user.uid), newUserProfile);
            
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
            setIsCreating(false);
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
                            <CardDescription>Invita nuevos contadores a la plataforma.</CardDescription>
                        </div>
                         <Button size="sm" className="gap-1" onClick={handleCreateNew}>
                            <PlusCircle className="h-4 w-4" />
                            Agregar Usuario
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <h3 className="text-lg font-semibold text-muted-foreground">La gestión de usuarios se ha simplificado.</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                           Utiliza el botón "Agregar Usuario" para invitar nuevos contadores.
                        </p>
                         <p className="text-xs text-muted-foreground mt-4 max-w-md mx-auto">
                           Nota: La funcionalidad para listar y editar usuarios existentes requiere privilegios de administrador elevados que se configuran manualmente en el backend de Firebase (Custom Claims), como se describe en el archivo README.md del proyecto.
                        </p>
                    </div>
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
                            <Button type="button" variant="secondary" disabled={isCreating}>Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" onClick={handleCreateUser} disabled={isCreating}>
                            {isCreating ? 'Creando e invitando...' : 'Crear e Invitar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}