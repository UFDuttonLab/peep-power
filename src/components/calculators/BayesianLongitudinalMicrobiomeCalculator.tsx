import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ControlSlider from '@/components/ControlSlider';
import BayesianAssuranceChart from '@/components/BayesianAssuranceChart';
import TimelineVisualization from '@/components/TimelineVisualization';
import { Clock, Brain, Info, Download, Code2, Copy, Play, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { MICROBIOME_PILOT_GUIDANCE } from '@/constants/bayesianConstants';
import { calculateLongitudinalAssurance } from '@/utils/bayesianPowerCalculations';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

type AssuranceResult = ReturnType<typeof calculateLongitudinalAssurance>;

const BayesianLongitudinalMicrobiomeCalculator = () => {
  const { toast } = useToast();
  const [effectSizeMean, setEffectSizeMean] = useState(0.25);
  const [effectSizeSD, setEffectSizeSD] = useState(0.10);
  const [nTimepoints, setNTimepoints] = useState(4);
  const [withinCorr, setWithinCorr] = useState(0.6);
  const [dropoutRate, setDropoutRate] = useState(0.1);
  const [targetPower, setTargetPower] = useState(0.80);
  const [targetAssurance, setTargetAssurance] = useState(0.80);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<AssuranceResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);

  const runSimulation = async () => {
    setIsCalculating(true);
    setProgress(0);
    // Let the UI show the busy state before the (fast, deterministic) calculation
    await new Promise(resolve => setTimeout(resolve, 20));
    try {
      setResult(calculateLongitudinalAssurance({ effectSizeMean, effectSizeSD, nTimepoints, withinCorr, dropoutRate, targetPower, targetAssurance, alpha }));
      setProgress(100);
      toast({
        title: "Calculation complete",
        description: "Assurance calculated exactly over the prior (no simulation noise)",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Calculation failed",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
      setProgress(0);
    }
  };

  const applyPreset = (preset: 'antibiotic' | 'diet' | 'disease') => {
    switch (preset) {
      case 'antibiotic':
        setNTimepoints(3);
        setEffectSizeMean(0.4);
        setEffectSizeSD(0.12);
        setWithinCorr(0.8);
        setDropoutRate(0.05);
        toast({ title: "Preset applied", description: "Antibiotic trial" });
        break;
      case 'diet':
        setNTimepoints(6);
        setEffectSizeMean(0.25);
        setEffectSizeSD(0.10);
        setWithinCorr(0.6);
        setDropoutRate(0.15);
        toast({ title: "Preset applied", description: "Diet intervention" });
        break;
      case 'disease':
        setNTimepoints(10);
        setEffectSizeMean(0.2);
        setEffectSizeSD(0.08);
        setWithinCorr(0.4);
        setDropoutRate(0.20);
        toast({ title: "Preset applied", description: "Disease progression" });
        break;
    }
  };

  const exportToCSV = () => {
    if (!result) return;
    const csv = [
      ['Sample Size', 'Assurance', 'Expected Power'],
      ...result.assuranceCurve.map((d) => [d.n, d.assurance, d.expectedPower]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bayesian_longitudinal_microbiome_assurance.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: "Assurance curve data downloaded" });
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'bayesian-microbiome-lmm',
      parameters: { effectSizeMean, effectSizeSD, nTimepoints, withinCorr, dropoutRate, targetPower, targetAssurance, alpha }
    });
    downloadRFile(rCode, 'bayesian_lmm_microbiome_power.R');
    toast({ title: "R code exported", description: "Ready to run in RStudio" });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'bayesian-microbiome-lmm',
      parameters: { effectSizeMean, effectSizeSD, nTimepoints, withinCorr, dropoutRate, targetPower, targetAssurance, alpha }
    });
    const success = await copyToClipboard(rCode);
    if (success) {
      toast({ title: "Copied to clipboard", description: "R code ready to paste" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Bayesian Longitudinal Microbiome Assurance
            </h2>
            <p className="text-muted-foreground">
              Account for uncertainty in time × treatment interactions when planning longitudinal microbiome
              studies. Ensures robust sample sizes even if pilot estimates of effect trajectories are uncertain.
            </p>
          </div>
        </div>
      </Card>

      <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-500">
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <strong>Why Bayesian for longitudinal microbiome?</strong> Temporal dynamics in microbiome studies
          are highly variable. Diet changes might show effects at week 2 or week 6. Bayesian assurance
          accounts for this uncertainty in effect timing and magnitude, giving you realistic sample sizes.
        </AlertDescription>
      </Alert>

      <Collapsible>
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-500">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="font-semibold">📊 Planning longitudinal microbiome studies</span>
              </div>
              <span className="text-sm text-muted-foreground">Click to expand</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="text-sm space-y-2 whitespace-pre-wrap">
              {MICROBIOME_PILOT_GUIDANCE.longitudinal}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Quick Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => applyPreset('antibiotic')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Antibiotic Trial</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              3 timepoints, strong effect
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('diet')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Diet Intervention</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              6 timepoints, moderate effect
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('disease')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Disease Progression</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              10 timepoints, subtle effect
            </div>
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prior Beliefs About Effect Size</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Time × treatment interaction effect (Cohen's f)
              </div>

              <ControlSlider
                id="effect-mean"
                label="Expected Effect Size (Mean)"
                value={effectSizeMean}
                onChange={setEffectSizeMean}
                min={0.1}
                max={1.0}
                step={0.05}
                tooltip="0.1=small, 0.25=medium, 0.4=large"
              />

              <ControlSlider
                id="effect-sd"
                label="Uncertainty (SD)"
                value={effectSizeSD}
                onChange={setEffectSizeSD}
                min={0.02}
                max={0.3}
                step={0.02}
                tooltip="How uncertain about temporal effect?"
              />

              <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                <strong>Effect size:</strong> {effectSizeMean >= 0.4 ? 'Large' : effectSizeMean >= 0.25 ? 'Medium' : 'Small'}
                <br />
                <strong>95% CI:</strong> {Math.max(0.05, effectSizeMean - 1.96 * effectSizeSD).toFixed(2)} to{' '}
                {(effectSizeMean + 1.96 * effectSizeSD).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Study Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ControlSlider
                id="timepoints"
                label="Timepoints per Subject"
                value={nTimepoints}
                onChange={setNTimepoints}
                min={2}
                max={10}
                step={1}
                decimals={0}
              />

              <ControlSlider
                id="within-corr"
                label="Within-Subject Correlation"
                value={withinCorr}
                onChange={setWithinCorr}
                min={0}
                max={0.95}
                step={0.05}
                tooltip="0.6-0.8 typical for microbiome"
              />

              <ControlSlider
                id="dropout"
                label="Dropout Rate per Timepoint"
                value={dropoutRate}
                onChange={setDropoutRate}
                min={0}
                max={0.3}
                step={0.05}
              />

              <ControlSlider
                id="target-power"
                label="Target Power"
                value={targetPower}
                onChange={setTargetPower}
                min={0.60}
                max={0.95}
                step={0.05}
              />

              <ControlSlider
                id="target-assurance"
                label="Target Assurance"
                value={targetAssurance}
                onChange={setTargetAssurance}
                min={0.60}
                max={0.95}
                step={0.05}
              />

              <ControlSlider
                id="alpha"
                label="Significance Level (α)"
                value={alpha}
                onChange={setAlpha}
                min={0.01}
                max={0.10}
                step={0.01}
              />

              <Button
                onClick={runSimulation}
                disabled={isCalculating}
                className="w-full"
                size="lg"
              >
                {isCalculating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    <span>Calculating... {progress.toFixed(0)}%</span>
                  </div>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Bayesian Simulation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {result ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Required Sample Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-6 bg-primary/5 rounded-lg border-2 border-primary">
                    <div className="text-sm text-muted-foreground mb-2">Starting Subjects (total, both groups)</div>
                    <div className="text-5xl font-bold text-primary mb-2">
                      {result.reached ? result.requiredN : `>${result.maxSearchN}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expected completers: {result.expectedCompleters} ({(result.totalDropout * 100).toFixed(0)}% total dropout)
                    </div>
                  </div>

                  <div className="mt-4 text-sm font-medium">{result.summary}</div>

                  <Alert className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-500">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Computation:</strong> exact noncentral F power for the time x treatment interaction
                      (completers only), averaged exactly over the effect-size prior. The shaded region shows how assurance
                      changes if the prior SD is 25% smaller or larger.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <Button onClick={exportToCSV} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                    <Button onClick={exportToR} variant="outline" size="sm">
                      <Code2 className="mr-2 h-4 w-4" />
                      R Code
                    </Button>
                    <Button onClick={copyRCode} variant="outline" size="sm">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Assurance Curve with Prior Sensitivity</CardTitle>
                    <FormulaDisplay formula={FORMULAS.LINEAR_MIXED_MODEL} buttonVariant="ghost" />
                  </div>
                </CardHeader>
                <CardContent>
                  <BayesianAssuranceChart
                    data={result.assuranceCurve.map(d => ({ x: d.n, y: d.assurance }))}
                    confidenceRegions={result.confidenceRegions}
                    bandLabel="Assurance if the prior SD is 25% smaller or larger"
                    target={targetAssurance}
                    currentValue={result.requiredN}
                    xLabel="Starting Subjects"
                    title="Assurance vs Sample Size"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timeline & Retention</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimelineVisualization
                    nTimepoints={nTimepoints}
                    dropoutRate={dropoutRate}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure and run simulation</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BayesianLongitudinalMicrobiomeCalculator;
