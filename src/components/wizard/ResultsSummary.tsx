import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { TestType } from './wizardConfig';
import SimplePowerChart from '@/components/SimplePowerChart';
import { 
  calculateTTestPower, 
  calculateOneWayAnovaPower, 
  calculateRepeatedMeasuresPower,
  calculateCorrelationPower,
  calculateChiSquarePower,
  calculatePERMANOVAPower,
  calculateRepeatedMeasuresPERMANOVAPower
} from '@/utils/powerCalculations';
import { 
  calculateLMMPower, 
  calculateNegBinomialPower, 
  calculateZINBPower 
} from '@/utils/microbiomePowerCalculations';

interface ResultsSummaryProps {
  testType: TestType;
  power: number;
  parameters: {
    n: number;
    effectSize: number;
    alpha: number;
  };
  onGoToCalculator: () => void;
  onRestart: () => void;
}

const testNames: Record<TestType, string> = {
  ttest: 'Two-Sample T-Test',
  oneway: 'One-Way ANOVA',
  twoway: 'Two-Way ANOVA',
  repeated: 'Repeated Measures ANOVA',
  chisquare: 'Chi-Square Test',
  correlation: 'Correlation Test',
  microbiome: 'PERMANOVA',
  'repeated-microbiome': 'Repeated Measures PERMANOVA',
  deseq: 'Differential Abundance (DESeq2)',
  zinb: 'Zero-Inflated Negative Binomial',
  'lmm-microbiome': 'Longitudinal Mixed Model',
};

