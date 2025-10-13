import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ControlSlider from '@/components/ControlSlider';
import SimplePowerChart from '@/components/SimplePowerChart';
import { Button } from '@/components/ui/button';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { Download, Info, Code2, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';

interface NestedPowerResult {
  powerBetween: number;
  powerWithin: number;
  summaryBetween: string;
  summaryWithin: string;
  curveData: Array<{ x: number; y: number }>;
}

// Import jStat for proper noncentral F distribution
// @ts-ignore
import jStat from 'jstat';

// Import noncentralFPower from powerCalculations
import { noncentralFPower } from '@/utils/powerCalculations';

// Calculate power for nested/hierarchical design
function calculateNestedAnovaPower(
  nPerCluster: number,
  clusters: number,
  groups: number,
  effectSize: number,
  icc: number,
  alpha: number = 0.05
): NestedPowerResult {
  // Design effect reduces effective sample size
  const designEffect = 1 + (nPerCluster - 1) * icc;
  const effectiveN = (nPerCluster * clusters) / designEffect;
  
  // Between-cluster effect (main effect of treatment)
  const dfBetween1 = groups - 1;
  const dfBetween2 = groups * (clusters - 1);
  
  // CORRECTED: Use proper noncentral F distribution instead of logistic approximation
  const effectiveClusters = (clusters * nPerCluster) / designEffect;
  const lambdaBetween = (effectiveClusters * groups * effectSize * effectSize) / 2;
  
  // Calculate power using proper noncentral F distribution
  const critF = jStat.centralF.inv(1 - alpha, dfBetween1, dfBetween2);
  const powerBetween = noncentralFPower(lambdaBetween, dfBetween1, dfBetween2, critF);
  
  // Within-cluster effect (assuming some within-cluster variation)
  const lambdaWithin = effectiveN * Math.pow(effectSize, 2) / 2;
  const powerWithin = Math.min(0.99, Math.max(0.05, 1 / (1 + Math.exp(-3 * (lambdaWithin - 3)))));
  
  const summaryBetween = `Between-cluster power: ${(powerBetween * 100).toFixed(1)}% with ${clusters} clusters, ${nPerCluster} per cluster, ICC=${icc.toFixed(2)}. ${
    powerBetween < 0.8 ? '⚠️ Power is below 80%.' : '✓ Adequate power.'
  }`;
  
  const summaryWithin = `Effective sample size: ${effectiveN.toFixed(0)} (design effect: ${designEffect.toFixed(2)}). ${
    icc > 0.2 ? '⚠️ High ICC reduces power substantially.' : 'Moderate clustering effect.'
  }`;
  
  // Generate power curve by varying number of clusters
  const curveData = [];
  for (let c = 2; c <= 50; c++) {
    const designEffectC = 1 + (nPerCluster - 1) * icc;
    const effectiveClustersC = (c * nPerCluster) / designEffectC;
    const lambdaC = (effectiveClustersC * groups * effectSize * effectSize) / 2;
    const dfBetween2C = groups * (c - 1);
    const critFC = jStat.centralF.inv(1 - alpha, dfBetween1, dfBetween2C);
    const powerC = noncentralFPower(lambdaC, dfBetween1, dfBetween2C, critFC);
    curveData.push({ x: c, y: Math.max(0.05, Math.min(0.99, powerC)) });
  }
  
  return {
    powerBetween,
    powerWithin,
    summaryBetween,
    summaryWithin,
    curveData
  };
}

export const NestedAnovaCalculator = () => {
  const { toast } = useToast();
  const [nPerCluster, setNPerCluster] = useState(10);
  const [clusters, setClusters] = useState(6);
  const [groups, setGroups] = useState(2);
  const [effectSize, setEffectSize] = useState(0.5);
  const [icc, setIcc] = useState(0.1);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<NestedPowerResult | null>(null);

  useEffect(() => {
    const newResult = calculateNestedAnovaPower(nPerCluster, clusters, groups, effectSize, icc, alpha);
    setResult(newResult);
  }, [nPerCluster, clusters, groups, effectSize, icc, alpha]);

  const exportResults = () => {
    if (!result) return;
    const csv = 'Clusters,Power\n' + result.curveData.map(d => `${d.x},${d.y}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nested_anova_power.csv';
    a.click();
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'nested-anova',
      parameters: { 
        sitesPerTreatment: clusters, 
        subplotsPerSite: nPerCluster, 
        effectSize, 
        alpha 
      }
    });
    downloadRFile(rCode, 'nested_anova_power_analysis.R');
    toast({
      title: "R code exported",
      description: "You can now run this analysis in R/RStudio",
    });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'nested-anova',
      parameters: { 
        sitesPerTreatment: clusters, 
        subplotsPerSite: nPerCluster, 
        effectSize, 
        alpha 
      }
    });
    const success = await copyToClipboard(rCode);
    if (success) {
      toast({
        title: "Copied to clipboard",
        description: "R code is ready to paste into RStudio",
      });
    }
  };

  if (!result) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Design Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ControlSlider
              id="nested-n-per-cluster"
              label="Observations per Cluster"
              value={nPerCluster}
              onChange={setNPerCluster}
              min={2}
              max={50}
              step={1}
              decimals={0}
            />

            <ControlSlider
              id="nested-clusters"
              label="Number of Clusters per Group"
              value={clusters}
              onChange={setClusters}
              min={2}
              max={50}
              step={1}
              decimals={0}
            />

            <ControlSlider
              id="nested-groups"
              label="Number of Treatment Groups"
              value={groups}
              onChange={setGroups}
              min={2}
              max={6}
              step={1}
              decimals={0}
            />

            <ControlSlider
              id="nested-effect-size"
              label="Effect Size (Cohen's d)"
              value={effectSize}
              onChange={setEffectSize}
              min={0.1}
              max={2.0}
              step={0.1}
            />

            <ControlSlider
              id="nested-icc"
              label="Intraclass Correlation (ICC)"
              value={icc}
              onChange={setIcc}
              min={0.01}
              max={0.5}
              step={0.01}
            />

            <ControlSlider
              id="nested-alpha"
              label="Significance Level (α)"
              value={alpha}
              onChange={setAlpha}
              min={0.001}
              max={0.1}
              step={0.001}
            />

            <div className="text-xs text-muted-foreground">
              <strong>Total sample size:</strong> {nPerCluster * clusters * groups} observations 
              in {clusters * groups} clusters
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Nested/Hierarchical Design:</strong> Use this when observations are clustered 
            (e.g., plots within sites, students within schools, samples within hosts).
            <div className="mt-2">
              <strong>ICC (Intraclass Correlation):</strong> Proportion of variance between clusters.
              <ul className="list-disc list-inside mt-1">
                <li>ICC = 0.05: Low clustering (individuals mostly independent)</li>
                <li>ICC = 0.15: Moderate clustering (typical for ecological field studies)</li>
                <li>ICC = 0.30: High clustering (observations strongly dependent)</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Power Analysis Results</CardTitle>
              <FormulaDisplay formula={FORMULAS.NESTED_ANOVA} buttonVariant="ghost" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Between-Cluster Power</div>
              <div className="text-3xl font-bold text-primary">
                {(result.powerBetween * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">{result.summaryBetween}</p>
            </div>

            <div className="text-sm text-muted-foreground">
              {result.summaryWithin}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Design Effect Impact</h4>
              <div className="text-xs space-y-1">
                <div>Design Effect: {(1 + (nPerCluster - 1) * icc).toFixed(2)}</div>
                <div>Effective Sample Size: {((nPerCluster * clusters * groups) / (1 + (nPerCluster - 1) * icc)).toFixed(0)} 
                  (vs {nPerCluster * clusters * groups} total observations)</div>
                <div className="text-muted-foreground mt-1">
                  {icc > 0.2 
                    ? "⚠️ High ICC substantially reduces effective sample size. Consider increasing number of clusters rather than observations per cluster."
                    : "✓ Moderate ICC. Clustering has manageable impact on power."}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Power Curve (Varying # Clusters)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimplePowerChart 
              data={result.curveData}
              currentValue={clusters}
              xLabel="Number of Clusters per Group"
              title="Power Curve"
            />
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Button onClick={exportResults} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                CSV
              </Button>
              <Button onClick={exportToR} variant="outline" size="sm">
                <Code2 className="w-4 h-4 mr-1" />
                R Code
              </Button>
              <Button onClick={copyRCode} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500">
          <AlertDescription className="text-xs">
            <strong>⚠️ Approximation Note:</strong> This calculator uses approximations for nested designs. 
            For precise estimates, use:
            <ul className="list-disc list-inside mt-1">
              <li>R package: <code className="bg-muted px-1 rounded">clusterPower</code></li>
              <li>R package: <code className="bg-muted px-1 rounded">lme4</code> with simulations</li>
              <li>Optimal Design software for multilevel models</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
