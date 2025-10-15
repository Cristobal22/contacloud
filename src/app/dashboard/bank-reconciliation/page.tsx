'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Upload, ArrowLeft } from "lucide-react"
  import { Input } from '@/components/ui/input';
  import { useCollection } from '@/firebase';
  import type { Voucher } from '@/lib/types';
  import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';

  type BankTransaction = {
    date: string;
    description: string;
    amount: number;
  }
  
  export default function BankReconciliationPage({ companyId }: { companyId?: string }) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [fileName, setFileName] = React.useState<string | null>(null);
    const [isReconciling, setIsReconciling] = React.useState(false);
    const [bankTransactions, setBankTransactions] = React.useState<BankTransaction[]>([]);

    const { data: vouchers, loading: vouchersLoading } = useCollection<Voucher>({ 
      path: `companies/${companyId}/vouchers`,
      companyId: companyId 
    });


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
    
    const handleStartReconciliation = () => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').slice(1); // Assume CSV has header
            const transactions = rows.map(row => {
                const columns = row.split(',');
                // Assuming CSV format: date,description,amount
                if (columns.length < 3) return null;
                return {
                    date: columns[0],
                    description: columns[1],
                    amount: parseFloat(columns[2]) || 0,
                };
            }).filter(Boolean) as BankTransaction[];
            
            setBankTransactions(transactions);
            setIsReconciling(true);
        };
        reader.readAsText(file);
    };

    const handleFinishReconciliation = () => {
        setIsReconciling(false);
        setFile(null);
        setFileName(null);
        setBankTransactions([]);
    };


    if (isReconciling) {
        return (
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                           <Button variant="outline" size="icon" onClick={handleFinishReconciliation}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                           <div>
                                <CardTitle>Conciliando Movimientos</CardTitle>
                                <CardDescription>Compara los movimientos de tu banco con tus registros contables.</CardDescription>
                           </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Movimientos Bancarios</CardTitle>
                            <CardDescription>Movimientos extraídos del archivo: {fileName}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bankTransactions.map((tx, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{tx.date}</TableCell>
                                            <TableCell>{tx.description}</TableCell>
                                            <TableCell className="text-right">${tx.amount.toLocaleString('es-CL')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Registros Contables</CardTitle>
                            <CardDescription>Movimientos registrados en el sistema.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vouchersLoading && <TableRow><TableCell colSpan={3} className="text-center">Cargando registros...</TableCell></TableRow>}
                                    {vouchers?.filter(v => v.type !== 'Traspaso').map(v => (
                                        <TableRow key={v.id}>
                                            <TableCell>{new Date(v.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</TableCell>
                                            <TableCell>{v.description}</TableCell>
                                            <TableCell className="text-right">${v.total.toLocaleString('es-CL')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                 <CardFooter className="flex justify-end">
                    <Button onClick={handleFinishReconciliation}>Finalizar Conciliación</Button>
                </CardFooter>
            </div>
        )
    }
    
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Conciliación Bancaria</CardTitle>
                <CardDescription>Compara los movimientos de tu banco con tus registros contables.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-medium mb-2">Cargar Cartola Bancaria</h3>
                            <div className="flex items-center gap-2">
                                <Input id="file-upload" type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".csv"/>
                                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Cargar Archivo
                                </Button>
                                {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Sube el archivo de tu cartola bancaria en formato CSV.</p>
                        </div>
                        <Button onClick={handleStartReconciliation} disabled={!file || !companyId}>Iniciar Conciliación</Button>
                    </div>
                     {!companyId && (
                         <p className="text-sm text-destructive mt-2">Por favor, selecciona una empresa para poder iniciar la conciliación.</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Estado de Conciliación</CardTitle>
                    <CardDescription>Aún no se ha realizado ninguna conciliación.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Utiliza el cargador de archivos para iniciar tu primera conciliación.</p>
                </CardContent>
            </Card>
      </div>
    )
  }
  
