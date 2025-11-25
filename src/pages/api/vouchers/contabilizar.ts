
import { NextApiRequest, NextApiResponse } from 'next';
import { initializeFirebaseAdmin } from '@/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        const db = initializeFirebaseAdmin();

        const { companyId, voucherId } = req.body;
        if (!companyId || !voucherId) {
            return res.status(400).json({ error: 'Missing required fields: companyId or voucherId.' });
        }

        const voucherRef = db.doc(`companies/${companyId}/vouchers/${voucherId}`);
        const voucherSnap = await voucherRef.get();

        if (!voucherSnap.exists) {
            return res.status(404).json({ error: 'Voucher not found.' });
        }

        const voucherData = voucherSnap.data();
        if (!voucherData) {
            return res.status(404).json({ error: 'Voucher data could not be read.' });
        }

        // --- Business Logic Validation ---
        
        // 1. Check if the voucher is already accounted for.
        if (voucherData.status !== 'Borrador') {
            return res.status(403).json({ error: `Only vouchers with status \'Borrador\' can be accounted for. Current status: ${voucherData.status}.` });
        }

        // 2. Check if the voucher is balanced.
        const totalDebits = voucherData.entries.reduce((sum: number, entry: any) => sum + Number(entry.debit || 0), 0);
        const totalCredits = voucherData.entries.reduce((sum: number, entry: any) => sum + Number(entry.credit || 0), 0);

        if (Math.round(totalDebits) !== Math.round(totalCredits)) {
            return res.status(400).json({ error: 'Voucher is not balanced. Debits and Credits must be equal.' });
        }

        if (totalDebits === 0) {
            return res.status(400).json({ error: 'Voucher totals cannot be zero.' });
        }
        
        // --- Update the voucher status ---
        await voucherRef.update({
            status: 'Contabilizado',
            accountedAt: FieldValue.serverTimestamp(), // Add a timestamp for when it was accounted
        });

        return res.status(200).json({ message: 'Voucher successfully accounted for.' });

    } catch (e) {
        console.error("An unexpected error occurred in the voucher contabilizar API:", e);
        const message = e instanceof Error ? e.message : "An unknown server error occurred.";
        return res.status(500).json({ error: `A critical server error occurred: ${message}` });
    }
}
