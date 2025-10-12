import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Info, Gauge, Download, Code2, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { calibrateFrequentistToBayesian } from '@/utils/bayesianPowerCalculations';

const BayesianCalibrationCalculator = () => {
  const { toast } = useToast();
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
        toast({ title: "Success", description: "Calibration complete!" });
      } catch (error) {
        toast({ title: "Error", description: "Calculation failed.", variant: "destructive" });
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  const exportToCSV = () => {
    if (!result) return;
    const csvData = `Frequentist Power,Bayesian Assurance,Assurance Loss\n${frequentistPower},${result.bayesianAssurance},${result.assuranceLoss}`;
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calibration_results.csv';
    a.click();
    toast({ title: "CSV exported", description: "Data downloaded successfully" });
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'bayesian-calibration',
      parameters: { frequentistPower, effectSize, effectUncertainty, nPerGroup, alpha }
    });
    downloadRFile(rCode, 'bayesian_calibration.R');
    toast({ title: "R code exported", description: "Ready to run in RStudio" });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'bayesian-calibration',
      parameters: { frequentistPower, effectSize, effectUncertainty, nPerGroup, alpha }
    });
    const success = await copyToClipboard(rCode);
    if (success) {
      toast({ title: "Copied to clipboard", description: "R code ready to paste" });
    }
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
                
                {/* Sample size recommendation with clear status */}
                <div className={`p-4 rounded-lg border-2 ${
                  result.recommendedN === nPerGroup 
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-500' 
                    : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.recommendedN === nPerGroup ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <p className="font-semibold text-green-900 dark:text-green-100">Sample Size Sufficient</p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <p className="font-semibold text-yellow-900 dark:text-yellow-100">Increase Sample Size</p>
                      </>
                    )}
                  </div>
                  <p className={`text-sm ${
                    result.recommendedN === nPerGroup 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {result.recommendedN === nPerGroup 
                      ? `Current N=${nPerGroup} is adequate for ${(frequentistPower * 100).toFixed(0)}% assurance`
                      : `Increase from N=${nPerGroup} to N=${result.recommendedN} per group`
                    }
                  </p>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription dangerouslySetInnerHTML={{ __html: result.summary }} />
                </Alert>

                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={exportToCSV} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button onClick={exportToR} variant="outline" size="sm">
                    <Code2 className="mr-2 h-4 w-4" />
                    R Code
                  </Button>
                  <Button onClick={copyRCode} variant="outline" size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
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
