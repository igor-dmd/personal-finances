import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type AccountType = 'credit_card' | 'checking' | 'investment';

export interface InstitutionConfig {
    id: string;
    name: string;
    accountTypes: AccountType[];
}

export interface InstitutionsConfig {
    institutions: InstitutionConfig[];
    accountTypeLabels: Record<AccountType, string>;
}

let cachedConfig: InstitutionsConfig | null = null;

export function getInstitutionsConfig(): InstitutionsConfig {
    if (cachedConfig) {
        return cachedConfig;
    }

    const institutionsConfigPath = join(process.cwd(), 'config', 'institutions.json');
    const fileContent = readFileSync(institutionsConfigPath, 'utf-8');
    cachedConfig = JSON.parse(fileContent) as InstitutionsConfig;
    return cachedConfig;
}

