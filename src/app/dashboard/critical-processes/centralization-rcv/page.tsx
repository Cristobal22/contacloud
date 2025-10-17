
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
import type { Account, Company } from "@/lib/types";
import { centralizeRcv } from "@/ai/flows/centralize-rcv-flow";
import { addDoc, collection } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

type RcvRow = {
    tipo: 'compra' | 'venta';
    neto: number;
    iva: number;
    total: number;
};


export default function CentralizationRcvPage() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();

    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: selectedCompany ? `companies/${selectedCompany.id}/accounts` : undefined,
    });
    
    const [year, setYear] = React.useState(currentYear.toString());
    const [month, setMonth] = React.useState(currentMonth.toString());
    const [isCentralizing, setIsCentralizing] = React.useState(false);
    const [file, setFile] = React.useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = React.useState<string | null>(null);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            setFile(selectedFile);
            setFileName(selectedFile.name);
        } else {
            setFile(null);
            setFileName(null);
        }
    };


    const handleCentralize = async () => {
        if (!file || !selectedCompany || !accounts) {
             toast({
                variant: "destructive",
                title: "Faltan datos",
                description: "Por favor, carga un archivo y asegúrate de tener una empresa y plan de cuentas seleccionados.",
            });
            return;
        }

        setIsCentralizing(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            
            try {
                const rows = text.split('\n').slice(1); // Omitir encabezado
                if (rows.length === 0) throw new Error("El archivo CSV está vacío o tiene un formato incorrecto.");

                let purchaseNet = 0, purchaseTax = 0, purchaseTotal = 0;
                let saleNet = 0, saleTax = 0, saleTotal = 0;

                rows.forEach(row => {
                    const columns = row.split(',');
                    if (columns.length < 4) return;
                    
                    const type = columns[0].toLowerCase().trim();
                    const net = parseFloat(columns[1]) || 0;
                    const tax = parseFloat(columns[2]) || 0;
                    const total = parseFloat(columns[3]) || 0;

                    if (type === 'compra') {
                        purchaseNet += net;
                        purchaseTax += tax;
                        purchaseTotal += total;
                    } else if (type === 'venta') {
                        saleNet += net;
                        saleTax += tax;
                        saleTotal += total;
                    }
                });

                const companyConfig: Partial<Company> = {
                    id: selectedCompany.id,
                    name: selectedCompany.name,
                    purchasesInvoicesPayableAccount: selectedCompany.purchasesInvoicesPayableAccount,
                    purchasesVatAccount: selectedCompany.purchasesVatAccount,
                    salesInvoicesReceivableAccount: selectedCompany.salesInvoicesReceivableAccount,
                    salesVatAccount: selectedCompany.salesVatAccount,
                };
                
                const generatedVouchers = await centralizeRcv({
                    rcvSummary: {
                        purchases: { netAmount: purchaseNet, taxAmount: purchaseTax, totalAmount: purchaseTotal },
                        sales: { netAmount: saleNet, taxAmount: saleTax, totalAmount: saleTotal },
                    },
                    accounts,
                    companyConfig,
                    period: { month: parseInt(month), year: parseInt(year) },
                });

                if (firestore) {
                    const collectionPath = `companies/${selectedCompany.id}/vouchers`;
                    const collectionRef = collection(firestore, collectionPath);
                    for (const voucher of generatedVouchers) {
                        await addDoc(collectionRef, voucher);
                    }
                    toast({
                        title: "Centralización Exitosa",
                        description: "Se crearon los comprobantes de compras y ventas en estado borrador.",
                        action: <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/vouchers')}>Ver Comprobantes</Button>
                    });
                }
            } catch (error: any) {
                console.error("Error during centralization:", error);
                toast({
                    variant: "destructive",
                    title: "Error en la Centralización",
                    description: "No se pudo procesar el archivo o generar los comprobantes: " + error.message,
                });
            } finally {
                setIsCentralizing(false);
            }
        };

        reader.onerror = () => {
            toast({
                variant: "destructive",
                title: "Error de Lectura",
                description: "No se pudo leer el archivo seleccionado.",
            });
            setIsCentralizing(false);
        };

        reader.readAsText(file);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Centralización RCV (vía Archivo)</CardTitle>
                <CardDescription>Centraliza el Registro de Compras y Ventas cargando un archivo CSV desde tu computador.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed p-8 text-center max-w-2xl mx-auto">
                    <h3 className="text-lg font-semibold">1. Selecciona el Período</h3>
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
                    </div>
                     <h3 className="text-lg font-semibold mt-4">2. Carga tu Archivo</h3>
                     <p className="text-sm text-muted-foreground text-center -mt-4">
                        El archivo debe ser CSV con las columnas: `tipo` (compra/venta), `neto`, `iva`, `total`.
                    </p>
                    <div className="flex items-center gap-2">
                        <Input id="file-upload" type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".csv"/>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!selectedCompany || isCentralizing}>
                            <Upload className="mr-2 h-4 w-4" />
                            Elegir Archivo
                        </Button>
                        {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
                    </div>

                    <Button className="w-full mt-4" onClick={handleCentralize} disabled={!selectedCompany || !file || isCentralizing || accountsLoading}>
                        {isCentralizing ? "Centralizando..." : (accountsLoading ? "Cargando datos..." : "Procesar Archivo y Centralizar")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
