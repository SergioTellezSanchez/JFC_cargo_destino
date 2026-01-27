'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface EditableNumberSelectProps {
    value: number;
    onChange: (value: number) => void;
    options: number[];
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    suffix?: string;
    className?: string; // Wrapper class
}

export default function EditableNumberSelect({
    value,
    onChange,
    options,
    min = 0,
    max = 100,
    step = 0.1,
    placeholder = '0.0',
    suffix = 'm',
    className = ''
}: EditableNumberSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionClick = (opt: number) => {
        onChange(opt);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val)) {
            // allows clearing the input to empty string visually if we needed to, 
            // but prop is number. We might need partial handling or just strict.
            // For now, let's assume parent handles 0 or we just pass the raw value if we changed prop types.
            // But since prop is number, we'll just pass 0 or keep it simple.
            // Let's stick to simple parsing for now.
            onChange(0);
        } else {
            onChange(val);
        }
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative flex items-center">
                <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={value || ''}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="w-full bg-transparent font-bold text-slate-700 outline-none p-1 border-b border-slate-200 focus:border-blue-500 text-lg placeholder:text-slate-300 pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    onFocus={() => setIsOpen(true)}
                />

                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-0 p-1 text-slate-400 hover:text-blue-500 transition-colors"
                >
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Suffix unit overlay if needed, or just let placeholder handle it. 
                    Actually user just wants clean input. We can leave it clean. */}
            </div>

            {/* Dropdown Options */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-100 max-h-48 overflow-y-auto z-50">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => handleOptionClick(opt)}
                            className={`w-full text-left px-3 py-2 text-sm font-medium hover:bg-blue-50 transition-colors flex justify-between items-center
                                ${value === opt ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}
                            `}
                        >
                            <span>{opt} {suffix}</span>
                            {value === opt && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        </button>
                    ))}
                    {/* Add a 'custom' helper or just let them type. Options list is enough. */}
                </div>
            )}
        </div>
    );
}
