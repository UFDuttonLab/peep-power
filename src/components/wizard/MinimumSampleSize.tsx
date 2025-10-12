import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, TrendingUp, RotateCcw, ArrowRight } from 'lucide-react';
import { TestType } from './wizardConfig';
import { calculateRequiredSampleSize } from '@/utils/powerCalculations';

interface MinimumSampleSizeProps {
  testType: TestType;
  effectSize: number;
  groups: number;
  onGoToCalculator: () => void;
  onRestart: () => void;
}

const testNames: Record<TestType, string> = {
  ttest: 'Two-Sample T-Test',
  oneway: 'One-Way ANOVA',
  twoway: 'Two-Way ANOVA',
  repeated: 'Repeated Measures ANOVA',
  nested: 'Nested ANOVA',
  chisquare: 'Chi-Square Test',
  correlation: 'Correlation Test',
  microbiome: 'PERMANOVA',
  'repeated-microbiome': 'Repeated Measures PERMANOVA',
  deseq: 'Differential Abundance (DESeq2)',
  zinb: 'Zero-Inflated Negative Binomial',
  'lmm-microbiome': 'Longitudinal Mixed Model',
};

const MinimumSampleSize = ({ 
  testType, 
  effectSize, 
  groups,
  onGoToCalculator, 
  onRestart 
}: MinimumSampleSizeProps) => {
  // Calculate required sample size for 80% power at alpha = 0.05
  const targetPower = 0.8;
  const alpha = 0.05;
  
  // Helper function for size categorization
  const getSizeCategory = (n: number) => {
    if (n <= 20) return { level: 'small', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20' };
    if (n <= 50) return { level: 'moderate', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/20' };
    return { level: 'large', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20' };
  };
  
  // Special handling for repeated-microbiome
  if (testType === 'repeated-microbiome') {
    const timepoints = groups; // For repeated-microbiome, "groups" is actually timepoints
    const correlation = 0.5; // Default assumption
    
    // Calculate minimum subjects needed
    let minSubjects = 5;
    const maxIterations = 200;
    
    for (let subjects = 5; subjects <= maxIterations; subjects++) {
      // CORRECTED: Design effect REDUCES effective sample size (divide, not multiply)
      // Higher correlation = more redundant information = SMALLER effective N
      const designEffect = 1 + (timepoints - 1) * correlation;
      const effectiveN = (subjects * timepoints) / designEffect;
      const df1 = timepoints - 1;
      const df2 = (subjects - 1) * (timepoints - 1);
      
      if (df2 <= 0) continue;
      
      const lambda = effectiveN * (effectSize / (1 - effectSize));
      
      // Simple approximation: power increases with lambda
      const approxPower = 1 - Math.exp(-lambda / (df1 + df2 + 10));
      
      if (approxPower >= targetPower) {
        minSubjects = subjects;
        break;
      }
    }
    
    const sizeInfo = getSizeCategory(minSubjects);
    const totalMeasurements = minSubjects * timepoints;
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Your Minimum Sample Size</h2>
          <p className="text-muted-foreground">{testNames[testType]}</p>
        </div>

        <Card className={`p-8 ${sizeInfo.bg}`}>
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background">
              <CheckCircle2 className={`h-8 w-8 ${sizeInfo.color}`} />
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">{minSubjects}</div>
              <p className="text-lg font-medium">independent subjects</p>
              <p className="text-sm text-muted-foreground mt-2">
                Measured at {timepoints} timepoint{timepoints > 1 ? 's' : ''} each
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total measurements: {totalMeasurements}
              </p>
            </div>
            <Alert className="text-left">
              <AlertDescription>
                This gives you <strong>80% power</strong> to detect R²={effectSize.toFixed(2)} variance explained 
                with {timepoints} repeated measurements (assuming within-subject correlation r={correlation}).
              </AlertDescription>
            </Alert>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Budget Planning Options</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Tight Budget', multiplier: 0.7, note: 'Lower power (~65-70%)' },
              { label: 'Recommended', multiplier: 1.0, note: '80% power - standard' },
              { label: 'Well-Funded', multiplier: 1.3, note: '90% power - ideal' },
            ].map((scenario) => {
              const scenarioN = Math.ceil(minSubjects * scenario.multiplier);
              return (
                <div key={scenario.label} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="font-semibold">{scenario.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{scenario.note}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{scenarioN}</div>
                      <div className="text-xs text-muted-foreground">subjects</div>
                      <div className="text-xs text-muted-foreground">({scenarioN * timepoints} total)</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Study Design Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Independent Subjects</p>
              <p className="text-xl font-bold">{minSubjects}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Timepoints per Subject</p>
              <p className="text-xl font-bold">{timepoints}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Measurements</p>
              <p className="text-xl font-bold">{totalMeasurements}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Expected Effect (R²)</p>
              <p className="text-xl font-bold">{(effectSize * 100).toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <AlertDescription>
            <strong>Important:</strong> Your sample size is {minSubjects} <strong>subjects</strong>, not {totalMeasurements} samples. 
            Each subject is measured {timepoints} times. This accounts for within-subject correlation (assumed r={correlation}).
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button onClick={onGoToCalculator} size="lg" className="flex-1 gap-2">
            Explore Advanced Options <ArrowRight className="h-5 w-5" />
          </Button>
          <Button onClick={onRestart} variant="outline" size="lg" className="gap-2">
            <RotateCcw className="h-5 w-5" /> Start Over
          </Button>
        </div>
      </div>
    );
  }
  
  // Special handling for microbiome (PERMANOVA) - needs different calculation than ANOVA
  if (testType === 'microbiome') {
    let requiredNPerGroup = 5;
    const maxIterations = 500;
    
    // Binary search for sample size that achieves target power
    let low = 5;
    let high = 500;
    
    for (let iter = 0; iter < 50; iter++) {
      const mid = Math.floor((low + high) / 2);
      const N = mid * groups;
      const df1 = groups - 1;
      const df2 = N - groups;
      
      if (df2 <= 0) {
        low = mid + 1;
        continue;
      }
      
      // Calculate power using PERMANOVA formula
      const lambda = N * (effectSize / (1 - effectSize));
      
      // Approximate power using chi-square approximation
      const criticalValue = 2.0 + (0.5 * df1); // Rough approximation of F critical value
      const approxPower = 1 - Math.exp(-lambda / (criticalValue * df2));
      
      if (Math.abs(approxPower - targetPower) < 0.05) {
        requiredNPerGroup = mid;
        break;
      }
      
      if (approxPower < targetPower) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    requiredNPerGroup = Math.max(low, 5); // Ensure minimum of 5 per group
    
    const requiredN = requiredNPerGroup;
    const budgetScenarios = [
      { label: 'Tight Budget', multiplier: 0.6, note: 'Lower power (~65%), higher risk of missing real effects' },
      { label: 'Recommended', multiplier: 1.0, note: '80% power - standard for most studies' },
      { label: 'Well-Funded', multiplier: 1.4, note: '90% power - ideal if resources allow' },
    ];

    const sizeInfo = getSizeCategory(requiredN);

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Your Minimum Sample Size</h2>
          <p className="text-muted-foreground">{testNames[testType]}</p>
        </div>

        <Card className={`p-8 ${sizeInfo.bg}`}>
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background">
              <CheckCircle2 className={`h-8 w-8 ${sizeInfo.color}`} />
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">{requiredN}</div>
              <p className="text-lg font-medium">samples per group</p>
              <p className="text-sm text-muted-foreground mt-2">
                For R²={effectSize.toFixed(2)} with {groups} groups
              </p>
            </div>
            <Alert className="text-left">
              <AlertDescription>
                This gives you <strong>~80% power</strong> to detect R²={effectSize.toFixed(2)} variance explained 
                with PERMANOVA at α = 0.05.
              </AlertDescription>
            </Alert>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Budget Planning Options</h3>
          </div>
          <div className="space-y-3">
            {budgetScenarios.map((scenario) => {
              const scenarioN = Math.ceil(requiredN * scenario.multiplier);
              return (
                <div key={scenario.label} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="font-semibold">{scenario.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{scenario.note}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">n = {scenarioN}</div>
                      <div className="text-xs text-muted-foreground">per group</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Study Design Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Number of Groups</p>
              <p className="text-xl font-bold">{groups}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Expected Effect (R²)</p>
              <p className="text-xl font-bold">{(effectSize * 100).toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Sample Size</p>
              <p className="text-xl font-bold">{requiredN * groups}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Statistical Power</p>
              <p className="text-xl font-bold">~80%</p>
            </div>
          </div>
        </Card>

        {requiredN > 100 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Large sample sizes may be logistically challenging. Consider if a smaller 
              effect size would still be biologically meaningful, or explore alternative designs.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button onClick={onGoToCalculator} size="lg" className="flex-1 gap-2">
            Explore Advanced Options <ArrowRight className="h-5 w-5" />
          </Button>
          <Button onClick={onRestart} variant="outline" size="lg" className="gap-2">
            <RotateCcw className="h-5 w-5" /> Start Over
          </Button>
        </div>
      </div>
    );
  }

  const testTypeMapping: Record<TestType, 'ttest' | 'anova' | 'correlation'> = {
    ttest: 'ttest',
    oneway: 'anova',
    twoway: 'anova',
    repeated: 'anova',
    nested: 'anova',
    chisquare: 'ttest', // Approximate
    correlation: 'correlation',
    microbiome: 'anova', // This won't be reached due to special handling above
    'repeated-microbiome': 'anova',
    deseq: 'anova', // Approximate as ANOVA for basic calculation
    zinb: 'anova', // Approximate as ANOVA for basic calculation
    'lmm-microbiome': 'anova', // Approximate as ANOVA for basic calculation
  };

  const mappedTestType = testTypeMapping[testType];
  const requiredN = calculateRequiredSampleSize(
    effectSize,
    targetPower,
    alpha,
    mappedTestType,
    groups
  );

  // Calculate budget estimates
  const budgetScenarios = [
    { label: 'Tight Budget', multiplier: 0.6, note: 'Lower power (~65%), higher risk of missing real effects' },
    { label: 'Recommended', multiplier: 1.0, note: '80% power - standard for most studies' },
    { label: 'Well-Funded', multiplier: 1.4, note: '90% power - ideal if resources allow' },
  ];

  const sizeInfo = getSizeCategory(requiredN);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Your Minimum Sample Size</h2>
        <p className="text-muted-foreground">{testNames[testType]}</p>
      </div>

      <Card className={`p-8 ${sizeInfo.bg}`}>
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background">
            <CheckCircle2 className={`h-8 w-8 ${sizeInfo.color}`} />
          </div>
          <div>
            <div className="text-5xl font-bold mb-2">{requiredN}</div>
            <p className="text-lg font-medium">samples per group</p>
            <p className="text-sm text-muted-foreground mt-2">
              For effect size {effectSize} with {groups} groups
            </p>
          </div>
          <Alert className="text-left">
            <AlertDescription>
              This gives you <strong>80% power</strong> to detect your expected effect at the standard 
              significance level (α = 0.05).
            </AlertDescription>
          </Alert>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Budget Planning Options</h3>
        </div>
        <div className="space-y-3">
          {budgetScenarios.map((scenario) => {
            const scenarioN = Math.ceil(requiredN * scenario.multiplier);
            return (
              <div key={scenario.label} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="font-semibold">{scenario.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{scenario.note}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">n = {scenarioN}</div>
                    <div className="text-xs text-muted-foreground">per group</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Study Design Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Number of Groups</p>
            <p className="text-xl font-bold">{groups}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Expected Effect Size</p>
            <p className="text-xl font-bold">{effectSize}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Sample Size</p>
            <p className="text-xl font-bold">{requiredN * groups}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Statistical Power</p>
            <p className="text-xl font-bold">80%</p>
          </div>
        </div>
      </Card>

      {requiredN > 100 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Large sample sizes may be logistically challenging. Consider if a smaller 
            effect size would still be biologically meaningful, or explore alternative designs.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button onClick={onGoToCalculator} size="lg" className="flex-1 gap-2">
          Explore Advanced Options <ArrowRight className="h-5 w-5" />
        </Button>
        <Button onClick={onRestart} variant="outline" size="lg" className="gap-2">
          <RotateCcw className="h-5 w-5" /> Start Over
        </Button>
      </div>
    </div>
  );
};

export default MinimumSampleSize;
