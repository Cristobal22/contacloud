
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
import { centralizeRcv } from "@/ai/flows/centralize-rcv-flow";
import { SelectedCompanyContext } from "../../layout";
import { useCollection, useFirestore } from "@/firebase";
import type { Account } from "@/lib/types";
import { collection, addDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

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
        if (!selectedCompany || !accounts || !firestore) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Por favor, selecciona una empresa y asegúrate de que tenga un plan de cuentas.",
            });
            return;
        }

        setIsCentralizing(true);
        toast({
            title: "Iniciando Centralización",
            description: "La IA está procesando el RCV. Esto puede tardar un momento...",
        });

        // Mock RCV data
        const mockRcvSummary = {
            purchases: {
                netAmount: 1500000,
                taxAmount: 285000,
                totalAmount: 1785000,
            },
            sales: {
                netAmount: 3000000,
                taxAmount: 570000,
                totalAmount: 3570000,
            },
        };

        try {
            const generatedVouchers = await centralizeRcv({
                rcvSummary: mockRcvSummary,
                accounts: accounts,
                companyConfig: selectedCompany,
                period: { month: parseInt(month), year: parseInt(year) }
            });

            if (!generatedVouchers || generatedVouchers.length === 0) {
                 throw new Error("La IA no pudo generar los comprobantes.");
            }
            
            const collectionPath = `companies/${selectedCompany.id}/vouchers`;
            const collectionRef = collection(firestore, collectionPath);

            for (const voucher of generatedVouchers) {
                await addDoc(collectionRef, voucher).catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: collectionPath,
                        operation: 'create',
                        requestResourceData: voucher,
                    }));
                     throw new Error("Error de permisos al guardar en Firestore.");
                });
            }

            toast({
                title: "¡Centralización Exitosa!",
                description: "Se han generado y guardado los comprobantes de compra y venta.",
            });

        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error en la Centralización",
                description: "No se pudo completar el proceso. Revisa la consola para más detalles.",
            });
        } finally {
            setIsCentralizing(false);
        }
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
                    <Button className="w-full" onClick={handleCentralize} disabled={isCentralizing || !selectedCompany || accountsLoading}>
                        {isCentralizing ? "Centralizando..." : "Centralizar Período"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
