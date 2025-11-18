'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCollection } from '@/firebase';
import type { Voucher } from '@/lib/types';
import { SelectedCompanyContext } from '../layout';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { useUser } from '@/firebase/auth/use-user';

const VouchersPage: React.FC = () => {
  const router = useRouter();
  const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
  const companyId = selectedCompany?.id;
  const { toast } = useToast();
  const { user } = useUser();

  const { data: vouchers, loading, refetch } = useCollection<Voucher>({ 
    path: companyId ? `companies/${companyId}/vouchers` : undefined,
  });

  const [isContabilizarDialogOpen, setIsContabilizarDialogOpen] = React.useState(false);
  const [voucherToContabilizar, setVoucherToContabilizar] = React.useState<Voucher | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [voucherToDelete, setVoucherToDelete] = React.useState<Voucher | null>(null);

  const [isUndoDialogOpen, setIsUndoDialogOpen] = React.useState(false);
  const [voucherToUndo, setVoucherToUndo] = React.useState<Voucher | null>(null);

  const [isForceDeleteDialogOpen, setIsForceDeleteDialogOpen] = React.useState(false);
  const [voucherToForceDelete, setVoucherToForceDelete] = React.useState<Voucher | null>(null);

  const handleApiAction = async (endpoint: string, body: object, successMessage: string, errorMessage: string) => {
    try {
        const token = await user?.getIdToken();
        if (!token) throw new Error("Authentication token not found.");

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body),
        });

        const res = await response.json();

        if (!response.ok) {
            throw new Error(res.error || errorMessage);
        }

        toast({ title: "Éxito", description: successMessage });
        refetch();
        return true;
    } catch (error) {
        const msg = error instanceof Error ? error.message : errorMessage;
        toast({ variant: "destructive", title: "Error", description: msg });
        return false;
    }
  };

  const handleContabilizar = async () => {
    if (!voucherToContabilizar || !companyId) return;
    const success = await handleApiAction(
        `/api/vouchers/contabilizar`,
        { companyId, voucherId: voucherToContabilizar.id },
        "Comprobante Contabilizado.",
        "No se pudo contabilizar el comprobante."
    );
    if (success) {
        setIsContabilizarDialogOpen(false);
        setVoucherToContabilizar(null);
    }
  };

  const handleDelete = async () => {
    if (!voucherToDelete || !companyId) return;
    const success = await handleApiAction(
        `/api/vouchers/delete`,
        { companyId, voucherId: voucherToDelete.id },
        "Comprobante eliminado.",
        "No se pudo eliminar el comprobante."
    );
    if (success) {
        setIsDeleteDialogOpen(false);
        setVoucherToDelete(null);
    }
  };

  const handleUndo = async () => {
    if (!voucherToUndo || !companyId) return;
    const success = await handleApiAction(
        `/api/vouchers/undo`,
        { companyId, voucherId: voucherToUndo.id },
        "Comprobante anulado exitosamente.",
        "No se pudo anular el comprobante."
    );
    if (success) {
        setIsUndoDialogOpen(false);
        setVoucherToUndo(null);
    }
  };

  const handleForceDelete = async () => {
    if (!voucherToForceDelete || !companyId) return;
    const success = await handleApiAction(
        `/api/vouchers/force-delete-centralization`,
        { companyId, voucherId: voucherToForceDelete.id },
        "El comprobante de centralización huérfano ha sido eliminado.",
        "No se pudo forzar la eliminación del comprobante."
    );
    if (success) {
        setIsForceDeleteDialogOpen(false);
        setVoucherToForceDelete(null);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle>Comprobantes Contables</CardTitle>
                <CardDescription>
                    Gestiona los comprobantes contables de tu empresa. Registra, edita y visualiza todas las transacciones.
                </CardDescription>
            </div>
            <Button className="ml-auto gap-1" size="sm" onClick={() => router.push('/dashboard/vouchers/edit/new')}>
                <PlusCircle className="h-3.5 w-3.5" />
                Nuevo Comprobante
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Cargando...</TableCell>
                </TableRow>
              )}
              {!loading && vouchers?.map((voucher) => {
                const isCentralizationVoucher = voucher.glosa?.startsWith('Centralización de Remuneraciones');
                const isAnulado = voucher.status === 'Anulado';

                return (
                  <TableRow key={voucher.id} className={isAnulado ? 'bg-gray-100 text-gray-500' : ''}>
                    <TableCell>{new Date(voucher.date.seconds * 1000).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{voucher.number}</TableCell>
                    <TableCell>{voucher.type}</TableCell>
                    <TableCell>{voucher.glosa}</TableCell>
                    <TableCell>
                        <Badge 
                            variant={voucher.status === 'Borrador' ? 'outline' : 'default'}
                            className={
                                isAnulado 
                                ? 'bg-gray-200 text-gray-600' 
                                : voucher.status === 'Contabilizado' ? 'bg-green-100 text-green-800' : ''
                            }
                        >
                            {voucher.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">{`$${new Intl.NumberFormat('es-CL').format(voucher.total)}`}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isAnulado}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          {voucher.status === 'Borrador' && (
                            <>
                                <DropdownMenuItem onSelect={() => router.push(`/dashboard/vouchers/edit/${voucher.id}`)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => { setVoucherToContabilizar(voucher); setIsContabilizarDialogOpen(true); }}>
                                  Contabilizar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => { setVoucherToDelete(voucher); setIsDeleteDialogOpen(true); }} className="text-red-600">
                                  Eliminar
                                </DropdownMenuItem>
                            </>
                          )}
                          {voucher.status === 'Contabilizado' && !isCentralizationVoucher && (
                            <DropdownMenuItem onSelect={() => { setVoucherToUndo(voucher); setIsUndoDialogOpen(true); }}>
                              Anular
                            </DropdownMenuItem>
                          )}
                          {voucher.status === 'Contabilizado' && isCentralizationVoucher && (
                            <DropdownMenuItem onSelect={() => { setVoucherToForceDelete(voucher); setIsForceDeleteDialogOpen(true); }} className="text-red-600">
                              Forzar Eliminación (Admin)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* All existing dialogs remain unchanged... */}
      <Dialog open={isContabilizarDialogOpen} onOpenChange={setIsContabilizarDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Confirmar Contabilización</DialogTitle>
                  <DialogDescription>¿Estás seguro de que quieres contabilizar el comprobante número {voucherToContabilizar?.number}? Esta acción no se puede deshacer.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsContabilizarDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleContabilizar}>Confirmar</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Confirmar Eliminación</DialogTitle>
                  <DialogDescription>¿Estás seguro de que quieres eliminar el comprobante número {voucherToDelete?.number}? Esta acción es permanente.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
                  <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Confirmar Anulación</DialogTitle>
                  <DialogDescription>¿Estás seguro de que quieres anular el comprobante número {voucherToUndo?.number}? Se creará un nuevo comprobante para revertir los asientos.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUndoDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleUndo}>Anular</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* New Dialog for Force Delete */}
      <Dialog open={isForceDeleteDialogOpen} onOpenChange={setIsForceDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación Forzada</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar el comprobante de centralización huérfano número <span className="font-bold">{voucherToForceDelete?.number}</span>. Esta es una herramienta de limpieza de datos y solo debe usarse para corregir inconsistencias donde el proceso de remuneraciones original ya no existe. Esta acción es permanente e irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsForceDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleForceDelete}>Entiendo, forzar eliminación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </main>
  );
};

export default VouchersPage;
