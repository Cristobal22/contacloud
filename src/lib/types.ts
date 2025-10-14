export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'Admin' | 'Accountant';
};

export type Company = {
  id: string;
  name: string;
  industry: string;
  active: boolean;
};

export type Account = {
  id:string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  balance: number;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Debit' | 'Credit';
  account: string;
  status: 'Pending' | 'Completed' | 'Failed';
};

export type CostCenter = {
    id: string;
    name: string;
    description: string;
};

export type Employee = {
  id: string;
  name: string;
  rut: string;
  position: string;
  costCenter: string;
  status: 'Active' | 'Inactive';
};
