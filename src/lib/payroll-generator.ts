
import type { FirebaseFirestore } from 'firebase-admin/firestore';
import type { Employee, Payroll, EconomicIndicator, AfpEntity, HealthEntity, FamilyAllowanceParameter, TaxParameter, TaxableCap } from '@/lib/types';

// --- Utility Functions ---
function isNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value);
}

// --- Data Fetching Functions ---

async function getEconomicIndicator(firestore: FirebaseFirestore.Firestore, year: number, month: number): Promise<EconomicIndicator | null> {
    // FIX: Use zero-padded month (YYYY-MM) to match how data is likely saved.
    const id = `${year}-${String(month).padStart(2, '0')}`;
    const doc = await firestore.collection('economic-indicators').doc(id).get();
    return doc.exists ? doc.data() as EconomicIndicator : null;
}

async function getAfpEntity(firestore: FirebaseFirestore.Firestore, name: string, year: number, month: number): Promise<AfpEntity | null> {
    const snapshot = await firestore.collection('afp-entities')
        .where('name', '==', name)
        .where('year', '==', year)
        .where('month', '==', month)
        .limit(1).get();
    return snapshot.empty ? null : snapshot.docs[0].data() as AfpEntity;
}

async function getHealthEntity(firestore: FirebaseFirestore.Firestore, name: string, year: number, month: number): Promise<HealthEntity | null> {
    const snapshot = await firestore.collection('health-entities')
        .where('name', '==', name)
        .where('year', '==', year)
        .where('month', '==', month)
        .limit(1).get();
    return snapshot.empty ? null : snapshot.docs[0].data() as HealthEntity;
}

async function getTaxableCaps(firestore: FirebaseFirestore.Firestore, year: number): Promise<TaxableCap | null> {
    const doc = await firestore.collection('taxable-caps').doc(String(year)).get();
    return doc.exists ? doc.data() as TaxableCap : null;
}

async function getFamilyAllowance(firestore: FirebaseFirestore.Firestore, taxableIncome: number, year: number, month: number, bracket?: 'A' | 'B' | 'C' | 'D'): Promise<number> {
    let query = firestore.collection('family-allowance-parameters')
        .where('year', '==', year)
        .where('month', '==', month);

    if (bracket) {
        query = query.where('tramo', '==', bracket);
    } else {
        query = query.where('desde', '<=', taxableIncome).orderBy('desde', 'desc');
    }

    const snapshot = await query.limit(1).get();
    if (snapshot.empty) return 0;
    const param = snapshot.docs[0].data() as FamilyAllowanceParameter;

    if (bracket) {
        return param.monto;
    }
    
    return param.hasta >= taxableIncome ? param.monto : 0;
}

async function getIUT(firestore: FirebaseFirestore.Firestore, taxableIncomeInCLP: number, utm: number): Promise<{ iut: number, factor: number, rebaja: number }> {
    if (taxableIncomeInCLP <= 0) return { iut: 0, factor: 0, rebaja: 0 };

    const taxableIncomeInUTM = taxableIncomeInCLP / utm;
    const snapshot = await firestore.collection('tax-parameters')
        .where('desdeUTM', '<=', taxableIncomeInUTM)
        .orderBy('desdeUTM', 'desc')
        .limit(1).get();

    if (snapshot.empty) return { iut: 0, factor: 0, rebaja: 0 };
    
    const param = snapshot.docs[0].data() as TaxParameter;

    // FINAL FIX: Validate the data coming from the database before using it.
    if (!isNumber(param.factor) || !isNumber(param.rebajaUTM)) {
        throw new Error(`Parámetros de impuesto (factor/rebaja) están corruptos o incompletos para el tramo que inicia en ${param.desdeUTM} UTM.`);
    }

    if (!param.hastaUTM || taxableIncomeInUTM <= param.hastaUTM) {
        const iutInUTM = (taxableIncomeInUTM * param.factor) - param.rebajaUTM;
        const iutInCLP = Math.round(iutInUTM * utm);
        return { iut: iutInCLP > 0 ? iutInCLP : 0, factor: param.factor, rebaja: param.rebajaUTM * utm };
    }

    return { iut: 0, factor: 0, rebaja: 0 };
}


// --- Main Payroll Logic ---

