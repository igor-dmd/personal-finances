import { Command } from 'commander';
import * as fs from 'fs';
import { ProcessImportFileService } from './modules/transactions/application/process-import-file-service';

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
            const processImportFileService = new ProcessImportFileService();

            console.log('Extraindo transações...');
            const result = await processImportFileService.execute({
                fileName: filepath,
                content,
                parserType: type,
            });
            console.log(`Extraídas ${result.count} transações.`);

            console.log('Transações salvas com sucesso.');

        } catch (error: any) {
            console.error('Erro ao processar arquivo:', error.message);
            process.exit(1);
        }
    });

program.parse(process.argv);
