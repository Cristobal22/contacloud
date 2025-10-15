
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  
  export default function GeneralBalancePage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance General</CardTitle>
          <CardDescription>Consulta el balance general de la empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aquí podrás visualizar un balance general detallado en un período específico.</p>
        </CardContent>
      </Card>
    )
  }
  