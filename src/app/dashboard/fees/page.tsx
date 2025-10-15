import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  
  export default function FeesPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Honorarios</CardTitle>
          <CardDescription>Gestiona tus boletas de honorarios.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aquí podrás registrar y consultar tus boletas de honorarios emitidas y recibidas.</p>
        </CardContent>
      </Card>
    )
  }
  