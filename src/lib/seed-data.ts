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
    { tramo: "1", desde: 0, hasta: 13.5, factor: 0, rebaja: 0 },
    { tramo: "2", desde: 13.5, hasta: 30, factor: 0.04, rebaja: 0.54 },
    { tramo: "3", desde: 30, hasta: 50, factor: 0.08, rebaja: 1.74 },
    { tramo: "4", desde: 50, hasta: 70, factor: 0.135, rebaja: 4.49 },
    { tramo: "5", desde: 70, hasta: 90, factor: 0.23, rebaja: 11.14 },
    { tramo: "6", desde: 90, hasta: 120, factor: 0.304, rebaja: 17.8 },
    { tramo: "7", desde: 120, hasta: 310, factor: 0.35, rebaja: 23.32 },
    { tramo: "8", desde: 310, hasta: Infinity, factor: 0.4, rebaja: 38.82 }
];

// Historical data for UF, UTM, and Minimum Wage in Chile
export const initialEconomicIndicators: Omit<EconomicIndicator, 'id'>[] = [
    // 2024
    { year: 2024, month: 1, uf: 37033.48, utm: 64666, minWage: 460000 },
    { year: 2024, month: 2, uf: 37072.1, utm: 64793, minWage: 460000 },
    { year: 2024, month: 3, uf: 37248.06, utm: 65182, minWage: 460000 },
    { year: 2024, month: 4, uf: 37338.45, utm: 65443, minWage: 460000 },
    { year: 2024, month: 5, uf: 37476.53, utm: 65770, minWage: 460000 },
    { year: 2024, month: 6, uf: 37482.52, utm: 65770, minWage: 460000 }, // June UTM is often same as May
    { year: 2024, month: 7, uf: 37510.99, utm: 66395, minWage: 500000 },

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

    // 2022
    { year: 2022, month: 1, uf: 31278.43, utm: 54442, minWage: 350000 },
    { year: 2022, month: 2, uf: 31538.99, utm: 55537, minWage: 350000 },
    { year: 2022, month: 3, uf: 31802.73, utm: 55704, minWage: 350000 },
    { year: 2022, month: 4, uf: 32174.58, utm: 56739, minWage: 350000 },
    { year: 2022, month: 5, uf: 32630.98, utm: 58774, minWage: 380000 },
    { year: 2022, month: 6, uf: 32997.55, utm: 59577, minWage: 380000 },
    { year: 2022, month: 7, uf: 33405.02, utm: 60183, minWage: 380000 },
    { year: 2022, month: 8, uf: 33835.45, utm: 60853, minWage: 400000 },
    { year: 2022, month: 9, uf: 34170.89, utm: 60853, minWage: 400000 },
    { year: 2022, month: 10, uf: 34493.63, utm: 61157, minWage: 400000 },
    { year: 2022, month: 11, uf: 34789.73, utm: 61460, minWage: 400000 },
    { year: 2022, month: 12, uf: 35111.98, utm: 61624, minWage: 400000 },

    // 2021
    { year: 2021, month: 1, uf: 29215.11, utm: 50973, minWage: 326500 },
    { year: 2021, month: 2, uf: 29272.07, utm: 51228, minWage: 326500 },
    { year: 2021, month: 3, uf: 29332.95, utm: 51592, minWage: 326500 },
    { year: 2021, month: 4, uf: 29432.84, utm: 52365, minWage: 326500 },
    { year: 2021, month: 5, uf: 29522.61, utm: 52365, minWage: 337000 },
    { year: 2021, month: 6, uf: 29578.53, utm: 52629, minWage: 337000 },
    { year: 2021, month: 7, uf: 29643.08, utm: 52893, minWage: 337000 },
    { year: 2021, month: 8, uf: 29752.46, utm: 53158, minWage: 337000 },
    { year: 2021, month: 9, uf: 29899.96, utm: 53422, minWage: 337000 },
    { year: 2021, month: 10, uf: 30107.03, utm: 53703, minWage: 337000 },
    { year: 2021, month: 11, uf: 30514.88, utm: 54171, minWage: 337000 },
    { year: 2021, month: 12, uf: 30991.73, utm: 54442, minWage: 337000 },

    // 2020
    { year: 2020, month: 1, uf: 28309.94, utm: 49673, minWage: 320500 },
    { year: 2020, month: 2, uf: 28416.32, utm: 49922, minWage: 320500 },
    { year: 2020, month: 3, uf: 28551.48, utm: 50021, minWage: 320500 },
    { year: 2020, month: 4, uf: 28622.77, utm: 50322, minWage: 320500 },
    { year: 2020, month: 5, uf: 28654.51, utm: 50322, minWage: 320500 },
    { year: 2020, month: 6, uf: 28669.76, utm: 50322, minWage: 320500 },
    { year: 2020, month: 7, uf: 28678.75, utm: 50322, minWage: 320500 },
    { year: 2020, month: 8, uf: 28723.77, utm: 50322, minWage: 320500 },
    { year: 2020, month: 9, uf: 28796.88, utm: 50322, minWage: 326500 },
    { year: 2020, month: 10, uf: 28913.33, utm: 50679, minWage: 326500 },
    { year: 2020, month: 11, uf: 29013.92, utm: 50973, minWage: 326500 },
    { year: 2020, month: 12, uf: 29074.88, utm: 50973, minWage: 326500 }
].map(item => ({
    ...item,
    uta: item.utm * 12,
    gratificationCap: Math.round((4.75 * item.minWage) / 12)
}));
