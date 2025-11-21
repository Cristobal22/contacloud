'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Company } from '@/lib/types';

interface CompanySwitcherProps {
  companies: Company[];
  selectedCompany: Company | null;
  onCompanySwitch: (company: Company) => void;
  isCollapsed: boolean;
}

export function CompanySwitcher({
  companies,
  selectedCompany,
  onCompanySwitch,
}: CompanySwitcherProps) {

  const handleValueChange = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      onCompanySwitch(company);
    }
  };

  if (!selectedCompany) {
    return (
        <div className="w-[200px] h-9 rounded-md animate-pulse bg-gray-200"/>
    )
  }

  return (
    <Select value={selectedCompany?.id} onValueChange={handleValueChange}>
      <SelectTrigger
        className={`w-[200px]`}
        aria-label="Select company"
      >
        <SelectValue placeholder="Seleccione una empresa">
          <span className="truncate">{selectedCompany?.name}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            <div className="flex items-center gap-3">
              <span className="truncate">{company.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
