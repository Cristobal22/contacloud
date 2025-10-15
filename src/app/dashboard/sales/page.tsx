import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  
  export default function SalesPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventas</CardTitle>
          <CardDescription>Gestiona tus documentos de venta.</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground">Aquí podrás visualizar y gestionar tus facturas de venta.</p>
        </CardContent>
      </Card>
    )
  }
  