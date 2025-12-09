import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Sale, Purchase, VatProportionalityRecord } from '@/lib/types';

export async function POST(request: Request) {
    try {
        const db = getAdminFirestore();
        const { companyId, year, month } = await request.json();

        if (!companyId || !year || !month) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const salesQuery = query(
            collection(db, `companies/${companyId}/sales`),
            where('issueDate', '>=', Timestamp.fromDate(startDate)),
            where('issueDate', '<=', Timestamp.fromDate(endDate))
        );

        const purchasesQuery = query(
            collection(db, `companies/${companyId}/purchases`),
            where('issueDate', '>=', Timestamp.fromDate(startDate)),
            where('issueDate', '<=', Timestamp.fromDate(endDate))
        );

        const [salesSnapshot, purchasesSnapshot] = await Promise.all([
            getDocs(salesQuery),
            getDocs(purchasesQuery)
        ]);

        const sales = salesSnapshot.docs.map(doc => doc.data() as Sale);
        const purchases = purchasesSnapshot.docs.map(doc => doc.data() as Purchase);

        // --- Calculation Logic (as before) ---
        const totalVentasAfectas = sales
            .filter(s => s.ivaClassification === 'Afecta')
            .reduce((acc, s) => acc + s.netAmount, 0);
        const totalVentasExentas = sales
            .filter(s => s.ivaClassification === 'Exenta')
            .reduce((acc, s) => acc + s.netAmount, 0);
        const totalVentas = totalVentasAfectas + totalVentasExentas;
        const proportionalityFactor = totalVentas > 0 ? totalVentasAfectas / totalVentas : 0;
        const ivaRecuperable = purchases
            .filter(p => p.ivaClassification === 'Recuperable')
            .reduce((acc, p) => acc + p.taxAmount, 0);
        const ivaUsoComun = purchases
            .filter(p => p.ivaClassification === 'Uso Común')
            .reduce((acc, p) => acc + p.taxAmount, 0);
        const ivaNoRecuperable = purchases
            .filter(p => p.ivaClassification === 'No Recuperable')
            .reduce((acc, p) => acc + p.taxAmount, 0);
        const creditoUsoComunRecuperable = Math.round(ivaUsoComun * proportionalityFactor);
        const totalCreditoFiscal = ivaRecuperable + creditoUsoComunRecuperable;

        const results = {
            totalVentasAfectas,
            totalVentasExentas,
            totalVentas,
            proportionalityFactor,
            ivaRecuperable,
            ivaUsoComun,
            ivaNoRecuperable,
            creditoUsoComunRecuperable,
            totalCreditoFiscal,
        };

        // --- CORRECTED: Save the result to the company's subcollection ---
        const historyRecord: Omit<VatProportionalityRecord, 'id' | 'companyId'> = {
            ...results,
            year,
            month,
            createdAt: serverTimestamp()
        };
        
        const historyCollectionRef = collection(db, `companies/${companyId}/vatProportionalityRecords`);
        await addDoc(historyCollectionRef, historyRecord);
        // --- End of correction ---

        return NextResponse.json(results);

    } catch (error) {
        console.error('[API_VAT_PROPORTIONALITY_ERROR]', error);
        return NextResponse.json({ error: 'An unexpected error occurred on the server.' }, { status: 500 });
    }
}
