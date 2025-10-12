import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ControlSlider from '../ControlSlider';
import PowerChart from '../SimplePowerChart';
import { calculateChiSquarePower } from '@/utils/powerCalculations';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { Download, Code2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ChiSquareCalculator = () => {
  const { toast } = useToast();
  const [n, setN] = useState(100);
  const [w, setW] = useState(0.3);
  const [df, setDf] = useState(3);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const res = calculateChiSquarePower(n, w, df, alpha);
    setResult(res);
  }, [n, w, df, alpha]);

  const lambda = w * w * n;
  const showLambdaWarning = lambda > 30 || df < 5;

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
    a.download = 'chi-square-power-analysis.csv';
    a.click();
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'chisquare',
      parameters: { n, w, df, alpha }
    });
    downloadRFile(rCode, 'chisquare_power_analysis.R');
    toast({
      title: "R code exported",
      description: "You can now run this analysis in R/RStudio",
    });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'chisquare',
      parameters: { n, w, df, alpha }
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
    <div className="grid md:grid-cols-[1fr_2fr] gap-6">
      <Card className="p-6 bg-secondary/50">
        <h2 className="text-2xl font-bold mb-6 pb-3 border-b-2 border-border">Chi-Square Test</h2>
        
        <div className="space-y-6">
          <ControlSlider
            id="chi-n"
            label="Total Sample Size (N)"
            value={n}
            min={10}
            max={500}
            step={10}
            onChange={setN}
            decimals={0}
            tooltip="Total number of observations across all categories."
          />

          <div className="space-y-2">
            <ControlSlider
              id="chi-w"
              label="Effect Size (Cohen's w)"
              value={w}
              min={0.05}
              max={1.0}
              step={0.01}
              onChange={setW}
              tooltip="Measure of deviation from expected frequencies. Small (0.1), Medium (0.3), Large (0.5)."
            />
            <Select onValueChange={(v) => v !== 'custom' && setW(parseFloat(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="0.1">Small (w=0.1)</SelectItem>
                <SelectItem value="0.3">Medium (w=0.3)</SelectItem>
                <SelectItem value="0.5">Large (w=0.5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ControlSlider
            id="chi-df"
            label="Degrees of Freedom (df)"
            value={df}
            min={1}
            max={10}
            step={1}
            onChange={setDf}
            decimals={0}
            tooltip="For contingency table: df = (rows - 1) × (columns - 1). For goodness-of-fit: df = categories - 1."
          />

          <div className="space-y-2">
            <ControlSlider
              id="chi-alpha"
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
        </div>
      </Card>

      <div className="space-y-6">
        {showLambdaWarning && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ Large Effect Warning:</strong> The non-centrality parameter (λ={lambda.toFixed(1)}) is large
              {df < 5 && ' and df is small'}. Power approximation may be less accurate. 
              Consider simulation-based methods or consult the R export code.
            </AlertDescription>
          </Alert>
        )}
        
        <h2 className="text-2xl font-bold">Results</h2>
        
        {result && (
          <>
            <Card className="p-6 bg-primary text-primary-foreground">
              <div dangerouslySetInnerHTML={{ __html: result.summary }} />
            </Card>

            <Card className="p-6">
              <PowerChart
                data={result.curveData}
                currentValue={n}
                xLabel="Total Sample Size"
                title="Power Curve: Chi-Square Test"
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
                <li><strong>Use Case:</strong> Test associations between categorical variables or goodness-of-fit.</li>
                <li><strong>Expected Frequencies:</strong> Each cell should have expected count ≥ 5 for valid results.</li>
                <li><strong>Independence:</strong> Each observation must belong to only one cell.</li>
                <li><strong>Sample Size:</strong> Larger samples needed for tables with many cells.</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ChiSquareCalculator;
