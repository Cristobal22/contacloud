
'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Upload } from "lucide-react"
  import { Input } from '@/components/ui/input';
  
  export default function BankReconciliationPage() {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = React.useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFileName(event.target.files[0].name);
        } else {
            setFileName(null);
        }
    };
    
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
                                <Input id="file-upload" type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange}/>
                                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Cargar Archivo
                                </Button>
                                {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Sube el archivo de tu cartola bancaria para iniciar el proceso.</p>
                        </div>
                        <Button disabled={!fileName}>Iniciar Conciliación</Button>
                    </div>
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
  
