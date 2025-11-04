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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import type { Employee, CostCenter, AfpEntity, HealthEntity, Bono, LegalDocument, EconomicIndicator } from '@/lib/types';
import { DOCUMENT_TEMPLATES } from '@/lib/document-templates';
import { SelectedCompanyContext } from '@/app/dashboard/layout';
import { doc, setDoc, addDoc, collection, where, DocumentReference, Timestamp, DocumentData, updateDoc, query } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FileText, Eye, Trash2, Loader2, ShieldAlert, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { nationalities, regions, communesByRegion } from '@/lib/geographical-data';
import { checkEmployeeHistory, softDeleteEmployee, permanentlyDeleteEmployee } from '@/lib/actions/employees';
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

const defaultEmployeeState: Partial<Employee> & { gratification?: number } = {
    rut: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    nationality: '',
    address: '',
    region: '',
    commune: '',
    phone: '',
    email: '',
    gender: undefined,
    maritalStatus: undefined,
    emergencyContactName: '',
    emergencyContactPhone: '',
    position: '',
    contractType: undefined,
    contractStartDate: '',
    contractEndDate: '',
    weeklyHours: 45,
    workday: 'Completa',
    costCenterId: '',
    status: 'Active',
    baseSalary: 0,
    mobilization: 0,
    collation: 0,
    gratificationType: 'Automatico',
    gratification: 0,
    bonosFijos: [],
    healthSystem: undefined,
    healthContributionType: 'Porcentaje',
    healthContributionValue: 7,
    afp: undefined,
    unemploymentInsuranceType: undefined,
    hasUnemploymentInsurance: true,
    hasFamilyAllowance: false,
    familyDependents: 0,
    familyAllowanceBracket: undefined,
    apvInstitution: '',
    apvAmount: 0,
    apvRegime: undefined,
    paymentMethod: undefined,
    bank: undefined,
    accountType: undefined,
    accountNumber: '',
};

