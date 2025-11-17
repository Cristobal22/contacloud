
import type { AfpEntity, EconomicIndicator, FamilyAllowanceParameter, HealthEntity, TaxableCap, TaxParameter } from "./types";
import { initialChartOfAccounts } from './chart-of-accounts-data';

// The initialChartOfAccounts is now imported from its own dedicated file.
export { initialChartOfAccounts };

const afpBaseData = [
    { name: "CAPITAL", mandatoryContribution: 11.44, previredCode: "33", provisionalRegime: "DL 3.500", dtCode: "02" },
    { name: "CUPRUM", mandatoryContribution: 11.44, previredCode: "03", provisionalRegime: "DL 3.500", dtCode: "03" },
    { name: "HABITAT", mandatoryContribution: 11.27, previredCode: "05", provisionalRegime: "DL 3.500", dtCode: "04" },
    { name: "MODELO", mandatoryContribution: 10.58, previredCode: "34", provisionalRegime: "DL 3.500", dtCode: "08" },
    { name: "PLANVITAL", mandatoryContribution: 11.16, previredCode: "08", provisionalRegime: "DL 3.500", dtCode: "05" },
    { name: "PROVIDA", mandatoryContribution: 11.45, previredCode: "09", provisionalRegime: "DL 3.500", dtCode: "06" },
    { name: "UNO", mandatoryContribution: 10.49, previredCode: "35", provisionalRegime: "DL 3.500", dtCode: "09" }
];

const healthData = [
    { name: "FONASA", mandatoryContribution: 7.00, previredCode: "01", dtCode: "01" },
    { name: "CONSALUD", mandatoryContribution: 7.00, previredCode: "18", dtCode: "02" },
    { name: "CRUZBLANCA", mandatoryContribution: 7.00, previredCode: "07", dtCode: "03" },
    { name: "NUEVA MASVIDA", mandatoryContribution: 7.00, previredCode: "31", dtCode: "04" },
    { name: "BANMEDICA", mandatoryContribution: 7.00, previredCode: "04", dtCode: "05" },
    { name: "VIDA TRES", mandatoryContribution: 7.00, previredCode: "17", dtCode: "06" },
    { name: "COLMENA", mandatoryContribution: 7.00, previredCode: "02", dtCode: "07" },
];

const sisRates = {
    '2024-1': 1.49, '2024-2': 1.49, '2024-3': 1.49, '2024-4': 1.49, '2024-5': 1.49, '2024-6': 1.49,
    '2024-7': 2.01, '2024-8': 2.01, '2024-9': 2.01, 
    '2024-10': 1.50, '2024-11': 1.50, '2024-12': 1.50,
    '2025-1': 1.38, '2025-2': 1.38, '2025-3': 1.38,
    '2025-4': 1.78, '2025-5': 1.78, '2025-6': 1.78,
    '2025-7': 1.88, '2025-8': 1.88, '2025-9': 1.88, '2025-10': 1.88, '25-11': 1.88, '2025-12': 1.88,
};

const getSisRate = (year: number, month: number): number => {
    return sisRates[`${year}-${month}`] || 1.47; // Default fallback
};


const generateAfpDataForYears = (years: number[]) => {
    return years.flatMap(year => 
        Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => {
            const sisRate = getSisRate(year, month);
            return afpBaseData.map(afp => ({ ...afp, year, month, employerContribution: sisRate }));
        })
    );
};

export const initialAfpEntities: Omit<AfpEntity, 'id'>[] = [
    ...generateAfpDataForYears([2023, 2024, 2025])
];

export const initialHealthEntities: Omit<HealthEntity, 'id'>[] = [
    ...[2023, 2024, 2025].flatMap(year => 
        Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => 
            healthData.map(health => ({ ...health, year, month }))
        )
    )
];


const familyAllowanceJanToApr2023 = [
    { tramo: "A", desde: 0, hasta: 429899, monto: 16828 },
    { tramo: "B", desde: 429900, hasta: 627913, monto: 10327 },
    { tramo: "C", desde: 627914, hasta: 979330, monto: 3264 },
    { tramo: "D", desde: 979331, hasta: Infinity, monto: 0 }
];
const familyAllowanceMayToAug2023 = [
    { tramo: "A", desde: 0, hasta: 429899, monto: 20328 },
    { tramo: "B", desde: 429900, hasta: 627913, monto: 12475 },
    { tramo: "C", desde: 627914, hasta: 979330, monto: 3942 },
    { tramo: "D", desde: 979331, hasta: Infinity, monto: 0 }
];
const familyAllowanceSep2023onwards = [
    { tramo: "A", desde: 0, hasta: 515879, monto: 20328 },
    { tramo: "B", desde: 515880, hasta: 753496, monto: 12475 },
    { tramo: "C", desde: 753497, hasta: 1175096, monto: 3942 },
    { tramo: "D", desde: 1175097, hasta: Infinity, monto: 0 }
];

const familyAllowance2024 = [
    { tramo: "A", desde: 0, hasta: 539699, monto: 20328 },
    { tramo: "B", desde: 539700, hasta: 788249, monto: 12475 },
    { tramo: "C", desde: 788250, hasta: 1228614, monto: 3942 },
    { tramo: "D", desde: 1228615, hasta: Infinity, monto: 0 }
];

const familyAllowance2025 = familyAllowance2024; // Assuming 2025 is same as 2024 until official data

