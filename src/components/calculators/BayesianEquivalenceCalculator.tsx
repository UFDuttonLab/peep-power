import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, AlertCircle, Info, Equal, Download, Code2, Copy } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { calculateEquivalenceN } from '@/utils/bayesianPowerCalculations';
import { useToast } from '@/hooks/use-toast';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

const BayesianEquivalenceCalculator = () => {
  const { toast } = useToast();
  const [equivalenceMargin, setEquivalenceMargin] = useState(0.3);
  const [priorMean, setPriorMean] = useState(0.1);
  const [priorSD, setPriorSD] = useState(0.2);
  const [targetProbability, setTargetProbability] = useState(0.95);
  const [targetAssurance, setTargetAssurance] = useState(0.6);
  const [testType, setTestType] = useState<'ttest' | 'correlation'>('ttest');
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const runSimulation = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const res = calculateEquivalenceN({
          equivalenceMargin,
          priorEffect: { mean: priorMean, sd: priorSD },
          targetProbability,
          targetAssurance,
          testType,
          alpha
        });
        setResult(res);
        toast({ title: "Success", description: "Equivalence analysis complete!" });
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Calculation failed. Please check your parameters.", variant: "destructive" });
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  const exportToCSV = () => {
    if (!result) return;
    const csvData = result.chart.map((row: any) => `${row.n},${row.probEquivalent}`).join('\n');
    const blob = new Blob([`Sample Size,Prob Equivalent\n${csvData}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'equivalence_analysis.csv';
    a.click();
    toast({ title: "CSV exported", description: "Data downloaded successfully" });
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'bayesian-equivalence',
      parameters: { equivalenceMargin, priorMean, priorSD, targetProbability, targetAssurance, testType, alpha }
    });
    downloadRFile(rCode, 'equivalence_testing.R');
    toast({ title: "R code exported", description: "Ready to run in RStudio" });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'bayesian-equivalence',
      parameters: { equivalenceMargin, priorMean, priorSD, targetProbability, targetAssurance, testType, alpha }
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
          <CardTitle>Bayesian Equivalence Testing Calculator</CardTitle>
          <CardDescription>
            Calculate sample size to prove treatments are practically equivalent
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <Equal className="h-4 w-4" />
        <AlertDescription>
          <strong>What is Equivalence Testing?</strong> Traditional tests ask "are groups different?" 
          Equivalence tests ask "are groups similar enough to be practically equivalent?" This is crucial 
          for showing no harm, conservation equivalence, or substitutability of methods.
        </AlertDescription>
      </Alert>

      <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-900 dark:text-green-100">
          <strong>When to use:</strong> Showing conservation practices don't harm biodiversity, proving 
          new methods equivalent to gold standard, demonstrating substitutability, bioequivalence studies.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Equivalence Parameters</CardTitle>
              <FormulaDisplay formula={FORMULAS.BAYESIAN_EQUIVALENCE} buttonVariant="ghost" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Test Type</Label>
              <Select value={testType} onValueChange={(v: any) => setTestType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ttest">Two-Sample t-test</SelectItem>
                  <SelectItem value="correlation">Correlation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equivalence Margin (ROPE): ±{equivalenceMargin.toFixed(2)}</Label>
              <Slider
                value={[equivalenceMargin]}
                onValueChange={(v) => setEquivalenceMargin(v[0])}
                min={0.1}
                max={1.0}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Maximum acceptable difference. Effects within ±{equivalenceMargin.toFixed(2)} are "equivalent"
              </p>
            </div>

            <div className="space-y-2">
              <Label>Prior Effect Size - Mean: {priorMean.toFixed(2)}</Label>
              <Slider
                value={[priorMean]}
                onValueChange={(v) => setPriorMean(v[0])}
                min={-0.5}
                max={0.5}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Expected difference (0 = perfect equivalence)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Prior Uncertainty - SD: {priorSD.toFixed(2)}</Label>
              <Slider
                value={[priorSD]}
                onValueChange={(v) => setPriorSD(v[0])}
                min={0.05}
                max={0.8}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <Label>Target Probability: {(targetProbability * 100).toFixed(0)}%</Label>
              <Slider
                value={[targetProbability * 100]}
                onValueChange={(v) => setTargetProbability(v[0] / 100)}
                min={80}
                max={99}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Declare equivalence when the posterior Pr(effect is within ROPE) ≥ this threshold
              </p>
            </div>

            <div className="space-y-2">
              <Label>Target Chance of Success: {(targetAssurance * 100).toFixed(0)}%</Label>
              <Slider
                value={[targetAssurance * 100]}
                onValueChange={(v) => setTargetAssurance(v[0] / 100)}
                min={50}
                max={95}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Required probability, before the study, that it ends by declaring equivalence. It cannot exceed
                the prior probability that the effect is inside the ROPE.
              </p>
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
              {isCalculating ? 'Calculating...' : 'Calculate Equivalence Design'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Required Sample Size</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">{testType === 'ttest' ? 'N Per Group' : 'Total N'}</p>
                    <p className="text-5xl font-bold text-primary">
                      {result.reached ? result.requiredN : `>${result.maxSearchN}`}
                    </p>
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

                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <p className="font-semibold">ROPE Analysis (prior)</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {(result.ropeAnalysis.probInROPE * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">In ROPE</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {(result.ropeAnalysis.probBelowROPE * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Below ROPE</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {(result.ropeAnalysis.probAboveROPE * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Above ROPE</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ROPE = Region of Practical Equivalence (±{equivalenceMargin.toFixed(2)})
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      vs. TOST (Two One-Sided Tests)
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-800 dark:text-blue-200">TOST (80% power at the prior mean) requires</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {Number.isFinite(result.comparisonToTOST.tostN) ? `N = ${result.comparisonToTOST.tostN}` : 'Not reachable'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-800 dark:text-blue-200">Difference</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {result.reached && Number.isFinite(result.comparisonToTOST.difference)
                            ? `${result.comparisonToTOST.difference > 0 ? '+' : ''}${result.comparisonToTOST.difference}`
                            : 'n/a'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Equivalence Probability Curve</CardTitle>
                  <CardDescription>Chance that the study declares equivalence, by sample size</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={result.chart}>
                      <defs>
                        <linearGradient id="equivGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="n" 
                        label={{ value: testType === 'ttest' ? 'Sample Size Per Group' : 'Total Sample Size', position: 'insideBottom', offset: -5 }} 
                      />
                      <YAxis label={{ value: 'Pr(Equivalent)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="probEquivalent" 
                        stroke="hsl(var(--chart-1))"
                        fill="url(#equivGradient)"
                        name="Chance of Declaring Equivalence"
                      />
                      <Line 
                        type="monotone" 
                        dataKey={() => targetAssurance}
                        stroke="hsl(var(--destructive))"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        name="Target Chance of Success"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interpretation Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-semibold mb-1">What is ROPE?</p>
                    <p className="text-sm text-muted-foreground">
                      The Region of Practical Equivalence (±{equivalenceMargin.toFixed(2)}) defines the smallest 
                      difference you care about. Effects smaller than this are considered "equivalent" for practical purposes.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-semibold mb-1">Bayesian vs TOST</p>
                    <p className="text-sm text-muted-foreground">
                      Bayesian approach gives direct probability statements: "95% probability effect is within ROPE". 
                      TOST gives p-values which are harder to interpret. Bayesian approach is often more intuitive.
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-semibold mb-1">Choosing Equivalence Margin</p>
                    <p className="text-sm text-muted-foreground">
                      For Cohen's d: 0.2 (small effect), 0.3 (moderate margin). For correlations: 0.1-0.2. 
                      Should be based on smallest effect size of practical importance, not statistical convenience.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Equal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure parameters and click "Calculate Equivalence Design"</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          <strong>Further Reading:</strong> Kruschke (2018) "Rejecting or Accepting Parameter Values in Bayesian Estimation", 
          Lakens (2017) "Equivalence Testing for Psychological Research"
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BayesianEquivalenceCalculator;
