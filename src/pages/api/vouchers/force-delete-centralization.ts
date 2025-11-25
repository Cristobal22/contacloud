import { NextApiRequest, NextApiResponse } from 'next';
import { initializeFirebaseAdmin } from '@/firebase/server';

// WARNING: This is a special-purpose administrative tool.
// It is designed to delete orphaned payroll centralization vouchers.
// It performs a specific check to ensure only the correct type of voucher is deleted.

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

        // CRITICAL SAFETY CHECK:
        // Only allow deletion if the voucher is specifically a payroll centralization voucher.
        if (!voucherData?.glosa?.startsWith('Centralización de Remuneraciones')) {
            return res.status(403).json({ error: 'Forbidden: This tool can only delete orphaned payroll centralization vouchers.' });
        }

        // If the safety check passes, proceed with deletion.
        await voucherRef.delete();

        return res.status(200).json({ message: 'Orphaned centralization voucher successfully deleted.' });

    } catch (e) {
        console.error("An unexpected error occurred in the force-delete-centralization API:", e);
        const message = e instanceof Error ? e.message : "An unknown server error occurred.";
        return res.status(500).json({ error: `A critical server error occurred: ${message}` });
    }
}
