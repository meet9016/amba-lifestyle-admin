'use client';

import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { ChevronDown, AlertCircle, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<SelectOption | string>;
  icon?: React.ReactNode;
  placeholder?: string;
  focusRingColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

const renderLabel = (label: string, required?: boolean) => {
  if (!label) return null;
  if (label.includes('*')) {
    const parts = label.split('*');
    return (
      <>
        {parts[0]}
        <span className="text-rose-500 font-bold ml-0.5">*</span>
        {parts.slice(1).join('*')}
      </>
    );
  }
  return (
    <>
      {label}
      {required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
    </>
  );
};

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options = [],
  icon,
  placeholder = 'Select an option',
  focusRingColor = 'focus:ring-indigo-500/10 focus:border-indigo-600',
  className = '',
  id,
  disabled,
  value,
  onChange,
  size = 'md',
  ...props
}) => {
  const generatedId = useId();
  const selectId = id || props.name || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options into uniform { value, label, disabled } objects
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
  }, [options]);

  // Find currently selected option
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Compute display label for the trigger button
  const displayLabel = selectedOption?.label || (placeholder ? placeholder : 'Select...');
  const isSelected = !!selectedOption && selectedOption.value !== '';
  const isCompact = size === 'sm' || className.includes('py-1.5') || className.includes('text-xs');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto focus search input when opened if options > 5
  useEffect(() => {
    if (isOpen && normalizedOptions.length > 5) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, normalizedOptions.length]);

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  };

  // Option selection handler
  const handleSelectOption = (opt: SelectOption) => {
    if (disabled || opt.disabled) return;
    setIsOpen(false);
    setSearchTerm('');

    if (onChange) {
      const syntheticEvent = {
        target: {
          name: props.name || '',
          value: String(opt.value),
          id: selectId
        },
        currentTarget: {
          name: props.name || '',
          value: String(opt.value),
          id: selectId
        }
      } as unknown as React.ChangeEvent<HTMLSelectElement>;

      onChange(syntheticEvent);
    }
  };

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-1.5" ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-zinc-700 tracking-wide select-none"
        >
          {renderLabel(label, props.required)}
        </label>
      )}

      {/* Hidden standard select element for 100% form / autocomplete compatibility */}
      <select
        id={selectId}
        name={props.name}
        value={value}
        disabled={disabled}
        onChange={onChange}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none"
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {normalizedOptions.map((opt, idx) => (
          <option key={idx} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom Designed Dropdown Trigger (Pure Light Mode) */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full flex items-center justify-between text-left rounded-xl bg-white border transition-all duration-200 outline-none select-none ${
            isCompact ? 'py-1.5 px-3 text-xs' : 'py-2.5 px-3.5 text-sm'
          } ${
            icon ? 'pl-10' : ''
          } ${
            disabled
              ? 'cursor-not-allowed bg-zinc-50 border-zinc-200 text-zinc-400 shadow-none'
              : error
              ? 'cursor-pointer border-rose-400 text-rose-950 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 shadow-2xs'
              : isOpen
              ? 'cursor-pointer border-indigo-600 ring-4 ring-indigo-500/10 text-zinc-900 shadow-sm'
              : 'cursor-pointer border-zinc-200 hover:border-zinc-300 text-zinc-800 shadow-2xs'
          } ${className}`}
        >
          {/* Leading Icon */}
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              {icon}
            </div>
          )}

          {/* Trigger Label */}
          <span
            className={`block truncate font-medium ${
              !isSelected ? 'text-zinc-400 font-normal' : 'text-zinc-900'
            }`}
          >
            {displayLabel}
          </span>

          {/* Custom Chevron Indicator */}
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ml-2 border transition-all duration-200 ${
              isOpen
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 rotate-180'
                : 'bg-zinc-50 border-zinc-200/80 text-zinc-400'
            }`}
          >
            <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
          </div>
        </button>

        {/* Floating Custom Dropdown Menu (Pure Light Mode) */}
        {isOpen && !disabled && (
          <div
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-1.5 max-h-64 overflow-hidden rounded-2xl bg-white border border-zinc-200/90 shadow-xl shadow-zinc-900/10 animate-in fade-in zoom-in-95 duration-150 flex flex-col"
          >
            {/* Search Input when items > 5 */}
            {normalizedOptions.length > 5 && (
              <div className="p-2 border-b border-zinc-100 bg-zinc-50/70 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search options..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-800 placeholder:text-zinc-400"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Scrollable List of Options */}
            <div className="overflow-y-auto max-h-52 p-1.5 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-400">
                  No matching options found
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isCurrent = String(opt.value) === String(value);
                  const isOptDisabled = !!opt.disabled;

                  return (
                    <button
                      key={idx}
                      type="button"
                      role="option"
                      aria-selected={isCurrent}
                      disabled={isOptDisabled}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all duration-150 text-left ${
                        isOptDisabled
                          ? 'opacity-40 cursor-not-allowed text-zinc-400 bg-zinc-50/50'
                          : isCurrent
                          ? 'bg-indigo-50 text-indigo-900 font-semibold cursor-pointer'
                          : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 cursor-pointer font-medium'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isCurrent && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Helper Text */}
      {!error && helperText && (
        <p className="text-xs text-zinc-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};