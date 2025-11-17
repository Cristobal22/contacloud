import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/firebase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== 'POST') {
            res.setHeader('Allow', ['POST']);
            return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
        }

        if (!db) {
            console.error("FATAL in API: Firebase Admin SDK is not initialized.");
            return res.status(500).json({ error: "Server configuration error: Firebase Admin is not initialized." });
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
                // --- READ PHASE --- 
                // All reads must happen before any writes.
                const payrollsRef = db.collection(`companies/${companyId}/payrolls`);
                const payrollsQuery = payrollsRef.where('period', '==', periodDate);
                const payrollsSnap = await transaction.get(payrollsQuery);

                const vouchersRef = db.collection(`companies/${companyId}/vouchers`);
                const voucherQuery = vouchersRef.where('glosa', '==', expectedGlosa);
                const voucherSnap = await transaction.get(voucherQuery);

                // --- WRITE PHASE ---
                // Now, perform all deletions.
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
            // Make sure to expose the specific Firestore error message to the client.
            return res.status(500).json({ error: `Database transaction failed: ${message}` });
        }

        return res.status(200).json({ message: 'Centralization undone successfully.' });

    } catch (e) {
        console.error("An unexpected top-level error occurred in the undo-centralization API:", e);
        const message = e instanceof Error ? e.message : "An unknown and critical server error occurred.";
        return res.status(500).json({ error: `A critical server error occurred: ${message}` });
    }
}
