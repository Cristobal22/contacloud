
import type { FirebaseFirestore } from 'firebase-admin/firestore';
import type { Employee, Payroll, EconomicIndicator, AfpEntity, HealthEntity, FamilyAllowanceParameter, TaxParameter, TaxableCap, Bono, PayrollEarningItem, PayrollDiscountItem } from '@/lib/types';

// --- Utility Functions ---
function isNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value);
}

function normalizeDate(dateInput: any): Date | null {
    if (!dateInput) return null;
    if (typeof dateInput === 'object' && dateInput !== null && isNumber(dateInput.seconds) && isNumber(dateInput.nanoseconds)) {
        return new Date(dateInput.seconds * 1000);
    }
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return null;
}

// --- Data Fetching Functions ---
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

async function getFamilyAllowanceBracket(firestore: FirebaseFirestore.Firestore, taxableIncome: number, year: number, month: number): Promise<FamilyAllowanceParameter | null> {
    const query = firestore.collection('family-allowance-parameters')
        .where('year', '==', year)
        .where('month', '==', month)
        .where('desde', '<=', taxableIncome)
        .orderBy('desde', 'desc')
        .limit(1);
    const snapshot = await query.get();
    if (snapshot.empty) return null;
    const param = snapshot.docs[0].data() as FamilyAllowanceParameter;
    return param.hasta >= taxableIncome ? param : null;
}

