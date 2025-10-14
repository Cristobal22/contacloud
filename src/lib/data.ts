import type { User, Company, Account, Transaction, CostCenter, Employee, Subject } from './types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  role: 'Accountant',
};

export const mockCompanies: Company[] = [
  { id: 'com-1', name: 'Innovate Inc.', industry: 'Technology', active: true },
  { id: 'com-2', name: 'HealthFirst Solutions', industry: 'Healthcare', active: true },
  { id: 'com-3', name: 'GreenLeaf Organics', industry: 'Agriculture', active: false },
  { id: 'com-4', name: 'Constructo Corp.', industry: 'Construction', active: true },
  { id: 'com-5', name: 'Quantum Logistics', industry: 'Transport', active: true },
];

export const mockAccounts: Account[] = [
  { id: 'acc-1', code: '1101-01', name: 'Caja', type: 'Asset', balance: 150000.75 },
  { id: 'acc-2', code: '1105-05', name: 'Cuentas por Cobrar Clientes', type: 'Asset', balance: 75230.50 },
  { id: 'acc-3', code: '2105-01', name: 'Remuneraciones por Pagar', type: 'Liability', balance: 85300.00 },
  { id: 'acc-4', code: '2105-10', name: 'Leyes Sociales por Pagar', type: 'Liability', balance: 22150.00 },
  { id: 'acc-5', code: '2105-15', name: 'Impuestos Retenidos por Pagar', type: 'Liability', balance: 7800.00 },
  { id: 'acc-6', code: '5105-05', name: 'Sueldos y Salarios', type: 'Expense', balance: 100000.00 },
  { id: 'acc-7', code: '5105-10', name: 'Aportes a Seguridad Social', type: 'Expense', balance: 15250.00 },
];

export const mockTransactions: Transaction[] = [
    { id: 'txn-1', date: '2023-10-28', description: 'Client payment for Project X', amount: 15000, type: 'Credit', account: 'Service Revenue', status: 'Completed' },
    { id: 'txn-2', date: '2023-10-27', description: 'October salaries', amount: 25000, type: 'Debit', account: 'Salaries Expense', status: 'Completed' },
    { id: 'txn-3', date: '2023-10-26', description: 'Invoice #INV-003 from Supplier Co.', amount: 3200, type: 'Debit', account: 'Accounts Payable', status: 'Pending' },
    { id: 'txn-4', date: '2023-10-25', description: 'Cash withdrawal for petty cash', amount: 500, type: 'Debit', account: 'Cash', status: 'Completed' },
    { id: 'txn-5', date: '2023-10-24', description: 'Received payment for Invoice #INV-001', amount: 7500, type: 'Credit', account: 'Accounts Receivable', status: 'Completed' },
    { id: 'txn-6', date: '2023-10-23', description: 'Cloud server hosting - October', amount: 450, type: 'Debit', account: 'Utilities Expense', status: 'Failed' },
];

export const mockCostCenters: CostCenter[] = [
    { id: 'cc-1', name: 'Producción', description: 'Costos asociados a la línea de producción.' },
    { id: 'cc-2', name: 'Administración', description: 'Costos generales y de administración.' },
    { id: 'cc-3', name: 'Ventas y Marketing', description: 'Costos relacionados con la comercialización y venta de productos.' },
];

export const mockEmployees: Employee[] = [
  { id: 'emp-1', name: 'Juan Pérez', rut: '12.345.678-9', position: 'Operario de Producción', costCenter: 'Producción', status: 'Active' },
  { id: 'emp-2', name: 'Ana Gómez', rut: '9.876.543-2', position: 'Asistente Administrativa', costCenter: 'Administración', status: 'Active' },
  { id: 'emp-3', name: 'Carlos Soto', rut: '15.678.901-K', position: 'Vendedor', costCenter: 'Ventas y Marketing', status: 'Active' },
  { id: 'emp-4', name: 'María Rodríguez', rut: '18.123.456-7', position: 'Jefe de Producción', costCenter: 'Producción', status: 'Inactive' },
];

export const mockSubjects: Subject[] = [
    { id: 'sub-1', name: 'Comercial ABC Ltda.', rut: '76.123.456-7', type: 'Cliente', status: 'Active' },
    { id: 'sub-2', name: 'Proveedor de Servicios XYZ S.A.', rut: '77.987.654-3', type: 'Proveedor', status: 'Active' },
    { id: 'sub-3', name: 'Asesorías Profesionales SpA', rut: '78.456.123-K', type: 'Proveedor', status: 'Active' },
    { id: 'sub-4', name: 'Cliente Minorista Ejemplo', rut: '15.890.123-4', type: 'Cliente', status: 'Inactive' },
];
