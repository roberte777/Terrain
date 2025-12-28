'use client';

// ============================================================================
// Select Dropdown Component
// ============================================================================

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: SelectProps<T>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-gray-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
        className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
