import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Plus, Trash2, AlertCircle, Info, Zap, Download, Code2, Copy } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateAdaptiveAllocation } from '@/utils/bayesianPowerCalculations';
import { useToast } from '@/hooks/use-toast';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { ADAPTIVE_ALLOCATION_CITATIONS } from '@/constants/bayesianConstants';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

// Define distinct colors for each treatment in the chart
const CHART_COLORS = [
  'hsl(217, 91%, 60%)',  // Blue
  'hsl(142, 71%, 45%)',  // Green
  'hsl(280, 65%, 60%)',  // Purple
  'hsl(25, 95%, 53%)',   // Orange
  'hsl(346, 77%, 50%)',  // Red
];

const BayesianAdaptiveAllocationCalculator = () => {
  const { toast } = useToast();
  const [treatments, setTreatments] = useState(['Control', 'Treatment A', 'Treatment B']);
  const [priors, setPriors] = useState([
    { mean: 0.3, sd: 0.2 },
    { mean: 0.5, sd: 0.2 },
    { mean: 0.7, sd: 0.2 }
  ]);
  const [maxN, setMaxN] = useState(150);
  const [targetPower, setTargetPower] = useState(0.80);
  const [alpha, setAlpha] = useState(0.05);
  const [allocationRule, setAllocationRule] = useState<'equal' | 'thompson' | 'optimal'>('thompson');
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const addTreatment = () => {
    if (treatments.length < 5) {
      setTreatments([...treatments, `Treatment ${String.fromCharCode(64 + treatments.length)}`]);
      setPriors([...priors, { mean: 0.5, sd: 0.2 }]);
    } else {
      toast({ title: "Error", description: "Maximum 5 treatments supported", variant: "destructive" });
    }
  };

  const removeTreatment = (index: number) => {
    if (treatments.length > 2) {
      setTreatments(treatments.filter((_, i) => i !== index));
      setPriors(priors.filter((_, i) => i !== index));
    } else {
      toast({ title: "Error", description: "Need at least 2 treatments", variant: "destructive" });
    }
  };

  const updateTreatment = (index: number, name: string) => {
    const updated = [...treatments];
    updated[index] = name;
    setTreatments(updated);
  };

  const updatePrior = (index: number, field: 'mean' | 'sd', value: number) => {
    const updated = [...priors];
    updated[index] = { ...updated[index], [field]: value };
    setPriors(updated);
  };

  const runSimulation = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const res = calculateAdaptiveAllocation({
          treatments,
          priors,
          maxN,
          targetPower,
          alpha,
          allocationRule,
          testType: 'anova'
        });
        setResult(res);
        toast({ title: "Success", description: "Adaptive allocation calculated!" });
      } catch (error) {
        toast({ title: "Error", description: "Calculation failed. Please check your parameters.", variant: "destructive" });
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  const exportToCSV = () => {
    if (!result) return;
    const csvData = result.expectedAllocations.map((a: any) => 
      `${a.treatment},${a.n},${a.proportion}`
    ).join('\n');
    const blob = new Blob([`Treatment,N,Proportion\n${csvData}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adaptive_allocation.csv';
    a.click();
    toast({ title: "CSV exported", description: "Data downloaded successfully" });
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'bayesian-adaptive',
      parameters: { treatments, priors, maxN, targetPower, alpha, allocationRule }
    });
    downloadRFile(rCode, 'adaptive_allocation.R');
    toast({ title: "R code exported", description: "Ready to run in RStudio" });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'bayesian-adaptive',
      parameters: { treatments, priors, maxN, targetPower, alpha, allocationRule }
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
          <CardTitle>Bayesian Adaptive Allocation Calculator</CardTitle>
          <CardDescription>
            Dynamically allocate more samples to promising treatments during the study
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>What is Adaptive Allocation?</strong> Instead of equal randomization, adaptive designs allocate 
          more samples to treatments showing better performance. This is both more efficient (better power) and 
          more ethical (fewer subjects to inferior treatments). <a href={`#cite-ethics`} className="text-primary underline text-xs">[1]</a>
        </AlertDescription>
      </Alert>

      <Alert className="bg-muted/50 border-muted">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>When to use:</strong> Restoration experiments comparing multiple interventions, 
          adaptive management trials, conservation action testing, any multi-arm study where ethics favor 
          reducing exposure to ineffective treatments.
          <div className="text-xs mt-2 pt-2 border-t border-border">
            <strong id="cite-ethics">[1]</strong> {ADAPTIVE_ALLOCATION_CITATIONS.ethics}
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Treatments & Priors</span>
                <Button onClick={addTreatment} size="sm" variant="outline" disabled={treatments.length >= 5}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {treatments.map((treatment, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={treatment}
                      onChange={(e) => updateTreatment(idx, e.target.value)}
                      className="w-40"
                    />
                    {treatments.length > 2 && (
                      <Button onClick={() => removeTreatment(idx)} size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Expected Effect - Mean: {priors[idx].mean.toFixed(2)}</Label>
                    <Slider
                      value={[priors[idx].mean]}
                      onValueChange={(v) => updatePrior(idx, 'mean', v[0])}
                      min={0}
                      max={2.0}
                      step={0.05}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Uncertainty - SD: {priors[idx].sd.toFixed(2)}</Label>
                    <Slider
                      value={[priors[idx].sd]}
                      onValueChange={(v) => updatePrior(idx, 'sd', v[0])}
                      min={0.05}
                      max={0.8}
                      step={0.05}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Design Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Total Sample Budget: {maxN}</Label>
                <Slider
                  value={[maxN]}
                  onValueChange={(v) => setMaxN(v[0])}
                  min={30}
                  max={500}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">
                  Total samples available across all treatments
                </p>
              </div>

              <div className="space-y-2">
                <Label>Allocation Rule</Label>
                <Select value={allocationRule} onValueChange={(v: any) => setAllocationRule(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Equal (Baseline)</SelectItem>
                    <SelectItem value="thompson">Thompson Sampling</SelectItem>
                    <SelectItem value="optimal">Optimal (Best Mean)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Thompson: balances exploration/exploitation. Optimal: greedy for best.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Target Power: {(targetPower * 100).toFixed(0)}%</Label>
                <Slider
                  value={[targetPower * 100]}
                  onValueChange={(v) => setTargetPower(v[0] / 100)}
                  min={70}
                  max={95}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Significance Level (α): {alpha}</Label>
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

              <Button onClick={runSimulation} className="w-full" disabled={isCalculating}>
                <Play className="h-4 w-4 mr-2" />
                {isCalculating ? 'Simulating...' : 'Simulate Adaptive Allocation'}
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
                  <CardTitle className="flex items-center justify-between">
                    <span>Expected Allocations</span>
                    <FormulaDisplay formula={FORMULAS.BAYESIAN_ADAPTIVE_ALLOCATION} buttonVariant="outline" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {result.expectedAllocations.map((alloc: any, idx: number) => (
                      <div key={idx} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-lg">{alloc.treatment}</p>
                          <p className="text-2xl font-bold text-primary">{alloc.n}</p>
                        </div>
                        <div className="w-full bg-background h-3 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${alloc.proportion * 100}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(alloc.proportion * 100).toFixed(1)}% of total samples
                        </p>
                      </div>
                    ))}
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>{result.summary}</AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-3 gap-2 mb-4">
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

                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      🎯 Power Gain vs Equal Allocation
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {result.comparisonToEqual.powerGain > 0 ? '+' : ''}{result.comparisonToEqual.powerGain.toFixed(1)}%
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                      Expected power: {(result.expectedPower * 100).toFixed(0)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Allocation Over Time</CardTitle>
                  <CardDescription>How allocation changes during the study</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={result.allocationCurve}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" label={{ value: 'Study Stage', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Cumulative Samples', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      {treatments.map((treatment, idx) => (
                        <Bar 
                          key={treatment}
                          dataKey={`allocations.${treatment}`}
                          stackId="a"
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                          name={treatment}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ethical Benefit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {result.comparisonToEqual.ethicalBenefit}
                  </p>
                  
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold mb-1">Efficiency Gain</p>
                      <p className="text-sm text-muted-foreground">
                        Adaptive allocation concentrates resources where they're most effective, improving 
                        statistical power while potentially reducing overall sample size needs.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold mb-1">Reduced Harm</p>
                      <p className="text-sm text-muted-foreground">
                        Fewer samples allocated to inferior treatments means less exposure to ineffective 
                        or potentially harmful interventions.
                      </p>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold mb-1">Faster Learning</p>
                      <p className="text-sm text-muted-foreground">
                        By focusing on promising treatments, adaptive designs can reach conclusions faster 
                        and with greater confidence.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure treatments and click "Simulate Adaptive Allocation"</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertDescription className="text-yellow-900 dark:text-yellow-100">
          <strong>Important:</strong> Adaptive allocation requires careful statistical planning to maintain type I 
          error control. Consult with a statistician experienced in adaptive designs. Pre-specify allocation rules 
          before data collection.
        </AlertDescription>
      </Alert>

      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          <strong>Further Reading:</strong> Berry et al. (2010) "Bayesian Adaptive Methods for Clinical Trials", 
          Thall & Wathen (2007) "Practical Bayesian adaptive randomisation in clinical trials"
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BayesianAdaptiveAllocationCalculator;
