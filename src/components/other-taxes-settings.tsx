
'use client';

import React from 'react';
import type { Account, TaxAccountMapping } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AccountSearchInput } from '@/components/account-search-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';

interface OtherTaxesSettingsProps {
    accounts: Account[];
    loading: boolean;
    mappings: TaxAccountMapping[];
    onChange: (newMappings: TaxAccountMapping[]) => void;
}

export function OtherTaxesSettings({ accounts, loading, mappings, onChange }: OtherTaxesSettingsProps) {

    const handleMappingChange = (index: number, field: keyof TaxAccountMapping, value: string) => {
        const newMappings = [...mappings];
        newMappings[index] = { ...newMappings[index], [field]: value };
        onChange(newMappings);
    };

    const handleAddMapping = () => {
        const newMappings = [...mappings, { taxCode: '', name: '', accountCode: '' }];
        onChange(newMappings);
    };

    const handleRemoveMapping = (index: number) => {
        const newMappings = mappings.filter((_, i) => i !== index);
        onChange(newMappings);
    };

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/5">Código</TableHead>
                        <TableHead className="w-2/5">Nombre del Impuesto</TableHead>
                        <TableHead className="w-2/5">Cuenta Contable Asignada</TableHead>
                        <TableHead className="w-1/5 text-right"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mappings.map((mapping, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <Input
                                    value={mapping.taxCode}
                                    onChange={(e) => handleMappingChange(index, 'taxCode', e.target.value)}
                                    placeholder="Ej: 271"
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    value={mapping.name}
                                    onChange={(e) => handleMappingChange(index, 'name', e.target.value)}
                                    placeholder="Ej: Mi Impuesto Específico"
                                />
                            </TableCell>
                            <TableCell>
                                <AccountSearchInput
                                    label=""
                                    value={mapping.accountCode}
                                    accounts={accounts}
                                    loading={loading}
                                    onValueChange={(value) => handleMappingChange(index, 'accountCode', value)}
                                    placeholder="Buscar o seleccionar cuenta..."
                                />
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveMapping(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {mappings.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                No hay impuestos personalizados. Añade uno para empezar.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="flex justify-start">
                <Button variant="outline" size="sm" onClick={handleAddMapping}>
                    Añadir Impuesto
                </Button>
            </div>
        </div>
    );
}
