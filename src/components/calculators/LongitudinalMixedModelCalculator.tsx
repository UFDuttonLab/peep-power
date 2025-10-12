import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ControlSlider from '@/components/ControlSlider';
import SimplePowerChart from '@/components/SimplePowerChart';
import TimelineVisualization from '@/components/TimelineVisualization';
import { calculateLMMPower, calculateRequiredSampleSizeLMM } from '@/utils/microbiomePowerCalculations';
import { AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';

const LongitudinalMixedModelCalculator = () => {
  const [nSubjects, setNSubjects] = useState(30);
  const [nTimepoints, setNTimepoints] = useState(4);
  const [effectSize, setEffectSize] = useState(0.25);
  const [withinCorr, setWithinCorr] = useState(0.6);
  const [randomSlopeVar, setRandomSlopeVar] = useState(0.3);
  const [nCovariates, setNCovariates] = useState(0);
  const [dropoutRate, setDropoutRate] = useState(0.1);
  const [alpha, setAlpha] = useState(0.05);

  const power = calculateLMMPower(nSubjects, nTimepoints, effectSize, withinCorr, randomSlopeVar, nCovariates, dropoutRate, alpha);
  const requiredN = calculateRequiredSampleSizeLMM(0.8, nTimepoints, effectSize, withinCorr, randomSlopeVar, nCovariates, dropoutRate, alpha);

  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'antibiotic':
        setNSubjects(25);
        setNTimepoints(3);
        setEffectSize(0.4);
        setWithinCorr(0.8);
        setDropoutRate(0.05);
        toast.success('Applied: Antibiotic trial preset');
        break;
      case 'diet':
        setNSubjects(40);
        setNTimepoints(6);
        setEffectSize(0.25);
        setWithinCorr(0.6);
        setDropoutRate(0.15);
        toast.success('Applied: Diet intervention preset');
        break;
      case 'disease':
        setNSubjects(50);
        setNTimepoints(10);
        setEffectSize(0.2);
        setWithinCorr(0.4);
        setDropoutRate(0.20);
        toast.success('Applied: Disease progression preset');
        break;
    }
  };

  const generatePowerCurve = () => {
    return Array.from({ length: 30 }, (_, i) => {
      const subjects = (i + 1) * 3;
      return {
        x: subjects,
        y: calculateLMMPower(subjects, nTimepoints, effectSize, withinCorr, randomSlopeVar, nCovariates, dropoutRate, alpha),
      };
    });
  };

  const getPowerInterpretation = () => {
    if (power >= 0.8) return { color: 'text-green-600', icon: TrendingUp, message: 'Excellent power' };
    if (power >= 0.6) return { color: 'text-yellow-600', icon: AlertCircle, message: 'Moderate power' };
    return { color: 'text-red-600', icon: AlertCircle, message: 'Low power' };
  };

  const interpretation = getPowerInterpretation();
  const Icon = interpretation.icon;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Longitudinal Mixed Model Power Analysis
            </h2>
            <p className="text-muted-foreground">
              Calculate power for complex longitudinal microbiome studies with covariates, 
              random effects, and missing data. More flexible than repeated measures PERMANOVA.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Quick Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => applyPreset('antibiotic')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Antibiotic Trial</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              3 timepoints, high correlation
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('diet')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Diet Intervention</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              6 timepoints, moderate correlation
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('disease')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Disease Progression</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              10 timepoints, low correlation
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
            <h3 className="text-lg font-semibold mb-4">Study Design</h3>
            <div className="space-y-6">
              <ControlSlider
                id="nsubjects"
                label="Number of Subjects"
                value={nSubjects}
                min={10}
                max={200}
                step={5}
                onChange={setNSubjects}
                decimals={0}
                tooltip="Total subjects across all groups"
              />
              
              <ControlSlider
                id="ntimepoints"
                label="Timepoints per Subject"
                value={nTimepoints}
                min={2}
                max={10}
                step={1}
                onChange={setNTimepoints}
                decimals={0}
                tooltip="Number of measurements per subject"
              />

              <ControlSlider
                id="effectsize"
                label="Effect Size (Cohen's f)"
                value={effectSize}
                min={0.1}
                max={1.0}
                step={0.05}
                onChange={setEffectSize}
                tooltip="Time × treatment interaction effect. 0.1=small, 0.25=medium, 0.4=large"
              />

              <ControlSlider
                id="withincorr"
                label="Within-Subject Correlation"
                value={withinCorr}
                min={0}
                max={0.95}
                step={0.05}
                onChange={setWithinCorr}
                tooltip="How correlated are repeated measures within subjects? 0.6-0.8 typical for microbiome"
              />

              <ControlSlider
                id="randomslope"
                label="Random Slope Variance"
                value={randomSlopeVar}
                min={0}
                max={1.0}
                step={0.1}
                onChange={setRandomSlopeVar}
                tooltip="How much do individual trajectories vary? 0=parallel, 1=highly variable"
              />

              <ControlSlider
                id="dropoutrate"
                label="Dropout Rate per Timepoint"
                value={dropoutRate}
                min={0}
                max={0.3}
                step={0.05}
                onChange={setDropoutRate}
                tooltip="Proportion of subjects lost at each timepoint"
              />

              <div className="space-y-3">
                <label className="text-sm font-medium">Number of Covariates</label>
                <Select value={nCovariates.toString()} onValueChange={(v) => setNCovariates(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    <SelectItem value="1">1 covariate</SelectItem>
                    <SelectItem value="2">2 covariates</SelectItem>
                    <SelectItem value="3">3+ covariates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ControlSlider
                id="alpha"
                label="Significance Level (α)"
                value={alpha}
                min={0.01}
                max={0.10}
                step={0.01}
                onChange={setAlpha}
              />
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
                <div className="text-sm text-muted-foreground">Current Subjects</div>
                <div className="text-2xl font-bold">{nSubjects}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">For 80% Power</div>
                <div className="text-2xl font-bold">{requiredN} subjects</div>
              </div>
            </div>
          </Card>

          <SimplePowerChart
            data={generatePowerCurve()}
            currentValue={nSubjects}
            xLabel="Number of Subjects"
            title="Power vs Sample Size"
          />

          <TimelineVisualization
            nTimepoints={nTimepoints}
            dropoutRate={dropoutRate}
          />
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">When to Use LMM</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Complex longitudinal design with covariates</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Missing data or irregular sampling intervals</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Individual trajectories vary (random slopes needed)</span>
              </li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LongitudinalMixedModelCalculator;