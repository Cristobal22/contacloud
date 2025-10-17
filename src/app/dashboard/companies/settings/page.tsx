
'use client';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React from 'react';
import type { Company, Account } from '@/lib/types';
import { useCollection, useFirestore } from '@/firebase';
import { SelectedCompanyContext } from '../../layout';
import { doc, updateDoc } from 'firebase/firestore';
import { AccountSearchInput } from '@/components/account-search-input';
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { useToast } from "@/hooks/use-toast";


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

    const handleCheckboxChange = (field: keyof Company, checked: boolean) => {
        if (company) {
            setCompany({ ...company, [field]: checked });
        }
    };

    const handleSaveChanges = () => {
        if (company && company.id && firestore) {
            const { id, ...companyData } = company;
            const companyRef = doc(firestore, 'companies', id);
            
            updateDoc(companyRef, companyData)
                .then(() => {
                    toast({
                        title: "Configuración guardada",
                        description: "Los cambios han sido guardados exitosamente.",
                    });
                    if (setSelectedCompany) {
                        setSelectedCompany(company as Company);
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
                <CardTitle>Configuración de la Empresa</CardTitle>
                <CardDescription>Modificación de datos para {company.name}</CardDescription>
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
                    <h3 className="text-lg font-medium">Cuentas</h3>
                    <AccountSearchInput 
                        label="Cuenta de Ganancia" 
                        value={company.profitAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('profitAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Cuenta de Pérdida" 
                        value={company.lossAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('lossAccount', value)}
                    />
                </div>

                {/* Ventas */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Ventas</h3>
                    <AccountSearchInput 
                        label="Facturas por Cobrar" 
                        value={company.salesInvoicesReceivableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('salesInvoicesReceivableAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Boletas por Cobrar" 
                        value={company.salesNotesReceivableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('salesNotesReceivableAccount', value)}
                    />
                     <AccountSearchInput 
                        label="Cuenta de IVA" 
                        value={company.salesVatAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('salesVatAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Otros Impuestos" 
                        value={company.salesOtherTaxesAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('salesOtherTaxesAccount', value)}
                    />
                </div>
                
                 {/* Compras */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-medium">Compras</h3>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="proportionalVat" checked={!!company.proportionalVat} onCheckedChange={(checked) => handleCheckboxChange('proportionalVat', !!checked)} />
                        <Label htmlFor="proportionalVat">IVA Proporcional</Label>
                    </div>
                    <AccountSearchInput 
                        label="Facturas por Pagar" 
                        value={company.purchasesInvoicesPayableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('purchasesInvoicesPayableAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Boletas por Pagar" 
                        value={company.purchasesNotesPayableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('purchasesNotesPayableAccount', value)}
                    />
                     <AccountSearchInput 
                        label="Cuenta de IVA" 
                        value={company.purchasesVatAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('purchasesVatAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Otros Impuestos" 
                        value={company.purchasesOtherTaxesAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('purchasesOtherTaxesAccount', value)}
                    />
                </div>

                {/* Honorarios */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Honorarios</h3>
                    <AccountSearchInput 
                        label="Honorarios por Pagar" 
                        value={company.feesPayableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('feesPayableAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Retenciones 2da Categoría" 
                        value={company.feesWithholdingAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('feesWithholdingAccount', value)}
                    />
                </div>

                 {/* Ingresos Honorarios */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-medium">Ingresos Honorarios</h3>
                    <AccountSearchInput 
                        label="Clientes Honorarios" 
                        value={company.incomeFeesReceivableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('incomeFeesReceivableAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Retenciones por Pagar" 
                        value={company.incomeFeesWithholdingAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('incomeFeesWithholdingAccount', value)}
                    />
                </div>

                 {/* Remuneraciones */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-medium">Remuneraciones</h3>
                    <AccountSearchInput 
                        label="Cuenta de Gasto (Sueldos)" 
                        value={company.remunerationExpenseAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('remunerationExpenseAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Sueldos por Pagar" 
                        value={company.salariesPayableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('salariesPayableAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Leyes Sociales por Pagar (AFP)" 
                        value={company.afpPayableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('afpPayableAccount', value)}
                    />
                    <AccountSearchInput 
                        label="Leyes Sociales por Pagar (Salud)" 
                        value={company.healthPayableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('healthPayableAccount', value)}
                    />
                     <AccountSearchInput 
                        label="Seguro de Cesantía por Pagar" 
                        value={company.unemploymentInsurancePayableAccount || ''} 
                        accounts={accounts || []} 
                        loading={accountsLoading}
                        onValueChange={(value) => handleInputChange('unemploymentInsurancePayableAccount', value)}
                    />
                </div>


                <div className="flex justify-end">
                    <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
                </div>
            </CardContent>
        </Card>
    )
}
