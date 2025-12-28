'use client';

// ============================================================================
// Number Input Component
// ============================================================================

interface NumberInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function NumberInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
}: NumberInputProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-gray-300">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          if (!isNaN(val)) {
            onChange(val);
          }
        }}
        disabled={disabled}
        className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
