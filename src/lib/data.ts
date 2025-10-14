import type { User, Company, Account, Transaction, CostCenter } from './types';

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
  { id: 'acc-1', code: '1010', name: 'Cash', type: 'Asset', balance: 150000.75 },
  { id: 'acc-2', code: '1200', name: 'Accounts Receivable', type: 'Asset', balance: 75230.50 },
  { id: 'acc-3', code: '2010', name: 'Accounts Payable', type: 'Liability', balance: 45800.00 },
  { id: 'acc-4', code: '3000', name: 'Owner\'s Equity', type: 'Equity', balance: 250000.00 },
  { id: 'acc-5', code: '4000', name: 'Service Revenue', type: 'Revenue', balance: 300500.25 },
  { id: 'acc-6', code: '5000', name: 'Salaries Expense', type: 'Expense', balance: 80000.00 },
  { id: 'acc-7', code: '5010', name: 'Rent Expense', type: 'Expense', balance: 25000.00 },
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
