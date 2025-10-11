import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import ControlSlider from '../ControlSlider';
import PowerChart from '../SimplePowerChart';
import { calculateTTestPower } from '@/utils/powerCalculations';
import { Download } from 'lucide-react';

const TTestCalculator = () => {
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

  return (
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
            tooltip="Number of independent observations in each of the two groups."
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
        <h2 className="text-2xl font-bold">Results</h2>
        
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

            <Button onClick={exportResults} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Results (CSV)
            </Button>

            <Card className="p-6 bg-secondary/30 border-l-4 border-accent">
              <h3 className="font-bold text-lg mb-3">Study Design Guidance</h3>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Use Case:</strong> Ideal for comparing the means of two groups, such as treatment vs. control.</li>
                <li><strong>Assumptions:</strong> Assumes data are normally distributed and have equal variances.</li>
                <li><strong>Replication:</strong> Ensure samples are true biological replicates and independent.</li>
                <li><strong>Balanced Design:</strong> Equal sample sizes provide the most statistical power.</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default TTestCalculator;
