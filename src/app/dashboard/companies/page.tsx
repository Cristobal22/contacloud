'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Badge } from "@/components/ui/badge"
  import { MoreHorizontal, PlusCircle } from "lucide-react"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import { useCollection, useFirestore } from "@/firebase"
  import { collection } from "firebase/firestore"
  import type { Company } from "@/lib/types"
  
  export default function CompaniesPage() {
    const firestore = useFirestore();
    const companiesCollection = firestore ? collection(firestore, 'companies') : null;
    const { data: companies, loading } = useCollection<Company>({ query: companiesCollection });

    return (
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Empresas</CardTitle>
                    <CardDescription>Gestiona tus empresas cliente.</CardDescription>
                </div>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Agregar Empresa
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre de Empresa</TableHead>
                <TableHead>Industria</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                </TableRow>
              ) : companies && companies.length > 0 ? (
                companies.map((company) => (
                    <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.industry}</TableCell>
                    <TableCell>
                        <Badge variant={company.active ? "default" : "outline"}>
                        {company.active ? "Activa" : "Inactiva"}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                            Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">No se encontraron empresas.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }
