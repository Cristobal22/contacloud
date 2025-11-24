'use client';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React from 'react';
import type { Company, Account, TaxAccountMapping, PayrollAccountMappings } from '@/lib/types';
import { useCollection, useFirestore } from '@/firebase';
import { SelectedCompanyContext } from '../../layout';
import { doc, updateDoc } from 'firebase/firestore';
import { AccountSearchInput } from '@/components/account-search-input';
import { OtherTaxesSettings } from '@/components/other-taxes-settings';
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { useToast } from "@/hooks/use-toast";
import { DeleteCompanyDialog } from '@/components/delete-company-dialog';
import { PayrollAccountMappingsForm } from '@/components/payroll-account-mappings-form';

// Mapeo para cuentas principales
const defaultAccountMappings: { [key in keyof Omit<Partial<Company>, 'payrollAccountMappings'>]: string } = {
    profitAccount: '3020101', // Ganancia (Pérdida) del Ejercicio
    lossAccount: '3020101', // Se usa la misma para resultado
    salesInvoicesReceivableAccount: '1010401', // Clientes Nacionales
    salesNotesReceivableAccount: '1010401', // Clientes Nacionales
    salesVatAccount: '2010901', // IVA Débito Fiscal
    purchasesInvoicesPayableAccount: '2010201', // Proveedores Nacionales
    purchasesNotesPayableAccount: '2010201', // Proveedores Nacionales
    purchasesVatAccount: '1010801', // IVA Crédito Fiscal
    vatRemanentAccount: '1010802', // IVA Remanente
    feesExpenseAccount: '4010401', // Honorarios
    feesPayableAccount: '2010301', // Honorarios por Pagar
    feesWithholdingAccount: '2010902', // Retención Impuesto 2da Categoría
    incomeFeesReceivableAccount: '1010402', // Boletas de Honorarios por Cobrar
    incomeFeesWithholdingAccount: '2010903', // Retención Boletas de Honorarios
    salariesPayableAccount: '2010302', // Sueldos por Pagar
};

// Mapeo para cuentas de remuneraciones granulares
const defaultPayrollAccountMappings: { [key in keyof Required<PayrollAccountMappings>]: string } = {
    expense_baseSalary: '4010101', // Sueldos y Salarios
    expense_gratification: '4010102', // Gratificaciones
    expense_overtime: '4010103', // Horas Extraordinarias
    expense_bonuses: '4010104', // Bonos
    expense_transportation: '4010105', // Movilización
    expense_mealAllowance: '4010106', // Colación
    liability_afp: '2010501', // Cotizaciones Previsionales por Pagar
    liability_health: '2010502', // Cotizaciones de Salud por Pagar
    liability_unemployment: '2010503', // Seguro de Cesantía por Pagar
    liability_tax: '2010904', // Impuesto Único a los Trabajadores
    liability_advances: '1010601', // Anticipo de Sueldos
    liability_ccaf: '2010504', // Caja de Compensación por Pagar
    expense_sis: '4010201', // Aporte Patronal SIS
    expense_unemployment: '4010202', // Aporte Patronal Seguro de Cesantía
};

