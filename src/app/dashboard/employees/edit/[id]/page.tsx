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
import { useCollection, useDoc, useFirestore } from '@/firebase';
import type { Employee, CostCenter, AfpEntity, HealthEntity, Bono, LegalDocument, EconomicIndicator } from '@/lib/types';
import { SelectedCompanyContext } from '@/app/dashboard/layout';
import { doc, setDoc, collection, where, DocumentReference, Timestamp, DocumentData, updateDoc, query } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { communesByRegion } from '@/lib/geographical-data';
import { checkEmployeeHistory, softDeleteEmployee, permanentlyDeleteEmployee } from '@/lib/actions/employees';
import { useToast } from "@/hooks/use-toast";

// Import new refactored components
import { PersonalDataSection } from '../components/PersonalDataSection';
import { ContractDataSection } from '../components/ContractDataSection';
import { FixedBonusesSection } from '../components/FixedBonusesSection';
import { GratificationSection } from '../components/GratificationSection';
import { PrevisionalDataSection } from '../components/PrevisionalDataSection';
import { FamilyAllowanceSection } from '../components/FamilyAllowanceSection';
import { ApvDataSection } from '../components/ApvDataSection';
import { SilDataSection } from '../components/SilDataSection';
import { PaymentDataSection } from '../components/PaymentDataSection';

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
    gender: '',
    maritalStatus: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    position: '',
    contractType: '',
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
    healthSystem: '',
    healthContributionType: 'Porcentaje',
    healthContributionValue: 7,
    afp: '',
    unemploymentInsuranceType: '',
    hasUnemploymentInsurance: true,
    familyAllowanceBracket: 'D',
    normalFamilyDependents: 0,
    invalidityFamilyDependents: 0,
    apvInstitution: '',
    apvAmount: 0,
    apvRegime: '',
    paymentMethod: 'Depósito en Cta. Cte./Vista',
    bank: '',
    accountType: '',
    accountNumber: '',
    hasSubmittedSIL: false,
    silFolio: '',
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

    const handleSaveChanges = () => {
        if (!firestore || !companyId || !employee) return;

        // Create a mutable copy of the employee data for modifications
        const toTimestamp = (d: any) => d ? Timestamp.fromDate(new Date(d)) : null;
        const { gratification, ...employeeData } = { ...employee };

        // *** RUT CLEANING LOGIC ***
        // Remove dots from the RUT before saving.
        if (employeeData.rut) {
            employeeData.rut = employeeData.rut.replace(/\./g, '');
        }

        const cleanedData = Object.entries(employeeData).reduce((acc, [key, value]) => ({ ...acc, [key]: value === undefined ? null : value }), {} as any);

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

    const isLoading = employeeLoading || indicatorsLoading || afpLoading || healthLoading || costCentersLoading;

    if (isLoading) return <p>Cargando...</p>;
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
                <PersonalDataSection employee={employee} handleFieldChange={handleFieldChange} availableCommunes={availableCommunes} />
                <ContractDataSection employee={employee} handleFieldChange={handleFieldChange} costCenters={costCenters} />
                <FixedBonusesSection employee={employee} handleFieldChange={handleFieldChange} setBonoDialogState={setBonoDialogState} />
                <GratificationSection employee={employee} handleFieldChange={handleFieldChange} />
                <PrevisionalDataSection employee={employee} handleFieldChange={handleFieldChange} uniqueAfpEntities={uniqueAfpEntities} uniqueHealthEntities={uniqueHealthEntities} />
                <FamilyAllowanceSection employee={employee} handleFieldChange={handleFieldChange} />
                <ApvDataSection employee={employee} handleFieldChange={handleFieldChange} />
                <PaymentDataSection employee={employee} handleFieldChange={handleFieldChange} />
                <SilDataSection employee={employee} handleFieldChange={handleFieldChange} />
            </CardContent>
            <CardFooter className="flex justify-between">
                {!isNew && <DeleteEmployeeManager companyId={companyId!} employeeId={id} employeeName={`${employee.firstName} ${employee.lastName}`} />}
                <Button onClick={handleSaveChanges} disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar Cambios'}
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
