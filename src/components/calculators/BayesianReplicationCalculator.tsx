import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Download, AlertCircle, Info, TrendingDown, Code2, Copy } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { calculateReplicationProbability } from '@/utils/bayesianPowerCalculations';
import { useToast } from '@/hooks/use-toast';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { PUBLICATION_BIAS_DESCRIPTIONS, PUBLICATION_BIAS_CITATIONS } from '@/constants/bayesianConstants';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

const BayesianReplicationCalculator = () => {
  const { toast } = useToast();
  const [publishedEffect, setPublishedEffect] = useState(0.5);
  const [publishedN, setPublishedN] = useState(50);
  const [publishedP, setPublishedP] = useState(0.03);
  const [testType, setTestType] = useState<'ttest' | 'anova' | 'correlation'>('ttest');
  const [groups, setGroups] = useState(2);
  const [alpha, setAlpha] = useState(0.05);
  const [replicationN, setReplicationN] = useState(50);
  const [publicationBias, setPublicationBias] = useState<'none' | 'mild' | 'moderate' | 'severe'>('moderate');
  const [priorSkepticism, setPriorSkepticism] = useState<'optimistic' | 'moderate' | 'skeptical'>('moderate');
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const runSimulation = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const res = calculateReplicationProbability({
          publishedEffect,
          publishedN,
          publishedP,
          testType,
          groups: testType === 'anova' ? groups : undefined,
          alpha,
          replicationN,
          publicationBias,
          priorSkepticism
        });
        setResult(res);
        toast({ title: "Success", description: "Replication probability calculated!" });
      } catch (error) {
        toast({ title: "Error", description: "Calculation failed. Please check your parameters.", variant: "destructive" });
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  const exportToCSV = () => {
    if (!result) return;
    const csvData = result.chart.map((row: any) => `${row.trueEffect},${row.posteriorDensity},${row.replicationProb}`).join('\n');
    const blob = new Blob([`True Effect,Posterior Density,Replication Prob\n${csvData}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'replication_analysis.csv';
    a.click();
    toast({ title: "CSV exported", description: "Data downloaded successfully" });
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'bayesian-replication',
      parameters: { publishedEffect, publishedN, publishedP, testType, groups, alpha, replicationN, publicationBias, priorSkepticism }
    });
    downloadRFile(rCode, 'replication_analysis.R');
    toast({ title: "R code exported", description: "Ready to run in RStudio" });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'bayesian-replication',
      parameters: { publishedEffect, publishedN, publishedP, testType, groups, alpha, replicationN, publicationBias, priorSkepticism }
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
          <CardTitle>Bayesian Replication Crisis Calculator</CardTitle>
          <CardDescription>
            Estimate realistic replication probability accounting for publication bias and winner's curse
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="text-red-900 dark:text-red-100">
          <strong>The Replication Crisis:</strong> Published effects are often inflated due to p-hacking, selective reporting, 
          and winner's curse. This calculator adjusts for bias to give realistic replication probabilities.
        </AlertDescription>
      </Alert>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>When to use:</strong> Before attempting to replicate published findings, when planning follow-up studies, 
          or when critically evaluating literature effect sizes for your own power analysis.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Published Study Details</CardTitle>
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
                  min={2}
                  max={10}
                  step={1}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Published Effect Size</Label>
              <Input
                type="number"
                value={publishedEffect}
                onChange={(e) => setPublishedEffect(parseFloat(e.target.value) || 0)}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Cohen's d for t-test/ANOVA, r for correlation
              </p>
            </div>

            <div className="space-y-2">
              <Label>Published Sample Size Per Group</Label>
              <Input
                type="number"
                value={publishedN}
                onChange={(e) => setPublishedN(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Published p-value</Label>
              <Input
                type="number"
                value={publishedP}
                onChange={(e) => setPublishedP(parseFloat(e.target.value) || 0)}
                step={0.001}
                max={0.05}
              />
            </div>

            <div className="space-y-2">
              <Label>Publication Bias Severity</Label>
              <Select value={publicationBias} onValueChange={(v: any) => setPublicationBias(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Open Science)</SelectItem>
                  <SelectItem value="mild">Mild (Pre-registered)</SelectItem>
                  <SelectItem value="moderate">Moderate (Typical)</SelectItem>
                  <SelectItem value="severe">Severe (High Competition)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prior Skepticism Level</Label>
              <Select value={priorSkepticism} onValueChange={(v: any) => setPriorSkepticism(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="optimistic">Optimistic (Trust Published)</SelectItem>
                  <SelectItem value="moderate">Moderate (Some Doubt)</SelectItem>
                  <SelectItem value="skeptical">Skeptical (High Doubt)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Replication Study N Per Group: {replicationN}</Label>
              <Slider
                value={[replicationN]}
                onValueChange={(v) => setReplicationN(v[0])}
                min={10}
                max={300}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Significance Level (α): {alpha}</Label>
              <Select value={alpha.toString()} onValueChange={(v) => setAlpha(parseFloat(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.005">0.005 (Stringent)</SelectItem>
                  <SelectItem value="0.01">0.01</SelectItem>
                  <SelectItem value="0.05">0.05 (Standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={runSimulation} className="w-full" disabled={isCalculating}>
              <Play className="h-4 w-4 mr-2" />
              {isCalculating ? 'Calculating...' : 'Calculate Replication Probability'}
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
                    <CardTitle>Replication Analysis</CardTitle>
                    <FormulaDisplay formula={FORMULAS.BAYESIAN_REPLICATION} buttonVariant="ghost" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Replication Probability</p>
                      <p className="text-3xl font-bold text-primary">
                        {(result.replicationProbability * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Effect Shrinkage</p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {((1 - result.shrinkageFactor) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Adjusted Effect</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {result.adjustedEffectSize.mean.toFixed(3)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        95% CI: [{result.adjustedEffectSize.ci95[0].toFixed(2)}, {result.adjustedEffectSize.ci95[1].toFixed(2)}]
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Recommended N</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {result.recommendations.minNForAdequatePower}
                      </p>
                      <p className="text-xs text-muted-foreground">For 80% power</p>
                    </div>
                  </div>

                  <Alert className={result.recommendations.shouldReplicate ? 
                    "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : 
                    "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
                  }>
                    <AlertCircle className={`h-4 w-4 ${result.recommendations.shouldReplicate ? 
                      'text-green-600 dark:text-green-400' : 
                      'text-yellow-600 dark:text-yellow-400'}`} 
                    />
                    <AlertDescription className={result.recommendations.shouldReplicate ? 
                      'text-green-900 dark:text-green-100' : 
                      'text-yellow-900 dark:text-yellow-100'
                    }>
                      <strong>{result.recommendations.shouldReplicate ? '✓ Replicate' : '⚠ Caution'}:</strong>{' '}
                      {result.recommendations.reasoning}
                    </AlertDescription>
                  </Alert>

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
                  <CardTitle>Posterior Distribution & Replication Probability</CardTitle>
                  <CardDescription>Adjusted for publication bias</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={result.chart}>
                      <defs>
                        <linearGradient id="posteriorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="trueEffect" 
                        label={{ value: 'Effect Size', position: 'insideBottom', offset: -5 }} 
                        tickFormatter={(v) => v.toFixed(2)}
                      />
                      <YAxis yAxisId="left" label={{ value: 'Replication Prob', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Posterior Density', angle: 90, position: 'insideRight' }} />
                      <Tooltip />
                      <Legend />
                      <Area 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="posteriorDensity" 
                        fill="url(#posteriorGradient)" 
                        stroke="hsl(var(--primary))"
                        name="Posterior Density"
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="replicationProb" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        name="Replication Probability"
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
                    <p className="font-semibold mb-2">Effect Size Inflation</p>
                    <p className="text-sm text-muted-foreground">
                      Published effect ({publishedEffect.toFixed(2)}) → Adjusted effect ({result.adjustedEffectSize.mean.toFixed(2)}). 
                      The {((1 - result.shrinkageFactor) * 100).toFixed(0)}% shrinkage accounts for winner's curse and publication bias.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-semibold mb-2">Replication Risk</p>
                    <p className="text-sm text-muted-foreground">
                      With N={replicationN}, there's only a {(result.replicationProbability * 100).toFixed(0)}% chance 
                      of getting p&lt;{alpha}. Use N={result.recommendations.minNForAdequatePower} for 80% power.
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-semibold mb-2">Publication Bias Impact</p>
                    <p className="text-sm text-muted-foreground">
                      {PUBLICATION_BIAS_DESCRIPTIONS[publicationBias]}
                    </p>
                    <div className="text-xs mt-2 pt-2 border-t border-border opacity-70">
                      <strong>References:</strong> {PUBLICATION_BIAS_CITATIONS.general}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter published study details to assess replication probability</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          <strong>Further Reading:</strong> Gelman & Carlin (2014) "Beyond Power Calculations", 
          Vasishth & Gelman (2021) "Type M and S errors", Open Science Collaboration (2015) 
          "Estimating the reproducibility of psychological science"
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BayesianReplicationCalculator;
