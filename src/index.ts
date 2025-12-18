import { Command } from 'commander';
import * as fs from 'fs';
import { ExtractionProcessor } from './extraction/processor';

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
            console.log(`Processing file: ${filepath} with type: ${type}`);

            if (!fs.existsSync(filepath)) {
                console.error(`File not found: ${filepath}`);
                process.exit(1);
            }

            const content = fs.readFileSync(filepath);
            const processor = new ExtractionProcessor();

            const transactions = await processor.processByType(filepath, content, type);
            console.log('Transactions extracted:', JSON.stringify(transactions, null, 2));

        } catch (error: any) {
            console.error('Error processing file:', error.message);
            process.exit(1);
        }
    });

program.parse(process.argv);

// console.log("Personal Finances App Backend Started"); // Removed or moved to a specific 'start' command if we wanted a server mode.
