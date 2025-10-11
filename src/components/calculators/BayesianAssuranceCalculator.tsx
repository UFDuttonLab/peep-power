import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ControlSlider from '@/components/ControlSlider';
import BayesianAssuranceChart from '@/components/BayesianAssuranceChart';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Brain, Download, Code2, Copy, Play } from 'lucide-react';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { calculateBayesianAssurance, BayesianAssuranceResult } from '@/utils/bayesianPowerCalculations';

export const BayesianAssuranceCalculator = () => {
  const { toast } = useToast();
  const [effectSizeMean, setEffectSizeMean] = useState(0.5);
  const [effectSizeSD, setEffectSizeSD] = useState(0.2);
  const [targetPower, setTargetPower] = useState(0.80);
  const [targetAssurance, setTargetAssurance] = useState(0.80);
  const [testType, setTestType] = useState<'ttest' | 'anova' | 'correlation'>('ttest');
  const [groups, setGroups] = useState(2);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<BayesianAssuranceResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const runSimulation = () => {
    setIsCalculating(true);
    // Use setTimeout to allow UI to update before heavy calculation
    setTimeout(() => {
      try {
        const newResult = calculateBayesianAssurance({
          effectSizeMean,
          effectSizeSD,
          targetPower,
          targetAssurance,
          testType,
          groups: testType === 'anova' ? groups : undefined,
          alpha
        });
        setResult(newResult);
        toast({
          title: "Simulation complete",
          description: `Monte Carlo simulation with 5000 samples completed successfully`,
        });
      } catch (e) {
        console.error('Bayesian calculation error:', e);
        toast({
          title: "Simulation failed",
          description: "An error occurred during the calculation",
          variant: "destructive",
        });
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };
  
  const exportResults = () => {
    if (!result) return;
    const csv = [
      ['Sample Size', 'Assurance'],
      ...result.assuranceCurve.map((d) => [d.n, d.assurance]),
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
          achieving your target power. Set your parameters below, then click "Run Simulation" 
          to perform Monte Carlo analysis (5000 samples).
        </AlertDescription>
      </Alert>
      
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
                min={0.1}
                max={2.0}
                step={0.05}
                tooltip={testType === 'correlation' ? 'Expected correlation coefficient (r)' : testType === 'ttest' ? "Cohen's d: 0.2=small, 0.5=medium, 0.8=large" : "Cohen's f: 0.1=small, 0.25=medium, 0.4=large"}
              />
              
              <ControlSlider
                id="effect-size-sd"
                label="Uncertainty (Standard Deviation)"
                value={effectSizeSD}
                onChange={setEffectSizeSD}
                min={0.05}
                max={0.5}
                step={0.05}
                tooltip="How uncertain are you? Larger SD = more uncertainty = larger required sample size"
              />
              
              <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                <strong>Interpretation:</strong> You believe the effect size is around <strong>{effectSizeMean.toFixed(2)}</strong>, 
                but it could reasonably be between <strong>{Math.max(0, effectSizeMean - 1.96*effectSizeSD).toFixed(2)}</strong> and <strong>{(effectSizeMean + 1.96*effectSizeSD).toFixed(2)}</strong> 
                (95% credible interval).
              </div>
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
                  </SelectContent>
                </Select>
              </div>
              
              {testType === 'anova' && (
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
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Monte Carlo Simulation
                  </>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground text-center mt-2">
                Monte Carlo simulation with 5,000 samples • Takes 2-5 seconds
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
                      {result.requiredN}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testType === 'ttest' ? 'per group' : testType === 'anova' ? 'per group' : 'total'}
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm" dangerouslySetInnerHTML={{ __html: result.summary }} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Assurance Curve with Confidence Regions</CardTitle>
                </CardHeader>
                <CardContent>
                  <BayesianAssuranceChart
                    data={result.assuranceCurve.map(d => ({ x: d.n, y: d.assurance }))}
                    confidenceRegions={{
                      lower: result.assuranceCurve.map(d => ({ 
                        x: d.n, 
                        y: Math.max(0, d.assurance - 0.1) 
                      })),
                      upper: result.assuranceCurve.map(d => ({ 
                        x: d.n, 
                        y: Math.min(1, d.assurance + 0.1) 
                      }))
                    }}
                    currentValue={result.requiredN}
                    xLabel={`Sample Size ${testType === 'correlation' ? '(Total)' : '(per Group)'}`}
                    title="Assurance vs Sample Size"
                  />
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    Shaded region represents 95% confidence interval for assurance estimates
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
                  Configure your parameters and click "Run Monte Carlo Simulation" to calculate 
                  the required sample size with Bayesian assurance.
                </p>
                <p className="text-xs text-muted-foreground">
                  This will perform 5,000 Monte Carlo simulations to account for effect size uncertainty.
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
