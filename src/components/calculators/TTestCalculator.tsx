import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import ControlSlider from '../ControlSlider';
import PowerChart from '../SimplePowerChart';
import EffectSizeGuidance from '../EffectSizeGuidance';
import { calculateTTestPower } from '@/utils/powerCalculations';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { Download, AlertTriangle, Dna, Code2, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

const TTestCalculator = () => {
  const { toast } = useToast();
  const [n, setN] = useState(50);
  const [effectSize, setEffectSize] = useState(0.5);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const res = calculateTTestPower(n, effectSize, alpha);
    setResult(res);
  }, [n, effectSize, alpha]);

  const handlePreset = (value: string) => {
    if (value === 'restoration') {
      setN(30);
      setEffectSize(0.8);
      setAlpha(0.05);
    } else if (value === 'pollutant') {
      setN(50);
      setEffectSize(0.5);
      setAlpha(0.05);
    }
  };

  const exportResults = () => {
    const csv = [
      ['Sample Size', 'Power'],
      ...result.curveData.map((d: any) => [d.x, d.y]),
    ]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ttest-power-analysis.csv';
    a.click();
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'ttest',
      parameters: { n, effectSize, alpha }
    });
    downloadRFile(rCode, 'ttest_power_analysis.R');
    toast({
      title: "R code exported",
      description: "You can now run this analysis in R/RStudio",
    });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'ttest',
      parameters: { n, effectSize, alpha }
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
    <div className="space-y-4">
      <div className="grid md:grid-cols-[1fr_2fr] gap-6">
      <Card className="p-6 bg-secondary/50">
        <h2 className="text-2xl font-bold mb-6 pb-3 border-b-2 border-border">Two-Sample t-test</h2>
        
        <div className="space-y-6">
          <ControlSlider
            id="ttest-n"
            label="Sample Size (n) per group"
            value={n}
            min={5}
            max={200}
            step={1}
            onChange={setN}
            decimals={0}
            tooltip="Number of INDEPENDENT experimental units (e.g., separate plots, tanks, or individuals) in each group. NOT the total number of measurements. If you have subsamples, average them within each unit first."
            warningThreshold={{ 
              min: 10, 
              message: "Power is very low with n<10 per group unless effect size is very large (d>1.0)" 
            }}
          />

          <div className="space-y-2">
            <ControlSlider
              id="ttest-effect"
              label="Effect Size (Cohen's d)"
              value={effectSize}
              min={0.1}
              max={2.0}
              step={0.05}
              onChange={setEffectSize}
              tooltip="Standardized mean difference between groups. Small (0.2) ≈ 10% change, Medium (0.5) ≈ 25% change, Large (0.8) ≈ 40% change."
            />
            <Select onValueChange={(v) => v !== 'custom' && setEffectSize(parseFloat(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="0.2">Small (d=0.2)</SelectItem>
                <SelectItem value="0.5">Medium (d=0.5)</SelectItem>
                <SelectItem value="0.8">Large (d=0.8)</SelectItem>
              </SelectContent>
            </Select>
            <EffectSizeGuidance effectType="cohens-d" />
          </div>

          <div className="space-y-2">
            <ControlSlider
              id="ttest-alpha"
              label="Alpha (α)"
              value={alpha}
              min={0.01}
              max={0.10}
              step={0.01}
              onChange={setAlpha}
              tooltip="The probability of a Type I error (false positive)."
            />
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

          <div className="pt-4 border-t border-dashed border-border">
            <label className="block font-medium mb-2">Ecological Scenario Example</label>
            <Select onValueChange={handlePreset}>
              <SelectTrigger>
                <SelectValue placeholder="Select a scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">-- Select a scenario --</SelectItem>
                <SelectItem value="restoration">Wetland restoration (Before vs. After)</SelectItem>
                <SelectItem value="pollutant">Pollutant effect on fish growth</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Results</h2>
          <FormulaDisplay formula={FORMULAS.TTEST} />
        </div>
        
        {result && (
          <>
            <Card className="p-6 bg-primary text-primary-foreground">
              <div dangerouslySetInnerHTML={{ __html: result.summary }} />
            </Card>

            <Card className="p-6">
              <PowerChart
                data={result.curveData}
                currentValue={n * 2}
                xLabel="Total Sample Size (N)"
                title="Power Curve: Two-Sample t-test"
              />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button onClick={exportResults} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={exportToR} variant="outline">
                <Code2 className="mr-2 h-4 w-4" />
                Download R Code
              </Button>
              <Button onClick={copyRCode} variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Copy R Code
              </Button>
            </div>

            <Card className="p-6 bg-secondary/30 border-l-4 border-accent">
              <h3 className="font-bold text-lg mb-3">Study Design Guidance</h3>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li><strong>Use Case:</strong> Ideal for comparing the means of two groups, such as treatment vs. control.</li>
                <li><strong>Assumptions:</strong> Assumes data are normally distributed and have equal variances.</li>
                <li><strong>Balanced Design:</strong> Equal sample sizes provide the most statistical power.</li>
              </ul>
            </Card>

            <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">⚠️ Critical: Avoid Pseudoreplication</p>
                  <p className="text-muted-foreground mb-2">
                    Your sample size (n) MUST be the number of independent experimental units, not total measurements.
                  </p>
                  <p className="font-medium">Example:</p>
                  <p className="text-muted-foreground">
                    ✗ "5 tanks with 10 fish each = n=50"<br/>
                    ✓ "5 tanks (average 10 fish per tank) = n=5"
                  </p>
                  <p className="text-xs mt-2">
                    See the <strong>Replication</strong> tab for more guidance.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
    </div>
  );
};

export default TTestCalculator;
