import React from 'react';

interface FilterOption {
    value: string | number | null;
    label: string;
}

interface FilterDropdownProps {
    label: string;
    options: FilterOption[];
    value: string | number | null;
    onChange: (value: string | number | null) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, value, onChange }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string | number | null) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium"
            >
                <span className="text-slate-500">{label}:</span>
                <span>{selectedOption?.label || 'Selecionar'}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-2 w-full min-w-[200px] bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={String(option.value)}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                                option.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
