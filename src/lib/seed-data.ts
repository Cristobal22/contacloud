
import type { AfpEntity, EconomicIndicator, FamilyAllowanceParameter, HealthEntity, Institution, TaxParameter } from "./types";

export const initialAfpEntities: Omit<AfpEntity, 'id'>[] = [
    { code: "03", name: "CAPITAL", mandatoryContribution: 11.44, previredCode: "33", provisionalRegime: "DL 3.500", dtCode: "02" },
    { code: "05", name: "CUPRUM", mandatoryContribution: 11.44, previredCode: "03", provisionalRegime: "DL 3.500", dtCode: "03" },
    { code: "08", name: "HABITAT", mandatoryContribution: 11.27, previredCode: "05", provisionalRegime: "DL 3.500", dtCode: "04" },
    { code: "29", name: "MODELO", mandatoryContribution: 10.58, previredCode: "34", provisionalRegime: "DL 3.500", dtCode: "08" },
    { code: "12", name: "PLANVITAL", mandatoryContribution: 11.16, previredCode: "08", provisionalRegime: "DL 3.500", dtCode: "05" },
    { code: "13", name: "PROVIDA", mandatoryContribution: 11.45, previredCode: "09", provisionalRegime: "DL 3.500", dtCode: "06" },
    { code: "35", name: "UNO", mandatoryContribution: 10.49, previredCode: "35", provisionalRegime: "DL 3.500", dtCode: "09" }
];

export const initialHealthEntities: Omit<HealthEntity, 'id'>[] = [
    { code: "001", name: "FONASA", mandatoryContribution: 7.00, previredCode: "01", dtCode: "01" },
    { code: "067", name: "CONSALUD", mandatoryContribution: 7.00, previredCode: "18", dtCode: "02" },
    { code: "099", name: "CRUZBLANCA", mandatoryContribution: 7.00, previredCode: "07", dtCode: "03" },
    { code: "081", name: "NUEVA MASVIDA", mandatoryContribution: 7.00, previredCode: "31", dtCode: "04" },
    { code: "078", name: "BANMEDICA", mandatoryContribution: 7.00, previredCode: "04", dtCode: "05" },
    { code: "080", name: "VIDA TRES", mandatoryContribution: 7.00, previredCode: "17", dtCode: "06" },
    { code: "076", name: "COLMENA", mandatoryContribution: 7.00, previredCode: "02", dtCode: "07" },
];

export const initialInstitutions: Omit<Institution, 'id'>[] = [
    { name: "AFP", type: "AFP" },
    { name: "Fonasa", type: "Salud" },
    { name: "Isapre", type: "Salud" },
    { name: "Mutual de Seguridad", type: "Mutual" },
    { name: "Caja de Compensación", type: "Caja de Compensación" }
];

export const initialFamilyAllowanceParameters: Omit<FamilyAllowanceParameter, 'id'>[] = [
    { tramo: "A", desde: 0, hasta: 515879, monto: 20328 },
    { tramo: "B", desde: 515880, hasta: 753496, monto: 12475 },
    { tramo: "C", desde: 753497, hasta: 1175196, monto: 3942 },
    { tramo: "D", desde: 1175197, hasta: Infinity, monto: 0 }
];

export const initialTaxParameters: Omit<TaxParameter, 'id'>[] = [
    { tramo: "Exento", desde: 0, hasta: 13.5, factor: 0, rebaja: 0 },
    { tramo: "Tramo 1", desde: 13.5, hasta: 30, factor: 0.04, rebaja: 0.54 },
    { tramo: "Tramo 2", desde: 30, hasta: 50, factor: 0.08, rebaja: 1.74 },
    { tramo: "Tramo 3", desde: 50, hasta: 70, factor: 0.135, rebaja: 4.49 },
    { tramo: "Tramo 4", desde: 70, hasta: 90, factor: 0.23, rebaja: 11.14 },
    { tramo: "Tramo 5", desde: 90, hasta: 120, factor: 0.304, rebaja: 17.8 },
    { tramo: "Tramo 6", desde: 120, hasta: 310, factor: 0.35, rebaja: 23.32 },
    { tramo: "Tramo 7", desde: 310, hasta: Infinity, factor: 0.4, rebaja: 38.82 }
];

