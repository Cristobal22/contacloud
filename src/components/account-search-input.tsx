'use client'
import React from "react";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Account } from "@/lib/types";

interface AccountSearchInputProps {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    accounts: Account[];
    loading: boolean;
}

export function AccountSearchInput({ label, value, onValueChange, accounts, loading }: AccountSearchInputProps) {
    const [accountName, setAccountName] = React.useState('');

    React.useEffect(() => {
        if (value && accounts.length > 0) {
            const account = accounts.find(acc => acc.code === value);
            setAccountName(account?.name || 'Cuenta no encontrada');
        } else if (!value) {
            setAccountName('');
        }
    }, [value, accounts]);

    const handleSearch = () => {
         const account = accounts.find(acc => acc.code === value);
         setAccountName(account?.name || 'Cuenta no encontrada');
    }

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <Input 
                    type="text" 
                    value={value} 
                    onChange={(e) => onValueChange(e.target.value)}
                    className="w-[120px]"
                />
                <Button variant="outline" onClick={handleSearch} disabled={loading}>
                    {loading ? 'Cargando...' : 'Buscar'}
                </Button>
                <Input 
                    type="text" 
                    value={accountName} 
                    readOnly 
                    className="flex-1 bg-muted"
                    placeholder="Nombre de la cuenta"
                />
            </div>
        </div>
    );
}
