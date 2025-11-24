'use client';

import React, { useMemo, useState, useRef, useContext } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { useCollection, useFirestore } from "@/firebase";
import { query, collection, writeBatch, getDocs, doc, Timestamp } from 'firebase/firestore';
import { SelectedCompanyContext } from "../layout";
import { useToast } from '@/hooks/use-toast';
import type { Employee, CostCenter } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MoreHorizontal, PlusCircle, Upload, Download } from "lucide-react";
import { HistoricalPayrollDialog } from "@/components/historical-payroll-dialog";

const HEADER_MAP: { [key: string]: string } = {
    rut: "RUT",
    firstName: "Nombres",
    lastName: "Apellidos",
    birthDate: "Fecha Nacimiento (YYYY-MM-DD)",
    nationality: "Nacionalidad",
    address: "Dirección",
    region: "Región",
    commune: "Comuna",
    phone: "Teléfono",
    email: "Email",
    gender: "Género",
    maritalStatus: "Estado Civil",
    emergencyContactName: "Nombre Contacto Emergencia",
    emergencyContactPhone: "Teléfono Contacto Emergencia",
    status: "Estado (Active/Inactive)",
    position: "Cargo",
    contractType: "Tipo Contrato",
    contractStartDate: "Fecha Inicio Contrato (YYYY-MM-DD)",
    contractEndDate: "Fecha Fin Contrato (YYYY-MM-DD)",
    weeklyHours: "Horas Semanales",
    workday: "Jornada",
    costCenterName: "Centro de Costo",
    baseSalary: "Sueldo Base",
    mobilization: "Movilización",
    collation: "Colación",
    gratificationType: "Tipo Gratificación",
    healthSystem: "Sistema de Salud (AFP)",
    healthContributionType: "Tipo Cotización Salud",
    healthContributionValue: "Valor Cotización Salud",
    afp: "AFP",
    unemploymentInsuranceType: "Tipo Seguro Cesantía",
    hasUnemploymentInsurance: "Tiene Seguro Cesantía (TRUE/FALSE)",
    hasFamilyAllowance: "Tiene Asignación Familiar (TRUE/FALSE)",
    familyDependents: "Cargas Familiares (Número)",
    familyAllowanceBracket: "Tramo Asignación Familiar",
    apvInstitution: "Institución APV",
    apvAmount: "Monto APV",
    apvRegime: "Régimen APV",
    paymentMethod: "Método de Pago",
    bank: "Banco",
    accountType: "Tipo de Cuenta",
    accountNumber: "Número de Cuenta",
};

const CSV_KEYS = Object.keys(HEADER_MAP);
const CSV_LABELS = Object.values(HEADER_MAP);
const LABEL_TO_KEY_MAP = Object.fromEntries(Object.entries(HEADER_MAP).map(([key, label]) => [label.toLowerCase(), key]));

const formatDateForCsv = (d: any) => {
    if (!d) return '';
    const date = d.toDate ? d.toDate() : new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

// --- Robust Data Conversion Functions ---
const toSafeString = (val: any): string => val?.toString().trim() || '';

const toTimestamp = (val: any): Timestamp | null => {
    if (!val) return null;
    const date = new Date(val);
    if (isNaN(date.getTime())) return null;
    return Timestamp.fromDate(date);
};

const toFloat = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    const cleanedVal = val.trim().replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(cleanedVal);
    return isNaN(num) ? 0 : num;
};

const toInt = (val: any): number => {
    if (typeof val === 'number') return Math.floor(val);
    if (typeof val !== 'string') return 0;
    const num = parseInt(val.trim(), 10);
    return isNaN(num) ? 0 : num;
};

const toBool = (val: any): boolean => {
    const s = toSafeString(val).toLowerCase();
    return ['true', 'verdadero', 'si', '1', 'active'].includes(s);
};
// -------------------------------------

