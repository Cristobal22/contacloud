
import type { FirebaseFirestore } from 'firebase-admin/firestore';
import type { Employee, Payroll, EconomicIndicator, AfpEntity, HealthEntity, FamilyAllowanceParameter, TaxParameter, TaxableCap, Bono } from '@/lib/types';

// --- Utility Functions ---
function isNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value);
}

// --- Data Fetching Functions (as before) ---
async function getEconomicIndicator(firestore: FirebaseFirestore.Firestore, year: number, month: number): Promise<EconomicIndicator | null> {
    const id = `${year}-${String(month).padStart(2, '0')}`;
    const doc = await firestore.collection('economic-indicators').doc(id).get();
    return doc.exists ? doc.data() as EconomicIndicator : null;
}

async function getAfpEntity(firestore: FirebaseFirestore.Firestore, name: string, year: number, month: number): Promise<AfpEntity | null> {
    const snapshot = await firestore.collection('afp-entities').where('name', '==', name).where('year', '==', year).where('month', '==', month).limit(1).get();
    return snapshot.empty ? null : snapshot.docs[0].data() as AfpEntity;
}

async function getHealthEntity(firestore: FirebaseFirestore.Firestore, name: string, year: number, month: number): Promise<HealthEntity | null> {
    const snapshot = await firestore.collection('health-entities').where('name', '==', name).where('year', '==', year).where('month', '==', month).limit(1).get();
    return snapshot.empty ? null : snapshot.docs[0].data() as HealthEntity;
}

async function getTaxableCaps(firestore: FirebaseFirestore.Firestore, year: number): Promise<TaxableCap | null> {
    const doc = await firestore.collection('taxable-caps').doc(String(year)).get();
    return doc.exists ? doc.data() as TaxableCap : null;
}

async function getFamilyAllowance(firestore: FirebaseFirestore.Firestore, taxableIncome: number, year: number, month: number, bracket?: 'A' | 'B' | 'C' | 'D'): Promise<number> {
    let query = firestore.collection('family-allowance-parameters').where('year', '==', year).where('month', '==', month);
    if (bracket) {
        query = query.where('tramo', '==', bracket);
    } else {
        query = query.where('desde', '<=', taxableIncome).orderBy('desde', 'desc');
    }
    const snapshot = await query.limit(1).get();
    if (snapshot.empty) return 0;
    const param = snapshot.docs[0].data() as FamilyAllowanceParameter;
    if (bracket) return param.monto;
    return param.hasta >= taxableIncome ? param.monto : 0;
}

async function getIUT(firestore: FirebaseFirestore.Firestore, taxableIncomeInCLP: number, utm: number): Promise<{ iut: number, factor: number, rebaja: number }> {
    if (taxableIncomeInCLP <= 0) return { iut: 0, factor: 0, rebaja: 0 };
    const taxableIncomeInUTM = taxableIncomeInCLP / utm;
    const snapshot = await firestore.collection('tax-parameters').where('desdeUTM', '<=', taxableIncomeInUTM).orderBy('desdeUTM', 'desc').limit(1).get();
    if (snapshot.empty) return { iut: 0, factor: 0, rebaja: 0 };
    const param = snapshot.docs[0].data() as TaxParameter;
    if (!isNumber(param.factor) || !isNumber(param.rebajaUTM)) throw new Error(`Parámetros de impuesto (factor/rebaja) están corruptos.`);
    if (!param.hastaUTM || taxableIncomeInUTM <= param.hastaUTM) {
        const iutInUTM = (taxableIncomeInUTM * param.factor) - param.rebajaUTM;
        const iutInCLP = Math.round(iutInUTM * utm);
        return { iut: iutInCLP > 0 ? iutInCLP : 0, factor: param.factor, rebaja: param.rebajaUTM * utm };
    }
    return { iut: 0, factor: 0, rebaja: 0 };
}

// --- Main Payroll Logic (REWRITTEN) ---

