import React from 'react';

interface AccountTypeIconProps {
    type: 'credit_card' | 'checking' | string;
    className?: string;
}

export const AccountTypeIcon: React.FC<AccountTypeIconProps> = ({ type, className = "h-4 w-4" }) => {
    if (type === 'credit_card') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`${className} text-purple-500`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-label="Cartão de Crédito"
            >
                <title>Cartão de Crédito</title>
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
        );
    }

    if (type === 'checking') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`${className} text-blue-500`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-label="Conta Corrente"
            >
                <title>Conta Corrente</title>
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v1H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
        );
    }

    return null;
};
