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
  import { useCollection } from "@/firebase"
  import type { Employee, CostCenter } from "@/lib/types"
  import Link from "next/link"
  import React from "react"
  
  export default function EmployeesPage({ companyId }: { companyId?: string }) {
    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ 
      path: `companies/${companyId}/employees`,
      companyId: companyId 
    });
    const { data: costCenters, loading: costCentersLoading } = useCollection<CostCenter>({
        path: `companies/${companyId}/cost-centers`,
        companyId: companyId,
    });

    const costCenterMap = React.useMemo(() => {
        if (!costCenters) return new Map<string, string>();
        return new Map(costCenters.map(cc => [cc.id, cc.name]));
    }, [costCenters]);

    const loading = employeesLoading || costCentersLoading;

    return (
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Personal</CardTitle>
                    <CardDescription>Gestiona los empleados de tu organización.</CardDescription>
                </div>
                <Button size="sm" className="gap-1" disabled={!companyId} asChild>
                  <Link href="/dashboard/employees/edit/new">
                    <PlusCircle className="h-4 w-4" />
                    Agregar Empleado
                  </Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Centro de Costo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
                </TableRow>
              )}
              {!loading && employees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{`${employee.firstName} ${employee.lastName}`}</TableCell>
                  <TableCell>{employee.rut}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.costCenterId ? costCenterMap.get(employee.costCenterId) : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === 'Active' ? "default" : "outline"}>
                      {employee.status === 'Active' ? "Activo" : "Inactivo"}
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
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/employees/edit/${employee.id}`}>Editar Ficha</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Ver Liquidaciones</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {!loading && employees?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">
                        {!companyId ? "Selecciona una empresa para ver sus empleados." : "No se encontraron empleados para esta empresa."}
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }
