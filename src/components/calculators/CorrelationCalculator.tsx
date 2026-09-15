import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import ControlSlider from '../ControlSlider';
import PowerChart from '../SimplePowerChart';
import { calculateCorrelationPower, type PowerResult } from '@/utils/powerCalculations';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { Download, Code2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

const CorrelationCalculator = () => {
  const { toast } = useToast();
  const [n, setN] = useState(40);
  const [rho, setRho] = useState(0.3);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<PowerResult | null>(null);

  useEffect(() => {
    const res = calculateCorrelationPower(n, rho, alpha);
    setResult(res);
  }, [n, rho, alpha]);

  const exportResults = () => {
    if (!result) return;
    const csv = [
      ['Sample Size', 'Power'],
      ...result.curveData.map((d: { x: number; y: number }) => [d.x, d.y]),
    ]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'correlation-power-analysis.csv';
    a.click();
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'correlation',
      parameters: { n, rho, alpha }
    });
    downloadRFile(rCode, 'correlation_power_analysis.R');
    toast({
      title: "R code exported",
      description: "You can now run this analysis in R/RStudio",
    });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'correlation',
      parameters: { n, rho, alpha }
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
        <h2 className="text-2xl font-bold mb-6 pb-3 border-b-2 border-border">Correlation Analysis</h2>
        
        <div className="space-y-6">
          <ControlSlider
            id="corr-n"
            label="Sample Size (n)"
            value={n}
            min={5}
            max={200}
            step={1}
            onChange={setN}
            decimals={0}
            tooltip="Total number of paired observations."
            warningThreshold={{ 
              min: 30, 
              message: "Correlations are unstable with n<30. Need n≈85 for 80% power to detect r=0.3" 
            }}
          />

          <div className="space-y-2">
            <ControlSlider
              id="corr-rho"
              label="Correlation Coefficient (ρ)"
              value={rho}
              min={0.05}
              max={0.95}
              step={0.01}
              onChange={setRho}
              tooltip="Expected strength and direction of the linear relationship. Small (0.1), Medium (0.3), Large (0.5)."
            />
            <Select onValueChange={(v) => v !== 'custom' && setRho(parseFloat(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="0.1">Small (ρ=0.1)</SelectItem>
                <SelectItem value="0.3">Medium (ρ=0.3)</SelectItem>
                <SelectItem value="0.5">Large (ρ=0.5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <ControlSlider
              id="corr-alpha"
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
                <SelectItem value="0.1">0.10</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Results</h2>
          <FormulaDisplay formula={FORMULAS.CORRELATION} />
        </div>
        
        {result && (
          <>
            <Card className="p-6 bg-primary text-primary-foreground">
              <div className="font-medium">{result.summary}</div>
            </Card>

            <Card className="p-6">
              <PowerChart
                data={result.curveData}
                currentValue={n}
                xLabel="Total Sample Size"
                title="Power Curve: Correlation Analysis"
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
                <li><strong>Use Case:</strong> Test for linear relationships between two continuous variables.</li>
                <li><strong>Linearity:</strong> Pearson correlation assumes a linear relationship. Check scatterplots first.</li>
                <li><strong>Independence:</strong> Each observation should be independent of the others.</li>
                <li><strong>Sample Size:</strong> Larger samples needed to detect small correlations reliably.</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default CorrelationCalculator;
