
import type { FirebaseFirestore } from 'firebase-admin/firestore';
import type { Employee, Payroll, EconomicIndicator, AfpEntity, HealthEntity, FamilyAllowanceParameter, TaxParameter, TaxableCap } from '@/lib/types';

// --- Constantes ---
const SIS_RATE = 0.015; // Tasa del Seguro de Invalidez y Sobrevivencia (ejemplo, verificar valor actual)

// --- Funciones de Obtención de Datos ---

async function getEconomicIndicator(firestore: FirebaseFirestore.Firestore, year: number, month: number): Promise<EconomicIndicator | null> {
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
    const taxableIncomeInUTM = taxableIncomeInCLP / utm;
    const snapshot = await firestore.collection('tax-parameters')
        .where('desdeUTM', '<=', taxableIncomeInUTM)
        .orderBy('desdeUTM', 'desc')
        .limit(1).get();
    if (snapshot.empty) return { iut: 0, factor: 0, rebaja: 0 };
    const param = snapshot.docs[0].data() as TaxParameter;
    if (!param.hastaUTM || taxableIncomeInUTM <= param.hastaUTM) {
        const iutInUTM = (taxableIncomeInUTM * param.factor) - param.rebajaUTM;
        const iutInCLP = Math.round(iutInUTM * utm);
        return { iut: iutInCLP > 0 ? iutInCLP : 0, factor: param.factor, rebaja: param.rebajaUTM * utm };
    }
    return { iut: 0, factor: 0, rebaja: 0 };
}


// --- Lógica Principal de Cálculo ---

export async function generatePayroll(firestore: FirebaseFirestore.Firestore, employee: Employee, year: number, month: number, otherTaxableEarnings: number = 0, otherDiscounts: number = 0): Promise<Partial<Payroll>> {
    
    // 1. Obtener datos externos necesarios
    const indicator = await getEconomicIndicator(firestore, year, month);
    const caps = await getTaxableCaps(firestore, year);
    if (!indicator || !caps || !indicator.uf || !indicator.utm) {
        throw new Error(`Indicadores económicos o topes imponibles no encontrados para ${month}/${year}`);
    }

    const afpEntity = employee.afp ? await getAfpEntity(firestore, employee.afp, year, month) : null;
    const healthEntity = employee.healthSystem ? await getHealthEntity(firestore, employee.healthSystem, year, month) : null;

    // 2. Calcular Haberes Imponibles
    const baseSalary = employee.baseSalary || 0;
    const gratification = employee.gratification || 0;
    const totalTaxableEarnings = baseSalary + gratification + otherTaxableEarnings;
    const taxableCap = caps.afpCap * indicator.uf;
    const afcCap = caps.afcCap * indicator.uf;
    const taxableBaseForCaps = Math.min(totalTaxableEarnings, taxableCap);

    // 3. Calcular Haberes No Imponibles
    const mobilization = employee.mobilization || 0;
    const collation = employee.collation || 0;
    
    let familyAllowanceAmount = 0;
    if (employee.hasFamilyAllowance && employee.familyDependents && employee.familyDependents > 0) {
        const singleAllowance = await getFamilyAllowance(firestore, taxableBaseForCaps, year, month, employee.familyAllowanceBracket);
        familyAllowanceAmount = singleAllowance * employee.familyDependents;
    }

    const totalNonTaxableEarnings = mobilization + collation + familyAllowanceAmount;
    
    // 4. Calcular Descuentos Previsionales
    let afpDiscount = 0;
    let employerAfpContribution = 0; // SIS
    if (afpEntity && !employee.isPensioner) {
        afpDiscount = Math.round(taxableBaseForCaps * (afpEntity.mandatoryContribution / 100));
        employerAfpContribution = Math.round(taxableBaseForCaps * SIS_RATE);
    }
    
    let healthDiscount = 0;
    if (healthEntity) {
        if (employee.healthContributionType === 'Porcentaje') {
            const legalMinimum = Math.round(taxableBaseForCaps * 0.07);
            const pactado = Math.round(taxableBaseForCaps * ((employee.healthContributionValue || 7) / 100));
            healthDiscount = Math.max(legalMinimum, pactado);
        } else { // Monto Fijo en UF
            const pactadoEnCLP = Math.round((employee.healthContributionValue || 0) * indicator.uf);
            healthDiscount = pactadoEnCLP;
        }
    }

    let unemploymentInsuranceDiscount = 0;
    if (employee.hasUnemploymentInsurance) {
        const afcBase = Math.min(totalTaxableEarnings, afcCap);
        if (employee.unemploymentInsuranceType === 'Indefinido') {
            unemploymentInsuranceDiscount = Math.round(afcBase * 0.006);
        } else if (employee.unemploymentInsuranceType === 'Plazo Fijo') {
            unemploymentInsuranceDiscount = 0; // Aporte solo del empleador
        }
    }

    // 5. Calcular Base Tributable para IUT
    const apvDiscount = (employee.apvRegime === 'B' && employee.apvAmount) ? employee.apvAmount : 0;
    const totalPrevisionalDiscounts = afpDiscount + healthDiscount + unemploymentInsuranceDiscount + apvDiscount;
    const taxableBaseForIUT = totalTaxableEarnings - totalPrevisionalDiscounts;

    // 6. Calcular Impuesto Único de Segunda Categoría (IUT)
    const { iut, factor, rebaja } = await getIUT(firestore, taxableBaseForIUT, indicator.utm);
    
    // 7. Calcular Totales
    const totalEarnings = totalTaxableEarnings + totalNonTaxableEarnings;
    const totalDiscounts = totalPrevisionalDiscounts + iut + otherDiscounts + (employee.apvRegime === 'A' ? (employee.apvAmount || 0) : 0);
    const netSalary = totalEarnings - totalDiscounts;

    // 8. Construir objeto de Liquidación
    const payrollData: Partial<Payroll> = {
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        period: `${String(month).padStart(2, '0')}-${year}`,
        year,
        month,
        baseSalary,
        gratification,
        taxableEarnings: totalTaxableEarnings,
        nonTaxableEarnings: totalNonTaxableEarnings,
        totalEarnings,
        afpDiscount,
        healthDiscount,
        unemploymentInsuranceDiscount,
        employerAfpContribution,
        iut,
        otherDiscounts,
        totalDiscounts,
        netSalary,
        iutFactor: factor,
        iutRebajaInCLP: rebaja,
    };
    
    return payrollData;
}
