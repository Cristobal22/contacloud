
'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SelectedCompanyContext } from "../../layout";
import { useCollection, useFirestore } from "@/firebase";
import type { Account } from "@/lib/types";

export default function CentralizationRcvPage() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const { toast } = useToast();
    const firestore = useFirestore();

    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: selectedCompany ? `companies/${selectedCompany.id}/accounts` : undefined,
    });
    
    const [year, setYear] = React.useState(currentYear.toString());
    const [month, setMonth] = React.useState(currentMonth.toString());
    const [isCentralizing, setIsCentralizing] = React.useState(false);

    const handleCentralize = async () => {
        // This functionality is a placeholder for now
        toast({
            title: "Función en desarrollo",
            description: "La centralización automática desde el SII aún no está implementada.",
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Centralización RCV (SII)</CardTitle>
                <CardDescription>Centraliza automáticamente el Registro de Compras y Ventas desde el SII.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed p-8 text-center max-w-lg mx-auto">
                    <h3 className="text-lg font-semibold">Iniciar Proceso de Centralización</h3>
                    <div className="w-full space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 text-left">
                                <Label htmlFor="month">Mes</Label>
                                <Select value={month} onValueChange={setMonth} disabled={isCentralizing}>
                                    <SelectTrigger id="month">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i+1} value={(i+1).toString()}>
                                                {new Date(0, i).toLocaleString('es-CL', { month: 'long' })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 text-left">
                                <Label htmlFor="year">Año</Label>
                                <Select value={year} onValueChange={setYear} disabled={isCentralizing}>
                                    <SelectTrigger id="year">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <SelectItem key={currentYear-i} value={(currentYear-i).toString()}>
                                                {currentYear-i}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground text-left">
                            Esta acción se conectará al SII para obtener los documentos del período seleccionado y generar los asientos contables correspondientes.
                        </p>
                    </div>
                    <Button className="w-full" onClick={handleCentralize} disabled={!selectedCompany}>
                        {isCentralizing ? "Centralizando..." : "Centralizar Período"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
