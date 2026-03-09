import type { AccountType, InstitutionConfig, InstitutionsConfig } from '../../../shared/config/institutions';

export function getInstitutionById(config: InstitutionsConfig, institutionId: string): InstitutionConfig {
    const institution = config.institutions.find((item) => item.id === institutionId);
    if (!institution) {
        throw new Error('Instituição não encontrada');
    }
    return institution;
}

export function resolveInstitutionAccountName(
    config: InstitutionsConfig,
    institutionId: string,
    accountType: AccountType
): string {
    const institution = getInstitutionById(config, institutionId);

    if (!institution.accountTypes.includes(accountType)) {
        throw new Error('Tipo de conta não suportado para a instituição');
    }

    const typeLabel = config.accountTypeLabels[accountType];
    return `${institution.name} ${typeLabel}`;
}
