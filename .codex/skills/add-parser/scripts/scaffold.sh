#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  echo "Usage: $0 <identifier-kebab-case> <display-name> [credit_card|checking]" >&2
  exit 1
fi

identifier="$1"
display_name="$2"
transaction_type="${3:-credit_card}"

if [[ ! "$identifier" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Identifier must be kebab-case" >&2
  exit 1
fi

if [[ "$transaction_type" != "credit_card" && "$transaction_type" != "checking" ]]; then
  echo "transaction_type must be credit_card or checking" >&2
  exit 1
fi

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)
cd "$repo_root"

parser_file="src/extraction/parsers/${identifier}.ts"
processor_file="src/extraction/processor.ts"
fixture_file="tests/functional/fixtures/${identifier}-sample.csv"
unit_test_file="tests/unit/${identifier}-parser.test.ts"

if [ -f "$parser_file" ]; then
  echo "Parser file already exists: $parser_file" >&2
  exit 1
fi

class_base=$(echo "$identifier" | awk -F- '{for(i=1;i<=NF;i++) printf toupper(substr($i,1,1)) substr($i,2)}')
class_name="${class_base}Parser"

if [ "$transaction_type" = "credit_card" ]; then
  type_const="TRANSACTION_TYPES.CREDIT_CARD"
else
  type_const="TRANSACTION_TYPES.CHECKING"
fi

cat > "$parser_file" <<PARSER
import { parse } from 'csv-parse/sync';
import { BillParser, TransactionDraft, TRANSACTION_TYPES } from '../types';

export class ${class_name} implements BillParser {
    name = '${display_name}';
    identifier = '${identifier}';
    transactionType = ${type_const};

    supports(filename: string): boolean {
        return filename.toLowerCase().endsWith('.csv');
    }

    async parse(content: Buffer): Promise<TransactionDraft[]> {
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as Array<Record<string, string>>;

        return records.map((record, index) => {
            const rawDate = record.date ?? record.Date;
            const rawAmount = record.amount ?? record.Amount;
            const rawDescription = record.description ?? record.Description;

            if (!rawDate || !rawAmount || !rawDescription) {
                throw new Error(
                    'Missing required columns at row ' + (index + 2) + '. Expected date, amount, description.'
                );
            }

            const date = new Date(rawDate);
            if (Number.isNaN(date.getTime())) {
                throw new Error('Invalid date at row ' + (index + 2) + ': ' + rawDate);
            }

            const normalizedAmount = String(rawAmount).replace(/\./g, '').replace(',', '.');
            const amount = Number(normalizedAmount);
            if (Number.isNaN(amount)) {
                throw new Error('Invalid amount at row ' + (index + 2) + ': ' + rawAmount);
            }

            return {
                date,
                amount,
                description: rawDescription,
                originalDescription: rawDescription,
            };
        });
    }
}
PARSER

import_line="import { ${class_name} } from './parsers/${identifier}';"
parser_line="        new ${class_name}(),"

if ! grep -Fq "$import_line" "$processor_file"; then
  tmp_file=$(mktemp)
  awk -v line="$import_line" '
    /^export class ExtractionProcessor/ && !inserted { print line; inserted=1 }
    { print }
  ' "$processor_file" > "$tmp_file"
  mv "$tmp_file" "$processor_file"
fi

if ! grep -Fq "$parser_line" "$processor_file"; then
  tmp_file=$(mktemp)
  awk -v line="$parser_line" '
    /^[[:space:]]*\];/ && !inserted { print line; inserted=1 }
    { print }
  ' "$processor_file" > "$tmp_file"
  mv "$tmp_file" "$processor_file"
fi

cat > "$fixture_file" <<CSV
date,amount,description
2026-01-01,-10.50,Coffee shop
2026-01-02,1000.00,Salary
CSV

cat > "$unit_test_file" <<TEST
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ${class_name} } from '../../src/extraction/parsers/${identifier}';

describe('${class_name}', () => {
    test('parses fixture file', async () => {
        const parser = new ${class_name}();
        const fixturePath = resolve(process.cwd(), 'tests/functional/fixtures/${identifier}-sample.csv');
        const content = readFileSync(fixturePath);

        const result = await parser.parse(content);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toMatchObject({
            description: expect.any(String),
            amount: expect.any(Number),
        });
    });
});
TEST

echo "Created $parser_file"
echo "Updated $processor_file"
echo "Created $fixture_file"
echo "Created $unit_test_file"