const ResultsSummary = ({ testType, power, parameters, onGoToCalculator, onRestart }: ResultsSummaryProps) => {
  const powerPercent = (power * 100).toFixed(1);
  const powerLevel = power >= 0.8 ? 'high' : power >= 0.6 ? 'medium' : 'low';

  const getInterpretation = () => {
    if (power >= 0.8) {
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        title: 'Excellent Power!',
        message: `With ${parameters.n} samples per group, you have a ${powerPercent}% chance of detecting an effect of size ${parameters.effectSize}. This meets the recommended 80% threshold.`,
      };
    } else if (power >= 0.6) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        title: 'Moderate Power',
        message: `With ${parameters.n} samples per group, you have a ${powerPercent}% chance of detecting the effect. Consider increasing sample size to reach 80% power.`,
      };
    } else {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        title: 'Low Power',
        message: `With ${parameters.n} samples per group, you only have a ${powerPercent}% chance of detecting the effect. You'll likely need more samples or a larger effect size.`,
      };
    }
  };

  const interpretation = getInterpretation();
  const Icon = interpretation.icon;

  // Generate test-specific power curve data
  const curveData = (() => {
    const points = 50; // More points for smoother curves
    const data: { x: number; y: number }[] = [];
    
    switch (testType) {
      case 'ttest': {
        const minN = Math.max(5, Math.floor(parameters.n * 0.3));
        const maxN = Math.ceil(parameters.n * 2);
        for (let i = 0; i < points; i++) {
          const n = Math.round(minN + (maxN - minN) * (i / (points - 1)));
          const result = calculateTTestPower(n, parameters.effectSize, parameters.alpha);
          data.push({ x: n, y: result.power });
        }
        break;
      }
      
      case 'oneway': {
        const minN = Math.max(5, Math.floor(parameters.n * 0.3));
        const maxN = Math.ceil(parameters.n * 2);
        for (let i = 0; i < points; i++) {
          const n = Math.round(minN + (maxN - minN) * (i / (points - 1)));
          const result = calculateOneWayAnovaPower(n, 3, parameters.effectSize, parameters.alpha);
          data.push({ x: n, y: result.power });
        }
        break;
      }
      
      case 'repeated': {
        const minN = Math.max(5, Math.floor(parameters.n * 0.3));
        const maxN = Math.ceil(parameters.n * 2);
        for (let i = 0; i < points; i++) {
          const n = Math.round(minN + (maxN - minN) * (i / (points - 1)));
          const result = calculateRepeatedMeasuresPower(n, 4, parameters.effectSize, 0.5, parameters.alpha);
          data.push({ x: n, y: result.power });
        }
        break;
      }
      
      case 'correlation': {
        const minN = Math.max(10, Math.floor(parameters.n * 0.3));
        const maxN = Math.ceil(parameters.n * 2);
        for (let i = 0; i < points; i++) {
          const n = Math.round(minN + (maxN - minN) * (i / (points - 1)));
          const result = calculateCorrelationPower(n, parameters.effectSize, parameters.alpha);
          data.push({ x: n, y: result.power });
        }
        break;
      }
      
      case 'chisquare': {
        const minN = Math.max(20, Math.floor(parameters.n * 0.3));
        const maxN = Math.ceil(parameters.n * 2);
        for (let i = 0; i < points; i++) {
          const n = Math.round(minN + (maxN - minN) * (i / (points - 1)));
          const result = calculateChiSquarePower(n, parameters.effectSize, 1, parameters.alpha);
          data.push({ x: n, y: result.power });
        }
        break;
      }
      
      case 'microbiome': {
        const minN = Math.max(10, Math.floor(parameters.n * 0.3));
        const maxN = Math.ceil(parameters.n * 2);
        const rSquared = parameters.effectSize * parameters.effectSize / (1 + parameters.effectSize * parameters.effectSize);
        for (let i = 0; i < points; i++) {
          const n = Math.round(minN + (maxN - minN) * (i / (points - 1)));
          const result = calculatePERMANOVAPower(n, 2, rSquared, parameters.alpha);
          data.push({ x: n, y: result.power });
        }
        break;
      }
      
      case 'repeated-microbiome': {
        const minN = Math.max(5, Math.floor(parameters.n * 0.3));
        const maxN = Math.ceil(parameters.n * 2);
        const rSquared = parameters.effectSize * parameters.effectSize / (1 + parameters.effectSize * parameters.effectSize);
        for (let i = 0; i < points; i++) {
          const n = Math.round(minN + (maxN - minN) * (i / (points - 1)));
          const result = calculateRepeatedMeasuresPERMANOVAPower(n, 4, rSquared, 0.5, parameters.alpha);
          data.push({ x: n, y: result.power });
        }
        break;
      }
      
      case 'deseq': {
        const minN = Math.max(5, Math.floor(parameters.n * 0.3));
        const maxN = Math.ceil(parameters.n * 2);
        const log2FC = parameters.effectSize * 0.693; // Convert effect size to log2FC
        for (let i = 0; i < points; i++) {
          const n = Math.round(minN + (maxN - minN) * (i / (points - 1)));
          const calculatedPower = calculateNegBinomialPower(n, log2FC, 0.1, 100, parameters.alpha, 1);
          data.push({ x: n, y: calculatedPower });
        }
        break;
      }
      
      case 'zinb': {
        const minN = Math.max(5, Math.floor(parameters.n * 0.3));
        const maxN = Math.ceil(parameters.n * 2);
        const log2FC = parameters.effectSize * 0.693;
        for (let i = 0; i < points; i++) {
          const n = Math.round(minN + (maxN - minN) * (i / (points - 1)));
          const calculatedPower = calculateZINBPower(n, 0.2, 50, 0.2, log2FC, parameters.alpha, 'both');
          data.push({ x: n, y: calculatedPower });
        }
        break;
      }
      
      case 'lmm-microbiome': {
        const minN = Math.max(5, Math.floor(parameters.n * 0.3));
        const maxN = Math.ceil(parameters.n * 2);
        for (let i = 0; i < points; i++) {
          const n = Math.round(minN + (maxN - minN) * (i / (points - 1)));
          const calculatedPower = calculateLMMPower(n, 4, parameters.effectSize, 0.5, 0.1, 0, 0, parameters.alpha);
          data.push({ x: n, y: calculatedPower });
        }
        break;
      }
      
      default: {
        // Fallback for other test types
        const minN = Math.max(5, Math.floor(parameters.n * 0.3));
        const maxN = Math.ceil(parameters.n * 2);
        for (let i = 0; i < points; i++) {
          const n = Math.round(minN + (maxN - minN) * (i / (points - 1)));
          const result = calculateTTestPower(n, parameters.effectSize, parameters.alpha);
          data.push({ x: n, y: result.power });
        }
      }
    }
    
    return data;
  })();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Your Power Analysis Results</h2>
        <p className="text-muted-foreground">{testNames[testType]}</p>
      </div>

      <Card className={`p-6 ${interpretation.bgColor}`}>
        <div className="flex items-start gap-4">
          <Icon className={`h-8 w-8 ${interpretation.color} flex-shrink-0`} />
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="font-semibold text-lg mb-1">{interpretation.title}</h3>
              <p className="text-sm">{interpretation.message}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Statistical Power</span>
                <span className="font-bold">{powerPercent}%</span>
              </div>
              <Progress value={power * 100} className="h-3" />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Power Curve</h3>
        <p className="text-sm text-muted-foreground">
          How power changes with sample size (keeping effect size at {parameters.effectSize})
        </p>
        <SimplePowerChart data={curveData} currentValue={parameters.n} />
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Study Parameters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Sample Size</p>
            <p className="text-2xl font-bold">{parameters.n}</p>
            <p className="text-xs text-muted-foreground">per group</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Effect Size</p>
            <p className="text-2xl font-bold">{parameters.effectSize}</p>
            <p className="text-xs text-muted-foreground">Cohen's d</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Alpha Level</p>
            <p className="text-2xl font-bold">{parameters.alpha}</p>
            <p className="text-xs text-muted-foreground">significance</p>
          </div>
        </div>
      </Card>

      {power < 0.8 && (
        <Alert>
          <AlertDescription>
            <strong>Recommendation:</strong> To achieve 80% power, consider increasing your sample size to{' '}
            {Math.ceil(parameters.n * 1.3)} per group, or aim for a larger effect size.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button onClick={onGoToCalculator} size="lg" className="flex-1 gap-2">
          Go to Full Calculator <ArrowRight className="h-5 w-5" />
        </Button>
        <Button onClick={onRestart} variant="outline" size="lg" className="gap-2">
          <RotateCcw className="h-5 w-5" /> Start Over
        </Button>
      </div>
    </div>
  );
};

export default ResultsSummary;
