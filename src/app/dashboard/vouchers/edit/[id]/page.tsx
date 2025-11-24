'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from "@/components/ui/table";
import { PlusCircle, Trash2, ArrowLeft, ChevronsUpDown, Check, AlertCircle } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useCollection, useDoc, useFirestore } from '@/firebase';
import type { Voucher, VoucherEntry, Account } from '@/lib/types';
import { SelectedCompanyContext } from '@/app/dashboard/layout';
import { doc, setDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { useRouter, useParams, useSearchParams } from 'next/navigation'; // Import useSearchParams
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ValidationChecklist = ({ items }: { items: string[] }) => {
    if (items.length === 0) return null;
    return (
        <div className="text-sm text-muted-foreground space-y-2 mr-auto">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span>{item}</span>
                </div>
            ))}
        </div>
    );
};


export default function VoucherEditPage() {
    const params = useParams();
    const searchParams = useSearchParams(); // Get search params
    const id = params.id as string;
    const isNew = id === 'new';
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const voucherRef = !isNew && firestore && companyId ? doc(firestore, `companies/${companyId}/vouchers`, id) : null;
    const { data: existingVoucher, loading: voucherLoading } = useDoc<Voucher>(voucherRef);

    const [voucher, setVoucher] = React.useState<Partial<Voucher> | null>(null);
    const [entries, setEntries] = React.useState<Partial<VoucherEntry>[]>([]);
    const [dateError, setDateError] = React.useState<string | null>(null);
    const [openPopovers, setOpenPopovers] = React.useState<Record<string, boolean>>({});
    const [validationErrors, setValidationErrors] = React.useState<string[]>([]);


    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: companyId ? `companies/${companyId}/accounts` : undefined,
        companyId: companyId,
    });
    
    React.useEffect(() => {
        if (isNew) {
            // Standard behavior for a new, empty voucher
            setVoucher({
                date: new Date().toISOString().substring(0, 10),
                type: 'Traspaso',
                description: '',
                status: 'Borrador',
                total: 0,
                entries: [],
                companyId: companyId,
            });
            setEntries([{ id: `new-entry-${Date.now()}-${Math.random()}`, account: '', description: '', debit: 0, credit: 0 }]);
        } else if (existingVoucher) {
            // --- FIX: Handle Firestore Timestamp Object for Dates ---
            let formattedDate = '';
            const dateValue = existingVoucher.date;

            if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
                // If it's a Firestore Timestamp, convert it to a 'YYYY-MM-DD' string.
                formattedDate = new Date(dateValue.seconds * 1000).toISOString().substring(0, 10);
            } else if (typeof dateValue === 'string') {
                // If it's already a string, use it directly (fallback).
                formattedDate = dateValue.substring(0, 10);
            }

            setVoucher({
                ...existingVoucher,
                date: formattedDate, // Use the safe, formatted string date.
            });
            setEntries(existingVoucher.entries);
        }
    }, [isNew, existingVoucher, companyId, searchParams]);

    React.useEffect(() => {
        if (voucher?.date && selectedCompany) {
            validateDate(voucher.date as string);
        }
    }, [voucher?.date, selectedCompany]);


    const handleAddEntry = () => {
        const newId = `new-entry-${Date.now()}-${Math.random()}`;
        setEntries([...entries, { id: newId, account: '', description: '', debit: 0, credit: 0 }]);
        setOpenPopovers(prev => ({ ...prev, [newId]: false }));
    };

    const handleRemoveEntry = (entryId: string) => {
        setEntries(entries.filter(entry => entry.id !== entryId));
    };

    const handleEntryChange = (entryId: string, field: keyof VoucherEntry, value: string | number) => {
        const newEntries = entries.map(entry => {
            if (entry.id === entryId) {
                const updatedEntry = { ...entry, [field]: value };
                if (field === 'debit' && Number(value) > 0) updatedEntry.credit = 0;
                if (field === 'credit' && Number(value) > 0) updatedEntry.debit = 0;
                return updatedEntry;
            }
            return entry;
        });
        setEntries(newEntries);
    };

     const validateDate = (dateString: string) => {
        if (!selectedCompany?.periodStartDate || !selectedCompany?.periodEndDate) {
            setDateError('La empresa no tiene un período de trabajo configurado.');
            return false;
        }
        
        const selectedDate = parseISO(dateString);
        const startDate = parseISO(selectedCompany.periodStartDate);
        const endDate = parseISO(selectedCompany.periodEndDate);

        if (selectedDate < startDate || selectedDate > endDate) {
            setDateError('La fecha está fuera del período de trabajo activo.');
            return false;
        } 
        
        if (selectedCompany.lastClosedDate) {
            const lastClosedDate = parseISO(selectedCompany.lastClosedDate);
            if (selectedDate <= lastClosedDate) {
                setDateError('La fecha pertenece a un período que ya ha sido cerrado.');
                return false;
            }
        }

        setDateError(null);
        return true;
    };


     const handleHeaderChange = (field: keyof Omit<Voucher, 'id' | 'total' | 'entries' | 'companyId'>, value: string) => {
        if (voucher) {
            if (field === 'date') {
                validateDate(value);
            }
            setVoucher({ ...voucher, [field]: value });
        }
    };

    const totalDebit = entries.reduce((sum, entry) => sum + Number(entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + Number(entry.credit || 0), 0);
    const isBalanced = Math.round(totalDebit) === Math.round(totalCredit) && totalDebit > 0;
    const canSave = isBalanced && !dateError && entries.length > 0 && !!voucher?.description && entries.every(e => e.account);

    React.useEffect(() => {
        const errors: string[] = [];
        if (!voucher?.description) {
            errors.push("Falta la descripción general del comprobante.");
        }
        if (entries.length === 0) {
            errors.push("El comprobante debe tener al menos un asiento.");
        }
        if (!entries.every(e => e.account)) {
            errors.push("Hay uno o más asientos sin una cuenta contable asignada.");
        }
        if (dateError) {
            errors.push(dateError);
        }
        if (totalDebit === 0 && entries.length > 0) {
             errors.push("Los totales no pueden ser cero.");
        } else if (Math.round(totalDebit) !== Math.round(totalCredit)) {
            errors.push("Los totales del Debe y el Haber no cuadran.");
        }
        setValidationErrors(errors);
    }, [voucher, entries, dateError, totalDebit, totalCredit]);


    const handleSaveClick = async () => {
        if (!firestore || !companyId || !voucher || !canSave) return;
        
        let statusToSave = voucher.status;
        if (voucher.status === 'Contabilizado') {
            statusToSave = 'Borrador';
            toast({
                title: "Comprobante revertido a Borrador",
                description: "Se han guardado cambios en un comprobante contabilizado. Su estado ha sido revertido a 'Borrador' y debe ser contabilizado nuevamente."
            });
        }

        const collectionPath = `companies/${companyId}/vouchers`;
        const collectionRef = collection(firestore, collectionPath);
        
        // --- FIX: Convert date string back to Timestamp for saving ---
        const dateToSave = voucher.date ? Timestamp.fromDate(parseISO(voucher.date as string)) : Timestamp.now();

        const voucherData = {
          date: dateToSave,
          type: voucher.type || 'Traspaso',
          description: voucher.description || '',
          status: statusToSave,
          total: totalDebit,
          entries: entries.map(e => ({
            account: e.account || '',
            description: e.description || '',
            debit: e.debit || 0,
            credit: e.credit || 0,
            id: e.id && !e.id.startsWith('new-') ? e.id : `entry-${Date.now()}-${Math.random()}`,
          })),
          companyId: companyId
        };

        try {
            if (isNew) {
                await addDoc(collectionRef, voucherData);
                toast({
                    title: "Éxito",
                    description: "El comprobante ha sido creado.",
                });
            } else {
                const docRef = doc(firestore, collectionPath, id);
                await setDoc(docRef, voucherData, { merge: true });
                toast({
                    title: "Éxito",
                    description: "El comprobante ha sido actualizado.",
                });
            }
            router.push('/dashboard/vouchers');
        } catch (err) {
            toast({
                title: "Error al guardar",
                description: "No se pudo guardar el comprobante. Por favor, intenta de nuevo.",
                variant: "destructive",
            });
        }
    };
    
    if (voucherLoading && !isNew) return <p>Cargando comprobante...</p>;
    if (!isNew && !voucher && !voucherLoading) return <p>No se encontró el comprobante.</p>;
    if (!voucher) return null;

    const periodIsDefined = selectedCompany?.periodStartDate && selectedCompany?.periodEndDate;
    const lastClosedDateInfo = selectedCompany?.lastClosedDate
        ? `Último cierre: ${format(parseISO(selectedCompany.lastClosedDate), 'P', { locale: es })}.`
        : "Aún no hay períodos cerrados.";

    const togglePopover = (entryId: string) => {
        setOpenPopovers(prev => ({ ...prev, [entryId]: !prev[entryId] }));
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/dashboard/vouchers"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>
                                        {isNew ? 'Nuevo Comprobante' : `Editar Comprobante #${id.substring(0, 6)}`}
                                    </CardTitle>
                                    <CardDescription>
                                        {periodIsDefined 
                                            ? `Período activo: ${format(parseISO(selectedCompany.periodStartDate as string), 'P', { locale: es })} - ${format(parseISO(selectedCompany.periodEndDate as string), 'P', { locale: es })}. ${lastClosedDateInfo}`
                                            : "Define el período de trabajo en la configuración de la empresa."
                                        }
                                    </CardDescription>
                                </div>
                                <Badge variant={voucher.status === 'Contabilizado' ? 'outline' : 'secondary'}>
                                    {voucher.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="voucher-date">Fecha</Label>
                            <Input 
                                id="voucher-date" 
                                type="date" 
                                value={(voucher.date as string) || ''}
                                onChange={(e) => handleHeaderChange('date', e.target.value)}
                                disabled={!periodIsDefined}
                            />
                            {dateError && <p className="text-sm text-destructive">{dateError}</p>}
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="voucher-type">Tipo</Label>
                            <Select value={voucher.type} onValueChange={(value) => handleHeaderChange('type', value as 'Ingreso' | 'Egreso' | 'Traspaso')} disabled={!periodIsDefined}>
                                <SelectTrigger id="voucher-type">
                                    <SelectValue placeholder="Selecciona un tipo"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ingreso">Ingreso</SelectItem>
                                    <SelectItem value="Egreso">Egreso</SelectItem>
                                    <SelectItem value="Traspaso">Traspaso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="voucher-description">Descripción</Label>
                            <Input 
                                id="voucher-description"
                                value={voucher.description || ''}
                                onChange={(e) => handleHeaderChange('description', e.target.value)}
                                placeholder="Ej: Pago de factura #101"
                                disabled={!periodIsDefined}
                            />
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Cuenta Contable</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="w-[180px] text-right">Debe</TableHead>
                                <TableHead className="w-[180px] text-right">Haber</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Popover open={openPopovers[entry.id!] || false} onOpenChange={() => togglePopover(entry.id!)}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openPopovers[entry.id!] || false}
                                                    className="w-full justify-between font-normal"
                                                    disabled={accountsLoading || !periodIsDefined}
                                                >
                                                    {accountsLoading ? "Cargando..." : entry.account
                                                        ? accounts?.find((acc) => acc.code === entry.account)?.name
                                                        : "Seleccionar cuenta..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Buscar cuenta..." />
                                                    <CommandList>
                                                        <CommandEmpty>No se encontró la cuenta.</CommandEmpty>
                                                        <CommandGroup>
                                                            {accounts?.map((acc) => (
                                                                <CommandItem
                                                                    key={acc.id}
                                                                    value={`${acc.code} ${acc.name}`}
                                                                    onSelect={() => {
                                                                        handleEntryChange(entry.id!, 'account', acc.code);
                                                                        togglePopover(entry.id!);
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", acc.code === entry.account ? "opacity-100" : "opacity-0")} />
                                                                    {acc.code} - {acc.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            value={entry.description}
                                            onChange={(e) => handleEntryChange(entry.id!, 'description', e.target.value)}
                                            placeholder="Descripción del asiento"
                                            disabled={!periodIsDefined}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="text-right"
                                            value={entry.debit}
                                            onChange={(e) => handleEntryChange(entry.id!, 'debit', parseFloat(e.target.value) || 0)}
                                            disabled={!periodIsDefined}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="text-right"
                                            value={entry.credit}
                                            onChange={(e) => handleEntryChange(entry.id!, 'credit', parseFloat(e.target.value) || 0)}
                                            disabled={!periodIsDefined}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveEntry(entry.id!)} disabled={!periodIsDefined}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {entries.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No hay asientos contables. Agrega uno para empezar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={2}>
                                     <Button size="sm" variant="outline" className="gap-1" onClick={handleAddEntry} disabled={!periodIsDefined}>
                                        <PlusCircle className="h-4 w-4" />
                                        Agregar Línea
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right font-bold text-lg">${Math.round(totalDebit).toLocaleString('es-CL')}</TableCell>
                                <TableCell className="text-right font-bold text-lg">${Math.round(totalCredit).toLocaleString('es-CL')}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell colSpan={2}></TableCell>
                                <TableCell className="text-right font-bold" colSpan={2}>
                                    {!isBalanced || totalDebit === 0 ? (
                                         <span className="text-destructive">Diferencia: ${(totalDebit - totalCredit).toLocaleString('es-CL')}</span>
                                    ): (
                                        <span className="text-green-600">Comprobante Cuadrado</span>
                                    )}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-end items-center gap-2 pt-6">
                    {!canSave && <ValidationChecklist items={validationErrors} />}
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/vouchers">Cancelar</Link>
                    </Button>
                    <Button disabled={!canSave} onClick={handleSaveClick}>Guardar Comprobante</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
