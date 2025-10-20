
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
import { useCollection, useFirestore, useUser } from "@/firebase"
import type { AccountGroup } from "@/lib/types"
import { collection, addDoc, setDoc, doc, deleteDoc } from "firebase/firestore";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
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
  import { buttonVariants } from '@/components/ui/button';
  import { errorEmitter } from '@/firebase/error-emitter'
  import { FirestorePermissionError } from '@/firebase/errors'
  import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/firebase/auth/use-user-profile';


export default function AccountGroupsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { userProfile } = useUserProfile(user?.uid);
    const { toast } = useToast();
    
    const accountGroupsCollection = React.useMemo(() => 
        firestore && user ? collection(firestore, `users/${user.uid}/account-groups`) : null,
    [firestore, user]);

    const { data: accountGroups, loading } = useCollection<AccountGroup>({ query: accountGroupsCollection });

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedGroup, setSelectedGroup] = React.useState<Partial<AccountGroup> | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [groupToDelete, setGroupToDelete] = React.useState<AccountGroup | null>(null);

    const handleCreateNew = () => {
        setSelectedGroup({ id: `new-${Date.now()}`, name: '' });
        setIsFormOpen(true);
    };

    const handleEdit = (group: AccountGroup) => {
        setSelectedGroup(group);
        setIsFormOpen(true);
    };

    const handleOpenDeleteDialog = (group: AccountGroup) => {
        setGroupToDelete(group);
        setIsDeleteDialogOpen(true);
    };

    const handleUpdateParameters = () => {
        toast({
            title: "Actualización de Parámetros",
            description: "Los grupos de cuentas son específicos de tu usuario. Puedes agregar, editar o eliminar grupos directamente desde esta tabla.",
            duration: 6000,
        });
    };
    
    const handleSave = () => {
        if (!firestore || !user || !selectedGroup || !selectedGroup.name) return;

        const collectionPath = `users/${user.uid}/account-groups`;
        const isNew = selectedGroup.id?.startsWith('new-');
        const groupData = { name: selectedGroup.name };
        
        setIsFormOpen(false);
        setSelectedGroup(null);

        if (isNew) {
            addDoc(collection(firestore, collectionPath), groupData)
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: collectionPath,
                        operation: 'create',
                        requestResourceData: groupData,
                    }));
                });
        } else if (selectedGroup.id) {
            const docRef = doc(firestore, collectionPath, selectedGroup.id);
            setDoc(docRef, groupData, { merge: true })
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: groupData,
                    }));
                });
        }
    };

    const handleDelete = () => {
        if (!firestore || !user || !groupToDelete) return;
        const docRef = doc(firestore, `users/${user.uid}/account-groups`, groupToDelete.id);
        
        setIsDeleteDialogOpen(false);
        setGroupToDelete(null);

        deleteDoc(docRef)
            .catch(err => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                }));
            });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Grupos de Cuentas Contables</CardTitle>
                            <CardDescription>Los grupos principales que clasifican el plan de cuentas. Son específicos para tu usuario.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                             {userProfile?.role === 'Admin' ? (
                                <Button size="sm" onClick={handleUpdateParameters} >
                                    Actualizar Parámetros
                                </Button>
                            ) : (
                                <Button size="sm" className="gap-1" onClick={handleCreateNew}>
                                    <PlusCircle className="h-4 w-4" />
                                    Agregar Grupo
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre del Grupo</TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">Cargando...</TableCell>
                                </TableRow>
                            )}
                            {!loading && accountGroups?.map((group) => (
                                <TableRow key={group.id}>
                                    <TableCell className="font-medium">{group.name}</TableCell>
                                    <TableCell>{group.id}</TableCell>
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
                                                <DropdownMenuItem onClick={() => handleEdit(group)}>Editar</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(group)}>
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && accountGroups?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">
                                        No has creado ningún grupo de cuentas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{selectedGroup?.id?.startsWith('new-') ? 'Crear Nuevo Grupo' : 'Editar Grupo'}</DialogTitle>
                        <DialogDescription>
                            Define el nombre del grupo de cuentas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nombre</Label>
                            <Input 
                                id="name" 
                                value={selectedGroup?.name || ''} 
                                onChange={(e) => setSelectedGroup(prev => prev ? {...prev, name: e.target.value} : null)} 
                                className="col-span-3" 
                            />
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
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el grupo <span className="font-bold">{groupToDelete?.name}</span>.
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