async function getIUT(firestore: FirebaseFirestore.Firestore, taxableIncomeInCLP: number, utm: number): Promise<{ iut: number, factor: number, rebaja: number }> {
    if (taxableIncomeInCLP <= 0 || isNaN(taxableIncomeInCLP)) return { iut: 0, factor: 0, rebaja: 0 };
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

// --- Main Payroll Logic (Granular) ---

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

    const earnings: PayrollEarningItem[] = [];
    const discounts: PayrollDiscountItem[] = [];

    const indicator = await getEconomicIndicator(firestore, year, month);
    if (!indicator || !isNumber(indicator.uf) || !isNumber(indicator.utm) || !isNumber(indicator.gratificationCap)) throw new Error(`Faltan indicadores económicos o están incompletos para ${month}/${year}.`);

    const caps = await getTaxableCaps(firestore, year);
    if (!caps || !isNumber(caps.afpCap) || !isNumber(caps.afcCap)) throw new Error(`Faltan topes imponibles o están incompletos para el año ${year}.`);

    const afpEntity = employee.afp ? await getAfpEntity(firestore, employee.afp, year, month) : null;
    const healthEntity = employee.healthSystem ? await getHealthEntity(firestore, employee.healthSystem, year, month) : null;

    const baseSalary = employee.baseSalary || 0;
    const periodStartDate = new Date(year, month - 1, 1);
    const periodEndDate = new Date(year, month, 0);
    const contractStartDate = normalizeDate(employee.contractStartDate);
    const contractEndDate = normalizeDate(employee.contractEndDate);

    if (!contractStartDate) throw new Error("El empleado no tiene una fecha de inicio de contrato válida.");

    let effectiveStartDate = periodStartDate > contractStartDate ? periodStartDate : contractStartDate;
    let effectiveEndDate = periodEndDate;
    if (contractEndDate && contractEndDate < periodEndDate) effectiveEndDate = contractEndDate;
    
    let calculatedWorkedDays = (effectiveEndDate.getTime() - effectiveStartDate.getTime()) / (1000 * 3600 * 24) + 1;
    if (calculatedWorkedDays < 0) calculatedWorkedDays = 0;
    if (calculatedWorkedDays > 30) calculatedWorkedDays = 30;
    if (new Date(year, month - 1, 1).getMonth() === 1 && calculatedWorkedDays >= 28) calculatedWorkedDays = 30;

    const absentDays = isNumber(absentDaysOverride) ? absentDaysOverride : 0;
    const workedDays = isNumber(workedDaysOverride) ? workedDaysOverride : calculatedWorkedDays - absentDays;
    const proportionalFactor = workedDays / 30;

    const proportionalBaseSalary = baseSalary * proportionalFactor;
    if (proportionalBaseSalary > 0) {
        earnings.push({ type: 'taxable', name: 'Sueldo Base Proporcional', amount: proportionalBaseSalary, calculationDetail: `${workedDays.toFixed(2)} / 30 días` });
    }

    let gratification = 0;
    if (employee.gratificationType === 'Tope Legal') {
        const monthlyGratificationCap = indicator.gratificationCap / 12;
        const calculatedGratification = proportionalBaseSalary * 0.25;
        gratification = Math.min(calculatedGratification, monthlyGratificationCap);
    } else if (employee.gratificationType === 'Automatico') {
        gratification = proportionalBaseSalary * 0.25;
    }
    if (gratification > 0) earnings.push({ type: 'taxable', name: 'Gratificación Legal', amount: gratification });

    const dailySalary = baseSalary / 30;
    const hourlyRate = (dailySalary * (employee.weeklyHours || 45)) / 45;
    const overtime50 = hourlyRate * 1.5 * (overtimeHours50Override || 0);
    const overtime100 = hourlyRate * 2 * (overtimeHours100Override || 0);
    if (overtime50 > 0) earnings.push({ type: 'taxable', name: 'Horas Extra (50%)', amount: overtime50, calculationDetail: `${overtimeHours50Override} horas` });
    if (overtime100 > 0) earnings.push({ type: 'taxable', name: 'Horas Extra (100%)', amount: overtime100, calculationDetail: `${overtimeHours100Override} horas` });

    (variableBonosOverride || []).forEach(bono => {
        if (bono.monto > 0) earnings.push({ type: bono.tipo === 'variable' ? 'taxable' : 'non-taxable', name: bono.glosa, amount: bono.monto });
    });
    (employee.bonosFijos || []).forEach(bono => {
        if (bono.monto > 0) earnings.push({ type: bono.tipo === 'fijo' ? 'taxable' : 'non-taxable', name: bono.glosa, amount: bono.monto * proportionalFactor });
    });

    const mobilization = (employee.mobilization || 0) * proportionalFactor;
    if (mobilization > 0) earnings.push({ type: 'non-taxable', name: 'Movilización', amount: mobilization });
    const collation = (employee.collation || 0) * proportionalFactor;
    if (collation > 0) earnings.push({ type: 'non-taxable', name: 'Colación', amount: collation });
    
    const taxableEarnings = earnings.filter(e => e.type === 'taxable').reduce((sum, e) => sum + e.amount, 0);

    let familyAllowanceAmount = 0;
    if (employee.hasFamilyAllowance && employee.familyDependents && employee.familyDependents > 0) {
        const allowanceBracket = await getFamilyAllowanceBracket(firestore, taxableEarnings, year, month);
        if (allowanceBracket) {
            familyAllowanceAmount = allowanceBracket.monto * employee.familyDependents;
            if (familyAllowanceAmount > 0) earnings.push({ type: 'non-taxable', name: 'Asignación Familiar', amount: familyAllowanceAmount, calculationDetail: `${employee.familyDependents} cargas, tramo ${allowanceBracket.tramo}` });
        }
    }

    const nonTaxableEarnings = earnings.filter(e => e.type === 'non-taxable').reduce((sum, e) => sum + e.amount, 0);
    const totalEarnings = taxableEarnings + nonTaxableEarnings;
    const taxableCap = caps.afpCap * indicator.uf;
    const afcCap = caps.afcCap * indicator.uf;

    const afpTaxableBase = Math.min(taxableEarnings, taxableCap);
    let afpDiscount = 0;
    if (afpEntity && afpEntity.mandatoryContribution > 0) {
        afpDiscount = Math.round(afpTaxableBase * (afpEntity.mandatoryContribution / 100));
        if (afpDiscount > 0) discounts.push({ type: 'previsional', name: 'Cotización Obligatoria AFP', amount: afpDiscount, calculationDetail: `${afpEntity.name} ${afpEntity.mandatoryContribution}%` });
    }

    const healthTaxableBase = Math.min(taxableEarnings, taxableCap);
    let healthDiscount = 0;
    if (healthEntity) {
        const legalMinDiscount = Math.round(healthTaxableBase * 0.07);
        let pactadoDiscount = legalMinDiscount;
        if (employee.healthContributionType === 'Monto Fijo' && employee.healthPlanAmount) {
            pactadoDiscount = Math.round(employee.healthPlanAmount * indicator.uf);
        } else if (employee.healthContributionType === 'Porcentaje' && employee.healthContributionValue) {
            pactadoDiscount = Math.round(healthTaxableBase * (employee.healthContributionValue / 100));
        }
        healthDiscount = Math.max(legalMinDiscount, pactadoDiscount);
        if (healthDiscount > 0) discounts.push({ type: 'previsional', name: 'Cotización Salud', amount: healthDiscount, calculationDetail: `${healthEntity.name}` });
    }
    
    let unemploymentInsuranceDiscount = 0;
    const afcTaxableBase = Math.min(taxableEarnings, afcCap);
    if (employee.hasUnemploymentInsurance && employee.unemploymentInsuranceType) {
        let rate = 0;
        if (employee.unemploymentInsuranceType === 'Indefinido') rate = 0.006;
        if (employee.unemploymentInsuranceType === 'Plazo Fijo') rate = 0; // Employer only
        if (employee.unemploymentInsuranceType === 'Trabajador de Casa Particular') rate = 0; // Employer only

        unemploymentInsuranceDiscount = Math.round(afcTaxableBase * rate);
        if (unemploymentInsuranceDiscount > 0) discounts.push({ type: 'previsional', name: 'Seguro de Cesantía', amount: unemploymentInsuranceDiscount, calculationDetail: '0.6% Contrato Indefinido' });
    }

    const apvDiscount = (employee.apvRegime === 'B' && isNumber(employee.apvAmount)) ? employee.apvAmount : 0;
    if (apvDiscount > 0) discounts.push({ type: 'previsional', name: 'APV Régimen B', amount: apvDiscount, calculationDetail: employee.apvInstitution });
    
    const totalPrevisionalDiscounts = afpDiscount + healthDiscount + unemploymentInsuranceDiscount + apvDiscount;
    const taxableBaseForIUT = taxableEarnings - totalPrevisionalDiscounts;
    const { iut } = await getIUT(firestore, taxableBaseForIUT, indicator.utm);
    if (iut > 0) discounts.push({ type: 'tax', name: 'Impuesto Único a la Renta', amount: iut });

    const apvRegimeADiscount = (employee.apvRegime === 'A' && isNumber(employee.apvAmount)) ? employee.apvAmount : 0;
    if (apvRegimeADiscount > 0) discounts.push({ type: 'other', name: 'APV Régimen A', amount: apvRegimeADiscount, calculationDetail: employee.apvInstitution });
    const advances = advancesOverride || 0;
    if (advances > 0) discounts.push({ type: 'other', name: 'Anticipo', amount: advances });
    
    const totalDiscounts = discounts.reduce((sum, d) => sum + d.amount, 0);
    const netSalary = totalEarnings - totalDiscounts;

    // FIX: Add baseSalary to the returned payroll object
    return {
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        year, month,
        
        baseSalary: baseSalary, // <-- Ensure base salary is included
        workedDays, 
        absentDays,
        
        earnings: earnings.map(e => ({...e, amount: Math.round(e.amount)})),
        discounts: discounts.map(d => ({...d, amount: Math.round(d.amount)})),

        taxableEarnings: Math.round(taxableEarnings),
        nonTaxableEarnings: Math.round(nonTaxableEarnings),
        totalEarnings: Math.round(totalEarnings),
        totalDiscounts: Math.round(totalDiscounts),
        netSalary: Math.round(netSalary),
        
        afpDiscount: Math.round(afpDiscount),
        healthDiscount: Math.round(healthDiscount),
        unemploymentInsuranceDiscount: Math.round(unemploymentInsuranceDiscount),
        familyAllowance: Math.round(familyAllowanceAmount),
        iut: Math.round(iut),
        advances: Math.round(advances),
        afpTaxableBase: Math.round(afpTaxableBase),
        healthTaxableBase: Math.round(healthTaxableBase),
        unemploymentInsuranceTaxableBase: Math.round(afcTaxableBase),
    } as Partial<Payroll>;
}
