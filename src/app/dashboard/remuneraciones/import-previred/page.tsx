import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Upload } from "lucide-react"

  
  export default function ImportPreviredPage() {
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
            <p className="text-sm text-muted-foreground">Sube el archivo PDF o XML del pago realizado en Previred para marcar las cotizaciones como pagadas.</p>
            <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Cargar Archivo
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  