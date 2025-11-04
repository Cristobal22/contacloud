import React from 'react';
import type { Employee, Payroll } from '@/lib/types';

const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return '$ 0';
    return `$ ${Math.round(value).toLocaleString('es-CL')}`;
};

interface PayslipPreviewProps {
    employee: Employee;
    payroll: Payroll;
}

const PayslipPreview: React.FC<PayslipPreviewProps> = ({ employee, payroll }) => {
    const companyName = 'EL PEREGRINO SPA'; // Replace with dynamic data if available
    const companyRut = '77.777.777-7'; // Replace with dynamic data if available
    const period = payroll.period || `${payroll.month}/${payroll.year}`;

    return (
        <div className="payslip-preview">
            <h2 style={{ textAlign: 'center' }}>LIQUIDACIÓN DE SUELDO</h2>
            <p style={{ textAlign: 'center' }}>{period.toUpperCase()}</p>
            <hr />

            <div className="company-details">
                <h3>DATOS EMPRESA</h3>
                <p>Razón Social: {companyName}</p>
                <p>RUT: {companyRut}</p>
            </div>

            <div className="employee-details">
                <h3>DATOS TRABAJADOR</h3>
                <p>Nombre: {employee.firstName} {employee.lastName}</p>
                <p>RUT: {employee.rut}</p>
                <p>Cargo: {employee.position || 'No especificado'}</p>
            </div>
            <hr />

            <div className="earnings">
                <h3>HABERES</h3>
                <ul>
                    <li><span>Sueldo Base:</span><span>{formatCurrency(payroll.baseSalary)}</span></li>
                    <li><span>Gratificación Legal:</span><span>{formatCurrency(payroll.gratification)}</span></li>
                    {payroll.bonos?.map(bono => (
                        <li key={bono.glosa}><span>{bono.glosa}:</span><span>{formatCurrency(bono.monto)}</span></li>
                    ))}
                    <li><span>Horas Extra:</span><span>{formatCurrency(payroll.otherTaxableEarnings - (payroll.bonos?.reduce((s, b) => s + b.monto, 0) || 0))}</span></li>
                    <li><span>Movilización:</span><span>{formatCurrency(employee.mobilization)}</span></li>
                    <li><span>Colación:</span><span>{formatCurrency(employee.collation)}</span></li>
                </ul>
                <p>TOTAL HABERES: <span>{formatCurrency(payroll.totalEarnings)}</span></p>
            </div>

            <div className="deductions">
                <h3>DESCUENTOS</h3>
                <ul>
                    <li><span>AFP {employee.afp}:</span><span>{formatCurrency(payroll.afpDiscount)}</span></li>
                    <li><span>Salud {employee.healthSystem}:</span><span>{formatCurrency(payroll.healthDiscount)}</span></li>
                    <li><span>Seguro de Cesantía:</span><span>{formatCurrency(payroll.unemploymentInsuranceDiscount)}</span></li>
                    <li><span>Impuesto Único:</span><span>{formatCurrency(payroll.iut)}</span></li>
                    <li><span>Anticipos:</span><span>{formatCurrency(payroll.advances)}</span></li>
                    <li><span>Otros Descuentos:</span><span>{formatCurrency(payroll.otherDiscounts)}</span></li>
                </ul>
                <p>TOTAL DESCUENTOS: <span>{formatCurrency(payroll.totalDiscounts)}</span></p>
            </div>

            <div className="net-salary">
                <h3>ALCANCE LÍQUIDO:</h3>
                <span>{formatCurrency(payroll.netSalary)}</span>
            </div>

            <div className="signature">
                <hr style={{ width: '60%', margin: '20px auto' }} />
                <p style={{ textAlign: 'center', fontSize: '0.8em' }}>Firma del Trabajador</p>
                <p style={{ fontSize: '0.7em', textAlign: 'justify' }}>Recibí conforme el alcance líquido de la presente liquidación, no teniendo cargo ni cobro alguno que hacer por otro concepto.</p>
            </div>
        </div>
    );
};

export default PayslipPreview;
