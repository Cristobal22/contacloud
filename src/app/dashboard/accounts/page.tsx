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
  import { MoreHorizontal, PlusCircle, Download, BookUp } from "lucide-react"
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
  import { useCollection, useFirestore } from "@/firebase"
  import { collection, addDoc, setDoc, doc, writeBatch } from "firebase/firestore"
  import type { Account } from "@/lib/types"
  import { errorEmitter } from '@/firebase/error-emitter'
  import { FirestorePermissionError } from '@/firebase/errors'
  import { SelectedCompanyContext } from '../layout';
  import { initialChartOfAccounts } from '@/lib/seed-data';
  import { useToast } from '@/hooks/use-toast';

  
export default function AccountsPage() {
  const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
  const companyId = selectedCompany?.id;
  const firestore = useFirestore();
  const { toast } = useToast();
  const { data: accounts, loading } = useCollection<Account>({
    path: companyId ? `companies/${companyId}/accounts` : undefined,
    companyId: companyId,
  });

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSeedConfirmOpen, setIsSeedConfirmOpen] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState<Partial<Account> | null>(null);

  const handleCreateNew = () => {
    setSelectedAccount({
        id: `new-${Date.now()}`,
        code: '',
        name: '',
        type: 'Activo',
        balance: 0,
        companyId: companyId,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (account: Account) => {
      setSelectedAccount(account);
      setIsDialogOpen(true);
  };

  const handleSaveAccount = () => {
    if (!firestore || !companyId || !selectedAccount) return;

    const isNew = selectedAccount.id?.startsWith('new-');
    const collectionPath = `companies/${companyId}/accounts`;
    const collectionRef = collection(firestore, collectionPath);
    
    const accountData = {
      code: selectedAccount.code || '',
      name: selectedAccount.name || '',
      type: selectedAccount.type || 'Activo',
      balance: selectedAccount.balance || 0,
      companyId: companyId,
    };
    
    setIsDialogOpen(false);
    setSelectedAccount(null);

    if (isNew) {
        addDoc(collectionRef, accountData)
            .catch(err => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: collectionPath,
                    operation: 'create',
                    requestResourceData: accountData,
                }));
            });
    } else {
        if (selectedAccount.id) {
            const docRef = doc(firestore, `companies/${companyId}/accounts`, selectedAccount.id);
            // Exclude balance from update for existing accounts
            const { balance, ...updateData } = accountData;
            setDoc(docRef, updateData, { merge: true })
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: updateData,
                    }));
                });
        }
    }
  };
    
  const handleFieldChange = (field: keyof Account, value: string | number) => {
    if (selectedAccount) {
        let updatedAccount = { ...selectedAccount, [field]: value };

        if (field === 'code' && typeof value === 'string' && value.length > 0) {
            const firstDigit = value.charAt(0);
            switch(firstDigit) {
                case '1': updatedAccount.type = 'Activo'; break;
                case '2': updatedAccount.type = 'Pasivo'; break;
                case '3': updatedAccount.type = 'Patrimonio'; break;
                case '4': updatedAccount.type = 'Resultado'; break;
                default: // Do nothing or reset
            }
        }

        setSelectedAccount(updatedAccount);
    }
  };

  const handleSeedData = async () => {
    if (!firestore || !companyId) return;

    const collectionPath = `companies/${companyId}/accounts`;
    const batch = writeBatch(firestore);

    initialChartOfAccounts.forEach(accountData => {
        const docRef = doc(collection(firestore, collectionPath));
        batch.set(docRef, { ...accountData, companyId, balance: 0 });
    });

    try {
        await batch.commit();
        toast({
            title: "Plan de Cuentas Cargado",
            description: "El plan de cuentas predeterminado ha sido cargado exitosamente.",
        });
    } catch (error) {
        console.error("Error seeding chart of accounts: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: collectionPath,
            operation: 'create',
        }));
    } finally {
      setIsSeedConfirmOpen(false);
    }
  };

  const showInitialActions = !loading && accounts?.length === 0 && companyId;


  return (
    <>
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Plan de Cuentas</CardTitle>
                    <CardDescription>
                        {showInitialActions ? "Empieza por configurar el plan de cuentas de la empresa." : "Gestiona las cuentas contables de la empresa seleccionada."}
                    </CardDescription>
                </div>
                 {!showInitialActions && (
                    <Button size="sm" className="gap-1" onClick={handleCreateNew} disabled={!companyId}>
                        <PlusCircle className="h-4 w-4" />
                        Agregar Cuenta
                    </Button>
                 )}
            </div>
        </CardHeader>
        <CardContent>
            {showInitialActions && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
                    <h3 className="text-lg font-semibold">¿Cómo quieres empezar?</h3>
                    <p className="text-sm text-muted-foreground">Puedes cargar un plan predeterminado, importar uno o empezar desde cero.</p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-2">
                        <Button onClick={() => setIsSeedConfirmOpen(true)}>
                            <BookUp className="mr-2 h-4 w-4"/>
                            Cargar Plan Predeterminado
                        </Button>
                         <Button variant="outline" disabled>
                            <Download className="mr-2 h-4 w-4"/>
                            Importar Plan (Próximamente)
                        </Button>
                         <Button variant="secondary" onClick={handleCreateNew}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Crear desde Cero
                        </Button>
                    </div>
                </div>
            )}
            {!showInitialActions && (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre de Cuenta</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
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
                    {!loading && accounts?.map((account) => (
                        <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.code}</TableCell>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{account.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">${account.balance.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
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
                                <DropdownMenuItem onClick={() => handleEdit(account)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem>Ver Movimientos</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))}
                    {!loading && !companyId && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                                Selecciona una empresa para ver su plan de cuentas.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{selectedAccount?.id?.startsWith('new-') ? 'Crear Nueva Cuenta' : 'Editar Cuenta'}</DialogTitle>
                  <DialogDescription>
                      Rellena los detalles de la cuenta contable. El tipo se asignará automáticamente.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="code" className="text-right">Código</Label>
                      <Input id="code" value={selectedAccount?.code || ''} onChange={(e) => handleFieldChange('code', e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Nombre</Label>
                      <Input id="name" value={selectedAccount?.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="type" className="text-right">Tipo</Label>
                      <Select value={selectedAccount?.type || 'Activo'} onValueChange={(value) => handleFieldChange('type', value as 'Activo' | 'Pasivo' | 'Patrimonio' | 'Resultado')} disabled>
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Activo">Activo</SelectItem>
                              <SelectItem value="Pasivo">Pasivo</SelectItem>
                              <SelectItem value="Patrimonio">Patrimonio</SelectItem>
                              <SelectItem value="Resultado">Resultado</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="balance" className="text-right">Saldo Inicial</Label>
                      <Input id="balance" type="number" value={selectedAccount?.balance ?? 0} onChange={(e) => handleFieldChange('balance', parseFloat(e.target.value))} className="col-span-3" disabled={!selectedAccount?.id?.startsWith('new-')} />
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="secondary">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" onClick={handleSaveAccount}>Guardar Cambios</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <AlertDialog open={isSeedConfirmOpen} onOpenChange={setIsSeedConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmas la carga del Plan Predeterminado?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción cargará un plan de cuentas contables estándar para esta empresa. Esta es la opción recomendada para empezar rápidamente.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleSeedData}
                >
                    Sí, cargar plan
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
