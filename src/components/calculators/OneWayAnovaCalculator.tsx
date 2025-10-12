import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import ControlSlider from '../ControlSlider';
import PowerChart from '../SimplePowerChart';
import { calculateOneWayAnovaPower } from '@/utils/powerCalculations';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { Download, Dna, Code2, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const OneWayAnovaCalculator = () => {
  const { toast } = useToast();
  const [n, setN] = useState(30);
  const [groups, setGroups] = useState(3);
  const [effectSize, setEffectSize] = useState(0.25);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const res = calculateOneWayAnovaPower(n, groups, effectSize, alpha);
    setResult(res);
  }, [n, groups, effectSize, alpha]);

  const handlePreset = (value: string) => {
    if (value === 'fertilizer') {
      setN(20);
      setGroups(3);
      setEffectSize(0.4);
      setAlpha(0.05);
    } else if (value === 'habitat') {
      setN(40);
      setGroups(4);
      setEffectSize(0.25);
      setAlpha(0.05);
    }
  };

  const exportResults = () => {
    const csv = [
      ['Sample Size per Group', 'Power'],
      ...result.curveData.map((d: any) => [d.x, d.y]),
    ]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oneway-anova-power-analysis.csv';
    a.click();
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'oneway-anova',
      parameters: { n, groups, effectSize, alpha }
    });
    downloadRFile(rCode, 'oneway_anova_power_analysis.R');
    toast({
      title: "R code exported",
      description: "You can now run this analysis in R/RStudio",
    });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'oneway-anova',
      parameters: { n, groups, effectSize, alpha }
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
        <h2 className="text-2xl font-bold mb-6 pb-3 border-b-2 border-border">One-Way ANOVA</h2>
        
        <div className="space-y-6">
          <ControlSlider
            id="oneway-n"
            label="Sample Size (n) per group"
            value={n}
            min={5}
            max={200}
            step={1}
            onChange={setN}
            decimals={0}
            tooltip="Number of independent observations in each group."
            warningThreshold={{ min: 15, message: "ANOVA requires at least 15 per group for reliable results" }}
          />

          <ControlSlider
            id="oneway-groups"
            label="Number of Groups (k)"
            value={groups}
            min={3}
            max={10}
            step={1}
            onChange={setGroups}
            decimals={0}
            tooltip="The total number of different treatments or sites being compared."
          />

          <div className="space-y-2">
            <ControlSlider
              id="oneway-effect"
              label="Effect Size (Cohen's f)"
              value={effectSize}
              min={0.05}
              max={1.0}
              step={0.01}
              onChange={setEffectSize}
              tooltip="Cohen's f: relates to η² (eta-squared) via f = √(η²/(1-η²)). Small (0.10), Medium (0.25), Large (0.40)."
            />
            <Select onValueChange={(v) => v !== 'custom' && setEffectSize(parseFloat(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="0.1">Small (f=0.1)</SelectItem>
                <SelectItem value="0.25">Medium (f=0.25)</SelectItem>
                <SelectItem value="0.4">Large (f=0.4)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <ControlSlider
              id="oneway-alpha"
              label="Alpha (α)"
              value={alpha}
              min={0.01}
              max={0.10}
              step={0.01}
              onChange={setAlpha}
              tooltip="The probability of a Type I error."
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
                <SelectItem value="fertilizer">Fertilizer effects on plant growth (3 levels)</SelectItem>
                <SelectItem value="habitat">Species response to habitat management</SelectItem>
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
                currentValue={n * groups}
                xLabel="Total Sample Size (N)"
                title="Power Curve: One-Way ANOVA"
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
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Use Case:</strong> Compare means of three or more independent groups.</li>
                <li><strong>Post-Hoc Tests:</strong> A significant ANOVA indicates at least one group differs. Use post-hoc tests (e.g., Tukey's HSD) to find which groups differ.</li>
                <li><strong>Multiple Comparisons:</strong> Consider corrections like Bonferroni or FDR to control Type I error.</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
    </div>
  );
};

export default OneWayAnovaCalculator;
