import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import ControlSlider from '../ControlSlider';
import PowerChart from '../SimplePowerChart';
import { calculateTwoWayAnovaPower } from '@/utils/powerCalculations';
import { Download } from 'lucide-react';

const TwoWayAnovaCalculator = () => {
  const [n, setN] = useState(20);
  const [factorA, setFactorA] = useState(3);
  const [factorB, setFactorB] = useState(2);
  const [effectA, setEffectA] = useState(0.25);
  const [effectB, setEffectB] = useState(0.20);
  const [effectInteraction, setEffectInteraction] = useState(0.15);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const res = calculateTwoWayAnovaPower(n, factorA, factorB, effectA, effectB, effectInteraction, alpha);
    setResult(res);
  }, [n, factorA, factorB, effectA, effectB, effectInteraction, alpha]);

  const handlePreset = (value: string) => {
    if (value === 'fertilizer-water') {
      setN(15);
      setFactorA(3);
      setFactorB(2);
      setEffectA(0.25);
      setEffectB(0.2);
      setEffectInteraction(0.15);
      setAlpha(0.05);
    } else if (value === 'habitat-season') {
      setN(20);
      setFactorA(4);
      setFactorB(3);
      setEffectA(0.3);
      setEffectB(0.25);
      setEffectInteraction(0.2);
      setAlpha(0.05);
    }
  };

  const exportResults = () => {
    const csv = [
      ['n per Cell', 'Power (Interaction)'],
      ...result.curveData.map((d: any) => [d.x, d.y]),
    ]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'twoway-anova-power-analysis.csv';
    a.click();
  };

  return (
    <div className="grid md:grid-cols-[1fr_2fr] gap-6">
      <Card className="p-6 bg-secondary/50">
        <h2 className="text-2xl font-bold mb-6 pb-3 border-b-2 border-border">Two-Way Factorial ANOVA</h2>
        
        <div className="space-y-6">
          <ControlSlider
            id="twoway-n"
            label="Sample Size (n) per cell"
            value={n}
            min={5}
            max={100}
            step={1}
            onChange={setN}
            decimals={0}
            tooltip="Number of independent observations in each combination of factor levels."
          />

          <ControlSlider
            id="twoway-a"
            label="Factor A Levels"
            value={factorA}
            min={2}
            max={6}
            step={1}
            onChange={setFactorA}
            decimals={0}
            tooltip="Number of levels for the first factor (e.g., 3 fertilizer types)."
          />

          <ControlSlider
            id="twoway-b"
            label="Factor B Levels"
            value={factorB}
            min={2}
            max={6}
            step={1}
            onChange={setFactorB}
            decimals={0}
            tooltip="Number of levels for the second factor (e.g., 2 watering levels)."
          />

          <ControlSlider
            id="twoway-effect-a"
            label="Effect Size Factor A (f)"
            value={effectA}
            min={0.05}
            max={1.0}
            step={0.01}
            onChange={setEffectA}
            tooltip="Effect size for the main effect of Factor A."
          />

          <ControlSlider
            id="twoway-effect-b"
            label="Effect Size Factor B (f)"
            value={effectB}
            min={0.05}
            max={1.0}
            step={0.01}
            onChange={setEffectB}
            tooltip="Effect size for the main effect of Factor B."
          />

          <ControlSlider
            id="twoway-interaction"
            label="Interaction Effect Size (f)"
            value={effectInteraction}
            min={0.05}
            max={1.0}
            step={0.01}
            onChange={setEffectInteraction}
            tooltip="Effect size for the A×B interaction effect."
          />

          <div className="space-y-2">
            <ControlSlider
              id="twoway-alpha"
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
                <SelectItem value="fertilizer-water">Fertilizer × Watering experiment</SelectItem>
                <SelectItem value="habitat-season">Habitat type × Season study</SelectItem>
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
                currentValue={n * factorA * factorB}
                xLabel="Total Sample Size (N)"
                title="Power Curve: Interaction Effect"
              />
            </Card>

            <Button onClick={exportResults} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Results (CSV)
            </Button>

            <Card className="p-6 bg-secondary/30 border-l-4 border-accent">
              <h3 className="font-bold text-lg mb-3">Study Design Guidance</h3>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Use Case:</strong> Analyze effects of two factors simultaneously and their interaction.</li>
                <li><strong>Main Effects vs Interaction:</strong> Separate power calculations for Factor A, Factor B, and A×B interaction.</li>
                <li><strong>Sample Size:</strong> The n shown is per cell. Total N = n × levels of A × levels of B.</li>
                <li><strong>Balanced Design:</strong> Equal sample sizes maximize power and simplify interpretation.</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default TwoWayAnovaCalculator;
