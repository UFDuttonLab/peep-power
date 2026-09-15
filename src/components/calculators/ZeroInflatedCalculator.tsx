import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ControlSlider from '@/components/ControlSlider';
import SimplePowerChart from '@/components/SimplePowerChart';
import DistributionVisualization from '@/components/DistributionVisualization';
import { calculateZINBPower } from '@/utils/microbiomePowerCalculations';
import { AlertCircle, TrendingUp, Info, Droplet, Download, Code2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

const ZeroInflatedCalculator = () => {
  const { toast } = useToast();
  const [n, setN] = useState(50);
  const [zeroInflation, setZeroInflation] = useState(0.6);
  const [meanCount, setMeanCount] = useState(50);
  const [dispersion, setDispersion] = useState(0.8);
  const [log2FC, setLog2FC] = useState(2.0);
  const [alpha, setAlpha] = useState(0.05);
  const [testType, setTestType] = useState<'count' | 'zero' | 'both'>('both');

  const power = calculateZINBPower(n, zeroInflation, meanCount, dispersion, log2FC, alpha, testType);
  // With the joint test, each component is tested at alpha / 2 (Bonferroni), so show them that way
  const componentAlpha = testType === 'both' ? alpha / 2 : alpha;
  const countPower = calculateZINBPower(n, zeroInflation, meanCount, dispersion, log2FC, componentAlpha, 'count');
  const zeroPower = calculateZINBPower(n, zeroInflation, meanCount, dispersion, log2FC, componentAlpha, 'zero');
  const assumedZeroChange = Math.min(0.2, zeroInflation / 2);
  
  const foldChange = Math.pow(2, log2FC);

  const exportToCSV = () => {
    const powerCurve = generatePowerCurve();
    const csv = [
      ['Sample Size', 'Power'],
      ...powerCurve.map((d) => [d.x, d.y]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zero_inflated_power.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: "Power curve data downloaded" });
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'zinb',
      parameters: { n, zeroInflation, meanCount, dispersion, log2FC, alpha, testType }
    });
    downloadRFile(rCode, 'zero_inflated_power.R');
    toast({ title: "R code exported", description: "Data downloaded successfully" });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'zinb',
      parameters: { n, zeroInflation, meanCount, dispersion, log2FC, alpha, testType }
    });
    const success = await copyToClipboard(rCode);
    if (success) {
      toast({ title: "Copied to clipboard", description: "R code ready to paste" });
    } else {
      toast({ title: "Error", description: "Failed to copy R code", variant: "destructive" });
    }
  };

  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'rare':
        setZeroInflation(0.8);
        setMeanCount(30);
        setDispersion(1.2);
        setLog2FC(3.0);
        toast({ title: "Preset applied", description: "Rare genus preset (80% zeros)" });
        break;
      case 'moderate':
        setZeroInflation(0.4);
        setMeanCount(100);
        setDispersion(0.6);
        setLog2FC(2.0);
        toast({ title: "Preset applied", description: "Moderate prevalence preset" });
        break;
      case 'barely-present':
        setZeroInflation(0.95);
        setMeanCount(10);
        setDispersion(1.5);
        setLog2FC(4.0);
        toast({ title: "Preset applied", description: "Barely present preset (95% zeros)" });
        break;
    }
  };

  const generatePowerCurve = () => {
    const maxN = 200; // Match slider max
    const minN = 10;  // Match slider min
    const numPoints = 100;
    
    return Array.from({ length: numPoints }, (_, i) => {
      const sampleSize = Math.round(minN + (i / (numPoints - 1)) * (maxN - minN));
      return {
        x: sampleSize,
        y: calculateZINBPower(sampleSize, zeroInflation, meanCount, dispersion, log2FC, alpha, testType),
      };
    });
  };

  const getPowerInterpretation = () => {
    if (power >= 0.8) return { color: 'text-green-600', icon: TrendingUp, message: 'Excellent power to detect this effect' };
    if (power >= 0.6) return { color: 'text-yellow-600', icon: AlertCircle, message: 'Moderate power - consider increasing sample size' };
    return { color: 'text-red-600', icon: AlertCircle, message: 'Low power - this effect will be difficult to detect' };
  };

  const interpretation = getPowerInterpretation();
  const Icon = interpretation.icon;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Droplet className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Zero-Inflated Power Analysis
            </h2>
            <p className="text-muted-foreground">
              Calculate power for detecting differences in rare taxa with high zero-inflation. 
              Essential when many samples have zero counts for a taxon of interest.
            </p>
          </div>
        </div>
      </Card>

      {/* Presets */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Quick Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => applyPreset('rare')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Rare Genus</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              80% zeros, mean=30
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('moderate')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Moderate Prevalence</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              40% zeros, mean=100
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('barely-present')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Barely Present</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              95% zeros, mean=10
            </div>
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Power Analysis</h2>
          <FormulaDisplay formula={FORMULAS.ZERO_INFLATED} />
        </div>
        
        <div className="grid md:grid-cols-[1fr_2fr] gap-6">
          {/* Left Column: Study Parameters */}
          <Card className="p-4 bg-background">
            <h3 className="font-semibold mb-4">Study Parameters</h3>
            <div className="space-y-6">
              <ControlSlider
                id="n"
                label="Samples per Group"
                value={n}
                min={10}
                max={200}
                step={5}
                onChange={setN}
                decimals={0}
                tooltip="Number of samples in each treatment group"
              />
              
              <ControlSlider
                id="zeroinflation"
                label="Zero-Inflation Proportion"
                value={zeroInflation}
                min={0}
                max={0.95}
                step={0.05}
                onChange={setZeroInflation}
                tooltip="Proportion of structural zeros (samples where the taxon is truly absent). Sampling zeros from the count model come on top of this."
              />

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                <strong>Zero-Inflation Guide:</strong>
                <ul className="mt-1 ml-4 list-disc space-y-1">
                  <li>0-0.3: Low (prevalent taxon)</li>
                  <li>0.4-0.7: Moderate (typical for many taxa)</li>
                  <li>0.8-0.95: High (rare, sporadic detection)</li>
                  <li>Current: {(zeroInflation * 100).toFixed(0)}% structural zeros</li>
                </ul>
              </div>

              <ControlSlider
                id="meancount"
                label="Mean Count (Count Component)"
                value={meanCount}
                min={5}
                max={500}
                step={5}
                onChange={setMeanCount}
                decimals={0}
                tooltip="Mean of the negative binomial count component, i.e. the average count in samples that are not structural zeros (sampling zeros included)"
              />

              <ControlSlider
                id="log2fc"
                label="Log2 Fold-Change (Effect Size)"
                value={log2FC}
                min={0.5}
                max={4}
                step={0.1}
                onChange={setLog2FC}
                tooltip={`Log2FC=${log2FC.toFixed(1)} means ${foldChange.toFixed(1)}× change`}
              />

              <ControlSlider
                id="dispersion"
                label="Dispersion Parameter"
                value={dispersion}
                min={0.1}
                max={2.0}
                step={0.1}
                onChange={setDispersion}
                tooltip="Biological variability in the count model"
              />

              <ControlSlider
                id="alpha"
                label="Significance Level (α)"
                value={alpha}
                min={0.01}
                max={0.10}
                step={0.01}
                onChange={setAlpha}
              />

              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3">Test Type</h4>
                <Select value={testType} onValueChange={(v) => setTestType(v as 'count' | 'zero' | 'both')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Count Difference Only</SelectItem>
                    <SelectItem value="zero">Zero-Inflation Difference Only</SelectItem>
                    <SelectItem value="both">Both Components (Combined)</SelectItem>
                  </SelectContent>
                </Select>

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded mt-3">
                  <strong>Test Type Explained:</strong>
                  <ul className="mt-1 ml-4 list-disc space-y-1">
                    <li><strong>Count:</strong> Tests if abundance differs when present</li>
                    <li><strong>Zero-Inflation:</strong> Tests if prevalence (presence/absence) differs</li>
                    <li><strong>Both:</strong> Tests for any difference (recommended)</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Right Column: Results */}
          <div className="space-y-4">
            <Card className="p-4 bg-background">
              <div className="flex items-start gap-4 mb-4">
                <Icon className={`h-8 w-8 ${interpretation.color}`} />
                <div>
                  <h3 className="text-2xl font-bold">Statistical Power: {(power * 100).toFixed(1)}%</h3>
                  <p className={`text-sm ${interpretation.color}`}>{interpretation.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Count Model Power</div>
                  <div className="text-2xl font-bold">{(countPower * 100).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Detecting abundance differences{testType === 'both' ? ' (at α/2)' : ''}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Zero Model Power</div>
                  <div className="text-2xl font-bold">{(zeroPower * 100).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Detecting a {(assumedZeroChange * 100).toFixed(0)}-point drop in structural zeros{testType === 'both' ? ' (at α/2)' : ''}
                  </div>
                </div>
              </div>

              {zeroInflation > 0.9 && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Very high zero-inflation ({(zeroInflation * 100).toFixed(0)}%). 
                    Consider using presence/absence analysis instead of count-based methods.
                  </AlertDescription>
                </Alert>
              )}

              {power < 0.8 && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Consider: (1) increasing sample size, (2) focusing on less rare taxa, 
                    or (3) expecting larger effect sizes.
                  </AlertDescription>
                </Alert>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Power Curve</h3>
              <SimplePowerChart
                data={generatePowerCurve()}
                currentValue={n}
                xLabel="Samples per Group"
                title="Power vs Sample Size"
              />
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Expected Distribution</h3>
              <DistributionVisualization
                type="zero-inflated"
                meanCount={meanCount}
                dispersion={dispersion}
                zeroInflation={zeroInflation}
              />
            </Card>

            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-3">Study Design Summary</h3>
              <div className="space-y-3">
                <div className="p-3 bg-background rounded">
                  <div className="flex justify-between">
                    <span className="text-sm">Total samples per group</span>
                    <span className="font-semibold">{n}</span>
                  </div>
                </div>
                <div className="p-3 bg-background rounded">
                  <div className="flex justify-between">
                    <span className="text-sm">Expected samples in count model</span>
                    <span className="font-semibold">{Math.round(n * (1 - zeroInflation))}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  High zero-inflation reduces effective sample size for the count model
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Export Results</h3>
              <div className="grid grid-cols-3 gap-2">
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
            </Card>
          </div>
        </div>
      </Card>

      {/* Educational Content */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="when-to-use">
          <AccordionTrigger>When to Use ZINB</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Taxa present in less than 70% of samples</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Many samples have zero counts (high zero-inflation)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Interested in both prevalence AND abundance changes</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Standard negative binomial models show poor fit</span>
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="comparison">
          <AccordionTrigger>ZINB vs Standard NB</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Use ZINB when:</strong> Zero-inflation &gt; 40% and you want to distinguish 
                  between "truly absent" (structural zeros) and "undetected" (sampling zeros).
                </AlertDescription>
              </Alert>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Use Standard NB when:</strong> Zero-inflation &lt; 40% or all zeros are sampling zeros.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="issues">
          <AccordionTrigger>Common Issues</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Convergence problems:</strong> ZINB models can fail to converge with very sparse data. 
                  Consider filtering taxa present in &lt;10% of samples.
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Inflated false positives:</strong> Without proper filtering, rare taxa can produce 
                  spurious results. Pre-filter low-prevalence taxa.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="software">
          <AccordionTrigger>Recommended Software</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• pscl package in R (zeroinfl function)</li>
              <li>• ZINB-WaVE for single-cell sequencing data</li>
              <li>• metagenomeSeq (fitZIG function) for microbiome data</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ZeroInflatedCalculator;
