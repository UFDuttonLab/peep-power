import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface ControlSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  tooltip?: string;
  decimals?: number;
  warningThreshold?: { min?: number; max?: number; message?: string };
}

const ControlSlider = ({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  tooltip,
  decimals = 2,
  warningThreshold,
}: ControlSliderProps) => {
  const handleChange = (newValue: number) => {
    // Clamp value to valid range
    const validated = Math.max(min, Math.min(max, newValue));
    onChange(validated);
  };

  // Check if value is in warning range
  const isWarning = warningThreshold && (
    (warningThreshold.min !== undefined && value < warningThreshold.min) ||
    (warningThreshold.max !== undefined && value > warningThreshold.max)
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className="font-medium">
            {label}
          </Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-primary text-primary-foreground">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className={`px-3 py-1 rounded text-sm font-bold ${isWarning ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100' : 'bg-card text-primary'}`}>
          {decimals === 0 ? value.toFixed(0) : value.toFixed(decimals)}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(vals) => handleChange(vals[0])}
        className="w-full"
      />
      {isWarning && warningThreshold?.message && (
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          ⚠️ {warningThreshold.message}
        </p>
      )}
    </div>
  );
};

export default ControlSlider;
