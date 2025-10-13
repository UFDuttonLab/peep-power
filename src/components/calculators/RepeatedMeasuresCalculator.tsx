import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import ControlSlider from '../ControlSlider';
import PowerChart from '../SimplePowerChart';
import { calculateRepeatedMeasuresPower } from '@/utils/powerCalculations';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { Download, Code2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

const RepeatedMeasuresCalculator = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState(30);
  const [timepoints, setTimepoints] = useState(4);
  const [effectSize, setEffectSize] = useState(0.25);
  const [correlation, setCorrelation] = useState(0.5);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const res = calculateRepeatedMeasuresPower(subjects, timepoints, effectSize, correlation, alpha);
    setResult(res);
  }, [subjects, timepoints, effectSize, correlation, alpha]);

  const handlePreset = (value: string) => {
    if (value === 'seasonal') {
      setSubjects(30);
      setTimepoints(4);
      setEffectSize(0.25);
      setCorrelation(0.5);
      setAlpha(0.05);
    } else if (value === 'monthly') {
      setSubjects(40);
      setTimepoints(6);
      setEffectSize(0.2);
      setCorrelation(0.6);
      setAlpha(0.05);
    }
  };

  const exportResults = () => {
    const csv = [
      ['Number of Subjects', 'Power'],
      ...result.curveData.map((d: any) => [d.x, d.y]),
    ]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'repeated-measures-power-analysis.csv';
    a.click();
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'repeated-measures',
      parameters: { subjects, timepoints, effectSize, correlation, alpha }
    });
    downloadRFile(rCode, 'repeated_measures_power_analysis.R');
    toast({
      title: "R code exported",
      description: "You can now run this analysis in R/RStudio",
    });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'repeated-measures',
      parameters: { subjects, timepoints, effectSize, correlation, alpha }
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
        <h2 className="text-2xl font-bold mb-6 pb-3 border-b-2 border-border">Repeated Measures ANOVA</h2>
        
        <div className="space-y-6">
          <ControlSlider
            id="rm-subjects"
            label="Number of Subjects"
            value={subjects}
            min={5}
            max={100}
            step={1}
            onChange={setSubjects}
            decimals={0}
            tooltip="Number of independent subjects/units being measured repeatedly."
          />

          <ControlSlider
            id="rm-timepoints"
            label="Number of Time Points"
            value={timepoints}
            min={3}
            max={10}
            step={1}
            onChange={setTimepoints}
            decimals={0}
            tooltip="Number of repeated measurements per subject (e.g., 4 seasons, 6 months)."
          />

          <div className="space-y-2">
            <ControlSlider
              id="rm-effect"
              label="Effect Size (f)"
              value={effectSize}
              min={0.05}
              max={1.0}
              step={0.01}
              onChange={setEffectSize}
              tooltip="Effect size for the within-subjects factor (time)."
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

          <ControlSlider
            id="rm-correlation"
            label="Correlation (r)"
            value={correlation}
            min={0.1}
            max={0.9}
            step={0.05}
            onChange={setCorrelation}
            tooltip="Expected correlation between repeated measurements on the same subject. Higher values increase power."
          />

          <div className="space-y-2">
            <ControlSlider
              id="rm-alpha"
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
                <SelectItem value="seasonal">Seasonal monitoring (quarterly)</SelectItem>
                <SelectItem value="monthly">Monthly population counts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Results</h2>
          <FormulaDisplay formula={FORMULAS.REPEATED_MEASURES} />
        </div>
        
        {result && (
          <>
            <Card className="p-6 bg-primary text-primary-foreground">
              <div className="font-medium">{result.summary}</div>
            </Card>

            <Card className="p-6">
              <PowerChart
                data={result.curveData}
                currentValue={subjects}
                xLabel="Number of Subjects"
                title="Power Curve: Repeated Measures ANOVA"
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
                <li><strong>Use Case:</strong> Analyze changes over time when the same subjects/sites are measured repeatedly.</li>
                <li><strong>Correlation Benefits:</strong> Higher correlation between repeated measures increases statistical power.</li>
                <li><strong>Sphericity Assumption:</strong> Assumes equal correlations between all pairs of time points.</li>
                <li><strong>Missing Data:</strong> Plan for potential dropouts, especially in long-term studies.</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default RepeatedMeasuresCalculator;
