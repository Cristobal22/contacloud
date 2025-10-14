import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  import { Upload } from "lucide-react"
  
  export default function TaxDocumentsPage() {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Centralización de Documentos Tributarios</CardTitle>
            <CardDescription>Sube documentos de compra o venta para su centralización.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="document-type">Tipo de Documento</Label>
                <Select>
                  <SelectTrigger id="document-type">
                    <SelectValue placeholder="Selecciona el tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Documento de Compra</SelectItem>
                    <SelectItem value="sales">Documento de Venta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="tax-document-file">Archivo del Documento</Label>
                <div className="flex items-center gap-3">
                    <Input id="tax-document-file" type="file" className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('tax-document-file')?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Elegir Archivo
                    </Button>
                    <span className="text-sm text-muted-foreground">Ningún archivo seleccionado</span>
                </div>
                <p className="text-xs text-muted-foreground">Sube un archivo PDF, XML, o de imagen.</p>
              </div>
              <div className="flex justify-end">
                <Button>Procesar Documento</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Historial de Cargas</CardTitle>
                <CardDescription>Revisa el estado de las cargas de documentos anteriores.</CardDescription>
            </Header>
            <CardContent>
                <p className="text-sm text-muted-foreground">Aún no hay historial de cargas.</p>
            </CardContent>
        </Card>
      </div>
    )
  }
  