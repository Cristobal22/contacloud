import React from 'react';
import type { Employee, Payroll, PayrollDraft } from '@/lib/types';

const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return '$ 0';
    return `$ ${Math.round(value).toLocaleString('es-CL')}`;
};

interface PayslipPreviewProps {
    employee: Employee;
    payroll: Payroll | PayrollDraft;
    company?: { name: string; rut: string };
}

const PayslipPreview: React.FC<PayslipPreviewProps> = ({ employee, payroll, company }) => {
    const companyName = company?.name || 'EL PEREGRINO SPA'; // Placeholder
    const companyRut = company?.rut || '77.777.777-7'; // Placeholder
    const period = 'period' in payroll && payroll.period ? payroll.period : `${String(payroll.month).padStart(2, '0')}-${payroll.year}`;

    const taxableBonos = payroll.variableBonos?.filter(b => b.type === 'taxable') || [];
    const nonTaxableBonos = payroll.variableBonos?.filter(b => b.type === 'non-taxable') || [];

    return (
        <div className="payslip-preview" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#000', backgroundColor: '#fff', padding: '20px', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
            
            <header style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>LIQUIDACIÓN DE SUELDO</h1>
                <p style={{ margin: '0', fontSize: '12px' }}>Período: {period}</p>
            </header>

            <table style={{ width: '100%', marginBottom: '15px', borderCollapse: 'collapse', border: '1px solid #333' }}>
                <tbody>
                    <tr><td colSpan={4} style={{ padding: '5px', border: '1px solid #333', backgroundColor: '#f2f2f2' }}><strong>DATOS DE LA EMPRESA</strong></td></tr>
                    <tr>
                        <td style={{ padding: '5px', border: '1px solid #333', width: '120px' }}><strong>Razón Social:</strong></td>
                        <td style={{ padding: '5px', border: '1px solid #333' }}>{companyName}</td>
                        <td style={{ padding: '5px', border: '1px solid #333', width: '80px' }}><strong>RUT:</strong></td>
                        <td style={{ padding: '5px', border: '1px solid #333', width: '150px' }}>{companyRut}</td>
                    </tr>
                </tbody>
            </table>

            <table style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse', border: '1px solid #333' }}>
                 <tbody>
                    <tr><td colSpan={4} style={{ padding: '5px', border: '1px solid #333', backgroundColor: '#f2f2f2' }}><strong>DATOS DEL TRABAJADOR</strong></td></tr>
                    <tr>
                        <td style={{ padding: '5px', border: '1px solid #333', width: '120px' }}><strong>Nombre:</strong></td>
                        <td style={{ padding: '5px', border: '1px solid #333' }}>{`${employee.firstName} ${employee.lastName}`}</td>
                        <td style={{ padding: '5px', border: '1px solid #333', width: '80px' }}><strong>RUT:</strong></td>
                        <td style={{ padding: '5px', border: '1px solid #333', width: '150px' }}>{employee.rut}</td>
                    </tr>
                     <tr>
                        <td style={{ padding: '5px', border: '1px solid #333' }}><strong>Cargo:</strong></td>
                        <td colSpan={3} style={{ padding: '5px', border: '1px solid #333' }}>{employee.position || 'No especificado'}</td>
                    </tr>
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ width: '49%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333' }}>
                        <thead><tr><th colSpan={2} style={{ padding: '5px', border: '1px solid #333', backgroundColor: '#f2f2f2' }}>HABERES</th></tr></thead>
                        <tbody>
                            <tr><td style={{ padding: '4px', border: '1px solid #333', fontStyle: 'italic' }}>Imponibles</td><td style={{ padding: '4px', border: '1px solid #333' }}></td></tr>
                            <tr><td style={{ padding: '4px 8px' }}>Sueldo Base</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(payroll.baseSalary)}</td></tr>
                            <tr><td style={{ padding: '4px 8px' }}>Gratificación Legal</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(payroll.gratification)}</td></tr>
                            {taxableBonos.map((bono, i) => <tr key={`tax-bono-${i}`}><td style={{ padding: '4px 8px' }}>{bono.glosa}</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(bono.monto)}</td></tr>)}
                            <tr><td style={{ padding: '4px', border: '1px solid #333', fontStyle: 'italic' }}>No Imponibles</td><td style={{ padding: '4px', border: '1px solid #333' }}></td></tr>
                            <tr><td style={{ padding: '4px 8px' }}>Movilización</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(payroll.mobilization)}</td></tr>
                            <tr><td style={{ padding: '4px 8px' }}>Colación</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(payroll.collation)}</td></tr>
                            {nonTaxableBonos.map((bono, i) => <tr key={`nontax-bono-${i}`}><td style={{ padding: '4px 8px' }}>{bono.glosa}</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(bono.monto)}</td></tr>)}
                        </tbody>
                    </table>
                </div>

                <div style={{ width: '49%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333' }}>
                        <thead><tr><th colSpan={2} style={{ padding: '5px', border: '1px solid #333', backgroundColor: '#f2f2f2' }}>DESCUENTOS</th></tr></thead>
                        <tbody>
                            <tr><td style={{ padding: '4px 8px' }}>Cotización AFP ({employee.afp})</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(payroll.afpDiscount)}</td></tr>
                            <tr><td style={{ padding: '4px 8px' }}>Cotización Salud ({employee.healthSystem})</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(payroll.healthDiscount)}</td></tr>
                            <tr><td style={{ padding: '4px 8px' }}>Seguro de Cesantía</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(payroll.unemploymentInsuranceDiscount)}</td></tr>
                            <tr><td style={{ padding: '4px 8px' }}>Impuesto Único</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(payroll.iut)}</td></tr>
                            <tr><td style={{ padding: '4px 8px' }}>Anticipos</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(payroll.advances)}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <table style={{ width: '100%', marginTop: '20px' }}>
                <tbody>
                    <tr>
                        <td style={{ width: '50%', verticalAlign: 'top' }}>
                             <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '5px', border: '1px solid #333' }}><strong>TOTAL IMPONIBLE</strong></td>
                                        <td style={{ padding: '5px', border: '1px solid #333', textAlign: 'right' }}><strong>{formatCurrency(payroll.taxableEarnings)}</strong></td>
                                    </tr>
                                     <tr>
                                        <td style={{ padding: '5px', border: '1px solid #333' }}><strong>TOTAL HABERES</strong></td>
                                        <td style={{ padding: '5px', border: '1px solid #333', textAlign: 'right' }}><strong>{formatCurrency(payroll.totalEarnings)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                        <td style={{ width: '50%', verticalAlign: 'top' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '5px', border: '1px solid #333' }}><strong>TOTAL DESCUENTOS</strong></td>
                                        <td style={{ padding: '5px', border: '1px solid #333', textAlign: 'right' }}><strong>{formatCurrency(payroll.totalDiscounts)}</strong></td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                                        <td style={{ padding: '8px', border: '1px solid #333' }}><strong>ALCANCE LÍQUIDO</strong></td>
                                        <td style={{ padding: '8px', border: '1px solid #333', textAlign: 'right' }}><strong>{formatCurrency(payroll.netSalary)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style={{ position: 'absolute', bottom: '40px', left: '20px', right: '20px', textAlign: 'center' }}>
                 <p style={{ fontSize: '10px', marginBottom: '40px' }}>Son: {payroll.netSalaryInWords || '...'}</p>
                <div style={{ display: 'inline-block', borderTop: '1px solid #000', width: '250px', padding: '5px' }}>
                    Firma del Trabajador
                </div>
                <p style={{ fontSize: '9px', marginTop: '10px' }}>
                    Recibí conforme el alcance líquido de la presente liquidación, no teniendo cargo ni cobro alguno que hacer por otro concepto.
                </p>
            </div>
        </div>
    );
};

export default PayslipPreview;
