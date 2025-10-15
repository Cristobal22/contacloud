
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

  export default function MonthlyClosingPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cierre Mensual</CardTitle>
          <CardDescription>Realiza el proceso de cierre contable mensual para bloquear el período.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500"/>
                <h3 className="text-lg font-semibold">Proceso de Cierre</h3>
                <p className="text-sm text-muted-foreground">Al ejecutar el cierre, se bloquearán los movimientos del período para evitar modificaciones. Este proceso es irreversible.</p>
                <Button variant="destructive">Ejecutar Cierre Mensual</Button>
            </div>
        </CardContent>
      </Card>
    )
  }
  