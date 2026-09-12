interface ProgressBarProps {
  value: number; // 0 - 100
  label?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ value, label, showPercentage = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-onSurface-variant">
          {label && <span>{label}</span>}
          {showPercentage && <span className="text-primary">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
