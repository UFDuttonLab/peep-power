import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Download, Copy, Code2, AlertCircle, Info } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateBayesianSequential } from '@/utils/bayesianPowerCalculations';
import { useToast } from '@/hooks/use-toast';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

const BayesianSequentialCalculator = () => {
  const { toast } = useToast();
  const [effectMean, setEffectMean] = useState(0.5);
  const [effectSD, setEffectSD] = useState(0.2);
  const [targetPower, setTargetPower] = useState(0.80);
  const [alpha, setAlpha] = useState(0.05);
  const [testType, setTestType] = useState<'ttest' | 'anova' | 'correlation'>('ttest');
  const [groups, setGroups] = useState(3);
  const [maxN, setMaxN] = useState(100);
  const [interimLooks, setInterimLooks] = useState(3);
  const [stoppingRule, setStoppingRule] = useState<'futility' | 'superiority' | 'both'>('both');
  const [futilityThreshold, setFutilityThreshold] = useState(0.1);
  const [superiorityThreshold, setSuperiorityThreshold] = useState(0.9);
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const runSimulation = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const res = calculateBayesianSequential({
          effectSizePrior: { mean: effectMean, sd: effectSD },
          targetPower,
          alpha,
          testType,
          groups: testType === 'anova' ? groups : undefined,
          maxN,
          interimLooks,
          stoppingRule,
          futilityThreshold,
          superiorityThreshold
        });
        setResult(res);
        toast({ title: "Success", description: "Sequential design calculated!" });
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Calculation failed. Please check your parameters.", variant: "destructive" });
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  const exportToCSV = () => {
    if (!result) return;
    
    const csvContent = [
      ['Look', 'N', 'Stop Futility', 'Stop Superiority', 'Continue'],
      ...result.stoppingProbabilities.map((sp: any) => [
        sp.look,
        sp.n,
        sp.stopFutility.toFixed(4),
        sp.stopSuperiority.toFixed(4),
        sp.continue.toFixed(4)
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bayesian_sequential_results.csv';
    a.click();
    toast({ title: "Exported", description: "Results saved to CSV!" });
  };

  const exportToR = () => {
    if (!result) return;
    const rCode = generateRCode({
      testType: 'bayesian-sequential',
      parameters: { effectMean, effectSD, maxN, interimLooks, testType, groups, alpha, stoppingRule, futilityThreshold, superiorityThreshold }
    });
    downloadRFile(rCode, 'bayesian_sequential_analysis.R');
    toast({ title: "R code exported", description: "Ready to run in RStudio" });
  };

  const copyRCode = async () => {
    if (!result) return;
    const rCode = generateRCode({
      testType: 'bayesian-sequential',
      parameters: { effectMean, effectSD, maxN, interimLooks, testType, groups, alpha, stoppingRule, futilityThreshold, superiorityThreshold }
    });
    const success = await copyToClipboard(rCode);
    if (success) {
      toast({ title: "Copied", description: "R code ready to paste" });
    }
  };

  const copyResults = () => {
    if (!result) return;
    
    const text = `Bayesian Sequential Design Results

Expected N: ${result.expectedN} per group
Sample Size Savings: ${result.savings.percentReduction.toFixed(1)}%
Power Under Prior: ${(result.operatingCharacteristics.powerUnderPrior * 100).toFixed(1)}%

${result.summary}`;
    
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Results copied to clipboard!" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bayesian Sequential Design Calculator</CardTitle>
          <CardDescription>
            Plan adaptive studies with interim analyses that stop early for futility or success
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>What is Sequential Design?</strong> Instead of collecting all data upfront, sequential designs 
          perform interim analyses. Studies can stop early if results are overwhelming (superiority) or hopeless 
          (futility), saving time and resources while maintaining statistical validity.
        </AlertDescription>
      </Alert>

      <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-900 dark:text-green-100">
          <strong>When to use:</strong> Field studies with high costs, ecological monitoring programs, 
          adaptive management experiments where early decisions save resources.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Design Parameters</CardTitle>
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
                  <SelectItem value="anova">One-Way ANOVA</SelectItem>
                  <SelectItem value="correlation">Correlation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {testType === 'anova' && (
              <div className="space-y-2">
                <Label>Number of Groups: {groups}</Label>
                <Slider
                  value={[groups]}
                  onValueChange={(v) => setGroups(v[0])}
                  min={3}
                  max={10}
                  step={1}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Effect Size Prior - Mean: {effectMean.toFixed(2)}</Label>
              <Slider
                value={[effectMean]}
                onValueChange={(v) => setEffectMean(v[0])}
                min={0.1}
                max={2.0}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <Label>Effect Size Prior - SD: {effectSD.toFixed(2)}</Label>
              <Slider
                value={[effectSD]}
                onValueChange={(v) => setEffectSD(v[0])}
                min={0.05}
                max={1.0}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum N {testType === 'correlation' ? '(Total)' : 'Per Group'}: {maxN}</Label>
              <Slider
                value={[maxN]}
                onValueChange={(v) => setMaxN(v[0])}
                min={20}
                max={300}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <Label>Number of Interim Looks (before the final analysis): {interimLooks}</Label>
              <Slider
                value={[interimLooks]}
                onValueChange={(v) => setInterimLooks(v[0])}
                min={2}
                max={10}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Stopping Rule</Label>
              <Select value={stoppingRule} onValueChange={(v: any) => setStoppingRule(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="futility">Futility Only</SelectItem>
                  <SelectItem value="superiority">Superiority Only</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(stoppingRule === 'futility' || stoppingRule === 'both') && (
              <div className="space-y-2">
                <Label>Futility Threshold: {futilityThreshold.toFixed(2)}</Label>
                <p className="text-xs text-muted-foreground">
                  Stop for futility when the predictive probability of a significant final result is at or below this value
                </p>
                <Slider
                  value={[futilityThreshold]}
                  onValueChange={(v) => setFutilityThreshold(v[0])}
                  min={0.01}
                  max={0.3}
                  step={0.01}
                />
              </div>
            )}

            {(stoppingRule === 'superiority' || stoppingRule === 'both') && (
              <div className="space-y-2">
                <Label>Superiority Threshold: {superiorityThreshold.toFixed(2)}</Label>
                <p className="text-xs text-muted-foreground">
                  Stop and declare success when the predictive probability of a significant final result reaches this value
                </p>
                <Slider
                  value={[superiorityThreshold]}
                  onValueChange={(v) => setSuperiorityThreshold(v[0])}
                  min={0.7}
                  max={0.99}
                  step={0.01}
                />
              </div>
            )}

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
              {isCalculating ? 'Calculating...' : 'Calculate Sequential Design'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Sequential Design Results</CardTitle>
                    <FormulaDisplay formula={FORMULAS.BAYESIAN_SEQUENTIAL} buttonVariant="ghost" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Expected N</p>
                      <p className="text-2xl font-bold text-primary">{result.expectedN}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Sample Savings</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {result.savings.percentReduction.toFixed(0)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Power Under Prior</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {(result.operatingCharacteristics.powerUnderPrior * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Max N (Fixed)</p>
                      <p className="text-2xl font-bold text-muted-foreground">{result.maxN}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Type I Error (simulated)</p>
                      <p className={`text-2xl font-bold ${result.operatingCharacteristics.typeIError > alpha * 1.2 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                        {(result.operatingCharacteristics.typeIError * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>{result.summary}</AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-3 gap-2">
                    <Button onClick={exportToCSV} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button onClick={exportToR} variant="outline" size="sm">
                      <Code2 className="h-4 w-4 mr-2" />
                      R Code
                    </Button>
                    <Button onClick={copyRCode} variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stopping Probabilities</CardTitle>
                  <CardDescription>Probability of stopping at each analysis, and of continuing past it (the last point is the final analysis)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={result.chart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="n" label={{ value: 'Sample Size', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Probability', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="stopProb" stroke="hsl(var(--primary))" name="Stop (Any)" strokeWidth={2} />
                      <Line type="monotone" dataKey="continueProb" stroke="hsl(var(--chart-2))" name="Continue" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interim Analysis Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.stoppingProbabilities.map((sp: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-semibold">
                            {idx === result.stoppingProbabilities.length - 1 ? 'Final analysis' : `Look ${sp.look}`} (N={sp.n})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {idx === result.stoppingProbabilities.length - 1
                              ? `Reaches final analysis and succeeds: ${(sp.stopSuperiority * 100).toFixed(1)}% | fails: ${(sp.stopFutility * 100).toFixed(1)}%`
                              : `Stop for futility: ${(sp.stopFutility * 100).toFixed(1)}% | Stop for success: ${(sp.stopSuperiority * 100).toFixed(1)}% | Continue: ${(sp.continue * 100).toFixed(1)}%`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure parameters and click "Calculate Sequential Design"</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertDescription className="text-yellow-900 dark:text-yellow-100">
          <strong>Important:</strong> Sequential designs require pre-specification of stopping rules before data collection. 
          Stopping early for success can inflate the type I error; the simulated value is shown with the results, and raising the superiority threshold reduces it. Consult a statistician for proper implementation.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BayesianSequentialCalculator;
