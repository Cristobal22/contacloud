import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/firebase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        if (!db) {
            return res.status(500).json({ error: "Server configuration error: Firebase Admin is not initialized." });
        }

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

        // The critical business logic check
        if (voucherData?.status !== 'Borrador') {
            return res.status(403).json({ error: 'Deletion failed: Only vouchers with status \'Borrador\' can be deleted.' });
        }

        // If the status is 'Borrador', proceed with deletion
        await voucherRef.delete();

        return res.status(200).json({ message: 'Voucher successfully deleted.' });

    } catch (e) {
        console.error("An unexpected error occurred in the voucher delete API:", e);
        const message = e instanceof Error ? e.message : "An unknown server error occurred.";
        return res.status(500).json({ error: `A critical server error occurred: ${message}` });
    }
}
