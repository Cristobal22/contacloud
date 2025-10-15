
'use client';
import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Upload } from "lucide-react"
  import { Input } from "@/components/ui/input";

  
  export default function ImportPreviredPage() {
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
      <Card>
        <CardHeader>
          <CardTitle>Importar Pago de Previred</CardTitle>
          <CardDescription>Importa el comprobante de pago de Previred para conciliar las cotizaciones.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground"/>
            <h3 className="text-lg font-semibold">Cargar Comprobante de Pago</h3>
            <p className="text-sm text-muted-foreground max-w-md">Sube el archivo PDF o XML del pago realizado en Previred para marcar las cotizaciones como pagadas.</p>
            <div className="flex items-center gap-2">
                <Input id="file-upload" type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange}/>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Cargar Archivo
                </Button>
                 <Button disabled={!fileName}>Procesar</Button>
            </div>
             {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>
        </CardContent>
      </Card>
    )
  }
  
