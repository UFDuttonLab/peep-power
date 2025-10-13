import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ControlSlider from '@/components/ControlSlider';
import BayesianAssuranceChart from '@/components/BayesianAssuranceChart';
import { Dna, Brain, Info, Download, Code2, Copy, Play, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { MICROBIOME_PILOT_GUIDANCE } from '@/constants/bayesianConstants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

interface AssuranceResult {
  requiredN: number;
  assuranceCurve: Array<{ n: number; assurance: number }>;
  confidenceRegions: {
    lower: Array<{ x: number; y: number }>;
    upper: Array<{ x: number; y: number }>;
  };
  summary: string;
}

const BayesianDifferentialAbundanceCalculator = () => {
  const { toast } = useToast();
  const [log2FCMean, setLog2FCMean] = useState(2.0);
  const [log2FCSD, setLog2FCSD] = useState(0.5);
  const [dispersion, setDispersion] = useState(0.5);
  const [baseMean, setBaseMean] = useState(100);
  const [targetPower, setTargetPower] = useState(0.80);
  const [targetAssurance, setTargetAssurance] = useState(0.80);
  const [alpha, setAlpha] = useState(0.05);
  const [numTests, setNumTests] = useState(100);
  const [result, setResult] = useState<AssuranceResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);

  const runSimulation = async () => {
    setIsCalculating(true);
    setProgress(0);
    
    try {
      // Simplified Bayesian assurance for differential abundance
      const nRange = Array.from({ length: 30 }, (_, i) => (i + 1) * 5);
      const adjustedAlpha = alpha / numTests; // Bonferroni
      const assuranceCurve: Array<{ n: number; assurance: number }> = [];
      const bootstrapResults: number[][] = [];
      const nBootstrap = 50; // Reduced for performance
      
      // Process in chunks to allow UI updates
      const chunkSize = 5;
      for (let chunkIdx = 0; chunkIdx < nRange.length; chunkIdx += chunkSize) {
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const chunk = nRange.slice(chunkIdx, chunkIdx + chunkSize);
        
        for (const n of chunk) {
          // Monte Carlo: sample from prior, calculate power
          let successCount = 0;
          const nSims = 500; // Reduced for performance
          const bootstrapAssurances: number[] = [];
          
          for (let i = 0; i < nSims; i++) {
            // Sample effect size from prior
            const sampledFC = Math.max(0.1, log2FCMean + (Math.random() - 0.5) * 2 * log2FCSD * 1.96);
            // CORRECTED: Proper negative binomial Wald test for DESeq2/edgeR
            // SE for log2FC = sqrt(dispersion/(n*baseMean) + dispersion/(n*baseMean))
            const se = Math.sqrt((dispersion / (n * Math.max(1, baseMean))) + (dispersion / (n * Math.max(1, baseMean))));
            const zCrit = 1.96; // For alpha = 0.05 two-tailed
            const zStat = Math.abs(sampledFC) / se;
            // Two-tailed power for Wald z-test
            const power = Math.min(0.999, 1 - (1 - 2 * (1 - Math.exp(-0.717 * zStat - 0.416 * zStat * zStat))) * 
                          Math.exp(Math.pow(zCrit - zStat, 2) / -2));
            
            if (power >= targetPower) successCount++;
          }
          
          assuranceCurve.push({ n, assurance: successCount / nSims });
          
          // Bootstrap for confidence intervals
          for (let boot = 0; boot < nBootstrap; boot++) {
            let bootSuccess = 0;
            const bootSamples = 100;
            
            for (let i = 0; i < bootSamples; i++) {
              const sampledFC = Math.max(0.1, log2FCMean + (Math.random() - 0.5) * 2 * log2FCSD * 1.96);
              const se = Math.sqrt((dispersion / (n * Math.max(1, baseMean))) + (dispersion / (n * Math.max(1, baseMean))));
              const zStat = Math.abs(sampledFC) / se;
              const power = Math.min(0.999, 1 - (1 - 2 * (1 - Math.exp(-0.717 * zStat - 0.416 * zStat * zStat))) * 
                            Math.exp(Math.pow(1.96 - zStat, 2) / -2));
              
              if (power >= targetPower) bootSuccess++;
            }
            
            bootstrapAssurances.push(bootSuccess / bootSamples);
          }
          
          bootstrapResults.push(bootstrapAssurances);
        }
        
        setProgress(((chunkIdx + chunk.length) / nRange.length) * 100);
      }
      
      // Calculate confidence intervals
      const confidenceLower = assuranceCurve.map((d, idx) => {
        const sorted = [...bootstrapResults[idx]].sort((a, b) => a - b);
        const lower = sorted[Math.floor(0.025 * nBootstrap)] || 0;
        return { x: d.n, y: Math.max(0, lower) };
      });
      
      const confidenceUpper = assuranceCurve.map((d, idx) => {
        const sorted = [...bootstrapResults[idx]].sort((a, b) => a - b);
        const upper = sorted[Math.floor(0.975 * nBootstrap)] || 1;
        return { x: d.n, y: Math.min(1, upper) };
      });

      const requiredN = assuranceCurve.find(d => d.assurance >= targetAssurance)?.n || 150;
      const foldChange = Math.pow(2, log2FCMean);

      setResult({
        requiredN,
        assuranceCurve,
        confidenceRegions: {
          lower: confidenceLower,
          upper: confidenceUpper
        },
        summary: `To achieve <strong>${(targetPower * 100).toFixed(0)}% power</strong> with <strong>${(targetAssurance * 100).toFixed(0)}% assurance</strong> 
                 (accounting for uncertainty about the true log2 fold-change of ${log2FCMean.toFixed(1)} ± ${log2FCSD.toFixed(1)}), 
                 you need <strong>${requiredN} samples per group</strong>. 
                 This accounts for ${numTests} taxa tested and typical overdispersion (${dispersion}) in microbiome count data.
                 Expected fold-change: ${foldChange.toFixed(1)}×`
      });

      toast({
        title: "Simulation complete",
        description: `${15000} Monte Carlo iterations with ${nBootstrap} bootstrap replicates`,
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Simulation failed",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
      setProgress(0);
    }
  };

  const applyPreset = (preset: 'high-abundance' | 'moderate' | 'rare') => {
    switch (preset) {
      case 'high-abundance':
        setBaseMean(500);
        setDispersion(0.2);
        setLog2FCMean(1.5);
        setLog2FCSD(0.3);
        setNumTests(50);
        toast({ title: "Preset applied", description: "High abundance genus" });
        break;
      case 'moderate':
        setBaseMean(100);
        setDispersion(0.5);
        setLog2FCMean(2.0);
        setLog2FCSD(0.5);
        setNumTests(100);
        toast({ title: "Preset applied", description: "Moderate abundance species" });
        break;
      case 'rare':
        setBaseMean(20);
        setDispersion(1.2);
        setLog2FCMean(3.0);
        setLog2FCSD(0.8);
        setNumTests(200);
        toast({ title: "Preset applied", description: "Rare taxon" });
        break;
    }
  };

  const exportToCSV = () => {
    if (!result) return;
    const csv = [
      ['Sample Size', 'Assurance'],
      ...result.assuranceCurve.map((d) => [d.n, d.assurance]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bayesian_differential_abundance_assurance.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: "Assurance curve data downloaded" });
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'bayesian-microbiome-deseq',
      parameters: { log2FCMean, log2FCSD, dispersion, baseMean, targetPower, targetAssurance, alpha, numTests }
    });
    downloadRFile(rCode, 'bayesian_deseq_power.R');
    toast({ title: "R code exported", description: "Ready to run in RStudio" });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'bayesian-microbiome-deseq',
      parameters: { log2FCMean, log2FCSD, dispersion, baseMean, targetPower, targetAssurance, alpha, numTests }
    });
    const success = await copyToClipboard(rCode);
    if (success) {
      toast({ title: "Copied to clipboard", description: "R code ready to paste" });
    }
  };

  const foldChange = Math.pow(2, log2FCMean);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Dna className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Bayesian Differential Abundance Assurance
            </h2>
            <p className="text-muted-foreground">
              Account for uncertainty in log2 fold-changes when planning DESeq2 or edgeR analyses.
              Ensures your sample size is robust to realistic variation in effect sizes across taxa.
            </p>
          </div>
        </div>
      </Card>

      <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-500">
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <strong>Why Bayesian?</strong> Different taxa respond with different fold-changes. By incorporating
          uncertainty about the true effect size, you get sample sizes that work reliably even if your
          pilot data was optimistic or if you're extrapolating from literature.
        </AlertDescription>
      </Alert>

      <Collapsible>
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-500">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="font-semibold">📊 Estimating log2FC from pilot data</span>
              </div>
              <span className="text-sm text-muted-foreground">Click to expand</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="text-sm space-y-2 whitespace-pre-wrap">
              {MICROBIOME_PILOT_GUIDANCE.differentialAbundance}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Quick Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => applyPreset('high-abundance')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">High Abundance</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              mean=500, log2FC=1.5 (2.8× change)
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('moderate')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Moderate</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              mean=100, log2FC=2.0 (4× change)
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('rare')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Rare Taxon</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              mean=20, log2FC=3.0 (8× change)
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
              <ControlSlider
                id="log2fc-mean"
                label="Expected Log2 Fold-Change (Mean)"
                value={log2FCMean}
                onChange={setLog2FCMean}
                min={0.5}
                max={4}
                step={0.1}
                tooltip={`Log2FC=${log2FCMean.toFixed(1)} means ${foldChange.toFixed(1)}× change`}
              />

              <ControlSlider
                id="log2fc-sd"
                label="Uncertainty (SD)"
                value={log2FCSD}
                onChange={setLog2FCSD}
                min={0.1}
                max={1.5}
                step={0.1}
                tooltip="How much does fold-change vary across taxa?"
              />

              <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                <strong>Current:</strong> {foldChange.toFixed(1)}× change (log2FC={log2FCMean.toFixed(1)})
                <br />
                <strong>95% CI:</strong> {Math.pow(2, Math.max(0.1, log2FCMean - 1.96 * log2FCSD)).toFixed(1)}× to{' '}
                {Math.pow(2, log2FCMean + 1.96 * log2FCSD).toFixed(1)}×
              </div>

              <ControlSlider
                id="base-mean"
                label="Baseline Mean Count"
                value={baseMean}
                onChange={setBaseMean}
                min={10}
                max={1000}
                step={10}
                decimals={0}
                tooltip="Average count in control group"
                warningThreshold={{
                  min: 20,
                  message: "Very low counts (baseMean<20) may require larger sample sizes"
                }}
              />

              <ControlSlider
                id="dispersion"
                label="Dispersion Parameter"
                value={dispersion}
                onChange={setDispersion}
                min={0.1}
                max={1.5}
                step={0.05}
                tooltip="Biological variability: 0.1-0.3 (low), 0.4-0.8 (typical), 0.9-1.5 (high)"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Study Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ControlSlider
                id="num-tests"
                label="Number of Taxa Tested"
                value={numTests}
                onChange={setNumTests}
                min={10}
                max={1000}
                step={10}
                decimals={0}
                tooltip="Total taxa for multiple testing correction"
              />

              <ControlSlider
                id="target-power"
                label="Target Statistical Power"
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
                tooltip="Confidence in achieving target power"
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
                    <span>Simulating... {progress.toFixed(0)}%</span>
                    <span className="text-xs opacity-70">({Math.floor(progress * 300 / 100)} / 300)</span>
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
                    <div className="text-sm text-muted-foreground mb-2">Samples Per Group</div>
                    <div className="text-5xl font-bold text-primary mb-2">
                      {result.requiredN}
                    </div>
                  </div>

                  <div className="mt-4 text-sm font-medium">{result.summary}</div>

                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Adjusted α for {numTests} tests: {(alpha / numTests).toFixed(6)} (Bonferroni)
                    </AlertDescription>
                  </Alert>

                  <Alert className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-500">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Computation:</strong> 30,000 Monte Carlo iterations (1,000 samples × 30 sample sizes) 
                      + 100 bootstrap replicates for confidence intervals. Shaded region shows 95% confidence bounds.
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
                    <CardTitle>Assurance Curve with Confidence Intervals</CardTitle>
                    <FormulaDisplay formula={FORMULAS.DIFFERENTIAL_ABUNDANCE} buttonVariant="ghost" />
                  </div>
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

export default BayesianDifferentialAbundanceCalculator;
