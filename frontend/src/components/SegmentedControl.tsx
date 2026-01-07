interface SegmentOption<T extends string> {
    value: T;
    label: string;
}

interface SegmentedControlProps<T extends string> {
    options: SegmentOption<T>[];
    value: T;
    onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
    options,
    value,
    onChange
}: SegmentedControlProps<T>) {
    return (
        <div className="bg-slate-100 p-1 rounded-lg inline-flex gap-1">
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`
                        px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                        ${value === option.value
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'}
                    `}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