export async function generatePayroll(firestore: FirebaseFirestore.Firestore, employee: Employee, year: number, month: number, otherTaxableEarnings: number = 0, otherDiscounts: number = 0): Promise<Partial<Payroll>> {
    
    // 1. Fetch and VALIDATE external data
    const indicator = await getEconomicIndicator(firestore, year, month);
    if (!indicator) throw new Error(`Faltan indicadores económicos para ${month}/${year}.`);
    if (!isNumber(indicator.uf) || !isNumber(indicator.utm) || !isNumber(indicator.gratificationCap)) {
        throw new Error(`Indicadores para ${month}/${year} están incompletos (UF, UTM o Tope Gratificación).`);
    }
    
    const caps = await getTaxableCaps(firestore, year);
    if (!caps) throw new Error(`Faltan topes imponibles para el año ${year}.`);
    if (!isNumber(caps.afpCap) || !isNumber(caps.afcCap)) {
        throw new Error(`Topes imponibles para ${year} están incompletos (afpCap o afcCap).`);
    }

    const afpEntity = employee.afp ? await getAfpEntity(firestore, employee.afp, year, month) : null;
    const healthEntity = employee.healthSystem ? await getHealthEntity(firestore, employee.healthSystem, year, month) : null;

    // 2. Calculate Taxable Earnings
    const baseSalary = employee.baseSalary || 0;

    let gratification = 0;
    if (employee.gratificationType === 'Tope Legal') {
        const monthlyGratificationCap = indicator.gratificationCap / 12;
        const calculatedGratification = baseSalary * 0.25;
        gratification = Math.min(calculatedGratification, monthlyGratificationCap);
    } else if (employee.gratificationType === 'Automatico') {
        gratification = baseSalary * 0.25;
    }

    const totalTaxableEarnings = baseSalary + gratification + otherTaxableEarnings;
    const taxableCap = caps.afpCap * indicator.uf;
    const afcCap = caps.afcCap * indicator.uf;
    const taxableBaseForCaps = Math.min(totalTaxableEarnings, taxableCap);

    // 3. Calculate Non-Taxable Earnings
    const mobilization = employee.mobilization || 0;
    const collation = employee.collation || 0;
    let familyAllowanceAmount = 0;
    if (employee.hasFamilyAllowance && employee.familyDependents && employee.familyDependents > 0) {
        familyAllowanceAmount = await getFamilyAllowance(firestore, taxableBaseForCaps, year, month, employee.familyAllowanceBracket) * employee.familyDependents;
    }
    const totalNonTaxableEarnings = mobilization + collation + familyAllowanceAmount;
    
    // 4. Calculate Previsional Discounts
    let afpDiscount = 0;
    if (afpEntity && !employee.isPensioner) {
        if (!isNumber(afpEntity.mandatoryContribution)) {
            throw new Error(`La AFP '${employee.afp}' no tiene una tasa de cotización válida para ${month}/${year}.`);
        }
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

    // 5. Calculate Taxable Base for IUT
    const apvDiscount = (employee.apvRegime === 'B' && isNumber(employee.apvAmount)) ? employee.apvAmount : 0;
    const totalPrevisionalDiscounts = afpDiscount + healthDiscount + unemploymentInsuranceDiscount + apvDiscount;
    const taxableBaseForIUT = totalTaxableEarnings - totalPrevisionalDiscounts;

    // 6. Calculate IUT
    const { iut, factor, rebaja } = await getIUT(firestore, taxableBaseForIUT, indicator.utm);
    
    // 7. Calculate Totals
    const otherFinalDiscounts = (employee.apvRegime === 'A' && isNumber(employee.apvAmount) ? employee.apvAmount : 0) + otherDiscounts;
    const totalEarnings = totalTaxableEarnings + totalNonTaxableEarnings;
    const totalDiscounts = totalPrevisionalDiscounts + iut + otherFinalDiscounts;
    const netSalary = totalEarnings - totalDiscounts;

    // 8. Build Payroll Object
    return {
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        period: `${String(month).padStart(2, '0')}-${year}`,
        year, month, baseSalary,
        gratification: Math.round(gratification),
        taxableEarnings: Math.round(totalTaxableEarnings),
        nonTaxableEarnings: Math.round(totalNonTaxableEarnings),
        totalEarnings: Math.round(totalEarnings),
        afpDiscount, healthDiscount, unemploymentInsuranceDiscount, iut,
        otherDiscounts: Math.round(otherFinalDiscounts),
        totalDiscounts: Math.round(totalDiscounts),
        netSalary: Math.round(netSalary),
    };
}
