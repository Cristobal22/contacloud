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
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { useCollection, useFirestore } from "@/firebase"
  import { collection, addDoc, setDoc, doc } from "firebase/firestore"
  import type { Account } from "@/lib/types"

  
export default function AccountsPage({ companyId }: { companyId?: string }) {
  const firestore = useFirestore();
  const { data: accounts, loading } = useCollection<Account>({
    path: `companies/${companyId}/accounts`,
    companyId: companyId,
  });

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState<Partial<Account> | null>(null);

  const handleCreateNew = () => {
    setSelectedAccount({
        id: `new-${Date.now()}`,
        code: '',
        name: '',
        type: 'Activo',
        balance: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (account: Account) => {
      setSelectedAccount(account);
      setIsDialogOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!firestore || !companyId || !selectedAccount) return;

    const isNew = selectedAccount.id?.startsWith('new-');
    const collectionRef = collection(firestore, `companies/${companyId}/accounts`);
    
    const accountData = {
      code: selectedAccount.code || '',
      name: selectedAccount.name || '',
      type: selectedAccount.type || 'Activo',
      balance: selectedAccount.balance || 0,
      companyId: companyId
    };
    
    try {
        if (isNew) {
            await addDoc(collectionRef, accountData);
        } else {
            if (selectedAccount.id) {
                const docRef = doc(firestore, `companies/${companyId}/accounts`, selectedAccount.id);
                // Exclude balance from update for existing accounts
                const { balance, ...updateData } = accountData;
                await setDoc(docRef, updateData, { merge: true });
            }
        }
        setIsDialogOpen(false);
        setSelectedAccount(null);
    } catch (error) {
        console.error("Error saving account: ", error);
    }
  };
    
  const handleFieldChange = (field: keyof Account, value: string | number) => {
    if (selectedAccount) {
        setSelectedAccount({ ...selectedAccount, [field]: value });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Plan de Cuentas</CardTitle>
                    <CardDescription>Gestiona tus cuentas contables.</CardDescription>
                </div>
                <Button size="sm" className="gap-1" onClick={handleCreateNew} disabled={!companyId}>
                    <PlusCircle className="h-4 w-4" />
                    Agregar Cuenta
                </Button>
            </div>
        </CardHeader>
        <CardContent>
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
              {!loading && accounts?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">No se encontraron cuentas para esta empresa.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{selectedAccount?.id?.startsWith('new-') ? 'Crear Nueva Cuenta' : 'Editar Cuenta'}</DialogTitle>
                  <DialogDescription>
                      Rellena los detalles de la cuenta contable.
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
                      <Select value={selectedAccount?.type || 'Activo'} onValueChange={(value) => handleFieldChange('type', value)}>
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
    </>
  )
}
