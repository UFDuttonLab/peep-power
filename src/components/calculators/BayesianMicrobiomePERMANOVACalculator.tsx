import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ControlSlider from '@/components/ControlSlider';
import BayesianAssuranceChart from '@/components/BayesianAssuranceChart';
import { Dna, Brain, Info, Download, Code2, Copy, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { calculateBayesianAssurance, BayesianAssuranceResult } from '@/utils/bayesianPowerCalculations';
import { MICROBIOME_PILOT_GUIDANCE } from '@/constants/bayesianConstants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const BayesianMicrobiomePERMANOVACalculator = () => {
  const { toast } = useToast();
  const [rSquaredMean, setRSquaredMean] = useState(0.08);
  const [rSquaredSD, setRSquaredSD] = useState(0.03);
  const [groups, setGroups] = useState(2);
  const [targetPower, setTargetPower] = useState(0.80);
  const [targetAssurance, setTargetAssurance] = useState(0.80);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<BayesianAssuranceResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const runSimulation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const newResult = calculateBayesianAssurance({
          effectSizeMean: rSquaredMean,
          effectSizeSD: rSquaredSD,
          targetPower,
          targetAssurance,
          testType: 'permanova',
          groups,
          alpha
        });
        setResult(newResult);
        toast({
          title: "Simulation complete",
          description: "Monte Carlo analysis with 5000 samples completed",
        });
      } catch (e) {
        toast({
          title: "Error",
          description: "Simulation failed. Please check your parameters.",
          variant: "destructive",
        });
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  const applyPreset = (preset: 'strong' | 'moderate' | 'subtle') => {
    switch (preset) {
      case 'strong':
        setRSquaredMean(0.15);
        setRSquaredSD(0.05);
        toast({ title: "Preset applied", description: "Strong effect (R²=0.15)" });
        break;
      case 'moderate':
        setRSquaredMean(0.08);
        setRSquaredSD(0.03);
        toast({ title: "Preset applied", description: "Moderate effect (R²=0.08)" });
        break;
      case 'subtle':
        setRSquaredMean(0.03);
        setRSquaredSD(0.02);
        toast({ title: "Preset applied", description: "Subtle effect (R²=0.03)" });
        break;
    }
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'bayesian',
      parameters: {
        effectMean: rSquaredMean,
        effectSD: rSquaredSD,
        targetPower,
        targetAssurance,
        testType: 'permanova',
        groups,
        alpha
      }
    });
    downloadRFile(rCode, 'bayesian_permanova_power.R');
    toast({ title: "R code exported", description: "Ready to run in RStudio" });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'bayesian',
      parameters: {
        effectMean: rSquaredMean,
        effectSD: rSquaredSD,
        targetPower,
        targetAssurance,
        testType: 'permanova',
        groups,
        alpha
      }
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
            <Dna className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Bayesian PERMANOVA Assurance
            </h2>
            <p className="text-muted-foreground">
              Account for uncertainty in R² when planning PERMANOVA analyses of community composition.
              Ensures your sample size is robust to variation in effect sizes across studies.
            </p>
          </div>
        </div>
      </Card>

      <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-500">
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <strong>Why Bayesian?</strong> Effect sizes (R²) vary across studies due to sequencing depth, 
          data processing, and biological variation. Assurance accounts for this uncertainty, giving you 
          sample sizes that work reliably even if your pilot R² was optimistic.
        </AlertDescription>
      </Alert>

      <Collapsible>
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-500">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="font-semibold">📊 How to estimate R² from pilot data</span>
              </div>
              <span className="text-sm text-muted-foreground">Click to expand</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="text-sm space-y-2 whitespace-pre-wrap">
              {MICROBIOME_PILOT_GUIDANCE.betaDiversity}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Quick Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => applyPreset('strong')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Strong Effect</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              R²=0.15 (antibiotic, major diet shift)
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('moderate')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Moderate Effect</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              R²=0.08 (diet change)
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('subtle')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Subtle Effect</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              R²=0.03 (supplement/modest treatment)
            </div>
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prior Beliefs About R²</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                What do you believe about the effect size before collecting data?
              </div>

              <ControlSlider
                id="r-squared-mean"
                label="Expected R² (Mean)"
                value={rSquaredMean}
                onChange={setRSquaredMean}
                min={0.01}
                max={0.30}
                step={0.01}
                tooltip="Proportion of variance explained: 0.02=small, 0.08=medium, 0.15=large"
              />

              <ControlSlider
                id="r-squared-sd"
                label="Uncertainty (Standard Deviation)"
                value={rSquaredSD}
                onChange={setRSquaredSD}
                min={0.01}
                max={0.10}
                step={0.01}
                tooltip="How uncertain are you? Larger SD = larger required sample size"
              />

              <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                <strong>Interpretation:</strong> You believe your treatment explains around{' '}
                <strong>{(rSquaredMean * 100).toFixed(1)}%</strong> of variance in community composition,
                {rSquaredSD < 0.03 ? ' with high confidence' : ' with uncertainty'} ranging from{' '}
                <strong>{Math.max(0.001, rSquaredMean - 1.96 * rSquaredSD).toFixed(3)}</strong> to{' '}
                <strong>{Math.min(0.95, rSquaredMean + 1.96 * rSquaredSD).toFixed(3)}</strong> (95% CI).
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Study Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ControlSlider
                id="groups"
                label="Number of Groups"
                value={groups}
                onChange={setGroups}
                min={2}
                max={6}
                step={1}
                decimals={0}
                tooltip="Number of treatment groups to compare"
                warningThreshold={{
                  min: 3,
                  message: "PERMANOVA needs 8-15 per group for multivariate community data"
                }}
              />

              <ControlSlider
                id="target-power"
                label="Target Statistical Power"
                value={targetPower}
                onChange={setTargetPower}
                min={0.60}
                max={0.95}
                step={0.05}
                tooltip="Probability of detecting an effect if it exists (typically 80%)"
              />

              <ControlSlider
                id="target-assurance"
                label="Target Assurance (Confidence)"
                value={targetAssurance}
                onChange={setTargetAssurance}
                min={0.60}
                max={0.95}
                step={0.05}
                tooltip="Probability of achieving your target power given uncertainty"
              />

              <ControlSlider
                id="alpha"
                label="Significance Level (α)"
                value={alpha}
                onChange={setAlpha}
                min={0.01}
                max={0.10}
                step={0.01}
                tooltip="Probability of Type I error (false positive)"
              />

              <Button
                onClick={runSimulation}
                disabled={isCalculating}
                className="w-full"
                size="lg"
              >
                {isCalculating ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Simulation
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
                    <div className="text-sm text-muted-foreground mb-2">Samples Per Group</div>
                    <div className="text-5xl font-bold text-primary mb-2">
                      {result.requiredN}
                    </div>
                  </div>

                  <div className="mt-4 text-sm" dangerouslySetInnerHTML={{ __html: result.summary }} />

                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      This accounts for uncertainty in R² and ensures reliable detection even if pilot estimates were optimistic.
                    </AlertDescription>
                  </Alert>

                  <Alert className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-500">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Computation:</strong> 5,000 Monte Carlo iterations across 59 sample sizes 
                      + 100 bootstrap replicates for confidence intervals. Shaded region shows 95% confidence bounds.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-3 gap-2 mt-4">
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
                  <CardTitle>Assurance Curve with Confidence Intervals</CardTitle>
                </CardHeader>
                <CardContent>
                  <BayesianAssuranceChart
                    data={result.assuranceCurve.map(d => ({ x: d.n, y: d.assurance }))}
                    confidenceRegions={result.confidenceRegions}
                    currentValue={result.requiredN}
                    xLabel="Samples Per Group"
                    title="Assurance vs Sample Size"
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Dna className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure parameters and run simulation to see required sample size</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BayesianMicrobiomePERMANOVACalculator;
