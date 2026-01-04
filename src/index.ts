import { Command } from 'commander';
import * as fs from 'fs';
import { ExtractionProcessor } from './extraction/processor';
import { FinanceRepository } from './db/repository';

const program = new Command();

program
    .version('1.0.0')
    .description('Personal Finances CLI');

program
    .command('process-file')
    .argument('<filepath>', 'path to the file to process')
    .argument('<type>', 'type of the file (e.g., nubank-cc-bill-csv)')
    .action(async (filepath, type) => {
        try {
            console.log(`Processando arquivo: ${filepath} com tipo: ${type}`);

            if (!fs.existsSync(filepath)) {
                console.error(`Arquivo não encontrado: ${filepath}`);
                process.exit(1);
            }

            const content = fs.readFileSync(filepath);
            const processor = new ExtractionProcessor();
            const repo = new FinanceRepository();

            console.log('Extraindo transações...');
            const transactions = await processor.processByType(filepath, content, type);
            console.log(`Extraídas ${transactions.length} transações.`);

            console.log('Salvando no banco de dados...');
            // For now, we hardcode the account based on the type or just use a default "Nubank"
            const accountName = 'Nubank Credit Card';
            const account = await repo.getOrCreateAccount(accountName, 'credit_card');

            const job = await repo.createImportJob(filepath, 'pending', type);

            await repo.saveTransactions(transactions, account.id, job.id);
            await repo.updateImportJobStatus(job.id, 'completed');

            console.log('Transações salvas com sucesso.');

        } catch (error: any) {
            console.error('Erro ao processar arquivo:', error.message);
            process.exit(1);
        }
    });

program.parse(process.argv);
