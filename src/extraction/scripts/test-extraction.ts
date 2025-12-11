import { ExtractionProcessor } from '../processor';

async function run() {
    const processor = new ExtractionProcessor();

    // Test CSV
    const csvContent = `Date,Description,Amount
2023-11-01,Salary,5000.00
2023-11-02,Rent,-1500.00`;
    const csvBuffer = Buffer.from(csvContent);

    console.log('Testing CSV Extraction...');
    try {
        const csvTransactions = await processor.process('statement.csv', csvBuffer);
        console.log('CSV Transactions:', csvTransactions);

        if (csvTransactions.length === 2 && csvTransactions[0].amount === 5000) {
            console.log('SUCCESS: CSV Extraction verified.');
        } else {
            console.error('FAILURE: CSV Extraction verification failed.');
        }
    } catch (error) {
        console.error('Error during extraction:', error);
    }
}

run().catch(console.error);
