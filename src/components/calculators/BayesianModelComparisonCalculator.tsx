import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Info, Scale, Download, Code2, Copy, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { calculateModelComparisonN } from '@/utils/bayesianPowerCalculations';
import ControlSlider from '@/components/ControlSlider';
import { Input } from '@/components/ui/input';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

const BayesianModelComparisonCalculator = () => {
  const { toast } = useToast();
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
        toast({ title: "Success", description: "Model comparison calculated!" });
      } catch (error) {
        toast({ title: "Error", description: "Calculation failed.", variant: "destructive" });
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  const exportToCSV = () => {
    if (!result) return;
    const csvData = models.map((m, i) => 
      `${m.name},${m.prior.mean},${m.prior.sd},${m.priorProbability},${m.complexity}`
    ).join('\n');
    const blob = new Blob([`Model,Prior Mean,Prior SD,Prior Prob,Complexity\n${csvData}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model_comparison.csv';
    a.click();
    toast({ title: "CSV exported", description: "Data downloaded successfully" });
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'bayesian-model-comparison',
      parameters: { models, nPerGroup, targetBF, alpha }
    });
    downloadRFile(rCode, 'model_comparison.R');
    toast({ title: "R code exported", description: "Ready to run in RStudio" });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'bayesian-model-comparison',
      parameters: { models, nPerGroup, targetBF, alpha }
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
          <div className="flex items-center justify-between">
            <CardTitle>Bayesian Model Comparison Calculator</CardTitle>
            <FormulaDisplay formula={FORMULAS.BAYESIAN_ASSURANCE} buttonVariant="ghost" />
          </div>
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Study Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ControlSlider
                id="n-per-group"
                label="Starting N Per Group"
                value={nPerGroup}
                onChange={setNPerGroup}
                min={20}
                max={300}
                step={10}
                decimals={0}
                tooltip="Starting sample size per group for calculation"
              />
              <ControlSlider
                id="target-bf"
                label="Target Bayes Factor"
                value={targetBF}
                onChange={setTargetBF}
                min={3}
                max={100}
                step={1}
                decimals={0}
                tooltip="Desired Bayes Factor for evidence: 3=moderate, 10=strong, 30+=very strong"
              />
              <ControlSlider
                id="alpha"
                label="Significance Level (α)"
                value={alpha}
                onChange={setAlpha}
                min={0.01}
                max={0.10}
                step={0.01}
              />
              <Button onClick={runSimulation} className="w-full" disabled={isCalculating}>
                <Play className="h-4 w-4 mr-2" />
                {isCalculating ? 'Calculating...' : 'Calculate Required N'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Specifications</CardTitle>
              <CardDescription>Define competing models and their priors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {models.map((model, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Input
                      value={model.name}
                      onChange={(e) => {
                        const newModels = [...models];
                        newModels[idx].name = e.target.value;
                        setModels(newModels);
                      }}
                      className="font-semibold max-w-[200px]"
                    />
                    {models.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setModels(models.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <ControlSlider
                    id={`model-${idx}-mean`}
                    label="Prior Mean (Effect Size)"
                    value={model.prior.mean}
                    onChange={(v) => {
                      const newModels = [...models];
                      newModels[idx].prior.mean = v;
                      setModels(newModels);
                    }}
                    min={0}
                    max={2}
                    step={0.1}
                    tooltip="Expected effect size under this model"
                  />
                  
                  <ControlSlider
                    id={`model-${idx}-sd`}
                    label="Prior SD (Uncertainty)"
                    value={model.prior.sd}
                    onChange={(v) => {
                      const newModels = [...models];
                      newModels[idx].prior.sd = v;
                      setModels(newModels);
                    }}
                    min={0.05}
                    max={0.5}
                    step={0.05}
                    tooltip="Uncertainty about the effect size"
                  />
                  
                  <ControlSlider
                    id={`model-${idx}-prob`}
                    label="Prior Probability"
                    value={model.priorProbability}
                    onChange={(v) => {
                      const newModels = [...models];
                      newModels[idx].priorProbability = v;
                      setModels(newModels);
                    }}
                    min={0.1}
                    max={0.8}
                    step={0.05}
                    tooltip="Your belief in this model before seeing data"
                  />
                  
                  <ControlSlider
                    id={`model-${idx}-complexity`}
                    label="Model Complexity"
                    value={model.complexity}
                    onChange={(v) => {
                      const newModels = [...models];
                      newModels[idx].complexity = v;
                      setModels(newModels);
                    }}
                    min={1}
                    max={10}
                    step={1}
                    decimals={0}
                    tooltip="Number of parameters (1=simple, 10=complex)"
                  />
                </div>
              ))}
              
              {models.length < 5 && (
                <Button
                  variant="outline"
                  onClick={() => setModels([...models, { 
                    name: `Model ${models.length + 1}`, 
                    prior: { mean: 0.5, sd: 0.2 }, 
                    priorProbability: 0.3, 
                    complexity: 2 
                  }])}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Model
                </Button>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Prior probabilities should sum to 1.0. Current sum: {models.reduce((sum, m) => sum + m.priorProbability, 0).toFixed(2)}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
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

                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-semibold">Model Comparison Details</h4>
                  {models.map((model, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded text-sm">
                      <div className="font-semibold">{model.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Prior: μ={model.prior.mean.toFixed(2)}, σ={model.prior.sd.toFixed(2)} • 
                        P(Model)={model.priorProbability.toFixed(2)} • 
                        Complexity={model.complexity}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
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
