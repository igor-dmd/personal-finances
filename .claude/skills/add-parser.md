# Add Parser Skill

Creates a new bank statement parser for the extraction system.

## Usage

```
/add-parser <name> <identifier>
```

Example: `/add-parser "Bradesco CSV" bradesco-csv`

## Steps

1. Ask the user for:
   - Parser name (human-readable, e.g., "Bradesco Bank CSV")
   - Identifier (kebab-case, e.g., "bradesco-csv")
   - File format details (columns, date format, amount format)

2. Create the parser file at `src/extraction/parsers/<identifier>.ts`:

```typescript
import { parse } from 'csv-parse/sync';
import { BillParser, TransactionDraft } from '../types';

interface Record {
    // Define columns based on user input
}

export class <ClassName>Parser implements BillParser {
    name = '<Parser Name>';
    identifier = '<identifier>';

    supports(filename: string): boolean {
        return filename.toLowerCase().endsWith('.csv');
    }

    async parse(content: Buffer): Promise<TransactionDraft[]> {
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as Record[];

        return records.map((record) => {
            return {
                date: new Date(record.date),
                amount: parseFloat(record.amount),
                description: record.description,
                originalDescription: record.description,
            };
        });
    }
}
```

3. Register the parser in `src/extraction/processor.ts`:
   - Add import: `import { <ClassName>Parser } from './parsers/<identifier>';`
   - Add to parsers array: `new <ClassName>Parser(),`

4. Create a test fixture file at `tests/functional/fixtures/<identifier>-sample.csv` with example data

5. Inform user to test with: `npx tsx src/index.ts process-file ./tests/functional/fixtures/<identifier>-sample.csv <identifier>`
