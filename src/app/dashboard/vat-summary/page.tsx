
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  
  export default function VatSummaryPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumen Mensual IVA</CardTitle>
          <CardDescription>Consulta el resumen mensual de IVA (Impuesto al Valor Agregado).</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Aquí podrás generar y visualizar el resumen de IVA débito y crédito fiscal del mes.</p>
        </CardContent>
      </Card>
    )
  }
  