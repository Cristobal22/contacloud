'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Checkbox } from '@/components/ui/checkbox';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import type { Employee, CostCenter } from '@/lib/types';
import { SelectedCompanyContext } from '@/app/dashboard/layout';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

type PageProps = {
    params: {
        id: string;
    };
};

export default function EmployeeFormPage({ params }: PageProps) {
    const { id } = params;
    const isNew = id === 'new';
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const firestore = useFirestore();
    const router = useRouter();

    const employeeRef = !isNew && firestore && selectedCompany ? doc(firestore, `companies/${selectedCompany.id}/employees`, id) : null;
    const { data: existingEmployee, loading: employeeLoading } = useDoc<Employee>(employeeRef);

    const [employee, setEmployee] = React.useState<Partial<Employee> | null>(null);

    const { data: costCenters, loading: costCentersLoading } = useCollection<CostCenter>({
        path: selectedCompany ? `companies/${selectedCompany.id}/cost-centers` : undefined,
        companyId: selectedCompany?.id
    });

    React.useEffect(() => {
        if (isNew) {
            setEmployee({ status: 'Active', hasUnemploymentInsurance: true });
        } else if (existingEmployee) {
            setEmployee(existingEmployee);
        }
    }, [isNew, existingEmployee]);

    const handleFieldChange = (field: keyof Employee, value: string | number | boolean) => {
        if (employee) {
            setEmployee({ ...employee, [field]: value });
        }
    };
    
    const handleSaveChanges = () => {
        if (!firestore || !selectedCompany || !employee) return;
        
        const collectionPath = `companies/${selectedCompany.id}/employees`;
        const collectionRef = collection(firestore, collectionPath);
        
        const employeeData = { ...employee, companyId: selectedCompany.id };

        router.push('/dashboard/employees');

        if (isNew) {
            addDoc(collectionRef, employeeData)
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: collectionPath,
                        operation: 'create',
                        requestResourceData: employeeData,
                    }));
                });
        } else {
            const docRef = doc(firestore, collectionPath, id);
            setDoc(docRef, employeeData, { merge: true })
                 .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: employeeData,
                    }));
                });
        }
    };

    if (employeeLoading) {
        return <p>Cargando empleado...</p>;
    }
    
    if (!isNew && !employee && !employeeLoading) {
        return <p>No se encontró el empleado.</p>;
    }
    
    if (!employee) {
        return null; 
    }


    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard/employees"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <CardTitle>{isNew ? 'Agregar Nuevo Empleado' : `Editar Ficha de ${employee.firstName} ${employee.lastName}`}</CardTitle>
                        <CardDescription>Completa la información detallada del empleado.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Personal Data */}
                <section className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Datos Personales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>RUT</Label><Input value={employee.rut || ''} onChange={(e) => handleFieldChange('rut', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Nombres</Label><Input value={employee.firstName || ''} onChange={(e) => handleFieldChange('firstName', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Apellidos</Label><Input value={employee.lastName || ''} onChange={(e) => handleFieldChange('lastName', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Fecha de Nacimiento</Label><Input type="date" value={employee.birthDate || ''} onChange={(e) => handleFieldChange('birthDate', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Nacionalidad</Label><Input value={employee.nationality || ''} onChange={(e) => handleFieldChange('nationality', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Dirección</Label><Input value={employee.address || ''} onChange={(e) => handleFieldChange('address', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Comuna</Label><Input value={employee.commune || ''} onChange={(e) => handleFieldChange('commune', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Región</Label><Input value={employee.region || ''} onChange={(e) => handleFieldChange('region', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Teléfono</Label><Input value={employee.phone || ''} onChange={(e) => handleFieldChange('phone', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Email</Label><Input type="email" value={employee.email || ''} onChange={(e) => handleFieldChange('email', e.target.value)} /></div>
                        <div className="space-y-2">
                            <Label>Género</Label>
                             <Select value={employee.gender} onValueChange={(v) => handleFieldChange('gender', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Femenino">Femenino</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent></Select>
                        </div>
                        <div className="space-y-2">
                             <Label>Estado Civil</Label>
                             <Select value={employee.civilStatus} onValueChange={(v) => handleFieldChange('civilStatus', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                                <SelectItem value="Soltero/a">Soltero/a</SelectItem>
                                <SelectItem value="Casado/a">Casado/a</SelectItem>
                                <SelectItem value="Viudo/a">Viudo/a</SelectItem>
                                <SelectItem value="Divorciado/a">Divorciado/a</SelectItem>
                                <SelectItem value="Conviviente Civil">Conviviente Civil</SelectItem>
                            </SelectContent></Select>
                        </div>
                    </div>
                </section>

                {/* Contract Data */}
                <section className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Datos Contractuales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo de Contrato</Label>
                             <Select value={employee.contractType} onValueChange={(v) => handleFieldChange('contractType', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                                <SelectItem value="Indefinido">Indefinido</SelectItem>
                                <SelectItem value="Plazo Fijo">Plazo Fijo</SelectItem>
                                <SelectItem value="Por Obra o Faena">Por Obra o Faena</SelectItem>
                                <SelectItem value="Part-Time">Part-Time</SelectItem>
                                <SelectItem value="Honorarios">Honorarios</SelectItem>
                             </SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>Cargo</Label><Input value={employee.position || ''} onChange={(e) => handleFieldChange('position', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Fecha Inicio Contrato</Label><Input type="date" value={employee.contractStartDate || ''} onChange={(e) => handleFieldChange('contractStartDate', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Fecha Término Contrato</Label><Input type="date" value={employee.contractEndDate || ''} onChange={(e) => handleFieldChange('contractEndDate', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Sueldo Base</Label><Input type="number" value={employee.baseSalary ?? ''} onChange={(e) => handleFieldChange('baseSalary', parseFloat(e.target.value))} /></div>
                         <div className="space-y-2">
                            <Label>Centro de Costo</Label>
                            <Select value={employee.costCenterId || ''} onValueChange={(v) => handleFieldChange('costCenterId', v)} disabled={costCentersLoading}>
                                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                                <SelectContent>
                                    {costCenters?.map(cc => <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select value={employee.status || 'Inactive'} onValueChange={(v) => handleFieldChange('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                                <SelectItem value="Active">Activo</SelectItem>
                                <SelectItem value="Inactive">Inactivo</SelectItem>
                            </SelectContent></Select>
                        </div>
                    </div>
                </section>
                
                {/* Previsional Data */}
                <section className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Datos Previsionales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="space-y-2">
                            <Label>Sistema de Salud</Label>
                            <Select value={employee.healthSystem} onValueChange={(v) => handleFieldChange('healthSystem', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                                <SelectItem value="Fonasa">Fonasa</SelectItem>
                                <SelectItem value="Consalud">Consalud</SelectItem>
                                <SelectItem value="CruzBlanca">CruzBlanca</SelectItem>
                                <SelectItem value="Colmena">Colmena</SelectItem>
                                <SelectItem value="Banmédica">Banmédica</SelectItem>
                                <SelectItem value="Vida Tres">Vida Tres</SelectItem>
                                <SelectItem value="Nueva Masvida">Nueva Masvida</SelectItem>
                            </SelectContent></Select>
                        </div>
                         <div className="space-y-2">
                            <Label>AFP</Label>
                             <Select value={employee.afp} onValueChange={(v) => handleFieldChange('afp', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                                <SelectItem value="Capital">Capital</SelectItem>
                                <SelectItem value="Cuprum">Cuprum</SelectItem>
                                <SelectItem value="Habitat">Habitat</SelectItem>
                                <SelectItem value="Modelo">Modelo</SelectItem>
                                <SelectItem value="Planvital">Planvital</SelectItem>
                                <SelectItem value="Provida">Provida</SelectItem>
                                <SelectItem value="Uno">Uno</SelectItem>
                            </SelectContent></Select>
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                            <Checkbox id="hasUnemploymentInsurance" checked={!!employee.hasUnemploymentInsurance} onCheckedChange={(checked) => handleFieldChange('hasUnemploymentInsurance', !!checked)} />
                            <Label htmlFor="hasUnemploymentInsurance">Tiene Seguro de Cesantía</Label>
                        </div>
                    </div>
                </section>

                 {/* Payment Data */}
                <section className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Datos de Pago</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Forma de Pago</Label>
                            <Select value={employee.paymentMethod} onValueChange={(v) => handleFieldChange('paymentMethod', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                                <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                                <SelectItem value="Cheque">Cheque</SelectItem>
                                <SelectItem value="Efectivo">Efectivo</SelectItem>
                            </SelectContent></Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Banco</Label>
                             <Select value={employee.bank} onValueChange={(v) => handleFieldChange('bank', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                                <SelectItem value="Banco de Chile">Banco de Chile</SelectItem>
                                <SelectItem value="Banco Internacional">Banco Internacional</SelectItem>
                                <SelectItem value="Scotiabank Chile">Scotiabank Chile</SelectItem>
                                <SelectItem value="BCI">BCI</SelectItem>
                                <SelectItem value="Banco Bice">Banco Bice</SelectItem>
                                <SelectItem value="HSBC Bank (Chile)">HSBC Bank (Chile)</SelectItem>
                                <SelectItem value="Banco Santander-Chile">Banco Santander-Chile</SelectItem>
                                <SelectItem value="Itaú Corpbanca">Itaú Corpbanca</SelectItem>
                                <SelectItem value="Banco Security">Banco Security</SelectItem>
                                <SelectItem value="Banco Falabella">Banco Falabella</SelectItem>
                                <SelectItem value="Banco Ripley">Banco Ripley</SelectItem>
                                <SelectItem value="Banco Consorcio">Banco Consorcio</SelectItem>
                                <SelectItem value="Scotiabank Azul (Ex-BBVA)">Scotiabank Azul (Ex-BBVA)</SelectItem>
                                <SelectItem value="BancoEstado">BancoEstado</SelectItem>
                            </SelectContent></Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Tipo de Cuenta</Label>
                             <Select value={employee.accountType} onValueChange={(v) => handleFieldChange('accountType', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                                <SelectItem value="Cuenta Corriente">Cuenta Corriente</SelectItem>
                                <SelectItem value="Cuenta Vista">Cuenta Vista</SelectItem>
                                <SelectItem value="Cuenta de Ahorro">Cuenta de Ahorro</SelectItem>
                            </SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>Número de Cuenta</Label><Input value={employee.accountNumber || ''} onChange={(e) => handleFieldChange('accountNumber', e.target.value)} /></div>
                    </div>
                </section>
            </CardContent>
             <CardFooter className="flex justify-end">
                <Button onClick={handleSaveChanges} disabled={!selectedCompany}>Guardar Cambios</Button>
            </CardFooter>
        </Card>
    );
}
