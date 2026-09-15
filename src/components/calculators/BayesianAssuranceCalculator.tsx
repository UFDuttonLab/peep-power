import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ControlSlider from '@/components/ControlSlider';
import BayesianAssuranceChart from '@/components/BayesianAssuranceChart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Brain, Download, Code2, Copy, Play, Dna, AlertCircle } from 'lucide-react';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { calculateBayesianAssurance, BayesianAssuranceResult } from '@/utils/bayesianPowerCalculations';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

export const BayesianAssuranceCalculator = () => {
  const { toast } = useToast();
  const [effectSizeMean, setEffectSizeMean] = useState(0.5);
  const [effectSizeSD, setEffectSizeSD] = useState(0.2);
  const [targetPower, setTargetPower] = useState(0.80);
  const [targetAssurance, setTargetAssurance] = useState(0.80);
  const [testType, setTestType] = useState<'ttest' | 'anova' | 'correlation' | 'permanova'>('ttest');
  const [groups, setGroups] = useState(2);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<BayesianAssuranceResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const runSimulation = () => {
    setIsCalculating(true);
    setProgress(0);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 15, 90));
    }, 200);
    
    // Use setTimeout to allow UI to update before heavy calculation
    setTimeout(() => {
      try {
        const newResult = calculateBayesianAssurance({
          effectSizeMean,
          effectSizeSD,
          targetPower,
          targetAssurance,
          testType,
          groups: (testType === 'anova' || testType === 'permanova') ? groups : undefined,
          alpha
        });
        clearInterval(progressInterval);
        setProgress(100);
        setResult(newResult);
        toast({
          title: "Simulation complete",
          description: `Assurance calculated for sample sizes up to ${newResult.maxSearchN}`,
        });
      } catch (e) {
        console.error('Bayesian calculation error:', e);
        clearInterval(progressInterval);
        toast({
          title: "Simulation failed",
          description: "An error occurred during the calculation",
          variant: "destructive",
        });
      } finally {
        setTimeout(() => {
          setIsCalculating(false);
          setProgress(0);
        }, 500);
      }
    }, 100);
  };
  
  const exportResults = () => {
    if (!result) return;
    const csv = [
      ['Sample Size', 'Assurance', 'Expected Power'],
      ...result.assuranceCurve.map((d) => [d.n, d.assurance, d.expectedPower]),
    ]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bayesian-assurance-analysis.csv';
    a.click();
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'bayesian',
      parameters: { 
        effectMean: effectSizeMean, 
        effectSD: effectSizeSD, 
        targetPower, 
        targetAssurance, 
        testType, 
        groups, 
        alpha 
      }
    });
    downloadRFile(rCode, 'bayesian_assurance_analysis.R');
    toast({
      title: "R code exported",
      description: "You can now run this analysis in R/RStudio",
    });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'bayesian',
      parameters: { 
        effectMean: effectSizeMean, 
        effectSD: effectSizeSD, 
        targetPower, 
        targetAssurance, 
        testType, 
        groups, 
        alpha 
      }
    });
    const success = await copyToClipboard(rCode);
    if (success) {
      toast({
        title: "Copied to clipboard",
        description: "R code is ready to paste into RStudio",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-500">
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <strong>Bayesian Assurance Calculator</strong>: Unlike traditional power analysis, 
          this accounts for <strong>uncertainty about the effect size</strong>. If you're not 
          100% sure what the true effect is, Bayesian assurance gives you the probability of 
          achieving your target power. Set your parameters below, then click "Run Simulation"; 
          assurance is calculated exactly from the prior (no simulation noise).
        </AlertDescription>
      </Alert>

      {testType === 'permanova' && (
        <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-500">
          <Dna className="h-4 w-4" />
          <AlertTitle>Microbiome-Specific Guidance</AlertTitle>
          <AlertDescription>
            PERMANOVA effect sizes (R²) are typically smaller than univariate analyses. 
            R² = 0.08 (8% variance explained) is considered a <strong>medium effect</strong> in microbiome research. 
            High within-group variability means you need larger sample sizes than traditional physiology studies.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prior Beliefs About Effect Size</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                What do you believe about the effect size <strong>before</strong> collecting data?
              </div>
              
              <ControlSlider
                id="effect-size-mean"
                label="Expected Effect Size (Mean)"
                value={effectSizeMean}
                onChange={setEffectSizeMean}
                min={testType === 'correlation' ? -0.99 : testType === 'permanova' ? 0.01 : 0.1}
                max={testType === 'correlation' ? 0.99 : testType === 'permanova' ? 0.30 : 2.0}
                step={testType === 'permanova' ? 0.01 : 0.05}
                tooltip={
                  testType === 'correlation' 
                    ? 'Expected correlation coefficient (r)' 
                    : testType === 'permanova'
                    ? "R² (variance explained): 0.02=small, 0.08=medium, 0.15=large"
                    : testType === 'ttest' 
                    ? "Cohen's d: 0.2=small, 0.5=medium, 0.8=large" 
                    : "Cohen's f: 0.1=small, 0.25=medium, 0.4=large"
                }
              />
              
              <ControlSlider
                id="effect-size-sd"
                label="Uncertainty (Standard Deviation)"
                value={effectSizeSD}
                onChange={setEffectSizeSD}
                min={0.01}
                max={testType === 'permanova' ? 0.1 : 0.5}
                step={0.01}
                tooltip="How uncertain are you? Larger SD = more uncertainty = larger required sample size"
              />
              
              <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                {testType === 'permanova' ? (
                  <>
                    <strong>Interpretation:</strong> You believe your treatment explains around{' '}
                    <strong>{(effectSizeMean * 100).toFixed(1)}%</strong> of the variance in community composition 
                    (R²={effectSizeMean.toFixed(3)})
                    {effectSizeSD < 0.05 ? (
                      <span>, with high confidence between </span>
                    ) : (
                      <span>, but with uncertainty ranging from </span>
                    )}
                    <strong>{Math.max(0.001, effectSizeMean - 1.96*effectSizeSD).toFixed(3)}</strong> to{' '}
                    <strong>{Math.min(0.95, effectSizeMean + 1.96*effectSizeSD).toFixed(3)}</strong> (95% CI).
                  </>
                ) : (
                  <>
                    <strong>Interpretation:</strong> You believe the effect size is around <strong>{effectSizeMean.toFixed(2)}</strong>
                    {effectSizeSD < 0.1 ? (
                      <span>, and you're quite confident it's between </span>
                    ) : effectSizeSD < 0.2 ? (
                      <span>, with moderate uncertainty between </span>
                    ) : (
                      <span>, but with substantial uncertainty it could range from </span>
                    )}
                    <strong>{Math.max(0.01, effectSizeMean - 1.96*effectSizeSD).toFixed(2)}</strong> to <strong>{(effectSizeMean + 1.96*effectSizeSD).toFixed(2)}</strong> 
                    (95% credible interval{(effectSizeMean - 1.96*effectSizeSD) < 0 ? ', truncated at 0' : ''}).
                  </>
                )}
              </div>
              
              {testType === 'permanova' && (
                <div className="mt-3 p-3 bg-background/50 rounded-lg border">
                  <h4 className="text-xs font-semibold mb-2">Common Microbiome Scenarios</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEffectSizeMean(0.15); setEffectSizeSD(0.05); }}
                      className="text-xs"
                    >
                      Strong (R²=0.15)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEffectSizeMean(0.08); setEffectSizeSD(0.03); }}
                      className="text-xs"
                    >
                      Moderate (R²=0.08)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEffectSizeMean(0.03); setEffectSizeSD(0.02); }}
                      className="text-xs"
                    >
                      Subtle (R²=0.03)
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Strong: antibiotics/major treatment | Moderate: diet change | Subtle: supplement
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Target Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                tooltip="Probability of achieving your target power given uncertainty (e.g., 80% sure of getting 80% power)"
              />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Test Type</label>
                <Select value={testType} onValueChange={(v: any) => setTestType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ttest">Two-Sample T-Test</SelectItem>
                    <SelectItem value="anova">One-Way ANOVA</SelectItem>
                    <SelectItem value="correlation">Correlation</SelectItem>
                    <SelectItem value="permanova">PERMANOVA (Microbiome)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(testType === 'anova' || testType === 'permanova') && (
                <ControlSlider
                  id="groups"
                  label="Number of Groups"
                  value={groups}
                  onChange={setGroups}
                  min={2}
                  max={6}
                  step={1}
                  decimals={0}
                />
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Significance Level (α)</label>
                <Select value={alpha.toString()} onValueChange={(v) => setAlpha(parseFloat(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.01">0.01</SelectItem>
                    <SelectItem value="0.05">0.05</SelectItem>
                    <SelectItem value="0.10">0.10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={runSimulation} 
                disabled={isCalculating}
                className="w-full mt-4"
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
                    Run Simulation
                  </>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground text-center mt-2">
                Exact calculation over the prior, results are identical on every run
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right: Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Required Sample Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-6 bg-primary/5 rounded-lg border-2 border-primary">
                    <div className="text-sm text-muted-foreground mb-2">Sample Size Needed</div>
                    <div className="text-5xl font-bold text-primary mb-2">
                      {result.reached ? result.requiredN : `>${result.maxSearchN}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testType === 'correlation' ? 'total' : 'per group'}
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm font-medium">{result.summary}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Assurance Curve with Prior Sensitivity</CardTitle>
                    <FormulaDisplay formula={FORMULAS.BAYESIAN_ASSURANCE} buttonVariant="ghost" />
                  </div>
                </CardHeader>
                <CardContent>
                  <BayesianAssuranceChart
                    data={result.assuranceCurve.map(d => ({ x: d.n, y: d.assurance }))}
                    confidenceRegions={result.confidenceRegions}
                    bandLabel="Assurance if the prior SD is 25% smaller or larger"
                    target={targetAssurance}
                    currentValue={result.requiredN}
                    xLabel={`Sample Size ${testType === 'correlation' ? '(Total)' : '(per Group)'}`}
                    title="Assurance vs Sample Size"
                  />
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    Shaded region shows how assurance changes if the prior SD is 25% smaller or larger
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Prior Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-40 relative">
                    <svg width="100%" height="160" className="border rounded bg-muted/30">
                      {/* X-axis */}
                      <line x1="40" y1="140" x2="100%" y2="140" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                      {/* Y-axis */}
                      <line x1="40" y1="10" x2="40" y2="140" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                      
                      {/* Prior distribution curve */}
                      {result.priorDistribution.length > 0 && (
                        <path
                          d={`M ${result.priorDistribution.map((d, i) => {
                            const x = 40 + (i / result.priorDistribution.length) * 300;
                            const y = 140 - (d.density / Math.max(...result.priorDistribution.map(p => p.density))) * 120;
                            return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                          }).join(' ')}`}
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          fill="hsl(var(--primary))"
                          fillOpacity="0.2"
                        />
                      )}
                      
                      {/* Labels */}
                      <text x="50%" y="155" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">
                        Effect Size
                      </text>
                      <text x="30" y="145" textAnchor="end" fontSize="10" fill="currentColor" opacity="0.6">
                        0
                      </text>
                    </svg>
                  </div>
                  <div className="text-xs text-center text-muted-foreground mt-2">
                    Your prior belief about the distribution of possible effect sizes
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={exportResults} variant="outline" size="sm">
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
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  Configure your parameters and click "Run Simulation" to calculate 
                  the required sample size with Bayesian assurance.
                </p>
                <p className="text-xs text-muted-foreground">
                  Assurance is the probability, under your prior, that the study reaches the target power.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Why use Bayesian assurance?</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Accounts for uncertainty:</strong> Traditional power assumes you know the exact effect size, which is unrealistic</li>
            <li><strong>More realistic:</strong> Effect sizes vary between studies due to biological variation, measurement error, etc.</li>
            <li><strong>Grant-friendly:</strong> Shows reviewers you've considered uncertainty in your planning</li>
            <li><strong>Conservative:</strong> Protects against under-powered studies by increasing sample size when effect is uncertain</li>
            <li><strong>Decision-theoretic:</strong> Explicitly incorporates your prior knowledge and risk tolerance</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BayesianAssuranceCalculator;
