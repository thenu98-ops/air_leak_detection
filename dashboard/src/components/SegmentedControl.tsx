import React from 'react';
import { motion } from 'framer-motion';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-canvas p-1 ring-1 ring-line">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            active ? 'text-ink' : 'text-muted hover:text-ink'}`
            }>
            
            {active &&
            <motion.span
              layoutId={`seg-${label}`}
              className="absolute inset-0 rounded-full bg-surface shadow-sm ring-1 ring-line"
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }} />

            }
            <span className="relative">{opt.label}</span>
          </button>);

      })}
    </div>);

}