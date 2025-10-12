import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Info, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import { calibrateFrequentistToBayesian } from '@/utils/bayesianPowerCalculations';

const BayesianCalibrationCalculator = () => {
  const [frequentistPower, setFrequentistPower] = useState(0.80);
  const [effectSize, setEffectSize] = useState(0.5);
  const [effectUncertainty, setEffectUncertainty] = useState(0.2);
  const [nPerGroup, setNPerGroup] = useState(64);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const runSimulation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const res = calibrateFrequentistToBayesian({ frequentistPower, effectSize, effectUncertainty, nPerGroup, testType: 'ttest', alpha });
        setResult(res);
        toast.success('Calibration complete!');
      } catch (error) {
        toast.error('Calculation failed.');
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bayesian Calibration Tool</CardTitle>
          <CardDescription>Translate frequentist power to Bayesian assurance</CardDescription>
        </CardHeader>
      </Card>
      <Alert>
        <Gauge className="h-4 w-4" />
        <AlertDescription>
          <strong>What is Calibration?</strong> Shows how much "power" you lose when accounting for uncertainty in effect size.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Frequentist Power: {(frequentistPower * 100).toFixed(0)}%</Label>
              <Slider value={[frequentistPower * 100]} onValueChange={(v) => setFrequentistPower(v[0] / 100)} min={70} max={95} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Effect Size: {effectSize.toFixed(2)}</Label>
              <Slider value={[effectSize]} onValueChange={(v) => setEffectSize(v[0])} min={0.2} max={1.5} step={0.05} />
            </div>
            <div className="space-y-2">
              <Label>Effect Uncertainty (SD): {effectUncertainty.toFixed(2)}</Label>
              <Slider value={[effectUncertainty]} onValueChange={(v) => setEffectUncertainty(v[0])} min={0.05} max={0.8} step={0.05} />
            </div>
            <div className="space-y-2">
              <Label>N Per Group: {nPerGroup}</Label>
              <Slider value={[nPerGroup]} onValueChange={(v) => setNPerGroup(v[0])} min={10} max={300} step={5} />
            </div>
            <Button onClick={runSimulation} className="w-full" disabled={isCalculating}>
              <Play className="h-4 w-4 mr-2" />
              {isCalculating ? 'Calibrating...' : 'Calibrate to Bayesian'}
            </Button>
          </CardContent>
        </Card>
        <div className="space-y-6">
          {result ? (
            <Card>
              <CardHeader>
                <CardTitle>Calibration Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Bayesian Assurance</p>
                    <p className="text-3xl font-bold text-primary">{(result.bayesianAssurance * 100).toFixed(0)}%</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Assurance Loss</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{result.assuranceLoss.toFixed(0)}%</p>
                  </div>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription dangerouslySetInnerHTML={{ __html: result.summary }} />
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter parameters to calibrate</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BayesianCalibrationCalculator;
