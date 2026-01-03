import React from 'react';

export interface Category {
    id: number;
    name: string;
    parentId: number | null;
}

interface CategoryComboboxProps {
    categories: Category[];
    selectedCategoryId: number | null;
    onSelect: (categoryId: number | null) => void;
    disabled?: boolean;
    autoFocus?: boolean;
}

interface Option {
    id: number | null;
    name: string;
}

export const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
    categories,
    selectedCategoryId,
    onSelect,
    disabled = false,
    autoFocus = false,
}) => {
    const [inputValue, setInputValue] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);
    const [highlightedIndex, setHighlightedIndex] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Build options list: "Uncategorized" first, then filtered categories
    const filteredOptions: Option[] = React.useMemo(() => {
        const uncategorized: Option = { id: null, name: 'Uncategorized' };
        const filtered = inputValue
            ? categories.filter(c =>
                c.name.toLowerCase().includes(inputValue.toLowerCase()))
            : categories;
        return [uncategorized, ...filtered.map(c => ({ id: c.id, name: c.name }))];
    }, [categories, inputValue]);

    // Sync input value when selection changes
    React.useEffect(() => {
        const selected = categories.find(c => c.id === selectedCategoryId);
        setInputValue(selected?.name || '');
    }, [selectedCategoryId, categories]);

    // Click outside handler
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                // Reset input to selected value
                const selected = categories.find(c => c.id === selectedCategoryId);
                setInputValue(selected?.name || '');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedCategoryId, categories]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) setIsOpen(true);
                setHighlightedIndex(i =>
                    Math.min(i + 1, filteredOptions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (isOpen && filteredOptions[highlightedIndex]) {
                    onSelect(filteredOptions[highlightedIndex].id);
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                const selected = categories.find(c => c.id === selectedCategoryId);
                setInputValue(selected?.name || '');
                break;
        }
    };

    const handleSelectOption = (option: Option) => {
        onSelect(option.id);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    if (!isOpen) setIsOpen(true);
                    setHighlightedIndex(0);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                autoFocus={autoFocus}
                placeholder="Search categories..."
                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full disabled:bg-slate-100 disabled:cursor-not-allowed"
            />

            {isOpen && !disabled && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-400 italic">
                            No categories found
                        </div>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <div
                                key={option.id ?? 'uncategorized'}
                                onClick={() => handleSelectOption(option)}
                                className={`px-3 py-2 text-sm cursor-pointer ${
                                    index === highlightedIndex
                                        ? 'bg-blue-100'
                                        : 'hover:bg-slate-100'
                                } ${option.id === null ? 'text-slate-400 italic' : ''}`}
                            >
                                {option.name}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
