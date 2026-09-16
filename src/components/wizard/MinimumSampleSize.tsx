import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, TrendingUp, RotateCcw, ArrowRight } from 'lucide-react';
import { TestType } from './wizardConfig';
import { calculateRequiredSampleSize } from '@/utils/powerCalculations';
import {
  MAX_SEARCH_N,
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

/** Upper bound of calculateRequiredSampleSize's search. */
const GENERAL_SEARCH_CAP = 100000;

/** Display a required sample size; Infinity means the target was not reached within `cap`. */
const formatN = (n: number, cap: number): string => {
  if (Number.isNaN(n)) return 'N/A';
  if (!Number.isFinite(n)) return `> ${cap.toLocaleString()}`;
  return n.toLocaleString();
};

/** Display n multiplied by a design factor without multiplying Infinity/NaN into a number. */
const formatTotal = (n: number, multiplier: number, cap: number): string => {
  if (Number.isNaN(n)) return 'N/A';
  if (!Number.isFinite(n)) return `> ${(cap * multiplier).toLocaleString()}`;
  return (n * multiplier).toLocaleString();
};

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
    if (!Number.isFinite(n)) return { level: 'large', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20' };
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
              <div className="text-5xl font-bold mb-2">{formatN(requiredN, MAX_SEARCH_N)}</div>
              <p className="text-lg font-medium">samples per group</p>
              <p className="text-sm text-muted-foreground mt-2">
                For log₂FC = {log2FC.toFixed(2)} with {numTests} taxa tested
              </p>
            </div>
            <Alert className="text-left bg-background/80">
              <AlertDescription>
                This gives you <strong>80% power</strong> to detect a <strong>{Math.pow(2, Math.abs(log2FC)).toFixed(2)}-fold change</strong>
                {' '}in abundance at Bonferroni-adjusted α = {(alpha / numTests).toFixed(4)}.
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
                  <p className="text-2xl font-bold">{formatN(scenario.n, MAX_SEARCH_N)}</p>
                  <p className="text-sm text-muted-foreground">per group</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: {formatTotal(scenario.n, groups, MAX_SEARCH_N)}
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
              <p className="font-medium">{formatTotal(requiredN, groups, MAX_SEARCH_N)}</p>
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
    
    // Smallest n per group with power >= target (linear scan; Infinity if not reached by the cap)
    const calculateZINBN = (target: number): number => {
      for (let n = 2; n <= MAX_SEARCH_N; n++) {
        if (calculateZINBPower(n, zeroInflation, baseMean, dispersion, log2FC, alpha / numTests, 'both') >= target) {
          return n;
        }
      }
      return Infinity;
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
              <div className="text-5xl font-bold mb-2">{formatN(requiredN, MAX_SEARCH_N)}</div>
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
                  <p className="text-2xl font-bold">{formatN(scenario.n, MAX_SEARCH_N)}</p>
                  <p className="text-sm text-muted-foreground">per group</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: {formatTotal(scenario.n, groups, MAX_SEARCH_N)}
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
              <p className="font-medium">{formatTotal(requiredN, groups, MAX_SEARCH_N)}</p>
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
    
    // effectSize arrives as Cohen's f (converted in HoldMyHandCalculator)
    const cohensF = effectSize;
    
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
              <div className="text-5xl font-bold mb-2">{formatN(requiredN, MAX_SEARCH_N)}</div>
              <p className="text-lg font-medium">subjects needed (total, 2 groups)</p>
              <p className="text-sm text-muted-foreground mt-2">
                Measured at {nTimepoints} timepoints (total: {formatTotal(requiredN, nTimepoints, MAX_SEARCH_N)} samples)
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
                  <p className="text-2xl font-bold">{formatN(scenario.n, MAX_SEARCH_N)}</p>
                  <p className="text-sm text-muted-foreground">subjects</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total samples: {formatTotal(scenario.n, nTimepoints, MAX_SEARCH_N)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Dropout considerations:</strong> The subject numbers above are enrollment targets. They already
            assume {(dropoutRate * 100).toFixed(0)}% of subjects are lost by the final timepoint, so no further
            inflation is needed. Use intention-to-treat analysis and multiple imputation for missing data.
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
              <p className="font-medium">{formatN(requiredN, MAX_SEARCH_N)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Number of Timepoints</p>
              <p className="font-medium">{nTimepoints}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Measurements</p>
              <p className="font-medium">{formatTotal(requiredN, nTimepoints, MAX_SEARCH_N)}</p>
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
    const timepoints = groups; // For repeated-microbiome, "groups" is the number of timepoints
    const correlation = 0.5; // Assumed within-subject correlation (compound symmetry)

    // Same model as the Repeated Measures PERMANOVA calculator: lambda = f² · N · m / (1 − ρ), f² = R²/(1 − R²)
    const minSubjects = calculateRequiredSampleSize(
      effectSize, targetPower, alpha, 'repeated-permanova', undefined, { timepoints, correlation }
    );

    const sizeInfo = getSizeCategory(minSubjects);
    const totalMeasurementsText = formatTotal(minSubjects, timepoints, GENERAL_SEARCH_CAP);
    
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
              <div className="text-5xl font-bold mb-2">{formatN(minSubjects, GENERAL_SEARCH_CAP)}</div>
              <p className="text-lg font-medium">independent subjects</p>
              <p className="text-sm text-muted-foreground mt-2">
                Measured at {timepoints} timepoint{timepoints > 1 ? 's' : ''} each
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total measurements: {totalMeasurementsText}
              </p>
            </div>
            <Alert className="text-left">
              <AlertDescription>
                This gives you <strong>80% power</strong> (α = 0.05) to detect R²={effectSize.toFixed(2)} variance explained
                across {timepoints} repeated measurements. Assumptions: within-subject correlation ρ = {correlation},
                compound symmetry (sphericity), no dropout, and a PERMANOVA pseudo-F that behaves like a parametric F test.
                Add extra subjects to cover expected dropout.
              </AlertDescription>
            </Alert>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Study Design Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Independent Subjects</p>
              <p className="text-xl font-bold">{formatN(minSubjects, GENERAL_SEARCH_CAP)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Timepoints per Subject</p>
              <p className="text-xl font-bold">{timepoints}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Measurements</p>
              <p className="text-xl font-bold">{totalMeasurementsText}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Expected Effect (R²)</p>
              <p className="text-xl font-bold">{(effectSize * 100).toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <AlertDescription>
            <strong>Important:</strong> Your sample size is {formatN(minSubjects, GENERAL_SEARCH_CAP)} <strong>subjects</strong>, not {totalMeasurementsText} samples.
            Each subject is measured {timepoints} times. This accounts for within-subject correlation (assumed ρ = {correlation}).
            If your correlation is lower than {correlation}, you will need more subjects.
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
  
  // Special handling for microbiome (PERMANOVA) - uses correct PERMANOVA power calculation
  if (testType === 'microbiome') {
    const requiredN = calculateRequiredSampleSize(effectSize, targetPower, alpha, 'permanova', groups);

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
              <div className="text-5xl font-bold mb-2">{formatN(requiredN, GENERAL_SEARCH_CAP)}</div>
              <p className="text-lg font-medium">samples per group</p>
              <p className="text-sm text-muted-foreground mt-2">
                For R²={effectSize.toFixed(2)} with {groups} groups
              </p>
            </div>
            <Alert className="text-left">
              <AlertDescription>
                This gives you <strong>at least 80% power</strong> to detect R²={effectSize.toFixed(2)} variance explained 
                with PERMANOVA at α = 0.05.
              </AlertDescription>
            </Alert>
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
              <p className="text-xl font-bold">{formatTotal(requiredN, groups, GENERAL_SEARCH_CAP)}</p>
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
              <div className="text-5xl font-bold mb-2">{formatN(totalN, GENERAL_SEARCH_CAP)}</div>
              <p className="text-lg font-medium">total samples needed</p>
              <p className="text-sm text-muted-foreground mt-2">
                To detect correlation ρ={effectSize.toFixed(3)}
              </p>
            </div>
            <Alert className="text-left">
              <AlertDescription>
                This gives you <strong>80% power</strong> to detect a correlation of <strong>ρ={effectSize.toFixed(3)}</strong> at α = 0.05.
              </AlertDescription>
            </Alert>
          </div>
        </Card>

        {effectSize > 0.7 && (
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Large correlation (r={effectSize.toFixed(3)}):</strong> Correlations above 0.7 are rare in ecology and biological sciences. 
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
              <div className="text-5xl font-bold mb-2">{formatN(totalN, GENERAL_SEARCH_CAP)}</div>
              <p className="text-lg font-medium">total samples needed</p>
              <p className="text-sm text-muted-foreground mt-2">
                For effect size w={effectSize.toFixed(3)}
              </p>
            </div>
            <Alert className="text-left">
              <AlertDescription>
                This gives you <strong>80% power</strong> to detect an effect size of w={effectSize.toFixed(3)}{' '}
                with {groups} categories (df = {groups - 1}) at α = 0.05.
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
              <strong>Large effect size (w={effectSize.toFixed(3)}):</strong> Cohen's w values above 0.5 are very large. 
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

  // Remaining designs: ttest (d, n per group), oneway (f, n per group),
  // twoway (f, one-way omnibus across all cells, n per cell), repeated (f, subjects)
  const isRepeated = testType === 'repeated';
  const isTwoWay = testType === 'twoway';
  const rmCorrelation = 0.5; // Assumed within-subject correlation for repeated measures

  const nFor = (target: number): number => {
    if (isRepeated) {
      return calculateRequiredSampleSize(
        effectSize, target, alpha, 'repeated-measures', undefined,
        { timepoints: groups, correlation: rmCorrelation }
      );
    }
    if (testType === 'ttest') {
      return calculateRequiredSampleSize(effectSize, target, alpha, 'ttest');
    }
    // oneway, twoway (cells treated as groups); other test types never reach this point
    return calculateRequiredSampleSize(effectSize, target, alpha, 'anova', groups);
  };

  const requiredN = nFor(targetPower);
  const requiredNText = formatN(requiredN, GENERAL_SEARCH_CAP);
  const totalText = formatTotal(requiredN, groups, GENERAL_SEARCH_CAP);
  const unitLabel = isRepeated ? 'subjects' : isTwoWay ? 'samples per cell' : 'samples per group';
  const groupLabel = isRepeated ? 'timepoints' : isTwoWay ? 'cells (factor-level combinations)' : 'groups';

  const sizeInfo = getSizeCategory(requiredN);
  const isLarge = !Number.isFinite(requiredN) ||
    (isRepeated ? requiredN > 100 : (requiredN * groups > 100 || requiredN > 50));

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
            <div className="text-5xl font-bold mb-2">{requiredNText}</div>
            <p className="text-lg font-medium">{unitLabel}</p>
            <p className="text-sm text-muted-foreground mt-2">
              For effect size {testType === 'ttest' ? `d=${effectSize.toFixed(3)}` : `f=${effectSize.toFixed(3)}`} with {groups} {groupLabel}
            </p>
          </div>
          <Alert className="text-left">
            <AlertDescription>
              This gives you <strong>80% power</strong> to detect your expected effect at the standard
              significance level (α = 0.05).
              {isRepeated && (
                <>
                  {' '}Each subject is measured at all {groups} timepoints. Assumptions: within-subject
                  correlation ρ = {rmCorrelation}, sphericity, and no dropout. Lower correlation requires more subjects.
                </>
              )}
              {isTwoWay && (
                <>
                  {' '}For two factors this treats every factor-level combination as one of {groups} groups and
                  plans for the omnibus test across cells. Power for a specific main effect or the interaction
                  can differ; use the Two-Way ANOVA calculator for those.
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </Card>

      {(testType === 'oneway' || testType === 'twoway') && Number.isFinite(requiredN) && requiredN < 15 && (
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> While {requiredNText} samples per {isTwoWay ? 'cell' : 'group'} may provide 80% statistical power,
            ANOVA results are most reliable with at least 15 samples per group due to assumptions about normality
            and homogeneity of variance. Consider increasing your sample size if possible.
          </AlertDescription>
        </Alert>
      )}

      {(testType === 'oneway' || testType === 'twoway' || isRepeated) && effectSize > 0.8 && (
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Large effect size (f={effectSize.toFixed(2)}):</strong> This is unusually large for an ANOVA.
            Typical values are 0.1 (small), 0.25 (medium), 0.4 (large). Verify this is appropriate for your study.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Study Design Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {isRepeated ? 'Number of Timepoints' : isTwoWay ? 'Number of Cells' : 'Number of Groups'}
            </p>
            <p className="text-xl font-bold">{groups}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Expected Effect Size</p>
            <p className="text-xl font-bold">{effectSize.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {isRepeated ? 'Total Measurements' : 'Total Sample Size'}
            </p>
            <p className="text-xl font-bold">{totalText}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Statistical Power</p>
            <p className="text-xl font-bold">80%</p>
          </div>
        </div>
      </Card>

      {isLarge && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Large sample sizes ({isRepeated ? `${requiredNText} subjects, ${totalText} total measurements` : `${requiredNText} ${unitLabel}`}) may be logistically challenging. Consider if a smaller
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