export const initialFamilyAllowanceParameters: Omit<FamilyAllowanceParameter, 'id'>[] = [
    // 2023
    ...Array.from({ length: 4 }, (_, i) => i + 1).flatMap(month => 
        familyAllowanceJanToApr2023.map(param => ({ ...param, year: 2023, month }))
    ),
    ...Array.from({ length: 4 }, (_, i) => i + 5).flatMap(month => 
        familyAllowanceMayToAug2023.map(param => ({ ...param, year: 2023, month }))
    ),
    ...Array.from({ length: 4 }, (_, i) => i + 9).flatMap(month => 
        familyAllowanceSep2023onwards.map(param => ({ ...param, year: 2023, month }))
    ),
    // 2024
    ...Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => 
        familyAllowance2024.map(param => ({ ...param, year: 2024, month }))
    ),
     // 2025
    ...Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => 
        familyAllowance2025.map(param => ({ ...param, year: 2025, month }))
    ),
];

export const initialTaxParameters: Omit<TaxParameter, 'id' | 'year' | 'month'>[] = [
    { tramo: "Exento", desdeUTM: 0, hastaUTM: 13.5, factor: 0, rebajaUTM: 0.54 },
    { tramo: "Tramo 1", desdeUTM: 13.5, hastaUTM: 30, factor: 0.04, rebajaUTM: 0.54 },
    { tramo: "Tramo 2", desdeUTM: 30, hastaUTM: 50, factor: 0.08, rebajaUTM: 1.74 },
    { tramo: "Tramo 3", desdeUTM: 50, hastaUTM: 70, factor: 0.135, rebajaUTM: 4.49 },
    { tramo: "Tramo 4", desdeUTM: 70, hastaUTM: 90, factor: 0.23, rebajaUTM: 11.14 },
    { tramo: "Tramo 5", desdeUTM: 90, hastaUTM: 120, factor: 0.304, rebajaUTM: 17.80 },
    { tramo: "Tramo 6", desdeUTM: 120, hastaUTM: 310, factor: 0.35, rebajaUTM: 23.32 },
    { tramo: "Tramo 7", desdeUTM: 310, hastaUTM: Infinity, factor: 0.40, rebajaUTM: 38.82 },
];


export const initialEconomicIndicators: Omit<EconomicIndicator, 'id' | 'uta' | 'gratificationCap'>[] = [
    // 2023
    { year: 2023, month: 1, uf: 35111.96, utm: 61769, minWage: 410000 },
    { year: 2023, month: 2, uf: 35277.83, utm: 61955, minWage: 410000 },
    { year: 2023, month: 3, uf: 35499.78, utm: 62450, minWage: 410000 },
    { year: 2023, month: 4, uf: 35688.19, utm: 62746, minWage: 410000 },
    { year: 2023, month: 5, uf: 35836.56, utm: 63059, minWage: 440000 },
    { year: 2023, month: 6, uf: 35948.30, utm: 63199, minWage: 440000 },
    { year: 2023, month: 7, uf: 36041.51, utm: 63263, minWage: 440000 },
    { year: 2023, month: 8, uf: 36173.23, utm: 63452, minWage: 440000 },
    { year: 2023, month: 9, uf: 36294.13, utm: 63515, minWage: 460000 },
    { year: 2023, month: 10, uf: 36471.60, utm: 63960, minWage: 460000 },
    { year: 2023, month: 11, uf: 36622.18, utm: 64115, minWage: 460000 },
    { year: 2023, month: 12, uf: 36768.91, utm: 64343, minWage: 460000 },
    // 2024
    { year: 2024, month: 1, uf: 36733.04, utm: 64666, minWage: 460000 },
    { year: 2024, month: 2, uf: 36856.50, utm: 64793, minWage: 460000 },
    { year: 2024, month: 3, uf: 37093.52, utm: 64793, minWage: 460000 },
    { year: 2024, month: 4, uf: 37261.98, utm: 65182, minWage: 460000 },
    { year: 2024, month: 5, uf: 37438.91, utm: 65443, minWage: 460000 },
    { year: 2024, month: 6, uf: 37571.86, utm: 65770, minWage: 460000 },
    { year: 2024, month: 7, uf: 37578.95, utm: 65967, minWage: 500000 },
    { year: 2024, month: 8, uf: 37754.47, utm: 65901, minWage: 500000 },
    { year: 2024, month: 9, uf: 37910.42, utm: 66362, minWage: 500000 },
    { year: 2024, month: 10, uf: 37971.42, utm: 66561, minWage: 500000 },
    { year: 2024, month: 11, uf: 38247.92, utm: 66628, minWage: 500000 },
    { year: 2024, month: 12, uf: 38416.69, utm: 67294, minWage: 500000 },
    // 2025
    { year: 2025, month: 1, uf: 38989.01, utm: 67429, minWage: 510636 },
    { year: 2025, month: 2, uf: 39081.90, utm: 67294, minWage: 510636 },
    { year: 2025, month: 3, uf: 39269.69, utm: 68034, minWage: 510636 },
    { year: 2025, month: 4, uf: 39485.65, utm: 68306, minWage: 510636 },
    { year: 2025, month: 5, uf: 39081.90, utm: 68648, minWage: 510636 },
    { year: 2025, month: 6, uf: 39189.45, utm: 68785, minWage: 529000 },
    { year: 2025, month: 7, uf: 39269.69, utm: 68923, minWage: 529000 },
    { year: 2025, month: 8, uf: 39265.22, utm: 68647, minWage: 529000 },
    { year: 2025, month: 9, uf: 39394.46, utm: 69265, minWage: 529000 },
    { year: 2025, month: 10, minWage: 529000 },
    { year: 2025, month: 11, minWage: 529000 },
    { year: 2025, month: 12, minWage: 529000 },
];

export const initialTaxableCaps: Omit<TaxableCap, 'id'>[] = [
    { year: 2023, afpCap: 81.6, afcCap: 122.6 },
    { year: 2024, afpCap: 84.3, afcCap: 126.6 },
    { year: 2025, afpCap: 87.8, afcCap: 131.9 }, 
];


