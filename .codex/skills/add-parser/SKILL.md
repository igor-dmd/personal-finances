---
name: add-parser
description: Scaffold a new CSV parser for the extraction pipeline, register it in src/extraction/processor.ts, and create starter tests/fixtures.
---

# Add Parser

Use this skill when the user asks to support a new bank statement parser.

## Inputs

- `identifier` in kebab-case, for example `itau-checking-csv`
- `display_name`, for example `Itaú Checking CSV`
- Optional `transaction_type`: `credit_card` or `checking` (default: `credit_card`)

## Steps

1. Run `scripts/scaffold.sh <identifier> <display_name> [transaction_type]`.
2. Confirm these artifacts:
- `src/extraction/parsers/<identifier>.ts`
- `src/extraction/processor.ts`
- `tests/functional/fixtures/<identifier>-sample.csv`
- `tests/unit/<identifier>-parser.test.ts`
3. Ask for format-specific mapping rules and refine parser logic.
4. Run `npm test -- tests/unit/<identifier>-parser.test.ts` when validation is requested.

## Output Contract

Report:
- Parser identifier and transaction type
- Files created/updated
- Remaining parser-specific TODOs (column mapping, locale/date quirks, filtering rules)
