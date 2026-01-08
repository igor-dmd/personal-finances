import { db } from './index';
import { transactions, installmentGroups } from './schema';
import { eq, isNull } from 'drizzle-orm';

interface InstallmentInfo {
    merchantName: string;
    currentInstallment: number;
    totalInstallments: number;
}

function parseInstallmentFromDescription(description: string): InstallmentInfo | null {
    // Pattern: "Merchant - Parcela 4/10" or "Merchant Parcela 4/10"
    const parcelaPattern = /(.*?)\s*-?\s*Parcela\s+(\d+)\/(\d+)/i;
    const match = description.match(parcelaPattern);

    if (match) {
        return {
            merchantName: match[1].trim(),
            currentInstallment: parseInt(match[2]),
            totalInstallments: parseInt(match[3]),
        };
    }

    return null;
}

async function backfillInstallments() {
    console.log('Starting installment backfill...');

    // Get all transactions without installment group that have "Parcela" in description
    const allTransactions = await db
        .select()
        .from(transactions)
        .where(isNull(transactions.installmentGroupId))
        .all();

    const installmentTransactions = allTransactions.filter(t =>
        t.description.match(/Parcela\s+\d+\/\d+/i)
    );

    console.log(`Found ${installmentTransactions.length} transactions with installment patterns`);

    // Group transactions by merchant + total installments
    const groupMap = new Map<string, typeof installmentTransactions>();

    for (const txn of installmentTransactions) {
        const info = parseInstallmentFromDescription(txn.description);
        if (!info) continue;

        const key = `${info.merchantName}|${info.totalInstallments}`;
        if (!groupMap.has(key)) {
            groupMap.set(key, []);
        }
        groupMap.get(key)!.push(txn);
    }

    console.log(`Found ${groupMap.size} unique installment groups`);

    let groupsCreated = 0;
    let transactionsUpdated = 0;

    // Create installment groups and link transactions
    for (const [key, txns] of groupMap) {
        const [merchantName, totalInstallmentsStr] = key.split('|');
        const totalInstallments = parseInt(totalInstallmentsStr);

        // Calculate total amount from all transactions in this group
        const totalAmount = Math.abs(txns.reduce((sum, t) => sum + t.amount, 0));

        // Create installment group
        const group = await db
            .insert(installmentGroups)
            .values({
                description: merchantName,
                totalInstallments,
                totalAmount,
            })
            .returning()
            .get();

        groupsCreated++;
        console.log(`Created group "${merchantName}" with ${totalInstallments} installments (R$ ${totalAmount.toFixed(2)})`);

        // Update transactions with group ID and installment number
        for (const txn of txns) {
            const info = parseInstallmentFromDescription(txn.description);
            if (!info) continue;

            await db
                .update(transactions)
                .set({
                    installmentGroupId: group.id,
                    installmentNumber: info.currentInstallment,
                })
                .where(eq(transactions.id, txn.id))
                .run();

            transactionsUpdated++;
        }
    }

    console.log(`\nBackfill complete!`);
    console.log(`- Groups created: ${groupsCreated}`);
    console.log(`- Transactions updated: ${transactionsUpdated}`);
}

// Run backfill
backfillInstallments()
    .then(() => {
        console.log('Done');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Backfill failed:', error);
        process.exit(1);
    });