function DeleteEmployeeManager({ companyId, employeeId, employeeName }: { companyId: string; employeeId: string; employeeName: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isChecking, setIsChecking] = React.useState(false);
    const [hasHistory, setHasHistory] = React.useState<boolean | null>(null);
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const handleCheckHistory = async () => {
        setIsChecking(true);
        const result = await checkEmployeeHistory(companyId, employeeId);
        setHasHistory(result.hasHistory);
        setIsChecking(false);
        setDialogOpen(true);
    };

    const handleSoftDelete = async () => {
        setIsLoading(true);
        const result = await softDeleteEmployee(companyId, employeeId);
        if (result.success) {
            toast({ title: "Éxito", description: result.message });
            router.push('/dashboard/employees');
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsLoading(false);
        setDialogOpen(false);
    };

    const handlePermanentDelete = async () => {
        setIsLoading(true);
        const result = await permanentlyDeleteEmployee(companyId, employeeId);
        if (result.success) {
            toast({ title: "Éxito", description: result.message });
            router.push('/dashboard/employees');
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsLoading(false);
        setDialogOpen(false);
    };

    return (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button variant="destructive" onClick={handleCheckHistory} disabled={isChecking}>
                {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                {isChecking ? 'Verificando...' : 'Eliminar'}
            </Button>
            {hasHistory !== null && (
                hasHistory ? (
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Desactivar a {employeeName}?</AlertDialogTitle>
                        <AlertDialogDescription>Este empleado tiene historial y solo puede ser desactivado.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleSoftDelete} disabled={isLoading}>Desactivar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                ) : (
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Eliminar a {employeeName}?</AlertDialogTitle>
                        <AlertDialogDescription>Puedes desactivarlo (reversible) o eliminarlo permanentemente (irreversible).</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><Button variant="outline" onClick={handleSoftDelete}>Desactivar</Button><AlertDialogAction onClick={handlePermanentDelete}>Eliminar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                )
            )}
        </AlertDialog>
    );
}

export default function EmployeeFormPage() {
    const params = useParams();
    const id = params.id as string;
    const isNew = id === 'new';
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const employeeRef = React.useMemo(() => !isNew && firestore && companyId ? doc(firestore, `companies/${companyId}/employees`, id) as DocumentReference<Employee> : null, [isNew, firestore, companyId, id]);
    const { data: existingEmployee, loading: employeeLoading } = useDoc<Employee>(employeeRef);
    const { data: legalDocuments, loading: documentsLoading } = useCollection<LegalDocument>({ query: !isNew && firestore && companyId ? query(collection(firestore, `companies/${companyId}/documents`), where('employeeId', '==', id)) : null });

    const [employee, setEmployee] = React.useState(defaultEmployeeState);
    const [availableCommunes, setAvailableCommunes] = React.useState<string[]>([]);
    const [bonoDialogState, setBonoDialogState] = React.useState<{ isOpen: boolean; bono: Partial<Bono>; index: number | null }>({ isOpen: false, bono: { glosa: '', monto: 0 }, index: null });

    const { data: afpEntities, loading: afpLoading } = useCollection<AfpEntity>({ path: 'afp-entities' });
    const { data: healthEntities, loading: healthLoading } = useCollection<HealthEntity>({ path: 'health-entities' });
    const { data: economicIndicators, loading: indicatorsLoading } = useCollection<EconomicIndicator>({ path: 'economic-indicators' });
    const { data: costCenters, loading: costCentersLoading } = useCollection<CostCenter>({ path: companyId ? `companies/${companyId}/cost-centers` : undefined });

    const uniqueAfpEntities = React.useMemo(() => afpEntities ? [...new Map(afpEntities.map(e => [e.name, e])).values()] : [], [afpEntities]);
    const uniqueHealthEntities = React.useMemo(() => healthEntities ? [...new Map(healthEntities.map(e => [e.name, e])).values()] : [], [healthEntities]);

    const gratificationCapMonthly = React.useMemo(() => {
        if (!economicIndicators?.length) return 0;
        const latest = economicIndicators.filter(i => i.minWage).sort((a, b) => b.id.localeCompare(a.id))[0];
        return latest?.minWage ? Math.round((4.75 * latest.minWage) / 12) : 0;
    }, [economicIndicators]);

    React.useEffect(() => {
        if (!employee) return;
        let value = 0;
        if (employee.gratificationType === 'Automatico' && employee.baseSalary && gratificationCapMonthly > 0) {
            value = Math.round(Math.min(employee.baseSalary * 0.25, gratificationCapMonthly));
        } else if (employee.gratificationType === 'Tope Legal') {
            value = gratificationCapMonthly;
        }
        if (employee.gratification !== value) handleFieldChange('gratification', value);
    }, [employee?.baseSalary, employee?.gratificationType, gratificationCapMonthly]);

    const formatDateForInput = (d: any) => d ? new Date(d.toDate ? d.toDate() : d).toISOString().split('T')[0] : '';

    React.useEffect(() => {
        if (isNew) {
            setEmployee({ ...defaultEmployeeState, companyId });
        } else if (existingEmployee) {
            const data = { ...defaultEmployeeState, ...existingEmployee };
            data.birthDate = formatDateForInput(data.birthDate);
            data.contractStartDate = formatDateForInput(data.contractStartDate);
            data.contractEndDate = formatDateForInput(data.contractEndDate);
            if (data.region) setAvailableCommunes(communesByRegion[data.region] || []);
            setEmployee(data);
        }
    }, [isNew, existingEmployee, companyId]);

    const handleFieldChange = (field: keyof typeof employee, value: any) => {
        setEmployee(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'region') {
                updated.commune = '';
                setAvailableCommunes(communesByRegion[value as string] || []);
            }
            return updated;
        });
    };

    const handleSaveBono = () => {
        if (!bonoDialogState.bono.glosa || !bonoDialogState.bono.monto) return;
        const current = employee.bonosFijos || [];
        const newBonos = bonoDialogState.index !== null ? current.map((b, i) => i === bonoDialogState.index ? bonoDialogState.bono as Bono : b) : [...current, bonoDialogState.bono as Bono];
        handleFieldChange('bonosFijos', newBonos);
        setBonoDialogState({ isOpen: false, bono: { glosa: '', monto: 0 }, index: null });
    };

    const handleRemoveBono = (i: number) => handleFieldChange('bonosFijos', (employee.bonosFijos || []).filter((_, idx) => idx !== i));

    const handleSaveChanges = () => {
        if (!firestore || !companyId || !employee) return;
        const toTimestamp = (d: any) => d ? Timestamp.fromDate(new Date(d)) : null;

        const { gratification, ...employeeData } = employee;
        
        const cleanedData = Object.entries(employeeData).reduce((acc, [key, value]) => ({...acc, [key]: value === undefined ? null : value}), {} as any);

        const finalData = { ...cleanedData, companyId };
        finalData.birthDate = toTimestamp(finalData.birthDate);
        finalData.contractStartDate = toTimestamp(finalData.contractStartDate);
        finalData.contractEndDate = toTimestamp(finalData.contractEndDate);
        
        const docRef = isNew ? doc(collection(firestore, `companies/${companyId}/employees`)) : doc(firestore, `companies/${companyId}/employees`, id);
        const action = isNew ? setDoc(docRef, finalData) : updateDoc(docRef, finalData as DocumentData);

        action.then(() => {
            toast({ title: "Éxito", description: "Ficha de personal guardada." });
            router.push('/dashboard/employees');
        }).catch(err => {
            console.error("Firestore Error:", err);
            toast({ title: "Error", description: err.message, variant: "destructive" });
        });
    };
    
    if (employeeLoading || indicatorsLoading) return <p>Cargando...</p>;
    if (!employee) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild><Link href="/dashboard/employees"><ArrowLeft className="h-4 w-4" /></Link></Button>
                    <div>
                        <CardTitle>{isNew ? 'Agregar Nuevo Empleado' : `Editar Ficha de ${employee.firstName} ${employee.lastName}`}</CardTitle>
                        <CardDescription>Completa todos los campos de la ficha del empleado.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
                
                <section id="personal-data" className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">1. Datos Personales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>RUT</Label><Input value={employee.rut} onChange={e => handleFieldChange('rut', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Nombres</Label><Input value={employee.firstName} onChange={e => handleFieldChange('firstName', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Apellidos</Label><Input value={employee.lastName} onChange={e => handleFieldChange('lastName', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Fecha de Nacimiento</Label><Input type="date" value={employee.birthDate} onChange={e => handleFieldChange('birthDate', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Nacionalidad</Label><Select value={employee.nationality} onValueChange={v => handleFieldChange('nationality', v)}><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger><SelectContent>{nationalities.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Dirección</Label><Input value={employee.address} onChange={e => handleFieldChange('address', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Región</Label><Select value={employee.region} onValueChange={v => handleFieldChange('region', v)}><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger><SelectContent>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Comuna</Label><Select value={employee.commune} onValueChange={v => handleFieldChange('commune', v)} disabled={!employee.region}><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger><SelectContent>{availableCommunes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Teléfono</Label><Input value={employee.phone} onChange={e => handleFieldChange('phone', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Email</Label><Input type="email" value={employee.email} onChange={e => handleFieldChange('email', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Género</Label><Select value={employee.gender} onValueChange={v => handleFieldChange('gender', v)}><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger><SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Femenino">Femenino</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Estado Civil</Label><Select value={employee.maritalStatus} onValueChange={v => handleFieldChange('maritalStatus', v)}><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger><SelectContent><SelectItem value="Soltero(a)">Soltero(a)</SelectItem><SelectItem value="Casado(a)">Casado(a)</SelectItem><SelectItem value="Viudo(a)">Viudo(a)</SelectItem><SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Nombre Contacto Emergencia</Label><Input value={employee.emergencyContactName} onChange={e => handleFieldChange('emergencyContactName', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Teléfono Contacto Emergencia</Label><Input value={employee.emergencyContactPhone} onChange={e => handleFieldChange('emergencyContactPhone', e.target.value)} /></div>
                    </div>
                </section>

                <section id="contract-data" className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">2. Datos Contractuales y de Remuneración</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2"><Label>Cargo</Label><Input value={employee.position} onChange={e => handleFieldChange('position', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Tipo Contrato</Label><Select value={employee.contractType} onValueChange={v => handleFieldChange('contractType', v)}><SelectTrigger><SelectValue placeholder="..."/></SelectTrigger><SelectContent><SelectItem value="Indefinido">Indefinido</SelectItem><SelectItem value="Plazo Fijo">Plazo Fijo</SelectItem><SelectItem value="Por Obra o Faena">Por Obra o Faena</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Fecha Inicio</Label><Input type="date" value={employee.contractStartDate} onChange={e => handleFieldChange('contractStartDate', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Fecha Término</Label><Input type="date" value={employee.contractEndDate} onChange={e => handleFieldChange('contractEndDate', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Horas Semanales</Label><Input type="number" value={employee.weeklyHours} onChange={e => handleFieldChange('weeklyHours', parseFloat(e.target.value) || 0)} /></div>
                        <div className="space-y-2"><Label>Jornada</Label><Select value={employee.workday} onValueChange={v => handleFieldChange('workday', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Completa">Completa</SelectItem><SelectItem value="Parcial">Parcial</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Centro de Costo</Label><Select value={employee.costCenterId} onValueChange={v => handleFieldChange('costCenterId', v)}><SelectTrigger><SelectValue placeholder="..."/></SelectTrigger><SelectContent>{costCenters?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Estado</Label><Select value={employee.status} onValueChange={v => handleFieldChange('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">Activo</SelectItem><SelectItem value="Inactive">Inactivo</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Sueldo Base</Label><Input type="number" value={employee.baseSalary} onChange={e => handleFieldChange('baseSalary', parseFloat(e.target.value) || 0)} /></div>
                        <div className="space-y-2"><Label>Movilización</Label><Input type="number" value={employee.mobilization} onChange={e => handleFieldChange('mobilization', parseFloat(e.target.value) || 0)} /></div>
                        <div className="space-y-2"><Label>Colación</Label><Input type="number" value={employee.collation} onChange={e => handleFieldChange('collation', parseFloat(e.target.value) || 0)} /></div>
                    </div>
                </section>

                <section id="fixed-bonuses" className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">3. Bonos Fijos Imponibles</h3>
                    <Card className="border-dashed">
                        <CardContent className="pt-6">
                            {(employee.bonosFijos || []).length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground">No hay bonos fijos.</p>
                            ) : (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Glosa</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="w-[100px] text-right">Acciones</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {employee.bonosFijos?.map((bono, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{bono.glosa}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(bono.monto)}</TableCell>
                                                <TableCell className="text-right">
                                                     <Button variant="ghost" size="icon" onClick={() => setBonoDialogState({ isOpen: true, bono, index })}><Eye className="h-4 w-4" /></Button>
                                                     <Button variant="ghost" size="icon" onClick={() => handleRemoveBono(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                        <CardFooter>
                             <Button variant="outline" onClick={() => setBonoDialogState({ isOpen: true, bono: { glosa: '', monto: 0 }, index: null })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Agregar Bono
                            </Button>
                        </CardFooter>
                    </Card>
                </section>

                <section id="gratification" className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">4. Gratificación Legal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-2"><Label>Tipo</Label><Select value={employee.gratificationType} onValueChange={v => handleFieldChange('gratificationType', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sin Gratificación">Sin Gratificación</SelectItem><SelectItem value="Tope Legal">Tope Legal</SelectItem><SelectItem value="Automatico">Automático (25%)</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Monto Calculado</Label><Input type="number" value={employee.gratification} disabled /></div>
                    </div>
                </section>
                
                <section id="previsional-data" className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">5. Datos Previsionales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                       <div className="space-y-2 col-span-2"><Label>Sistema de Salud</Label><Select value={employee.healthSystem} onValueChange={v => handleFieldChange('healthSystem', v)}><SelectTrigger><SelectValue placeholder="..."/></SelectTrigger><SelectContent>{uniqueHealthEntities.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Tipo Cotización</Label><Select value={employee.healthContributionType} onValueChange={v => handleFieldChange('healthContributionType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Porcentaje">%</SelectItem><SelectItem value="Monto Fijo">UF</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Valor Cotización</Label><Input type="number" value={employee.healthContributionValue} onChange={e => handleFieldChange('healthContributionValue', parseFloat(e.target.value) || 0)} /></div>
                         <div className="space-y-2 col-span-2"><Label>AFP</Label><Select value={employee.afp} onValueChange={v => handleFieldChange('afp', v)}><SelectTrigger><SelectValue placeholder="..."/></SelectTrigger><SelectContent>{uniqueAfpEntities.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Tipo Contrato (Seg. Cesantía)</Label><Select value={employee.unemploymentInsuranceType} onValueChange={v => handleFieldChange('unemploymentInsuranceType', v)}><SelectTrigger><SelectValue placeholder="..."/></SelectTrigger><SelectContent><SelectItem value="Indefinido">Indefinido</SelectItem><SelectItem value="Plazo Fijo">Plazo Fijo</SelectItem></SelectContent></Select></div>
                        <div className="flex items-center space-x-2 pt-6"><Checkbox id="hasUnemploymentInsurance" checked={employee.hasUnemploymentInsurance} onCheckedChange={c => handleFieldChange('hasUnemploymentInsurance', c)} /><Label htmlFor="hasUnemploymentInsurance">Acogido a Seguro de Cesantía</Label></div>
                    </div>
                </section>

                <section id="family-allowance" className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">6. Asignación Familiar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div className="flex items-center space-x-2"><Checkbox id="hasFamilyAllowance" checked={employee.hasFamilyAllowance} onCheckedChange={c => handleFieldChange('hasFamilyAllowance', c)} /><Label htmlFor="hasFamilyAllowance">Aplica Asignación Familiar</Label></div>
                        <div className="space-y-2"><Label>Cargas</Label><Input type="number" value={employee.familyDependents} onChange={e => handleFieldChange('familyDependents', parseInt(e.target.value) || 0)} disabled={!employee.hasFamilyAllowance} /></div>
                        <div className="space-y-2"><Label>Tramo</Label><Select value={employee.familyAllowanceBracket} onValueChange={v => handleFieldChange('familyAllowanceBracket', v)} disabled={!employee.hasFamilyAllowance}><SelectTrigger><SelectValue placeholder="..." /></SelectTrigger><SelectContent>{['A','B','C','D'].map(t => <SelectItem key={t} value={t}>Tramo {t}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                </section>

                <section id="apv-data" className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">7. Ahorro Previsional Voluntario (APV)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>Institución</Label><Input value={employee.apvInstitution} onChange={e => handleFieldChange('apvInstitution', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Monto</Label><Input type="number" value={employee.apvAmount} onChange={e => handleFieldChange('apvAmount', parseFloat(e.target.value) || 0)} /></div>
                        <div className="space-y-2"><Label>Regimen APV</Label><Select value={employee.apvRegime} onValueChange={v => handleFieldChange('apvRegime', v)}><SelectTrigger><SelectValue placeholder="..." /></SelectTrigger><SelectContent><SelectItem value="Regimen A">Regimen A</SelectItem><SelectItem value="Regimen B">Regimen B</SelectItem></SelectContent></Select></div>
                    </div>
                </section>
            </CardContent>
            <CardFooter className="flex justify-between">
                <DeleteEmployeeManager companyId={companyId} employeeId={id} employeeName={`${employee.firstName} ${employee.lastName}`} />
                <Button onClick={handleSaveChanges} disabled={employeeLoading}>
                    {employeeLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar Cambios'}
                </Button>
            </CardFooter>
            <Dialog open={bonoDialogState.isOpen} onOpenChange={o => setBonoDialogState(prev => ({ ...prev, isOpen: o }))}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{bonoDialogState.index === null ? 'Agregar Bono Fijo' : 'Editar Bono Fijo'}</DialogTitle><DialogDescription>Ingrese los datos del bono fijo.</DialogDescription></DialogHeader>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Glosa</Label><Input value={bonoDialogState.bono.glosa} onChange={e => setBonoDialogState(prev => ({ ...prev, bono: { ...prev.bono, glosa: e.target.value } }))} /></div><div className="space-y-2"><Label>Monto</Label><Input type="number" value={bonoDialogState.bono.monto} onChange={e => setBonoDialogState(prev => ({ ...prev, bono: { ...prev.bono, monto: parseFloat(e.target.value) || 0 } }))} /></div></div>
                    <DialogFooter><Button type="button" variant="secondary" onClick={() => setBonoDialogState({ isOpen: false, bono: { glosa: '', monto: 0 }, index: null })}>Cancelar</Button><Button type="button" onClick={handleSaveBono}>Guardar</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}