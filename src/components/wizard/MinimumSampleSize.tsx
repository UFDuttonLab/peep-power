import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, TrendingUp, RotateCcw, ArrowRight } from 'lucide-react';
import { TestType } from './wizardConfig';
import { calculateRequiredSampleSize } from '@/utils/powerCalculations';
import { 
  calculateLMMPower,
  calculateRequiredSampleSizeNB,
  calculateRequiredSampleSizeLMM,
  calculateZINBPower,
  cohensDToLog2FC
} from '@/utils/microbiomePowerCalculations';
import { MicrobiomeParams } from './MicrobiomeParameters';

interface MinimumSampleSizeProps {
  testType: TestType;
  effectSize: number;
  groups: number;
  microbiomeParams?: MicrobiomeParams;
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

const MinimumSampleSize = ({ 
  testType, 
  effectSize, 
  groups,
  microbiomeParams,
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
  
  // DESeq2 Differential Abundance Analysis
  if (testType === 'deseq') {
    const { dispersion = 0.5, baseMean = 100, numTests = 100 } = microbiomeParams || {};
    const log2FC = cohensDToLog2FC(effectSize);
    
    const budgetScenarios = [
      { label: 'Tight Budget', targetPower: 0.65, color: 'bg-yellow-50 dark:bg-yellow-950/20' },
      { label: 'Recommended', targetPower: 0.80, color: 'bg-green-50 dark:bg-green-950/20' },
      { label: 'Well-Funded', targetPower: 0.90, color: 'bg-blue-50 dark:bg-blue-950/20' },
    ].map(scenario => ({
      ...scenario,
      n: calculateRequiredSampleSizeNB(scenario.targetPower, log2FC, dispersion, baseMean, alpha, numTests)
    }));
    
    const requiredN = budgetScenarios[1].n;
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Your Minimum Sample Size</h2>
          <p className="text-muted-foreground">DESeq2 Differential Abundance Analysis</p>
        </div>

        <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">{requiredN}</div>
              <p className="text-lg font-medium">samples per group</p>
              <p className="text-sm text-muted-foreground mt-2">
                For log₂FC = {log2FC.toFixed(2)} with {numTests} taxa tested
              </p>
            </div>
            <Alert className="text-left bg-background/80">
              <AlertDescription>
                This gives you <strong>80% power</strong> to detect a <strong>{Math.pow(2, Math.abs(log2FC)).toFixed(2)}-fold change</strong>
                {' '}in abundance at FDR-adjusted α = {(alpha / numTests).toFixed(4)} (Bonferroni).
              </AlertDescription>
            </Alert>
          </div>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold">Budget Scenarios</h3>
          {budgetScenarios.map((scenario, idx) => (
            <Card key={idx} className={scenario.color}>
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{scenario.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {(scenario.targetPower * 100).toFixed(0)}% power
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{scenario.n}</p>
                  <p className="text-sm text-muted-foreground">per group</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: {scenario.n * groups}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Multiple testing correction:</strong> Testing {numTests} taxa requires stringent correction,
            increasing required sample size. Consider pre-filtering low-abundance taxa (&lt;10 reads across samples)
            to reduce the number of tests.
          </AlertDescription>
        </Alert>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Study Design Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Test</p>
              <p className="font-medium">DESeq2 Negative Binomial</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Samples</p>
              <p className="font-medium">{requiredN * groups}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Effect Size (log₂FC)</p>
              <p className="font-medium">{log2FC.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Number of Groups</p>
              <p className="font-medium">{groups}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dispersion</p>
              <p className="font-medium">{dispersion.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Base Mean</p>
              <p className="font-medium">{baseMean}</p>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button onClick={onRestart} variant="outline" className="flex-1 gap-2">
            <RotateCcw className="h-5 w-5" /> Start Over
          </Button>
          <Button onClick={onGoToCalculator} className="flex-1 gap-2">
            Explore Advanced Options <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  // Zero-Inflated Negative Binomial Analysis
  if (testType === 'zinb') {
    const { dispersion = 0.5, baseMean = 100, zeroInflation = 0.5, numTests = 100 } = microbiomeParams || {};
    const log2FC = cohensDToLog2FC(effectSize);
    
    const calculateZINBN = (targetPower: number): number => {
      let low = 5, high = 500;
      for (let iter = 0; iter < 50; iter++) {
        const mid = Math.floor((low + high) / 2);
        const power = calculateZINBPower(mid, zeroInflation, baseMean, dispersion, log2FC, alpha / numTests, 'both');
        
        if (Math.abs(power - targetPower) < 0.02) return mid;
        if (power < targetPower) low = mid + 1;
        else high = mid - 1;
      }
      return Math.max(low, 10);
    };
    
    const budgetScenarios = [
      { label: 'Tight Budget', targetPower: 0.65, color: 'bg-yellow-50 dark:bg-yellow-950/20' },
      { label: 'Recommended', targetPower: 0.80, color: 'bg-green-50 dark:bg-green-950/20' },
      { label: 'Well-Funded', targetPower: 0.90, color: 'bg-blue-50 dark:bg-blue-950/20' },
    ].map(scenario => ({
      ...scenario,
      n: calculateZINBN(scenario.targetPower)
    }));
    
    const requiredN = budgetScenarios[1].n;
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Your Minimum Sample Size</h2>
          <p className="text-muted-foreground">Zero-Inflated Negative Binomial Model</p>
        </div>

        <Card className="p-8 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">{requiredN}</div>
              <p className="text-lg font-medium">samples per group</p>
              <p className="text-sm text-muted-foreground mt-2">
                For log₂FC = {log2FC.toFixed(2)} with {(zeroInflation * 100).toFixed(0)}% zero-inflation
              </p>
            </div>
            <Alert className="text-left bg-background/80">
              <AlertDescription>
                This gives you <strong>80% power</strong> to detect changes in both count and zero-inflation
                components with {numTests} taxa tested.
              </AlertDescription>
            </Alert>
          </div>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold">Budget Scenarios</h3>
          {budgetScenarios.map((scenario, idx) => (
            <Card key={idx} className={scenario.color}>
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{scenario.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {(scenario.targetPower * 100).toFixed(0)}% power
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{scenario.n}</p>
                  <p className="text-sm text-muted-foreground">per group</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: {scenario.n * groups}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>High zero-inflation detected:</strong> With {(zeroInflation * 100).toFixed(0)}% zeros,
            ZINB models are appropriate. However, if zeros are primarily due to low sequencing depth rather
            than biological absence, consider rarefaction or filtering instead.
          </AlertDescription>
        </Alert>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Study Design Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium">Zero-Inflated Negative Binomial</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Samples</p>
              <p className="font-medium">{requiredN * groups}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Zero-Inflation</p>
              <p className="font-medium">{(zeroInflation * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dispersion</p>
              <p className="font-medium">{dispersion.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button onClick={onRestart} variant="outline" className="flex-1 gap-2">
            <RotateCcw className="h-5 w-5" /> Start Over
          </Button>
          <Button onClick={onGoToCalculator} className="flex-1 gap-2">
            Explore Advanced Options <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  // Linear Mixed Model for Longitudinal Microbiome
  if (testType === 'lmm-microbiome') {
    const { withinCorr = 0.5, randomSlopeVar = 0.1, dropoutRate = 0.1 } = microbiomeParams || {};
    const nTimepoints = groups;
    const nCovariates = 1;
    
    let cohensF = effectSize;
    if (effectSize < 0.1) {
      cohensF = Math.sqrt(effectSize / (1 - effectSize));
    }
    
    const budgetScenarios = [
      { label: 'Tight Budget', targetPower: 0.65, color: 'bg-yellow-50 dark:bg-yellow-950/20' },
      { label: 'Recommended', targetPower: 0.80, color: 'bg-green-50 dark:bg-green-950/20' },
      { label: 'Well-Funded', targetPower: 0.90, color: 'bg-blue-50 dark:bg-blue-950/20' },
    ].map(scenario => ({
      ...scenario,
      n: calculateRequiredSampleSizeLMM(scenario.targetPower, nTimepoints, cohensF, withinCorr, randomSlopeVar, nCovariates, dropoutRate, alpha)
    }));
    
    const requiredN = budgetScenarios[1].n;
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Your Minimum Sample Size</h2>
          <p className="text-muted-foreground">Linear Mixed Model (Longitudinal Taxa)</p>
        </div>

        <Card className="p-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">{requiredN}</div>
              <p className="text-lg font-medium">subjects needed</p>
              <p className="text-sm text-muted-foreground mt-2">
                Measured at {nTimepoints} timepoints (total: {requiredN * nTimepoints} samples)
              </p>
            </div>
            <Alert className="text-left bg-background/80">
              <AlertDescription>
                This gives you <strong>80% power</strong> to detect a <strong>time × group interaction</strong>
                {' '}(Cohen's f = {cohensF.toFixed(2)}), accounting for within-subject correlation (ρ={withinCorr.toFixed(2)})
                {' '}and {(dropoutRate * 100).toFixed(0)}% dropout.
              </AlertDescription>
            </Alert>
          </div>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold">Budget Scenarios</h3>
          {budgetScenarios.map((scenario, idx) => (
            <Card key={idx} className={scenario.color}>
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{scenario.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {(scenario.targetPower * 100).toFixed(0)}% power
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{scenario.n}</p>
                  <p className="text-sm text-muted-foreground">subjects</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total samples: {scenario.n * nTimepoints}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Dropout considerations:</strong> With {(dropoutRate * 100).toFixed(0)}% expected dropout,
            consider recruiting {Math.ceil(requiredN * 1.1)} subjects initially to maintain target power.
            Use intention-to-treat analysis and multiple imputation for missing data.
          </AlertDescription>
        </Alert>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Study Design Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium">Linear Mixed Model</p>
            </div>
            <div>
              <p className="text-muted-foreground">Subjects Needed</p>
              <p className="font-medium">{requiredN}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Number of Timepoints</p>
              <p className="font-medium">{nTimepoints}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Measurements</p>
              <p className="font-medium">{requiredN * nTimepoints}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Within-Subject Correlation</p>
              <p className="font-medium">{withinCorr.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Random Slope Variance</p>
              <p className="font-medium">{randomSlopeVar.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button onClick={onRestart} variant="outline" className="flex-1 gap-2">
            <RotateCcw className="h-5 w-5" /> Start Over
          </Button>
          <Button onClick={onGoToCalculator} className="flex-1 gap-2">
            Explore Advanced Options <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }
  
  // Special handling for repeated-microbiome using LMM power calculation
  if (testType === 'repeated-microbiome') {
    const timepoints = groups; // For repeated-microbiome, "groups" is actually timepoints
    const correlation = 0.5; // Default within-subject correlation assumption
    const randomSlopeVar = 0.1; // Conservative assumption for random slopes
    const nCovariates = 1; // Treatment effect
    const dropoutRate = 0.1; // 10% dropout assumption
    
    // Convert R² to Cohen's f: f = √(R²/(1-R²))
    const cohensF = Math.sqrt(effectSize / (1 - effectSize));
    
    // Binary search for required subjects using proper LMM calculation
    let low = 5, high = 500;
    let minSubjects = 10;
    
    for (let iter = 0; iter < 50; iter++) {
      const mid = Math.floor((low + high) / 2);
      
      // Calculate LMM power using the corrected function from microbiomePowerCalculations.ts
      const power = calculateLMMPower(
        mid, timepoints, cohensF, correlation, 
        randomSlopeVar, nCovariates, dropoutRate, alpha
      );
      
      if (Math.abs(power - targetPower) < 0.02) {
        minSubjects = mid;
        break;
      }
      if (power < targetPower) low = mid + 1;
      else high = mid - 1;
    }
    minSubjects = Math.max(low, 10); // Minimum 10 subjects for repeated measures
    
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
              { label: 'Tight Budget', targetPower: 0.65, note: '65% power to detect your effect' },
              { label: 'Recommended', targetPower: 0.80, note: '80% power - standard' },
              { label: 'Well-Funded', targetPower: 0.90, note: '90% power - ideal' },
            ].map((scenario) => {
              // Calculate actual N for each power target using binary search
              let low = 5, high = 500;
              let scenarioN = minSubjects;
              
              for (let iter = 0; iter < 50; iter++) {
                const mid = Math.floor((low + high) / 2);
                
                const power = calculateLMMPower(
                  mid, timepoints, cohensF, correlation, 
                  randomSlopeVar, nCovariates, dropoutRate, alpha
                );
                
                if (Math.abs(power - scenario.targetPower) < 0.02) {
                  scenarioN = mid;
                  break;
                }
                
                if (power < scenario.targetPower) {
                  low = mid + 1;
                } else {
                  high = mid - 1;
                }
              }
              scenarioN = Math.max(scenarioN, 10);
              
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
    
    // Calculate actual N for each power target instead of using multipliers
    const budgetScenarios = [
      { label: 'Tight Budget', targetPower: 0.65 },
      { label: 'Recommended', targetPower: 0.80 },
      { label: 'Well-Funded', targetPower: 0.90 },
    ].map(scenario => {
      // Binary search for N at this power level
      let low = 5, high = 500;
      let scenarioN = requiredN;
      
      for (let iter = 0; iter < 50; iter++) {
        const mid = Math.floor((low + high) / 2);
        const N = mid * groups;
        const df1 = groups - 1;
        const df2 = N - groups;
        
        if (df2 <= 0) {
          low = mid + 1;
          continue;
        }
        
        const lambda = N * (effectSize / (1 - effectSize));
        const criticalValue = 2.0 + (0.5 * df1);
        const approxPower = 1 - Math.exp(-lambda / (criticalValue * df2));
        
        if (Math.abs(approxPower - scenario.targetPower) < 0.02) {
          scenarioN = mid;
          break;
        }
        
        if (approxPower < scenario.targetPower) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      scenarioN = Math.max(scenarioN, 5);
      
      return {
        label: scenario.label,
        n: scenarioN,
        note: `${(scenario.targetPower * 100).toFixed(0)}% power to detect your effect`
      };
    });

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
            {budgetScenarios.map((scenario) => (
              <div key={scenario.label} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="font-semibold">{scenario.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{scenario.note}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">n = {scenario.n}</div>
                    <div className="text-xs text-muted-foreground">per group</div>
                  </div>
                </div>
              </div>
            ))}
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
        
        {effectSize > 0.3 && (
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Large R² ({(effectSize * 100).toFixed(0)}%):</strong> This is very high for microbiome studies. 
              Typical PERMANOVA R² values are 5-20%. Verify this effect size is realistic for your study.
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

  // Special handling for correlation test (total N, not per group)
  if (testType === 'correlation') {
    const totalN = calculateRequiredSampleSize(effectSize, targetPower, alpha, 'correlation');
    const sizeInfo = getSizeCategory(totalN);
    
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
              <div className="text-5xl font-bold mb-2">{totalN}</div>
              <p className="text-lg font-medium">total samples needed</p>
              <p className="text-sm text-muted-foreground mt-2">
                To detect correlation ρ={effectSize.toFixed(2)}
              </p>
            </div>
            <Alert className="text-left">
              <AlertDescription>
                This gives you <strong>80% power</strong> to detect a correlation of <strong>ρ={effectSize.toFixed(2)}</strong> at α = 0.05.
              </AlertDescription>
            </Alert>
          </div>
        </Card>

        {effectSize > 0.7 && (
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Large correlation (r={effectSize}):</strong> Correlations above 0.7 are rare in ecology and biological sciences. 
              Verify this effect size is realistic for your study.
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

  // Special handling for chi-square (total N, not per group)
  if (testType === 'chisquare') {
    const totalN = calculateRequiredSampleSize(effectSize, targetPower, alpha, 'chisquare', groups);
    const sizeInfo = getSizeCategory(totalN);
    
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
              <div className="text-5xl font-bold mb-2">{totalN}</div>
              <p className="text-lg font-medium">total samples needed</p>
              <p className="text-sm text-muted-foreground mt-2">
                For effect size w={effectSize.toFixed(2)}
              </p>
            </div>
            <Alert className="text-left">
              <AlertDescription>
                This gives you <strong>80% power</strong> to detect an effect size of w={effectSize.toFixed(2)} 
                with {groups} categories/groups at α = 0.05.
              </AlertDescription>
            </Alert>
          </div>
        </Card>

        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <AlertDescription>
            <strong>Chi-square requirement:</strong> Each cell in your contingency table should have an expected 
            frequency of at least 5 for reliable results.
          </AlertDescription>
        </Alert>
        
        {effectSize > 0.5 && (
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Large effect size (w={effectSize.toFixed(2)}):</strong> Cohen's w values above 0.5 are very large. 
              Typical values are 0.1 (small), 0.3 (medium), 0.5 (large). Verify this is appropriate for your study.
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

  const testTypeMapping: Record<TestType, 'ttest' | 'anova' | 'correlation' | 'chisquare'> = {
    ttest: 'ttest',
    oneway: 'anova',
    twoway: 'anova',
    repeated: 'anova',
    chisquare: 'chisquare',
    correlation: 'correlation', // This won't be reached due to special handling above
    microbiome: 'anova', // This won't be reached due to special handling above
    'repeated-microbiome': 'anova', // This won't be reached due to special handling above
    deseq: 'anova', // Approximate as ANOVA for basic calculation
    zinb: 'anova', // Approximate as ANOVA for basic calculation
    'lmm-microbiome': 'anova', // Approximate as ANOVA for basic calculation
  };

  const mappedTestType = testTypeMapping[testType];
  let requiredN = calculateRequiredSampleSize(
    effectSize,
    targetPower,
    alpha,
    mappedTestType,
    groups
  );
  
  // Enforce statistical validity minimums for ANOVA
  const ANOVA_MIN_PER_GROUP = 15;
  if ((testType === 'oneway' || testType === 'twoway' || testType === 'repeated') && requiredN < ANOVA_MIN_PER_GROUP) {
    requiredN = ANOVA_MIN_PER_GROUP;
  }

  // Calculate actual N for each power target instead of using multipliers
  const budgetScenarios = [
    { label: 'Tight Budget', targetPower: 0.65 },
    { label: 'Recommended', targetPower: 0.80 },
    { label: 'Well-Funded', targetPower: 0.90 },
  ].map(scenario => {
    const scenarioN = calculateRequiredSampleSize(
      effectSize,
      scenario.targetPower,
      alpha,
      mappedTestType,
      groups
    );
    
    return {
      label: scenario.label,
      n: Math.max(scenarioN, testType === 'oneway' || testType === 'twoway' || testType === 'repeated' ? ANOVA_MIN_PER_GROUP : scenarioN),
      note: `${(scenario.targetPower * 100).toFixed(0)}% power to detect your effect`
    };
  });

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
              For effect size {
                testType === 'ttest' ? `d=${effectSize.toFixed(2)}` :
                (testType === 'oneway' || testType === 'twoway') ? `f=${effectSize.toFixed(2)}` :
                testType === 'repeated' ? `f=${effectSize.toFixed(2)}` :
                effectSize.toFixed(2)
              } with {groups} {testType === 'repeated' ? 'timepoints' : 'groups'}
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

      {(testType === 'oneway' || testType === 'twoway' || testType === 'repeated') && requiredN < 20 && (
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> While {requiredN} samples per group may provide 80% statistical power, 
            ANOVA results are most reliable with ≥15 samples per group due to assumptions about normality 
            and homogeneity of variance. Consider increasing your sample size if possible.
          </AlertDescription>
        </Alert>
      )}
      
      {(testType === 'oneway' || testType === 'twoway') && effectSize > 0.8 && (
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Large effect size (f={effectSize}):</strong> This is unusually large for an ANOVA. 
            Typical values are 0.1 (small), 0.25 (medium), 0.4 (large). Verify this is appropriate for your study.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Budget Planning Options</h3>
        </div>
        <div className="space-y-3">
          {budgetScenarios.map((scenario) => (
            <div key={scenario.label} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="font-semibold">{scenario.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">{scenario.note}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">n = {scenario.n}</div>
                  <div className="text-xs text-muted-foreground">per group</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Study Design Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {testType === 'repeated' ? 'Number of Timepoints' : 'Number of Groups'}
            </p>
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

      {(requiredN * groups > 100 || (testType !== 'repeated' && requiredN > 50)) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Large sample sizes ({testType === 'repeated' ? `${requiredN * groups} total measurements` : `${requiredN} per group`}) may be logistically challenging. Consider if a smaller 
            effect size would still be biologically meaningful, or explore alternative designs.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Validation warnings for unrealistic effect sizes */}
      {testType === 'ttest' && Math.abs(effectSize) > 1.5 && (
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Very large effect size (d={effectSize.toFixed(2)}):</strong> Cohen's d values above 1.5 are extremely rare in most fields. 
            Typical values are 0.2 (small), 0.5 (medium), 0.8 (large). Please verify this is realistic for your study.
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