export default function CompanySettingsPage() {
    const { selectedCompany, setSelectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const [company, setCompany] = React.useState<Partial<Company> | null>(null);
    const firestore = useFirestore();
    const { toast } = useToast();

    React.useEffect(() => {
        if (selectedCompany) {
            setCompany(selectedCompany);
        } else {
            setCompany(null);
        }
    }, [selectedCompany]);

    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: selectedCompany ? `companies/${selectedCompany.id}/accounts` : undefined,
        companyId: selectedCompany?.id,
    });
    
    const handleInputChange = (field: keyof Company, value: any) => {
        if (company) {
            setCompany({ ...company, [field]: value });
        }
    };

    const handleMappingChange = (field: keyof PayrollAccountMappings, value: string) => {
        if (company) {
            setCompany(prev => ({
                ...prev,
                payrollAccountMappings: {
                    ...(prev?.payrollAccountMappings || {}),
                    [field]: value
                }
            }));
        }
    };
    
    const handleOtherTaxesChange = (type: 'sales' | 'purchases', newMappings: TaxAccountMapping[]) => {
        if (company) {
            const field = type === 'sales' ? 'salesOtherTaxesAccounts' : 'purchasesOtherTaxesAccounts';
            setCompany({ ...company, [field]: newMappings });
        }
    };

    const handleCheckboxChange = (field: keyof Company, checked: boolean) => {
        if (company) {
            setCompany({ ...company, [field]: checked });
        }
    };

    const handleSaveChanges = (updatedCompanyData: Partial<Company>) => {
        if (updatedCompanyData && updatedCompanyData.id && firestore) {
            const { id, ...companyData } = updatedCompanyData;
            const companyRef = doc(firestore, 'companies', id);
            
            updateDoc(companyRef, companyData)
                .then(() => {
                    toast({
                        title: "Configuración guardada",
                        description: "Los cambios han sido guardados exitosamente.",
                    });
                    if (setSelectedCompany) {
                        setSelectedCompany(updatedCompanyData as Company);
                    }
                })
                .catch((error) => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: companyRef.path,
                        operation: 'update',
                        requestResourceData: companyData,
                    }));
                });
        }
    };

    const handleAssignDefaults = () => {
        if (!accounts || accounts.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'No hay un plan de cuentas cargado.' });
            return;
        }

        const accountMap = new Map(accounts.map(acc => [acc.code, acc]));
        let updatedCompany: Partial<Company> = { ...(company || {}) };
        let missingAccounts: string[] = [];

        // Asignar cuentas principales
        for (const key in defaultAccountMappings) {
            const field = key as keyof typeof defaultAccountMappings;
            const code = defaultAccountMappings[field];
            if (accountMap.has(code)) {
                updatedCompany[field] = code as any;
            } else {
                missingAccounts.push(`${field} (código ${code})`);
            }
        }

        // Asignar cuentas de remuneraciones
        let updatedPayrollMappings: PayrollAccountMappings = { ...(updatedCompany.payrollAccountMappings || {}) };
        for (const key in defaultPayrollAccountMappings) {
            const field = key as keyof PayrollAccountMappings;
            const code = defaultPayrollAccountMappings[field];
            if (accountMap.has(code)) {
                updatedPayrollMappings[field] = code;
            } else {
                missingAccounts.push(`${field} (código ${code})`);
            }
        }
        updatedCompany.payrollAccountMappings = updatedPayrollMappings;

        setCompany(updatedCompany);

        if (missingAccounts.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Faltan Cuentas Predeterminadas',
                description: `No se pudieron asignar todas las cuentas. Faltan las siguientes: ${missingAccounts.join(', ')}.`,
                duration: 10000,
            });
        } else {
            toast({
                title: 'Cuentas Asignadas',
                description: 'Se han asignado las cuentas predeterminadas. Guarda los cambios para confirmarlos.'
            });
        }
    };

    if (!company) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Configuración de la Empresa</CardTitle>
                    <CardDescription>Por favor, selecciona una empresa desde el menú superior para ver su configuración.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-muted-foreground">No hay ninguna empresa seleccionada.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>Configuración de la Empresa</CardTitle>
                        <CardDescription>Modificación de datos para {company.name}</CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleAssignDefaults} disabled={accountsLoading}>
                        Asignar Cuentas Predeterminadas
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* General */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Nombre/Razón Social</Label>
                            <Input id="companyName" value={company.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rut">RUT</Label>
                            <Input id="rut" value={company.rut || ''} onChange={(e) => handleInputChange('rut', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input id="address" value={company.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} />
                        </div>
                    </div>
                     <div className="space-y-2 mt-4">
                        <Label htmlFor="giro">Giro o Actividad Comercial</Label>
                        <Input id="giro" value={company.giro || ''} onChange={(e) => handleInputChange('giro', e.target.value)} />
                        <p className="text-xs text-muted-foreground">
                            Consulte los códigos de actividad en el <a href="https://www.sii.cl/ayudas/ayudas_por_servicios/1956-codigos-1959.html" target="_blank" rel="noopener noreferrer" className="text-primary underline">sitio del SII</a>.
                        </p>
                    </div>
                     <div className="flex items-center space-x-2 pt-4">
                        <Checkbox id="isDistributor" checked={!!company.isDistributor} onCheckedChange={(checked) => handleCheckboxChange('isDistributor', !!checked)} />
                        <Label htmlFor="isDistributor">Es Distribuidora (recupera imp. Art. 42)</Label>
                    </div>
                </div>

                {/* Período de Digitación */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Período de Digitación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startYear">Año de Inicio</Label>
                            <Input id="startYear" type="number" value={company.startYear || ''} onChange={(e) => handleInputChange('startYear', parseInt(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            {/* Empty div for spacing */}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="periodStartDate">Fecha inicial</Label>
                            <Input id="periodStartDate" type="date" value={company.periodStartDate || ''} onChange={(e) => handleInputChange('periodStartDate', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="periodEndDate">Fecha final</Label>
                            <Input id="periodEndDate" type="date" value={company.periodEndDate || ''} onChange={(e) => handleInputChange('periodEndDate', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Cuentas */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Cuentas Contables Principales</h3>
                    <AccountSearchInput 
                        label="Cuenta de Resultado del Ejercicio" 
                        value={company.profitAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('profitAccount', value)}
                    />
                </div>

                 {/* Impuestos (IVA) */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Impuestos (IVA)</h3>
                    <AccountSearchInput 
                        label="IVA Débito Fiscal (Ventas)" 
                        value={company.salesVatAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('salesVatAccount', value)}
                    />
                     <AccountSearchInput 
                        label="IVA Crédito Fiscal (Compras)" 
                        value={company.purchasesVatAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('purchasesVatAccount', value)}
                    />
                     <AccountSearchInput 
                        label="IVA Remanente Crédito (Arrastre)" 
                        value={company.vatRemanentAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('vatRemanentAccount', value)}
                    />
                     <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="proportionalVat" checked={!!company.proportionalVat} onCheckedChange={(checked) => handleCheckboxChange('proportionalVat', !!checked)} />
                        <Label htmlFor="proportionalVat">Utiliza IVA Proporcional</Label>
                    </div>
                </div>

                {/* Ventas */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Cuentas de Ventas</h3>
                    <AccountSearchInput 
                        label="Cuentas por Cobrar (Facturas)" 
                        value={company.salesInvoicesReceivableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('salesInvoicesReceivableAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Cuentas por Cobrar (Boletas)" 
                        value={company.salesNotesReceivableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('salesNotesReceivableAccount', value)}
                    />
                </div>

                {/* Otros Impuestos - Ventas */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Otros Impuestos y Retenciones (Ventas)</h3>
                     <OtherTaxesSettings 
                        accounts={accounts || []}
                        loading={accountsLoading}
                        mappings={company.salesOtherTaxesAccounts || []}
                        onChange={(newMappings) => handleOtherTaxesChange('sales', newMappings)}
                    />
                </div>
                
                 {/* Compras */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-medium">Cuentas de Compras</h3>
                    <AccountSearchInput 
                        label="Cuentas por Pagar (Facturas)" 
                        value={company.purchasesInvoicesPayableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('purchasesInvoicesPayableAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Cuentas por Pagar (Boletas)" 
                        value={company.purchasesNotesPayableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('purchasesNotesPayableAccount', value)}
                    />
                </div>

                {/* Otros Impuestos - Compras */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Otros Impuestos y Retenciones (Compras)</h3>
                     <OtherTaxesSettings 
                        accounts={accounts || []}
                        loading={accountsLoading}
                        mappings={company.purchasesOtherTaxesAccounts || []}
                        onChange={(newMappings) => handleOtherTaxesChange('purchases', newMappings)}
                    />
                </div>

                {/* Honorarios */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Honorarios (Gastos)</h3>
                     <AccountSearchInput 
                        label="Cuenta de Gasto en Honorarios" 
                        value={company.feesExpenseAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('feesExpenseAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Cuenta de Honorarios por Pagar" 
                        value={company.feesPayableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('feesPayableAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Cuenta de Retención (2da Categoría)" 
                        value={company.feesWithholdingAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('feesWithholdingAccount', value)}
                    />
                </div>

                 {/* Ingresos Honorarios */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-medium">Honorarios (Ingresos)</h3>
                    <AccountSearchInput 
                        label="Cuenta de Honorarios por Cobrar" 
                        value={company.incomeFeesReceivableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('incomeFeesReceivableAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Cuenta de Retención (Boletas de Honorarios)" 
                        value={company.incomeFeesWithholdingAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('incomeFeesWithholdingAccount', value)}
                    />
                </div>

                 {/* Remuneraciones */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-medium">Centralización de Remuneraciones</h3>
                     <p className="text-sm text-muted-foreground">
                        Define las cuentas contables para una correcta centralización de las liquidaciones de sueldo.
                    </p>
                    <AccountSearchInput 
                        label="Sueldos por Pagar (Total Líquido)" 
                        value={company.salariesPayableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('salariesPayableAccount', value)}
                    />
                    <PayrollAccountMappingsForm 
                        company={company}
                        accounts={accounts || []}
                        loading={accountsLoading}
                        onMappingChange={handleMappingChange}
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={() => handleSaveChanges(company!)}>Guardar Cambios</Button>
                </div>

                {/* Danger Zone */}
                <div className="space-y-4 pt-8">
                    <h3 className="text-lg font-medium text-destructive">Zona de Peligro</h3>
                    <div className="rounded-lg border border-destructive bg-destructive/5 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold">Eliminar esta empresa</h4>
                                <p className="text-sm text-muted-foreground">
                                    Una vez eliminada, la empresa y todos sus datos se perderán para siempre.
                                </p>
                            </div>
                            <DeleteCompanyDialog 
                                company={company as Company} 
                            />
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
