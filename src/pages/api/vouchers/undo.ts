
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/firebase/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    if (!db) {
        return res.status(500).json({ error: "Server configuration error: Firebase Admin is not initialized." });
    }

    const { companyId, voucherId } = req.body;
    if (!companyId || !voucherId) {
        return res.status(400).json({ error: 'Missing required fields: companyId or voucherId.' });
    }

    const originalVoucherRef = db.doc(`companies/${companyId}/vouchers/${voucherId}`);
    const newVoucherRef = db.collection(`companies/${companyId}/vouchers`).doc();

    try {
        await db.runTransaction(async (transaction) => {
            const originalVoucherSnap = await transaction.get(originalVoucherRef);

            if (!originalVoucherSnap.exists) {
                throw new Error('Original voucher not found.');
            }

            const originalVoucherData = originalVoucherSnap.data();
            if (!originalVoucherData) {
                throw new Error('Original voucher data could not be read.');
            }

            if (originalVoucherData.status !== 'Contabilizado') {
                throw new Error(`Only vouchers with status 'Contabilizado' can be undone. Current status: ${originalVoucherData.status}.`);
            }
            
            if (originalVoucherData.glosa?.startsWith('Centralización de Remuneraciones')) {
                throw new Error('Centralization vouchers cannot be undone through this method to maintain data integrity.');
            }

            const reversedEntries = originalVoucherData.entries.map((entry: any) => ({
                account: entry.account || '',
                description: entry.description || '',
                debit: entry.credit || 0,
                credit: entry.debit || 0,
            }));

            // --- ROBUST FIX for glosa undefined ---
            let referenceId = originalVoucherData.number;
            if (!referenceId) {
                // Fallback to a slice of the unique voucher ID if number is missing
                referenceId = voucherId.substring(0, 6);
            }

            const reversalVoucherData = {
                companyId: originalVoucherData.companyId,
                date: Timestamp.now(),
                glosa: `Anulación del Comprobante #${referenceId}`,
                entries: reversedEntries,
                status: 'Contabilizado',
                total: originalVoucherData.total || 0,
                type: originalVoucherData.type || 'Traspaso',
                originalVoucherId: voucherId,
                undoneAt: FieldValue.serverTimestamp(),
            };

            // 1. Create the new reversal voucher
            transaction.set(newVoucherRef, reversalVoucherData);

            // 2. Update the original voucher's status to 'Anulado'
            transaction.update(originalVoucherRef, { status: 'Anulado' });
        });

        return res.status(200).json({ 
            message: 'Voucher successfully undone and a reversal voucher has been created.',
            newVoucherId: newVoucherRef.id
        });

    } catch (e) {
        console.error("An unexpected error occurred in the voucher undo API:", e);
        const message = e instanceof Error ? e.message : "An unknown server error occurred.";
        if (message.includes('not found')) {
            return res.status(404).json({ error: message });
        } else if (message.includes('Only vouchers with status') || message.includes('Centralization vouchers cannot be undone')) {
            return res.status(403).json({ error: message });
        }
        return res.status(500).json({ error: `A critical server error occurred: ${message}` });
    }
}
