'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    label?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export default function CustomSelect({
    value,
    onChange,
    options,
    label,
    placeholder = 'Seleccionar...',
    className = '',
    disabled = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        if (disabled) return;
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-transparent border-b-2 py-3 text-lg font-medium transition-colors
                    ${isOpen ? 'border-blue-500 text-slate-800' : 'border-slate-200 text-slate-700 hover:border-slate-300'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                disabled={disabled}
            >
                <div className="truncate">
                    {selectedOption ? selectedOption.label : <span className="text-slate-300">{placeholder}</span>}
                </div>
                <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu - Always opens down with z-index */}
            <div
                className={`absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[100] origin-top transition-all duration-200
                    ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
                `}
                style={{ maxHeight: '300px', overflowY: 'auto' }}
            >
                <div className="p-1">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between text-sm font-medium transition-colors
                                ${value === option.value
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                        >
                            <span>{option.label}</span>
                            {value === option.value && <Check size={16} className="text-blue-500" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
