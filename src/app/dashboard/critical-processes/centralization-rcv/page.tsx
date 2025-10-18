
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
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Upload, FileText } from "lucide-react";
import { format, lastDayOfMonth } from "date-fns";
import { es } from "date-fns/locale";

type RcvSummary = {
    netAmount: number;
    taxAmount: number;
    totalAmount: number;
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
    const [isProcessing, setIsProcessing] = React.useState(false);

    const [purchaseFile, setPurchaseFile] = React.useState<File | null>(null);
    const [salesFile, setSalesFile] = React.useState<File | null>(null);
    const purchaseFileInputRef = React.useRef<HTMLInputElement>(null);
    const salesFileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'purchase' | 'sale') => {
        const file = event.target.files?.[0];
        if (file) {
            if (type === 'purchase') setPurchaseFile(file);
            else setSalesFile(file);
        }
    };
    
    const processAndCentralize = async (type: 'purchase' | 'sale') => {
        const file = type === 'purchase' ? purchaseFile : salesFile;
        if (!file || !selectedCompany || !firestore) {
             toast({
                variant: "destructive",
                title: "Faltan datos",
                description: "Por favor, carga un archivo y asegúrate de tener una empresa seleccionada.",
            });
            return;
        }

        const requiredAccounts = type === 'purchase' 
            ? [selectedCompany.purchasesVatAccount, selectedCompany.purchasesInvoicesPayableAccount]
            : [selectedCompany.salesVatAccount, selectedCompany.salesInvoicesReceivableAccount];
        
        if (requiredAccounts.some(acc => !acc)) {
            toast({
                variant: "destructive",
                title: "Configuración incompleta",
                description: `Por favor, define las cuentas de ${type === 'purchase' ? 'compras' : 'ventas'} (IVA y Cuentas por Pagar/Cobrar) en la configuración de la empresa.`,
                action: <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard/companies/settings')}>Ir a Configuración</Button>
            });
            return;
        }

        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            
            try {
                const rows = text.split('\n').slice(1);
                if (rows.length === 0) throw new Error("El archivo CSV está vacío o tiene un formato incorrecto.");

                const summary: RcvSummary = rows.reduce((acc, row) => {
                    const columns = row.split(';');
                    if (columns.length < 15) return acc;
                    // Column 10: Monto Neto, Column 11: Monto IVA Recuperable, Column 14: Monto Total
                    acc.netAmount += parseFloat(columns[10]) || 0;
                    acc.taxAmount += parseFloat(columns[11]) || 0;
                    acc.totalAmount += parseFloat(columns[14]) || 0;
                    return acc;
                }, { netAmount: 0, taxAmount: 0, totalAmount: 0 });

                if(summary.totalAmount === 0) {
                    throw new Error("No se encontraron montos válidos en el archivo. Revisa el formato (neto,iva,total).");
                }
                
                const periodDate = new Date(parseInt(year), parseInt(month) - 1);
                const lastDay = lastDayOfMonth(periodDate);
                const monthName = format(periodDate, 'MMMM', { locale: es });
                
                const defaultResultAccount = type === 'purchase'
                    ? accounts?.find(a => a.name.toUpperCase().includes('GASTOS') && a.code.length > 5) // Find a detail expense account
                    : accounts?.find(a => a.code.startsWith('40101') && a.code.length > 5); // Find a detail income account
                
                if (!defaultResultAccount) {
                    throw new Error(`No se encontró una cuenta de resultado por defecto para ${type === 'purchase' ? 'gastos' : 'ingresos'}.`);
                }

                let entries = [];
                if (type === 'purchase') {
                    entries = [
                        { account: defaultResultAccount.code, description: 'Neto Compras del período', debit: summary.netAmount, credit: 0 },
                        { account: selectedCompany.purchasesVatAccount!, description: 'IVA Crédito Fiscal', debit: summary.taxAmount, credit: 0 },
                        { account: selectedCompany.purchasesInvoicesPayableAccount!, description: 'Total Facturas por Pagar', debit: 0, credit: summary.totalAmount },
                    ];
                } else { // sale
                    entries = [
                        { account: selectedCompany.salesInvoicesReceivableAccount!, description: 'Total Facturas por Cobrar', debit: summary.totalAmount, credit: 0 },
                        { account: defaultResultAccount.code, description: 'Neto Ventas del período', debit: 0, credit: summary.netAmount },
                        { account: selectedCompany.salesVatAccount!, description: 'IVA Débito Fiscal', debit: 0, credit: summary.taxAmount },
                    ];
                }

                const voucherData = {
                    date: format(lastDay, 'yyyy-MM-dd'),
                    type: 'Traspaso',
                    description: `Centralización ${type === 'purchase' ? 'Compras' : 'Ventas'} ${monthName} ${year}`,
                    status: 'Borrador',
                    total: summary.totalAmount,
                    entries,
                    companyId: selectedCompany.id,
                };

                const collectionPath = `companies/${selectedCompany.id}/vouchers`;
                await addDoc(collection(firestore, collectionPath), voucherData);

                toast({
                    title: `Centralización de ${type === 'purchase' ? 'Compras' : 'Ventas'} Exitosa`,
                    description: `Se creó el comprobante en estado borrador.`,
                    action: <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/vouchers')}>Ver Comprobantes</Button>
                });


            } catch (error: any) {
                console.error("Error during centralization:", error);
                toast({
                    variant: "destructive",
                    title: "Error en la Centralización",
                    description: "No se pudo procesar el archivo o generar el comprobante: " + error.message,
                });
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsText(file, 'ISO-8859-1');
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Centralización RCV (vía Archivo)</CardTitle>
                <CardDescription>Centraliza el Registro de Compras y Ventas cargando archivos CSV desde tu computador.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="max-w-lg mx-auto space-y-4">
                    <h3 className="text-lg font-semibold text-center">1. Selecciona el Período</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 text-left">
                            <Label htmlFor="month">Mes</Label>
                            <Select value={month} onValueChange={setMonth} disabled={isProcessing}>
                                <SelectTrigger id="month"><SelectValue /></SelectTrigger>
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
                            <Select value={year} onValueChange={setYear} disabled={isProcessing}>
                                <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <SelectItem key={currentYear-i} value={(currentYear-i).toString()}>{currentYear-i}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 items-start">
                    {/* Compras */}
                    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center">
                         <FileText className="h-10 w-10 text-primary" />
                        <h3 className="text-lg font-semibold">2. Cargar Registro de Compras</h3>
                        <p className="text-xs text-muted-foreground">
                            El CSV debe tener las columnas: `neto`, `iva`, `total`.
                        </p>
                        <div className="flex items-center gap-2">
                            <Input id="purchase-file-upload" type="file" ref={purchaseFileInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'purchase')} accept=".csv"/>
                            <Button variant="outline" onClick={() => purchaseFileInputRef.current?.click()} disabled={!selectedCompany || isProcessing}>
                                <Upload className="mr-2 h-4 w-4" />
                                {purchaseFile ? 'Cambiar Archivo' : 'Elegir Archivo'}
                            </Button>
                        </div>
                        {purchaseFile && <p className="text-sm text-muted-foreground truncate max-w-[200px]">{purchaseFile.name}</p>}
                        <Button className="w-full mt-2" onClick={() => processAndCentralize('purchase')} disabled={!selectedCompany || !purchaseFile || isProcessing || accountsLoading}>
                            {isProcessing ? "Procesando..." : (accountsLoading ? "Cargando..." : "Centralizar Compras")}
                        </Button>
                    </div>

                    {/* Ventas */}
                     <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center">
                        <FileText className="h-10 w-10 text-primary" />
                        <h3 className="text-lg font-semibold">3. Cargar Registro de Ventas</h3>
                        <p className="text-xs text-muted-foreground">
                           El CSV debe tener las columnas: `neto`, `iva`, `total`.
                        </p>
                        <div className="flex items-center gap-2">
                            <Input id="sales-file-upload" type="file" ref={salesFileInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'sale')} accept=".csv"/>
                            <Button variant="outline" onClick={() => salesFileInputRef.current?.click()} disabled={!selectedCompany || isProcessing}>
                                 <Upload className="mr-2 h-4 w-4" />
                                {salesFile ? 'Cambiar Archivo' : 'Elegir Archivo'}
                            </Button>
                        </div>
                         {salesFile && <p className="text-sm text-muted-foreground truncate max-w-[200px]">{salesFile.name}</p>}
                         <Button className="w-full mt-2" onClick={() => processAndCentralize('sale')} disabled={!selectedCompany || !salesFile || isProcessing || accountsLoading}>
                            {isProcessing ? "Procesando..." : (accountsLoading ? "Cargando..." : "Centralizar Ventas")}
                        </Button>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
