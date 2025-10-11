import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ControlSlider from '@/components/ControlSlider';
import { TestType } from './wizardConfig';

interface ParameterGuideProps {
  testType: TestType;
  parameters: {
    n: number;
    effectSize: number;
    alpha: number;
  };
  onParameterChange: (key: string, value: number) => void;
  onNext: () => void;
}

const testNames: Record<TestType, string> = {
  ttest: 'Two-Sample T-Test',
  oneway: 'One-Way ANOVA',
  twoway: 'Two-Way ANOVA',
  repeated: 'Repeated Measures ANOVA',
  nested: 'Nested ANOVA',
  chisquare: 'Chi-Square Test',
  correlation: 'Correlation Test',
  microbiome: 'PERMANOVA (Microbiome)',
  'repeated-microbiome': 'Repeated Measures PERMANOVA',
};

const testDescriptions: Record<TestType, string> = {
  ttest: 'Comparing means of two independent groups',
  oneway: 'Comparing means across 3+ groups with one factor',
  twoway: 'Analyzing effects of two factors and their interaction',
  repeated: 'Comparing measurements from the same subjects over time/conditions',
  nested: 'Analyzing nested or hierarchical data structures',
  chisquare: 'Testing association between categorical variables',
  correlation: 'Measuring strength of relationship between two continuous variables',
  microbiome: 'Testing differences in community composition between groups',
  'repeated-microbiome': 'Testing community composition changes in repeated measures',
};

const ParameterGuide = ({ testType, parameters, onParameterChange, onNext }: ParameterGuideProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{testNames[testType]}</h2>
        <p className="text-muted-foreground">{testDescriptions[testType]}</p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Set Your Parameters</h3>
          
          <div className="space-y-6">
            <ControlSlider
              id="n"
              label="Sample Size per Group (n)"
              value={parameters.n}
              min={5}
              max={100}
              step={1}
              onChange={(val) => onParameterChange('n', val)}
              tooltip="Number of independent units in each group. Consider your budget and logistics."
              decimals={0}
            />

            <ControlSlider
              id="effectSize"
              label="Effect Size (Cohen's d)"
              value={parameters.effectSize}
              min={0.1}
              max={2.0}
              step={0.1}
              onChange={(val) => onParameterChange('effectSize', val)}
              tooltip="Magnitude of the effect you want to detect. Small=0.2, Medium=0.5, Large=0.8"
            />

            <ControlSlider
              id="alpha"
              label="Significance Level (α)"
              value={parameters.alpha}
              min={0.01}
              max={0.1}
              step={0.01}
              onChange={(val) => onParameterChange('alpha', val)}
              tooltip="Probability of Type I error. Standard is 0.05 (5%)"
            />
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">Quick Presets:</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onParameterChange('n', 15);
                onParameterChange('effectSize', 0.8);
              }}
            >
              Tight Budget (n=15, d=0.8)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onParameterChange('n', 30);
                onParameterChange('effectSize', 0.5);
              }}
            >
              Moderate (n=30, d=0.5)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onParameterChange('n', 50);
                onParameterChange('effectSize', 0.3);
              }}
            >
              Well-Funded (n=50, d=0.3)
            </Button>
          </div>
        </div>

        <Button onClick={onNext} className="w-full" size="lg">
          Calculate Power
        </Button>
      </Card>
    </div>
  );
};

export default ParameterGuide;
