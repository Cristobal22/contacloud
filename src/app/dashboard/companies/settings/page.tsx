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


export default function CompanySettingsPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const [company, setCompany] = React.useState<Partial<Company> | null>(null);
    const firestore = useFirestore();

    React.useEffect(() => {
        if (selectedCompany) {
            setCompany(selectedCompany);
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

    const handleSaveChanges = async () => {
        if (company && company.id && firestore) {
            const companyRef = doc(firestore, 'companies', company.id);
            await updateDoc(companyRef, company);
            alert('Cambios guardados exitosamente!');
        }
    };

    if (!company) {
        return <p>Selecciona una empresa para ver su configuración.</p>
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
                    <div className="flex items-center space-x-2">
                        <Checkbox id="isDistributor" checked={!!company.isDistributor} onCheckedChange={(checked) => handleCheckboxChange('isDistributor', !!checked)} />
                        <Label htmlFor="isDistributor">Es Distribuidora (recupera imp. Art. 42)</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Empresa</Label>
                            <Input id="companyName" value={company.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startYear">Año de Inicio</Label>
                            <Input id="startYear" type="number" value={company.startYear || ''} onChange={(e) => handleInputChange('startYear', parseInt(e.target.value))} />
                        </div>
                    </div>
                </div>

                {/* Período de Digitación */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Período de Digitación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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


                <div className="flex justify-end">
                    <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
                </div>
            </CardContent>
        </Card>
    )
}