export default function EmployeesPage() {
    const { selectedCompany } = useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<Employee | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

    const employeesQuery = useMemo(() => firestore && companyId ? query(collection(firestore, `companies/${companyId}/employees`)) : null, [firestore, companyId]);
    const costCentersQuery = useMemo(() => firestore && companyId ? query(collection(firestore, `companies/${companyId}/cost-centers`)) : null, [firestore, companyId]);

    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ query: employeesQuery, disabled: !employeesQuery });
    const { data: costCenters, loading: costCentersLoading } = useCollection<CostCenter>({ query: costCentersQuery, disabled: !costCentersQuery });

    const { costCenterMap, costCenterNameToIdMap } = useMemo(() => {
        if (!costCenters) return { costCenterMap: new Map(), costCenterNameToIdMap: new Map() };
        const map = new Map(costCenters.map(cc => [cc.id, cc.name]));
        const reverseMap = new Map(costCenters.map(cc => [cc.name.toLowerCase(), cc.id]));
        return { costCenterMap: map, costCenterNameToIdMap: reverseMap };
    }, [costCenters]);

    const handleExport = () => {
        if (!employees) return;

        const dataToExport = employees.map(emp => {
            const exportRow: { [key: string]: any } = {};
            CSV_KEYS.forEach(key => {
                const label = HEADER_MAP[key];
                const value = (emp as any)[key];

                if (key === 'costCenterName') {
                    exportRow[label] = emp.costCenterId ? costCenterMap.get(emp.costCenterId) || '' : '';
                } else if (key.includes('Date')) {
                    exportRow[label] = formatDateForCsv(value);
                } else if (typeof value === 'boolean') {
                    exportRow[label] = value ? 'TRUE' : 'FALSE';
                } else {
                    exportRow[label] = value ?? '';
                }
            });
            return exportRow;
        });

        const csv = Papa.unparse(dataToExport, { columns: CSV_LABELS, delimiter: ';' });
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `export-personal-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadTemplate = () => {
        const csv = Papa.unparse([CSV_LABELS], { header: false, delimiter: ';' });
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'plantilla-importacion-personal.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleTriggerImport = () => fileInputRef.current?.click();

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !firestore || !companyId) return;

        setIsImporting(true);
        setIsImportDialogOpen(false);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim().toLowerCase(),
            complete: async (results) => {

                if (results.errors.length > 0) {
                    console.error("Parsing errors:", results.errors);
                    const errorMessages = results.errors.map(e => e.message).join(", ");
                    toast({ title: "Error de formato CSV", description: `No se pudo procesar el archivo. Errores: ${errorMessages}`, variant: "destructive" });
                    setIsImporting(false);
                    return;
                }

                const records = results.data.map(spanishRecord => {
                    const englishRecord: { [key: string]: any } = {};
                    for (const label in spanishRecord) {
                        const key = LABEL_TO_KEY_MAP[label];
                        if (key) {
                            englishRecord[key] = (spanishRecord as any)[label];
                        }
                    }
                    return englishRecord;
                });

                if (!records.length) {
                    toast({ title: "Archivo vacío", variant: "destructive" });
                    setIsImporting(false);
                    return;
                }

                const batch = writeBatch(firestore);
                const employeesCollection = collection(firestore, `companies/${companyId}/employees`);
                const querySnapshot = await getDocs(query(employeesCollection));
                const existingEmployees = new Map(querySnapshot.docs.map(d => [toSafeString(d.data().rut).replace(/[^0-9kK]/g, ''), d.id]));

                let createdCount = 0, updatedCount = 0;

                for (const record of records) {
                    const rut = toSafeString(record.rut).replace(/[^0-9kK]/g, '');
                    if (!rut || !record.firstName || !record.lastName) continue;

                    const costCenterId = record.costCenterName ? costCenterNameToIdMap.get(toSafeString(record.costCenterName).toLowerCase()) || null : null;

                    const employeeData: Partial<Employee> = {
                        companyId,
                        rut: toSafeString(record.rut),
                        firstName: toSafeString(record.firstName),
                        lastName: toSafeString(record.lastName),
                        birthDate: toTimestamp(record.birthDate),
                        nationality: toSafeString(record.nationality),
                        address: toSafeString(record.address),
                        region: toSafeString(record.region),
                        commune: toSafeString(record.commune),
                        phone: toSafeString(record.phone) || null,
                        email: toSafeString(record.email) || null,
                        gender: toSafeString(record.gender),
                        maritalStatus: toSafeString(record.maritalStatus),
                        emergencyContactName: toSafeString(record.emergencyContactName) || null,
                        emergencyContactPhone: toSafeString(record.emergencyContactPhone) || null,
                        status: toBool(record.status) ? 'Active' : 'Inactive',
                        position: toSafeString(record.position),
                        contractType: toSafeString(record.contractType),
                        contractStartDate: toTimestamp(record.contractStartDate),
                        contractEndDate: toTimestamp(record.contractEndDate),
                        weeklyHours: toInt(record.weeklyHours) || undefined,
                        workday: toSafeString(record.workday),
                        costCenterId: costCenterId,
                        baseSalary: toFloat(record.baseSalary),
                        mobilization: toFloat(record.mobilization),
                        collation: toFloat(record.collation),
                        gratificationType: toSafeString(record.gratificationType) || 'Sin Gratificación',
                        healthSystem: toSafeString(record.healthSystem),
                        healthContributionType: toSafeString(record.healthContributionType) === 'Monto Fijo' ? 'Monto Fijo' : 'Porcentaje',
                        healthContributionValue: toFloat(record.healthContributionValue),
                        afp: toSafeString(record.afp),
                        unemploymentInsuranceType: toSafeString(record.unemploymentInsuranceType) || 'No Aplica',
                        hasUnemploymentInsurance: toBool(record.hasUnemploymentInsurance),
                        hasFamilyAllowance: toBool(record.hasFamilyAllowance),
                        familyDependents: toInt(record.familyDependents),
                        familyAllowanceBracket: toSafeString(record.familyAllowanceBracket) || null,
                        apvInstitution: toSafeString(record.apvInstitution) || null,
                        apvAmount: toFloat(record.apvAmount),
                        apvRegime: toSafeString(record.apvRegime) || null,
                        paymentMethod: toSafeString(record.paymentMethod),
                        bank: toSafeString(record.bank) || null,
                        accountType: toSafeString(record.accountType) || null,
                        accountNumber: toSafeString(record.accountNumber) || null,
                    };
                    
                    const existingDocId = existingEmployees.get(rut);
                    const docRef = existingDocId ? doc(firestore, `companies/${companyId}/employees`, existingDocId) : doc(employeesCollection);

                    if (existingDocId) {
                        Object.keys(employeeData).forEach(key => (employeeData as any)[key] === undefined && delete (employeeData as any)[key]);
                        batch.update(docRef, employeeData);
                        updatedCount++;
                    } else {
                        batch.set(docRef, { ...employeeData, createdAt: Timestamp.now(), bonosFijos: [] });
                        createdCount++;
                    }
                }

                try {
                    await batch.commit();
                    toast({ title: "Importación completada", description: `${createdCount} empleados creados, ${updatedCount} actualizados.` });
                } catch (error: any) {
                    console.error("Import Error:", error);
                    toast({ title: "Error de importación", description: error.message, variant: "destructive" });
                } finally {
                    setIsImporting(false);
                    if(fileInputRef.current) fileInputRef.current.value = '';
                }
            },
            error: (error) => {
                toast({ title: "Error al leer el archivo", description: error.message, variant: "destructive" });
                setIsImporting(false);
            }
        });
    };

    const loading = employeesLoading || costCentersLoading;

    return (
      <>
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle>Personal</CardTitle>
                        <CardDescription>Gestiona la ficha completa de todos los empleados de tu organización.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".csv" />
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setIsImportDialogOpen(true)} disabled={!companyId || isImporting}>
                            <Upload className="h-4 w-4" />
                            {isImporting ? 'Importando...' : 'Importar'}
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={handleExport} disabled={!companyId || !employees || employees.length === 0}>
                            <Download className="h-4 w-4" />
                            Exportar
                        </Button>
                        <Button size="sm" className="gap-1" disabled={!companyId} asChild>
                            <Link href="/dashboard/employees/edit/new">
                            <PlusCircle className="h-4 w-4" />
                            Agregar
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>RUT</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead><span className="sr-only">Acciones</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRow><TableCell colSpan={5} className="text-center">Cargando...</TableCell></TableRow>}
                        {!loading && employees?.map((employee) => (
                        <TableRow key={employee.id}>
                            <TableCell className="font-medium">{`${employee.firstName} ${employee.lastName}`}</TableCell>
                            <TableCell>{employee.rut}</TableCell>
                            <TableCell>{employee.position}</TableCell>
                            <TableCell><Badge variant={employee.status === 'Active' ? "default" : "outline"}>{employee.status === 'Active' ? "Activo" : "Inactivo"}</Badge></TableCell>
                            <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem asChild><Link href={`/dashboard/employees/edit/${employee.id}`}>Editar Ficha</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedEmployeeForHistory(employee)}>Ver Liquidaciones</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))}
                        {!loading && employees?.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center">{!companyId ? "Selecciona una empresa para ver sus empleados." : "No se encontraron empleados. Agrega uno o importa un CSV."}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <HistoricalPayrollDialog isOpen={!!selectedEmployeeForHistory} onClose={() => setSelectedEmployeeForHistory(null)} employee={selectedEmployeeForHistory} companyId={companyId} />

        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Importar y Exportar Personal</DialogTitle>
                    <DialogDescription>
                        Descarga la plantilla para asegurar el formato correcto. El sistema creará o actualizará empleados basado en la columna <strong>RUT</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="prose prose-sm text-foreground/80 max-w-none py-2">
                    <p>Usa la plantilla para cargar datos masivamente. Las columnas mínimas requeridas son <strong>RUT, Nombres y Apellidos</strong>.</p>
                    <strong>Encabezados de la Plantilla:</strong>
                    <div className="flex flex-wrap gap-1 mt-2 text-xs">
                        {CSV_LABELS.map(label => <code key={label} className="p-1 bg-muted rounded-sm font-mono">{label}</code>)}
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:justify-start pt-4">
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Plantilla
                    </Button>
                    <Button onClick={handleTriggerImport} disabled={isImporting}>
                        <Upload className="mr-2 h-4 w-4" />
                        {isImporting ? 'Procesando...': 'Seleccionar Archivo'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
    )
}
