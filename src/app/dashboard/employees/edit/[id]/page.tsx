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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
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
import type { Employee, CostCenter, AfpEntity, HealthEntity, EconomicIndicator, LegalDocument } from '@/lib/types';
import { DOCUMENT_TEMPLATES } from '@/lib/document-templates';
import { SelectedCompanyContext } from '@/app/dashboard/layout';
import { doc, setDoc, addDoc, collection, where, DocumentReference, Timestamp, DocumentData, updateDoc } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FileText, Eye } from 'lucide-react';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { nationalities, regions, communesByRegion } from '@/lib/geographical-data';


export default function EmployeeFormPage() {
    const params = useParams();
    const id = params.id as string;
    const isNew = id === 'new';
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const router = useRouter();

    const employeeRef = React.useMemo(() => 
        !isNew && firestore && companyId ? doc(firestore, `companies/${companyId}/employees`, id) as DocumentReference<Employee> : null
    , [isNew, firestore, companyId, id]);

    const { data: existingEmployee, loading: employeeLoading } = useDoc<Employee>(employeeRef);
    
    const { data: legalDocuments, loading: documentsLoading } = useCollection<LegalDocument>({
        path: companyId ? `companies/${companyId}/documents` : undefined,
        query: companyId && !isNew ? [where('employeeId', '==', id)] : undefined,
    });

    const [employee, setEmployee] = React.useState<Partial<Employee> | null>(null);
    const [availableCommunes, setAvailableCommunes] = React.useState<string[]>([]);


    const { data: costCenters, loading: costCentersLoading } = useCollection<CostCenter>({
        path: companyId ? `companies/${companyId}/cost-centers` : undefined,
        companyId: companyId
    });

    const { data: afpEntities, loading: afpLoading } = useCollection<AfpEntity>({
        path: 'afp-entities',
    });
     const { data: healthEntities, loading: healthLoading } = useCollection<HealthEntity>({
        path: 'health-entities',
    });

    const uniqueAfpEntities = React.useMemo(() => {
        if (!afpEntities) return [];
        const uniqueMap = new Map<string, AfpEntity>();
        afpEntities.forEach(entity => {
            if (!uniqueMap.has(entity.name)) {
                uniqueMap.set(entity.name, entity);
            }
        });
        return Array.from(uniqueMap.values());
    }, [afpEntities]);

    const uniqueHealthEntities = React.useMemo(() => {
        if (!healthEntities) return [];
        const uniqueMap = new Map<string, HealthEntity>();
        healthEntities.forEach(entity => {
            if (!uniqueMap.has(entity.name)) {
                uniqueMap.set(entity.name, entity);
            }
        });
        return Array.from(uniqueMap.values());
    }, [healthEntities]);

    const { data: economicIndicators, loading: indicatorsLoading } = useCollection<EconomicIndicator>({
        path: 'economic-indicators',
    });

    const gratificationCapMonthly = React.useMemo(() => {
        if (!economicIndicators || economicIndicators.length === 0) {
            return 0;
        }
        const latestIndicator = economicIndicators
            .filter(i => i.minWage)
            .sort((a, b) => b.id.localeCompare(a.id))[0];
        
        if (!latestIndicator || !latestIndicator.minWage) return 0;
        
        return Math.round((4.75 * latestIndicator.minWage) / 12);
    }, [economicIndicators]);

    const formatDateForInput = (timestamp: any): string => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        // Adjust for timezone offset to get the correct date in the local timezone
        const adjustedDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
        const year = adjustedDate.getFullYear();
        const month = (adjustedDate.getMonth() + 1).toString().padStart(2, '0');
        const day = adjustedDate.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    React.useEffect(() => {
        if (isNew) {
            setEmployee({ 
                status: 'Active', 
                hasUnemploymentInsurance: true, 
                companyId: companyId,
                healthContributionType: 'Porcentaje',
                healthContributionValue: 7,
                gratificationType: 'Manual',
            });
        } else if (existingEmployee) {
            const employeeData = { ...existingEmployee };

            // Convert date fields for display
            if (employeeData.birthDate) employeeData.birthDate = formatDateForInput(employeeData.birthDate as any);
            if (employeeData.contractStartDate) employeeData.contractStartDate = formatDateForInput(employeeData.contractStartDate as any);
            if (employeeData.contractEndDate) employeeData.contractEndDate = formatDateForInput(employeeData.contractEndDate as any);

            const communesForRegion = employeeData.region ? communesByRegion[employeeData.region] || [] : [];
            
            if (employeeData.region) {
                setAvailableCommunes(communesForRegion);
                if (employeeData.commune && !communesForRegion.includes(employeeData.commune)) {
                    employeeData.commune = ''; 
                }
            } else {
                setAvailableCommunes([]);
                employeeData.commune = '';
            }
            
            setEmployee(employeeData);
        }
    }, [isNew, existingEmployee, companyId]);

    const handleFieldChange = (field: keyof Employee, value: string | number | boolean | undefined) => {
        if (employee) {
            const updatedEmployee = { ...employee, [field]: value };
            
            if (field === 'region' && typeof value === 'string') {
                setAvailableCommunes(communesByRegion[value] || []);
                updatedEmployee.commune = ''; 
            }

            setEmployee(updatedEmployee);
        }
    };
    
    React.useEffect(() => {
        if (employee?.gratificationType === 'Automatico' && employee.baseSalary && gratificationCapMonthly > 0) {
            const calculatedGratification = employee.baseSalary * 0.25;
            const finalGratification = Math.min(calculatedGratification, gratificationCapMonthly);
            setEmployee(prev => prev ? {...prev, gratification: Math.round(finalGratification)} : null);
        } else if (employee?.gratificationType === 'Manual') {
            // Manual logic
        } else if (employee?.gratificationType === 'Automatico' && !employee.baseSalary) {
             setEmployee(prev => prev ? {...prev, gratification: 0} : null);
        }

    }, [employee?.baseSalary, employee?.gratificationType, gratificationCapMonthly]);


    const handleSaveChanges = () => {
        if (!firestore || !companyId || !employee) return;
    
        const collectionPath = `companies/${companyId}/employees`;
    
        const { dependentes, ...employeeFields } = employee;
        const employeeData: Partial<Employee> = { ...employeeFields, companyId };

        // Helper to convert string to Timestamp, adjusting for timezone
        const toTimestamp = (dateString: string | undefined | null) => {
            if (!dateString) return null;
            // Create a date object from the string. This will be in the local timezone
            // but interpreted as UTC midnight. We need to correct this.
            const date = new Date(dateString);
            // Create a new date that accounts for the timezone offset, effectively making it
            // a local midnight date.
            const adjustedDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
            return Timestamp.fromDate(adjustedDate);
        };

        // Convert date strings back to Timestamps before saving
        if (employeeData.birthDate) employeeData.birthDate = toTimestamp(employeeData.birthDate as string);
        if (employeeData.contractStartDate) employeeData.contractStartDate = toTimestamp(employeeData.contractStartDate as string);
        // For contractEndDate, allow it to be null if the string is empty
        employeeData.contractEndDate = toTimestamp(employeeData.contractEndDate as string);

        if (isNew) {
            addDoc(collection(firestore, collectionPath), employeeData)
                .then(() => {
                    router.push('/dashboard/employees');
                })
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: collectionPath,
                        operation: 'create',
                        requestResourceData: employeeData as DocumentData,
                    }));
                });
        } else {
            const docRef = doc(firestore, collectionPath, id);
            // Use updateDoc for existing records for safer and more intentional updates.
            updateDoc(docRef, employeeData as DocumentData)
                .then(() => {
                    router.push('/dashboard/employees');
                })
                 .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'update',
                        requestResourceData: employeeData as DocumentData,
                    }));
                });
        }
    };
    
    const getDocumentName = (slug: string) => {
        const template = DOCUMENT_TEMPLATES.find(t => t.slug === slug);
        return template ? template.name : 'Documento Desconocido';
    };

    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('es-CL');
    };

    if (employeeLoading || indicatorsLoading) {
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
                        <div className="space-y-2"><Label>Fecha de Nacimiento</Label><Input type="date" value={employee.birthDate as string || ''} onChange={(e) => handleFieldChange('birthDate', e.target.value)} /></div>
                        <div className="space-y-2">
                            <Label>Nacionalidad</Label>
                            <Select value={employee.nationality} onValueChange={(v) => handleFieldChange('nationality', v)}>
                                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                                <SelectContent>
                                    {nationalities.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label>Dirección</Label><Input value={employee.address || ''} onChange={(e) => handleFieldChange('address', e.target.value)} /></div>
                         <div className="space-y-2">
                            <Label>Región</Label>
                            <Select value={employee.region} onValueChange={(v) => handleFieldChange('region', v)}>
                                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                                <SelectContent>
                                    {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Comuna</Label>
                            <Select value={employee.commune} onValueChange={(v) => handleFieldChange('commune', v)} disabled={!employee.region}>
                                <SelectTrigger><SelectValue placeholder="Selecciona una región primero..." /></SelectTrigger>
                                <SelectContent>
                                    {availableCommunes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
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
                    <h3 className="text-lg font-medium border-b pb-2">Datos Contractuales y de Remuneración</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2"><Label>Fecha de Inicio</Label><Input type="date" value={employee.contractStartDate as string || ''} onChange={(e) => handleFieldChange('contractStartDate', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Fecha de Término</Label><Input type="date" value={employee.contractEndDate as string || ''} onChange={(e) => handleFieldChange('contractEndDate', e.target.value)} /></div>
                         <div className="space-y-2"><Label>Sueldo Base</Label><Input type="number" value={employee.baseSalary ?? ''} onChange={(e) => handleFieldChange('baseSalary', parseFloat(e.target.value) || 0)} /></div>
                        
                        <div className="space-y-2">
                            <Label>Gratificación Legal</Label>
                            <Select value={employee.gratificationType} onValueChange={(v) => handleFieldChange('gratificationType', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Manual">Manual</SelectItem>
                                    <SelectItem value="Automatico">Automático (25% con tope)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                             <Label>Monto Gratificación</Label>
                            <Input 
                                type="number" 
                                value={employee.gratification ?? ''} 
                                onChange={(e) => handleFieldChange('gratification', parseFloat(e.target.value) || 0)} 
                                disabled={employee.gratificationType === 'Automatico'}
                            />
                        </div>
                        
                        <div className="space-y-2"><Label>Movilización</Label><Input type="number" value={employee.mobilization ?? ''} onChange={(e) => handleFieldChange('mobilization', parseFloat(e.target.value) || 0)} /></div>
                        <div className="space-y-2"><Label>Colación</Label><Input type="number" value={employee.collation ?? ''} onChange={(e) => handleFieldChange('collation', parseFloat(e.target.value) || 0)} /></div>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div className="space-y-2 col-span-2">
                            <Label>Sistema de Salud</Label>
                            <Select value={employee.healthSystem} onValueChange={(v) => handleFieldChange('healthSystem', v)} disabled={healthLoading}>
                                <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                                <SelectContent>
                                    {uniqueHealthEntities.map(entity => <SelectItem key={entity.id} value={entity.name}>{entity.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo Cotización Salud</Label>
                            <Select value={employee.healthContributionType} onValueChange={(v) => handleFieldChange('healthContributionType', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                                    <SelectItem value="Porcentaje">Porcentaje (%)</SelectItem>
                                    <SelectItem value="Monto Fijo">Monto Fijo (UF)</SelectItem>
                                </SelectContent></Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Valor Cotización Salud</Label>
                            <Input type="number" value={employee.healthContributionValue ?? ''} onChange={(e) => handleFieldChange('healthContributionValue', parseFloat(e.target.value) || 0)} />
                        </div>
                         <div className="space-y-2 col-span-2">
                            <Label>AFP</Label>
                             <Select value={employee.afp} onValueChange={(v) => handleFieldChange('afp', v)} disabled={afpLoading}>
                                 <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                                 <SelectContent>
                                    {uniqueAfpEntities.map(entity => <SelectItem key={entity.id} value={entity.name}>{entity.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo Contrato (Seg. Cesantía)</Label>
                             <Select value={employee.unemploymentInsuranceType} onValueChange={(v) => handleFieldChange('unemploymentInsuranceType', v)}>
                                 <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="Indefinido">Indefinido</SelectItem>
                                    <SelectItem value="Plazo Fijo">Plazo Fijo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                            <Checkbox id="hasUnemploymentInsurance" checked={!!employee.hasUnemploymentInsurance} onCheckedChange={(checked) => handleFieldChange('hasUnemploymentInsurance', !!checked)} />
                            <Label htmlFor="hasUnemploymentInsurance">Acogido a Seguro de Cesantía</Label>
                        </div>
                    </div>
                </section>

                {/* Legal Documents */}
                {!isNew && (
                <section className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Documentos Legales</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><FileText className="h-4 w-4 inline-block mr-2"/>Tipo de Documento</TableHead>
                                <TableHead>Fecha de Guardado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documentsLoading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">Cargando documentos...</TableCell>
                                </TableRow>
                            )}
                            {!documentsLoading && legalDocuments && legalDocuments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">No se encontraron documentos para este empleado.</TableCell>
                                </TableRow>
                            )}
                            {legalDocuments?.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">{getDocumentName(doc.templateSlug)}</TableCell>
                                    <TableCell>{doc.lastSaved ? formatDate(doc.lastSaved as Timestamp) : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/documents/${doc.templateSlug}?docId=${doc.id}`}>
                                                <Eye className="h-4 w-4 mr-2"/>
                                                Ver/Editar
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </section>
                )}

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
                <Button onClick={handleSaveChanges} disabled={!companyId}>Guardar Cambios</Button>
            </CardFooter>
        </Card>
    );
}