// Historical data for UF, UTM, and Minimum Wage in Chile, with projection to Sep 2025.
export const initialEconomicIndicators: Omit<EconomicIndicator, 'id'>[] = [
    // 2023
    { year: 2023, month: 1, uf: 35284.1, utm: 61769, minWage: 410000 },
    { year: 2023, month: 2, uf: 35384.81, utm: 61954, minWage: 410000 },
    { year: 2023, month: 3, uf: 35606.32, utm: 62450, minWage: 410000 },
    { year: 2023, month: 4, uf: 35835.43, utm: 63059, minWage: 410000 },
    { year: 2023, month: 5, uf: 35911.2, utm: 63199, minWage: 440000 },
    { year: 2023, month: 6, uf: 36006.18, utm: 63263, minWage: 440000 },
    { year: 2023, month: 7, uf: 36052.7, utm: 63452, minWage: 440000 },
    { year: 2023, month: 8, uf: 36130.68, utm: 63515, minWage: 440000 },
    { year: 2023, month: 9, uf: 36294.61, utm: 63961, minWage: 460000 },
    { year: 2023, month: 10, uf: 36341.38, utm: 64114, minWage: 460000 },
    { year: 2023, month: 11, uf: 36561.4, utm: 64216, minWage: 460000 },
    { year: 2023, month: 12, uf: 36785.49, utm: 64343, minWage: 460000 },

    // 2024
    { year: 2024, month: 1, uf: 37033.48, utm: 64666, minWage: 460000 },
    { year: 2024, month: 2, uf: 37072.1, utm: 64793, minWage: 460000 },
    { year: 2024, month: 3, uf: 37248.06, utm: 65182, minWage: 460000 },
    { year: 2024, month: 4, uf: 37338.45, utm: 65443, minWage: 460000 },
    { year: 2024, month: 5, uf: 37476.53, utm: 65770, minWage: 460000 },
    { year: 2024, month: 6, uf: 37482.52, utm: 65770, minWage: 460000 },
    { year: 2024, month: 7, uf: 37510.99, utm: 66395, minWage: 500000 },
    // Projection Starts
    { year: 2024, month: 8, uf: 37540.0, utm: 66500, minWage: 500000 },
    { year: 2024, month: 9, uf: 37570.0, utm: 66600, minWage: 500000 },
    { year: 2024, month: 10, uf: 37600.0, utm: 66700, minWage: 500000 },
    { year: 2024, month: 11, uf: 37630.0, utm: 66800, minWage: 500000 },
    { year: 2024, month: 12, uf: 37660.0, utm: 66900, minWage: 500000 },
    
    // 2025
    { year: 2025, month: 1, uf: 37700.0, utm: 67000, minWage: 500000 },
    { year: 2025, month: 2, uf: 37740.0, utm: 67150, minWage: 500000 },
    { year: 2025, month: 3, uf: 37780.0, utm: 67300, minWage: 500000 },
    { year: 2025, month: 4, uf: 37820.0, utm: 67450, minWage: 500000 },
    { year: 2025, month: 5, uf: 37860.0, utm: 67600, minWage: 500000 },
    { year: 2025, month: 6, uf: 37900.0, utm: 67750, minWage: 500000 },
    { year: 2025, month: 7, uf: 37940.0, utm: 67900, minWage: 500000 },
    { year: 2025, month: 8, uf: 37980.0, utm: 68050, minWage: 500000 },
    { year: 2025, month: 9, uf: 38020.0, utm: 68200, minWage: 500000 },

].map(item => ({
    ...item,
    uta: item.utm * 12,
    gratificationCap: Math.round((4.75 * item.minWage) / 12)
}));
