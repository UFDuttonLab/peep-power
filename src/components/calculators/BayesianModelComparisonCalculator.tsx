import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Plus, Trash2, Info, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { calculateModelComparisonN } from '@/utils/bayesianPowerCalculations';

const BayesianModelComparisonCalculator = () => {
  const [models, setModels] = useState([
    { name: 'Null Model', prior: { mean: 0, sd: 0.1 }, priorProbability: 0.3, complexity: 1 },
    { name: 'Small Effect', prior: { mean: 0.3, sd: 0.2 }, priorProbability: 0.4, complexity: 2 },
    { name: 'Large Effect', prior: { mean: 0.8, sd: 0.2 }, priorProbability: 0.3, complexity: 3 }
  ]);
  const [nPerGroup, setNPerGroup] = useState(50);
  const [targetBF, setTargetBF] = useState(10);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const runSimulation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const res = calculateModelComparisonN({ models, nPerGroup, testType: 'ttest', alpha, targetBayesFactor: targetBF });
        setResult(res);
        toast.success('Model comparison calculated!');
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
          <CardTitle>Bayesian Model Comparison Calculator</CardTitle>
          <CardDescription>Calculate sample size for selecting between competing models</CardDescription>
        </CardHeader>
      </Card>
      <Alert>
        <Scale className="h-4 w-4" />
        <AlertDescription>
          <strong>What is Model Comparison?</strong> Tests competing ecological theories by comparing models. 
          Uses Bayes Factors to quantify evidence for one model over another.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Starting N Per Group: {nPerGroup}</Label>
              <Slider value={[nPerGroup]} onValueChange={(v) => setNPerGroup(v[0])} min={20} max={300} step={10} />
            </div>
            <div className="space-y-2">
              <Label>Target Bayes Factor: {targetBF}</Label>
              <Slider value={[targetBF]} onValueChange={(v) => setTargetBF(v[0])} min={3} max={100} step={1} />
            </div>
            <Button onClick={runSimulation} className="w-full" disabled={isCalculating}>
              <Play className="h-4 w-4 mr-2" />
              {isCalculating ? 'Calculating...' : 'Calculate Required N'}
            </Button>
          </CardContent>
        </Card>
        <div className="space-y-6">
          {result ? (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-primary/10 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Required N Per Group</p>
                  <p className="text-5xl font-bold text-primary">{result.requiredN}</p>
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
                  <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure and calculate</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BayesianModelComparisonCalculator;
