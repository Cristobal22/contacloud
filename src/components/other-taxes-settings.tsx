
'use client';

import React from 'react';
import type { Account, TaxAccountMapping } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AccountSearchInput } from '@/components/account-search-input';

const definedTaxes: { code: string; name: string }[] = [
    { code: "27", name: "Imp. Adic. Licores, Piscos y Vinos (ILA)" },
    { code: "28", name: "Imp. Adic. Bebidas Analcohólicas y Minerales" },
    { code: "15", name: "Imp. Específico Diesel" },
    { code: "16", name: "Imp. Específico Gasolinas" },
    { code: "49", name: "Tabacos Elaborados" },
    { code: "50", name: "Cigarrillos" },
    { code: "23", name: "Imp. Adic. Pirotecnia, Armas y Similares" },
    { code: "24", name: "Imp. Adic. Alfombras y Tapices Finos" },
    { code: "25", name: "Imp. Adic. Pieles Finas" },
    { code: "26", name: "Imp. Adic. Casas Rodantes" },
    { code: "29", name: "Imp. Adic. Vehículos de Lujo" },
    { code: "32", name: "Margen de Comercialización" },
];

interface OtherTaxesSettingsProps {
    accounts: Account[];
    loading: boolean;
    mappings: TaxAccountMapping[];
    onChange: (newMappings: TaxAccountMapping[]) => void;
}

export function OtherTaxesSettings({ accounts, loading, mappings, onChange }: OtherTaxesSettingsProps) {

    const handleAccountChange = (taxCode: string, accountCode: string) => {
        const existingMappingIndex = mappings.findIndex(m => m.taxCode === taxCode);
        let newMappings = [...mappings];

        if (existingMappingIndex > -1) {
            // Update existing mapping
            if (accountCode) {
                newMappings[existingMappingIndex] = { ...newMappings[existingMappingIndex], accountCode };
            } else {
                // Remove if account is cleared
                newMappings.splice(existingMappingIndex, 1);
            }
        } else if (accountCode) {
            // Add new mapping
            newMappings.push({ taxCode, accountCode });
        }
        
        onChange(newMappings);
    };

    const getAccountForTax = (taxCode: string) => {
        return mappings.find(m => m.taxCode === taxCode)?.accountCode || '';
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-2/5">Impuesto</TableHead>
                    <TableHead className="w-3/5">Cuenta Contable Asignada</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {definedTaxes.map((tax) => (
                    <TableRow key={tax.code}>
                        <TableCell>
                            <span className="font-medium">{tax.name}</span>
                            <p className="text-xs text-muted-foreground">Código: {tax.code}</p>
                        </TableCell>
                        <TableCell>
                            <AccountSearchInput
                                label=""
                                value={getAccountForTax(tax.code)}
                                accounts={accounts}
                                loading={loading}
                                onValueChange={(value) => handleAccountChange(tax.code, value)}
                                placeholder="Buscar o seleccionar cuenta..."
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