export async function generatePayroll(
    firestore: FirebaseFirestore.Firestore, 
    employee: Employee, 
    year: number, 
    month: number, 
    workedDaysOverride?: number,
    absentDaysOverride?: number,
    overtimeHours50Override?: number,
    overtimeHours100Override?: number,
    variableBonosOverride?: Bono[],
    advancesOverride?: number
): Promise<Partial<Payroll>> {
    
    // 1. Fetch and Validate external data
    const indicator = await getEconomicIndicator(firestore, year, month);
    if (!indicator || !isNumber(indicator.uf) || !isNumber(indicator.utm) || !isNumber(indicator.gratificationCap)) throw new Error(`Faltan indicadores económicos o están incompletos para ${month}/${year}.`);
    
    const caps = await getTaxableCaps(firestore, year);
    if (!caps || !isNumber(caps.afpCap) || !isNumber(caps.afcCap)) throw new Error(`Faltan topes imponibles o están incompletos para el año ${year}.`);

    const afpEntity = employee.afp ? await getAfpEntity(firestore, employee.afp, year, month) : null;
    const healthEntity = employee.healthSystem ? await getHealthEntity(firestore, employee.healthSystem, year, month) : null;

    // 2. Calculate Proportionality and Overrides
    const baseSalary = employee.baseSalary || 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Determine effective worked days. Chilean standard is 30 for monthly salaries.
    // We prioritize workedDaysOverride, then absentDaysOverride, then default to 30.
    const workedDays = isNumber(workedDaysOverride) ? workedDaysOverride : 30 - (isNumber(absentDaysOverride) ? absentDaysOverride : 0);
    const proportionalFactor = workedDays / 30;
    const proportionalBaseSalary = baseSalary * proportionalFactor;

    // 3. Calculate Taxable Earnings
    let gratification = 0;
    if (employee.gratificationType === 'Tope Legal') {
        const monthlyGratificationCap = indicator.gratificationCap / 12;
        const calculatedGratification = proportionalBaseSalary * 0.25;
        gratification = Math.min(calculatedGratification, monthlyGratificationCap);
    } else if (employee.gratificationType === 'Automatico') {
        gratification = proportionalBaseSalary * 0.25;
    }

    // Overtime Calculation (based on 45-hour work week)
    const dailySalary = baseSalary / 30;
    const hourlyRate = (dailySalary * 7) / 45;
    const overtime50 = hourlyRate * 1.5 * (overtimeHours50Override || 0);
    const overtime100 = hourlyRate * 2 * (overtimeHours100Override || 0);

    // Variable Bonos
    let taxableBonos = 0;
    let nonTaxableBonos = 0;
    if (variableBonosOverride) {
        variableBonosOverride.forEach(bono => {
            if (bono.noImponible) {
                nonTaxableBonos += bono.monto;
            } else {
                taxableBonos += bono.monto;
            }
        });
    }

    const totalTaxableEarnings = proportionalBaseSalary + gratification + overtime50 + overtime100 + taxableBonos;
    const taxableCap = caps.afpCap * indicator.uf;
    const afcCap = caps.afcCap * indicator.uf;
    const taxableBaseForCaps = Math.min(totalTaxableEarnings, taxableCap);

    // 4. Calculate Non-Taxable Earnings
    const mobilization = (employee.mobilization || 0) * proportionalFactor;
    const collation = (employee.collation || 0) * proportionalFactor;
    let familyAllowanceAmount = 0;
    if (employee.hasFamilyAllowance && employee.familyDependents && employee.familyDependents > 0) {
        familyAllowanceAmount = await getFamilyAllowance(firestore, taxableBaseForCaps, year, month, employee.familyAllowanceBracket) * employee.familyDependents;
    }
    const totalNonTaxableEarnings = mobilization + collation + familyAllowanceAmount + nonTaxableBonos;
    
    // 5. Calculate Previsional Discounts
    let afpDiscount = 0;
    if (afpEntity && !employee.isPensioner && afpEntity.mandatoryContribution) {
        afpDiscount = Math.round(taxableBaseForCaps * (afpEntity.mandatoryContribution / 100));
    }
    
    const legalHealthMinimum = Math.round(taxableBaseForCaps * 0.07);
    let healthDiscount = legalHealthMinimum;
    if (healthEntity) {
        if (employee.healthContributionType === 'Porcentaje') {
            const pactado = Math.round(taxableBaseForCaps * ((employee.healthContributionValue || 7) / 100));
            healthDiscount = Math.max(legalHealthMinimum, pactado);
        } else { // Monto Fijo en UF
            const pactadoEnCLP = Math.round((employee.healthContributionValue || 0) * indicator.uf);
            healthDiscount = Math.max(legalHealthMinimum, pactadoEnCLP);
        }
    }

    let unemploymentInsuranceDiscount = 0;
    if (employee.contractType === 'Indefinido' && employee.hasUnemploymentInsurance) {
        const afcBase = Math.min(totalTaxableEarnings, afcCap);
        unemploymentInsuranceDiscount = Math.round(afcBase * 0.006);
    }

    // 6. Calculate Taxable Base for IUT
    const apvDiscount = (employee.apvRegime === 'B' && isNumber(employee.apvAmount)) ? employee.apvAmount : 0;
    const totalPrevisionalDiscounts = afpDiscount + healthDiscount + unemploymentInsuranceDiscount + apvDiscount;
    const taxableBaseForIUT = totalTaxableEarnings - totalPrevisionalDiscounts;

    // 7. Calculate IUT
    const { iut } = await getIUT(firestore, taxableBaseForIUT, indicator.utm);
    
    // 8. Calculate Totals
    const otherFinalDiscounts = (employee.apvRegime === 'A' && isNumber(employee.apvAmount) ? employee.apvAmount : 0) + (advancesOverride || 0);
    const totalEarnings = totalTaxableEarnings + totalNonTaxableEarnings;
    const totalDiscounts = totalPrevisionalDiscounts + iut + otherFinalDiscounts;
    const netSalary = totalEarnings - totalDiscounts;

    // 9. Build Payroll Object
    return {
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        period: `${String(month).padStart(2, '0')}-${year}`,
        year, month, 
        baseSalary: Math.round(proportionalBaseSalary),
        workedDays: workedDays,
        absentDays: isNumber(absentDaysOverride) ? absentDaysOverride : (30 - workedDays),
        gratification: Math.round(gratification),
        overtimeHours50: overtimeHours50Override, overtimeHours100: overtimeHours100Override, variableBonos: variableBonosOverride, advances: advancesOverride,
        taxableEarnings: Math.round(totalTaxableEarnings),
        nonTaxableEarnings: Math.round(totalNonTaxableEarnings),
        totalEarnings: Math.round(totalEarnings),
        afpDiscount, healthDiscount, unemploymentInsuranceDiscount, iut,
        otherDiscounts: Math.round(otherFinalDiscounts),
        totalDiscounts: Math.round(totalDiscounts),
        netSalary: Math.round(netSalary),
    };
}
