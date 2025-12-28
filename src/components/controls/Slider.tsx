'use client';

// ============================================================================
// Slider Control Component
// ============================================================================

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  disabled = false,
  showValue = true,
}: SliderProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <label className="text-gray-300">{label}</label>
        {showValue && (
          <span className="text-gray-400 font-mono">
            {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}
          </span>
        )}
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
