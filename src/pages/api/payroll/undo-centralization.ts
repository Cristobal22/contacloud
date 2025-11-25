import { NextApiRequest, NextApiResponse } from 'next';
import { initializeFirebaseAdmin } from '@/firebase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Correctly initialize Firebase and get the db instance.
        const db = initializeFirebaseAdmin();

        if (req.method !== 'POST') {
            res.setHeader('Allow', ['POST']);
            return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
        }

        const { companyId, year, month } = req.body;
        if (!companyId || !year || !month) {
            return res.status(400).json({ error: 'Missing required fields: companyId, year, or month.' });
        }

        let periodDate;
        let expectedGlosa;
        try {
            periodDate = new Date(Date.UTC(parseInt(year as string), parseInt(month as string) - 1, 1));
            const monthName = periodDate.toLocaleString('es-CL', { month: 'long', timeZone: 'UTC' });
            const periodLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
            expectedGlosa = `Centralización de Remuneraciones ${periodLabel}`;
        } catch (dateError) {
            const message = dateError instanceof Error ? dateError.message : "Unknown date processing error";
            return res.status(400).json({ error: `Invalid date parameters: ${message}` });
        }

        try {
            await db.runTransaction(async (transaction) => {
                const payrollsRef = db.collection(`companies/${companyId}/payrolls`);
                const payrollsQuery = payrollsRef.where('period', '==', periodDate);
                const payrollsSnap = await transaction.get(payrollsQuery);

                const vouchersRef = db.collection(`companies/${companyId}/vouchers`);
                const voucherQuery = vouchersRef
                    .where('glosa', '==', expectedGlosa)
                    .where('status', '==', 'Borrador');
                const voucherSnap = await transaction.get(voucherQuery);

                if (!payrollsSnap.empty) {
                    payrollsSnap.forEach(doc => transaction.delete(doc.ref));
                }

                if (!voucherSnap.empty) {
                    voucherSnap.forEach(doc => transaction.delete(doc.ref));
                }
            });
        } catch (transactionError) {
            console.error("Error during Firestore transaction:", transactionError);
            const message = transactionError instanceof Error ? transactionError.message : "Unknown transaction error";
            return res.status(500).json({ error: `Database transaction failed: ${message}` });
        }

        return res.status(200).json({ message: 'Centralization undone successfully. Draft voucher deleted.' });

    } catch (e) {
        console.error("An unexpected top-level error occurred in the undo-centralization API:", e);
        const message = e instanceof Error ? e.message : "An unknown and critical server error occurred.";
        return res.status(500).json({ error: `A critical server error occurred: ${message}` });
    }
}
