import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ControlSlider from '@/components/ControlSlider';
import SimplePowerChart from '@/components/SimplePowerChart';
import DistributionVisualization from '@/components/DistributionVisualization';
import { calculateNegBinomialPower, calculateRequiredSampleSizeNB, adjustAlphaForBonferroni } from '@/utils/microbiomePowerCalculations';
import { AlertCircle, TrendingUp, Info, Dna } from 'lucide-react';
import { toast } from 'sonner';

const DifferentialAbundanceCalculator = () => {
  const [n, setN] = useState(30);
  const [log2FC, setLog2FC] = useState(2.0);
  const [dispersion, setDispersion] = useState(0.5);
  const [baseMean, setBaseMean] = useState(100);
  const [alpha, setAlpha] = useState(0.05);
  const [numTests, setNumTests] = useState(100);
  const [useFDR, setUseFDR] = useState(true);

  const power = calculateNegBinomialPower(n, log2FC, dispersion, baseMean, alpha, useFDR ? numTests : 1);
  const requiredN = calculateRequiredSampleSizeNB(0.8, log2FC, dispersion, baseMean, alpha, useFDR ? numTests : 1);
  
  const foldChange = Math.pow(2, log2FC);
  const adjustedAlpha = useFDR ? adjustAlphaForBonferroni(alpha, numTests) : alpha;

  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'high-abundance':
        setBaseMean(500);
        setDispersion(0.2);
        setLog2FC(1.5);
        setNumTests(50);
        toast.success('Applied: High abundance genus preset');
        break;
      case 'moderate':
        setBaseMean(100);
        setDispersion(0.5);
        setLog2FC(2.0);
        setNumTests(100);
        toast.success('Applied: Moderate abundance species preset');
        break;
      case 'rare':
        setBaseMean(20);
        setDispersion(1.2);
        setLog2FC(3.0);
        setNumTests(200);
        toast.success('Applied: Rare taxon preset');
        break;
    }
  };

  const generatePowerCurve = () => {
    return Array.from({ length: 30 }, (_, i) => {
      const sampleSize = (i + 1) * 5;
      return {
        x: sampleSize,
        y: calculateNegBinomialPower(sampleSize, log2FC, dispersion, baseMean, alpha, useFDR ? numTests : 1),
      };
    });
  };

  const getPowerInterpretation = () => {
    if (power >= 0.8) return { color: 'text-green-600', icon: TrendingUp, message: 'Excellent power to detect this effect' };
    if (power >= 0.6) return { color: 'text-yellow-600', icon: AlertCircle, message: 'Moderate power - consider increasing sample size' };
    return { color: 'text-red-600', icon: AlertCircle, message: 'Low power - unlikely to detect this effect reliably' };
  };

  const interpretation = getPowerInterpretation();
  const Icon = interpretation.icon;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Dna className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Differential Abundance Power Analysis
            </h2>
            <p className="text-muted-foreground">
              Calculate statistical power for detecting differentially abundant taxa using DESeq2 or edgeR-style 
              negative binomial tests. Essential for planning microbiome studies focused on specific taxa.
            </p>
          </div>
        </div>
      </Card>

      {/* Presets */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Quick Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => applyPreset('high-abundance')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">High Abundance Genus</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              mean=500, disp=0.2, log2FC=1.5
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('moderate')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Moderate Abundance</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              mean=100, disp=0.5, log2FC=2.0
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('rare')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Rare Taxon</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              mean=20, disp=1.2, log2FC=3.0
            </div>
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="parameters" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="guide">Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="parameters" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Study Parameters</h3>
            <div className="space-y-6">
              <ControlSlider
                id="n"
                label="Samples per Group"
                value={n}
                min={5}
                max={100}
                step={1}
                onChange={setN}
                decimals={0}
                tooltip="Number of samples in each treatment group"
              />
              
              <ControlSlider
                id="log2fc"
                label="Log2 Fold-Change (Effect Size)"
                value={log2FC}
                min={0.5}
                max={4}
                step={0.1}
                onChange={setLog2FC}
                tooltip={`Log2FC=${log2FC.toFixed(1)} means ${foldChange.toFixed(1)}× change in abundance`}
              />

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                <strong>Interpreting Log2 Fold-Change:</strong>
                <ul className="mt-1 ml-4 list-disc space-y-1">
                  <li>Log2FC = 1.0 → 2× change (doubling)</li>
                  <li>Log2FC = 2.0 → 4× change</li>
                  <li>Log2FC = 3.0 → 8× change</li>
                  <li>Current: {foldChange.toFixed(2)}× change</li>
                </ul>
              </div>

              <ControlSlider
                id="basemean"
                label="Baseline Mean Count"
                value={baseMean}
                min={10}
                max={1000}
                step={10}
                onChange={setBaseMean}
                decimals={0}
                tooltip="Average normalized read count in control group"
              />

              <ControlSlider
                id="dispersion"
                label="Dispersion Parameter"
                value={dispersion}
                min={0.1}
                max={1.5}
                step={0.05}
                onChange={setDispersion}
                tooltip="Biological variability: 0.1-0.3 (low), 0.4-0.8 (typical), 0.9-1.5 (high)"
              />

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                <strong>Dispersion Guide:</strong>
                <ul className="mt-1 ml-4 list-disc space-y-1">
                  <li>0.1-0.3: Highly abundant, consistent taxa</li>
                  <li>0.4-0.8: Typical biological variability</li>
                  <li>0.9-1.5: Rare or highly variable taxa</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Multiple Testing Correction</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={useFDR ? 'default' : 'outline'}
                  onClick={() => setUseFDR(true)}
                  className="flex-1"
                >
                  Apply Correction
                </Button>
                <Button
                  variant={!useFDR ? 'default' : 'outline'}
                  onClick={() => setUseFDR(false)}
                  className="flex-1"
                >
                  Single Test
                </Button>
              </div>

              {useFDR && (
                <ControlSlider
                  id="numtests"
                  label="Number of Taxa Tested"
                  value={numTests}
                  min={10}
                  max={1000}
                  step={10}
                  onChange={setNumTests}
                  decimals={0}
                  tooltip="Total number of taxa being tested (typically 50-500 for 16S data)"
                />
              )}

              <ControlSlider
                id="alpha"
                label="Significance Level (α)"
                value={alpha}
                min={0.01}
                max={0.10}
                step={0.01}
                onChange={setAlpha}
              />

              {useFDR && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Adjusted α: {adjustedAlpha.toFixed(6)} (Bonferroni correction for {numTests} tests)
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <Icon className={`h-8 w-8 ${interpretation.color}`} />
              <div>
                <h3 className="text-2xl font-bold">Power: {(power * 100).toFixed(1)}%</h3>
                <p className={`text-sm ${interpretation.color}`}>{interpretation.message}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Current Sample Size</div>
                <div className="text-2xl font-bold">{n} per group</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">For 80% Power</div>
                <div className="text-2xl font-bold">{requiredN} per group</div>
              </div>
            </div>

            {power < 0.8 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Consider increasing sample size to {requiredN} per group, or focus on taxa with larger fold-changes or lower dispersion.
                </AlertDescription>
              </Alert>
            )}
          </Card>

          <SimplePowerChart
            data={generatePowerCurve()}
            currentValue={n}
            xLabel="Samples per Group"
            title="Power vs Sample Size"
          />

          <DistributionVisualization
            type="negative-binomial"
            meanCount={baseMean}
            dispersion={dispersion}
          />

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Multiple Testing Impact</h3>
            <div className="space-y-3">
              {[10, 100, 500, 1000].map(tests => {
                const testPower = calculateNegBinomialPower(n, log2FC, dispersion, baseMean, alpha, tests);
                return (
                  <div key={tests} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                    <span className="text-sm">Testing {tests} taxa</span>
                    <span className="font-semibold">{(testPower * 100).toFixed(1)}% power</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Power decreases as you test more taxa due to multiple testing correction
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">When to Use This Test</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>You want to identify specific taxa that differ between groups</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Your data is count-based (reads per taxon from sequencing)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>You're comparing 2 or more independent groups</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>You have pilot data to estimate dispersion and mean counts</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Common Mistakes</h3>
            <div className="space-y-3 text-sm">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ignoring multiple testing:</strong> If you test 500 taxa without correction, 
                  you'll get ~25 false positives even if there are no real differences.
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Underestimating dispersion:</strong> Real data is usually more variable than expected. 
                  Use pilot data or published values from similar studies.
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Confusing log2FC with fold-change:</strong> Log2FC=2 means 4× change, not 2× change.
                </AlertDescription>
              </Alert>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Recommended Reading</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • Love et al. (2014) - DESeq2 paper: Moderated estimation of fold change and dispersion
              </li>
              <li>
                • Robinson et al. (2010) - edgeR: empirical Bayes for differential expression
              </li>
              <li>
                • McMurdie & Holmes (2014) - Best practices for analyzing microbiome data
              </li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DifferentialAbundanceCalculator;