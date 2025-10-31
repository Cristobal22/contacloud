import type { Account, Voucher } from './types';

export interface BalanceRow {
    code: string;
    name: string;
    sumasDebe: number;
    sumasHaber: number;
    saldoDeudor: number;
    saldoAcreedor: number;
    activo: number;
    pasivo: number;
    perdida: number;
    ganancia: number;
}

export interface EightColumnBalanceData {
    rows: BalanceRow[];
    totals: Omit<BalanceRow, 'code' | 'name'>;
    resultadoDelEjercicio: number;
}

export function generateEightColumnBalance(
    accounts: Account[],
    vouchers: Voucher[]
): EightColumnBalanceData {
    const balanceMap = new Map<string, BalanceRow>();

    // 1. Initialize map with all accounts.
    for (const account of accounts) {
        balanceMap.set(account.code, {
            code: account.code,
            name: account.name,
            sumasDebe: 0, sumasHaber: 0, saldoDeudor: 0, saldoAcreedor: 0,
            activo: 0, pasivo: 0, perdida: 0, ganancia: 0,
        });
    }

    // 2. Process vouchers to calculate Debit and Credit sums.
    for (const voucher of vouchers) {
        if (voucher.status !== 'Contabilizado') continue;
        for (const entry of voucher.entries) {
            const row = balanceMap.get(entry.account);
            if (row) {
                row.sumasDebe += entry.debit || 0;
                row.sumasHaber += entry.credit || 0;
            }
        }
    }

    // 3. Determine balances and classify them robustly.
    for (const account of accounts) {
        const row = balanceMap.get(account.code);
        if (row) {
            const balance = row.sumasDebe - row.sumasHaber;
            if (balance > 0) {
                row.saldoDeudor = balance;
            } else if (balance < 0) {
                row.saldoAcreedor = -balance;
            }

            // Robust classification based on account type and balances.
            // This handles "unnatural" balances correctly.
            switch (account.type) {
                case 'Activo':
                    row.activo = row.saldoDeudor - row.saldoAcreedor;
                    break;
                case 'Pasivo':
                case 'Patrimonio':
                    row.pasivo = row.saldoAcreedor - row.saldoDeudor;
                    break;
                case 'Gasto':
                    row.perdida = row.saldoDeudor - row.saldoAcreedor;
                    break;
                case 'Ingreso':
                    row.ganancia = row.saldoAcreedor - row.saldoDeudor;
                    break;
            }
        }
    }

    // 4. Calculate totals for each column.
    const totals: Omit<BalanceRow, 'code' | 'name'> = {
        sumasDebe: 0, sumasHaber: 0, saldoDeudor: 0, saldoAcreedor: 0,
        activo: 0, pasivo: 0, perdida: 0, ganancia: 0,
    };

    const rows = Array.from(balanceMap.values());
    for (const row of rows) {
        totals.sumasDebe += row.sumasDebe;
        totals.sumasHaber += row.sumasHaber;
        totals.saldoDeudor += row.saldoDeudor;
        totals.saldoAcreedor += row.saldoAcreedor;
        totals.activo += row.activo;
        totals.pasivo += row.pasivo;
        totals.perdida += row.perdida;
        totals.ganancia += row.ganancia;
    }

    // 5. Calculate the result for the period.
    const resultadoDelEjercicio = totals.ganancia - totals.perdida;

    return {
        rows: rows.filter(row => row.sumasDebe !== 0 || row.sumasHaber !== 0),
        totals,
        resultadoDelEjercicio,
    };
}
