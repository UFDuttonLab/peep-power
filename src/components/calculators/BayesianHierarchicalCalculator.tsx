import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, AlertCircle, Info, Network } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateHierarchicalPower } from '@/utils/bayesianPowerCalculations';
import { toast } from 'sonner';

const BayesianHierarchicalCalculator = () => {
  const [effectMean, setEffectMean] = useState(0.5);
  const [effectSD, setEffectSD] = useState(0.2);
  const [nClusters, setNClusters] = useState(10);
  const [nPerCluster, setNPerCluster] = useState(10);
  const [icc, setICC] = useState(0.2);
  const [iccUncertainty, setICCUncertainty] = useState(0.1);
  const [testType, setTestType] = useState<'ttest' | 'anova'>('ttest');
  const [groups, setGroups] = useState(2);
  const [targetPower, setTargetPower] = useState(0.80);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const runSimulation = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const res = calculateHierarchicalPower({
          effectSizePrior: { mean: effectMean, sd: effectSD },
          nClusters,
          nPerCluster,
          icc,
          iccUncertainty,
          testType,
          groups: testType === 'anova' ? groups : undefined,
          targetPower,
          alpha
        });
        setResult(res);
        toast.success('Hierarchical design calculated!');
      } catch (error) {
        toast.error('Calculation failed. Please check your parameters.');
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bayesian Hierarchical Power Calculator</CardTitle>
          <CardDescription>
            Calculate sample size for nested/clustered data accounting for ICC uncertainty
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <Network className="h-4 w-4" />
        <AlertDescription>
          <strong>What is Hierarchical Design?</strong> When data is nested (e.g., plots within sites, samples within 
          organisms, repeated measures within individuals), observations aren't independent. The intraclass correlation 
          (ICC) quantifies this clustering, and uncertainty in ICC affects required sample size.
        </AlertDescription>
      </Alert>

      <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-900 dark:text-green-100">
          <strong>When to use:</strong> Multi-site field studies, plot-based experiments, longitudinal data, 
          samples nested within organisms, any situation where observations share common features.
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
              <Label>Number of Clusters (Sites/Plots): {nClusters}</Label>
              <Slider
                value={[nClusters]}
                onValueChange={(v) => setNClusters(v[0])}
                min={3}
                max={50}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Examples: field sites, experimental plots, individual organisms
              </p>
            </div>

            <div className="space-y-2">
              <Label>Samples Per Cluster: {nPerCluster}</Label>
              <Slider
                value={[nPerCluster]}
                onValueChange={(v) => setNPerCluster(v[0])}
                min={2}
                max={50}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Examples: subsamples, repeated measures, nested observations
              </p>
            </div>

            <div className="space-y-2">
              <Label>Intraclass Correlation (ICC): {icc.toFixed(2)}</Label>
              <Slider
                value={[icc]}
                onValueChange={(v) => setICC(v[0])}
                min={0.01}
                max={0.8}
                step={0.01}
              />
              <p className="text-xs text-muted-foreground">
                Typical values: 0.05 (low clustering), 0.2 (moderate), 0.5 (high)
              </p>
            </div>

            <div className="space-y-2">
              <Label>ICC Uncertainty (SD): {iccUncertainty.toFixed(2)}</Label>
              <Slider
                value={[iccUncertainty]}
                onValueChange={(v) => setICCUncertainty(v[0])}
                min={0.01}
                max={0.3}
                step={0.01}
              />
              <p className="text-xs text-muted-foreground">
                Use higher values if ICC is poorly known from pilot data
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
              {isCalculating ? 'Calculating...' : 'Calculate Hierarchical Design'}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Clusters Needed</p>
                      <p className="text-3xl font-bold text-primary">{result.requiredClusters}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Per Cluster</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.requiredPerCluster}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total N</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.totalN}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Effective N</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{result.effectiveN}</p>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription dangerouslySetInnerHTML={{ __html: result.summary }} />
                  </Alert>

                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-semibold">Design Effect</p>
                    <p className="text-2xl font-bold">{result.designEffect.mean.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      95% CI: [{result.designEffect.ci95[0].toFixed(2)}, {result.designEffect.ci95[1].toFixed(2)}]
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Design effect = 1 + (n-1) × ICC. Values &gt; 1 indicate clustering inflates required sample size.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="font-semibold text-yellow-900 dark:text-yellow-100">⚠ Naive Analysis Would Underestimate</p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                      Ignoring clustering: N = {result.comparison.naiveN} per group
                    </p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Inflation factor: {result.comparison.inflationFactor.toFixed(2)}×
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sensitivity to ICC</CardTitle>
                  <CardDescription>How required clusters vary with ICC</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={result.sensitivityToICC}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="icc" 
                        label={{ value: 'Intraclass Correlation (ICC)', position: 'insideBottom', offset: -5 }}
                        tickFormatter={(v) => v.toFixed(2)}
                      />
                      <YAxis 
                        yAxisId="left"
                        label={{ value: 'Required Clusters', angle: -90, position: 'insideLeft' }} 
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        label={{ value: 'Design Effect', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="requiredClusters" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Required Clusters"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="designEffect" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Design Effect"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Understanding ICC</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-semibold mb-1">Low ICC (0.01-0.10)</p>
                    <p className="text-sm text-muted-foreground">
                      Minimal clustering. Examples: distant field sites, independent experimental units.
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-semibold mb-1">Moderate ICC (0.10-0.30)</p>
                    <p className="text-sm text-muted-foreground">
                      Typical for ecological data. Examples: plots within sites, repeated measures on individuals.
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-semibold mb-1">High ICC (0.30-0.80)</p>
                    <p className="text-sm text-muted-foreground">
                      Strong clustering. Examples: multiple measurements on same tissue, highly similar microhabitats.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure parameters and click "Calculate Hierarchical Design"</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          <strong>Further Reading:</strong> Raudenbush & Liu (2000) "Statistical power and optimal design for multisite 
          randomized trials", Schochet (2008) "Technical Methods Report: Guidelines for Multiple Testing in Impact Evaluations"
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BayesianHierarchicalCalculator;
