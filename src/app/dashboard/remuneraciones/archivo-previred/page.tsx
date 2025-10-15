import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  
  export default function ArchivoPreviredPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Archivo Previred</CardTitle>
          <CardDescription>Genera el archivo para el pago de cotizaciones en Previred.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
            <h3 className="text-lg font-semibold">Generación de Archivo</h3>
            <p className="text-sm text-muted-foreground">Esta función generará el archivo de carga para Previred basado en las liquidaciones procesadas del mes.</p>
            <Button>Generar Archivo para el Mes Actual</Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  