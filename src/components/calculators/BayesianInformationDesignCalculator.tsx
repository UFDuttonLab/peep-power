import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Plus, Trash2, AlertCircle, Info, Target, Download, Code2, Copy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateInformationBasedDesign } from '@/utils/bayesianPowerCalculations';
import { useToast } from '@/hooks/use-toast';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';

const BayesianInformationDesignCalculator = () => {
  const { toast } = useToast();
  const [priorMean, setPriorMean] = useState(0.5);
  const [priorSD, setPriorSD] = useState(0.3);
  const [testType, setTestType] = useState<'ttest' | 'anova'>('ttest');
  const [groups, setGroups] = useState(2);
  const [objective, setObjective] = useState<'maximize-info' | 'cost-benefit' | 'minimize-uncertainty'>('cost-benefit');
  const [designs, setDesigns] = useState([
    { name: 'Design A', nPerGroup: 30, measurementError: 1.0, cost: 100 },
    { name: 'Design B', nPerGroup: 50, measurementError: 0.8, cost: 180 },
    { name: 'Design C', nPerGroup: 100, measurementError: 0.6, cost: 400 }
  ]);
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const addDesign = () => {
    setDesigns([...designs, { 
      name: `Design ${String.fromCharCode(65 + designs.length)}`, 
      nPerGroup: 40, 
      measurementError: 1.0, 
      cost: 150 
    }]);
  };

  const removeDesign = (index: number) => {
    if (designs.length > 2) {
      setDesigns(designs.filter((_, i) => i !== index));
    } else {
      toast({ title: "Error", description: "Need at least 2 designs to compare", variant: "destructive" });
    }
  };

  const updateDesign = (index: number, field: string, value: any) => {
    const updated = [...designs];
    updated[index] = { ...updated[index], [field]: value };
    setDesigns(updated);
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const res = calculateInformationBasedDesign({
          priorUncertainty: { mean: priorMean, sd: priorSD },
          designs,
          testType,
          groups: testType === 'anova' ? groups : undefined,
          objective
        });
        setResult(res);
        toast({ title: "Success", description: "Design comparison complete!" });
      } catch (error) {
        toast({ title: "Error", description: "Analysis failed. Please check your parameters.", variant: "destructive" });
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  const exportToCSV = () => {
    if (!result) return;
    const csvData = result.rankedDesigns.map((d: any) => 
      `${d.name},${d.rank},${d.expectedInfo},${d.costPerInfo},${d.posteriorSD},${d.uncertaintyReduction}`
    ).join('\n');
    const blob = new Blob([`Design,Rank,Info,Cost per Info,Posterior SD,Uncertainty Reduction\n${csvData}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design_comparison.csv';
    a.click();
    toast({ title: "CSV exported", description: "Data downloaded successfully" });
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'bayesian-information',
      parameters: { priorMean, priorSD, testType, groups, objective, designs }
    });
    downloadRFile(rCode, 'information_design.R');
    toast({ title: "R code exported", description: "Ready to run in RStudio" });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'bayesian-information',
      parameters: { priorMean, priorSD, testType, groups, objective, designs }
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
          <CardTitle>Bayesian Information-Based Design Calculator</CardTitle>
          <CardDescription>
            Compare multiple study designs to maximize information gain per unit cost
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <strong>What is Information-Based Design?</strong> Uses information theory to quantify "how much we'll learn" 
          from each design option. Helps choose between different sampling strategies, measurement methods, or sample sizes 
          by balancing information gain with cost.
        </AlertDescription>
      </Alert>

      <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-900 dark:text-green-100">
          <strong>When to use:</strong> Pilot study planning, choosing between measurement technologies, 
          optimizing field sampling effort, comparing destructive vs non-destructive methods.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prior Uncertainty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Effect Size Prior - Mean: {priorMean.toFixed(2)}</Label>
                <Slider
                  value={[priorMean]}
                  onValueChange={(v) => setPriorMean(v[0])}
                  min={0.1}
                  max={2.0}
                  step={0.05}
                />
              </div>

              <div className="space-y-2">
                <Label>Effect Size Prior - SD: {priorSD.toFixed(2)}</Label>
                <Slider
                  value={[priorSD]}
                  onValueChange={(v) => setPriorSD(v[0])}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                />
              </div>

              <div className="space-y-2">
                <Label>Test Type</Label>
                <Select value={testType} onValueChange={(v: any) => setTestType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ttest">Two-Sample t-test</SelectItem>
                    <SelectItem value="anova">One-Way ANOVA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {testType === 'anova' && (
                <div className="space-y-2">
                  <Label>Number of Groups: {groups}</Label>
                  <Slider
                    value={[groups]}
                    onValueChange={(v) => setGroups(v[0])}
                    min={2}
                    max={10}
                    step={1}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Optimization Objective</Label>
                <Select value={objective} onValueChange={(v: any) => setObjective(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maximize-info">Maximize Information</SelectItem>
                    <SelectItem value="cost-benefit">Best Cost-Benefit</SelectItem>
                    <SelectItem value="minimize-uncertainty">Minimize Uncertainty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Design Options</span>
                <Button onClick={addDesign} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {designs.map((design, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={design.name}
                      onChange={(e) => updateDesign(idx, 'name', e.target.value)}
                      className="w-32"
                    />
                    {designs.length > 2 && (
                      <Button onClick={() => removeDesign(idx)} size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">N Per Group: {design.nPerGroup}</Label>
                    <Slider
                      value={[design.nPerGroup]}
                      onValueChange={(v) => updateDesign(idx, 'nPerGroup', v[0])}
                      min={10}
                      max={200}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Measurement Error (SD): {design.measurementError.toFixed(2)}</Label>
                    <Slider
                      value={[design.measurementError]}
                      onValueChange={(v) => updateDesign(idx, 'measurementError', v[0])}
                      min={0.1}
                      max={3.0}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Relative Cost: {design.cost}</Label>
                    <Slider
                      value={[design.cost]}
                      onValueChange={(v) => updateDesign(idx, 'cost', v[0])}
                      min={50}
                      max={1000}
                      step={10}
                    />
                  </div>
                </div>
              ))}

              <Button onClick={runAnalysis} className="w-full" disabled={isCalculating}>
                <Play className="h-4 w-4 mr-2" />
                {isCalculating ? 'Analyzing...' : 'Compare Designs'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Optimal Design</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-primary/10 rounded-lg">
                    <p className="text-4xl font-bold text-primary mb-2">{result.optimalDesign}</p>
                    <p className="text-sm text-muted-foreground">Best design for {objective.replace('-', ' ')}</p>
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

              <Card>
                <CardHeader>
                  <CardTitle>Design Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.rankedDesigns.map((design: any) => (
                      <div key={design.name} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-lg">#{design.rank} {design.name}</p>
                            <p className="text-sm text-muted-foreground">{design.recommendation}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                          <div>
                            <p className="text-muted-foreground">Fisher Information</p>
                            <p className="font-semibold">{design.expectedInfo.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cost per Info</p>
                            <p className="font-semibold">{design.costPerInfo.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Posterior SD</p>
                            <p className="font-semibold">{design.posteriorSD.toFixed(3)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Uncertainty ↓</p>
                            <p className="font-semibold text-green-600 dark:text-green-400">
                              {design.uncertaintyReduction.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Information vs Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={result.chart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="design" />
                      <YAxis yAxisId="left" label={{ value: 'Information', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Cost', angle: 90, position: 'insideRight' }} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="info" fill="hsl(var(--primary))" name="Information" />
                      <Bar yAxisId="right" dataKey="cost" fill="hsl(var(--chart-2))" name="Cost" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Add designs and click "Compare Designs" to find optimal study design</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          <strong>Further Reading:</strong> Chaloner & Verdinelli (1995) "Bayesian Experimental Design: A Review", 
          Ryan et al. (2016) "Using Bayesian Adaptive Designs to Improve Phase III Trials"
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BayesianInformationDesignCalculator;
