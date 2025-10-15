import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  
  export default function PurchasesPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compras</CardTitle>
          <CardDescription>Gestiona tus documentos de compra.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aquí podrás visualizar y gestionar tus facturas de compra.</p>
        </CardContent>
      </Card>
    )
  }
  