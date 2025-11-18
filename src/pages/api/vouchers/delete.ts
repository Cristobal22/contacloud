
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
        if (!voucherData) {
            return res.status(500).json({ error: 'Voucher data could not be read.' });
        }

        // --- Enhanced Business Logic Check ---
        const status = voucherData.status;
        if (status === 'Contabilizado') {
            return res.status(403).json({ error: 'Deletion failed: An accounted voucher cannot be deleted. Please undo it first to maintain the audit trail.' });
        } else if (status === 'Anulado') {
            return res.status(403).json({ error: 'Deletion failed: An undone voucher cannot be deleted as it is a critical part of the accounting history.' });
        } else if (status !== 'Borrador') {
            // Catch-all for any other statuses
            return res.status(403).json({ error: `Deletion failed: Only vouchers with status 'Borrador' can be deleted. Current status: ${status}.` });
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
