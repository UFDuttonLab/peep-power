import { useState, useMemo } from 'react';
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
import type { FormulaInfo } from '@/components/FormulaDisplay';

interface NestedPowerResult {
  powerBetween: number;
  designEffect: number;
  totalN: number;
  effectiveTotalN: number;
  summaryBetween: string;
  summaryDesign: string;
  curveData: Array<{ x: number; y: number }>;
}

import jStat from 'jstat';
import { noncentralFPower } from '@/utils/powerCalculations';

/**
 * Power for the treatment effect in a balanced nested (cluster) design.
 * g treatment groups, c clusters per group, m observations per cluster.
 * DE = 1 + (m - 1) * ICC, lambda = f^2 * g * c * m / DE,
 * df1 = g - 1, df2 = g * (c - 1) (clusters are the error units).
 */
function nestedPowerAt(
  m: number,
  c: number,
  g: number,
  f: number,
  icc: number,
  alpha: number
): number {
  const df1 = g - 1;
  const df2 = g * (c - 1);
  if (df1 < 1 || df2 < 1) return 0;
  const designEffect = 1 + (m - 1) * icc;
  const lambda = (f * f * g * c * m) / designEffect;
  const critF = jStat.centralF.inv(1 - alpha, df1, df2);
  return noncentralFPower(lambda, df1, df2, critF);
}

// Formula shown in the dialog; kept next to the code that implements it.
const NESTED_FORMULA: FormulaInfo = {
  ...FORMULAS.NESTED_ANOVA,
  formula: `Power = P(F > F_crit | lambda)

Design Effect DE = 1 + (m - 1) x ICC
lambda = f² x g x c x m / DE

df1 = g - 1
df2 = g x (c - 1)   (clusters are the error units)`,
  variables: [
    { symbol: 'f', description: "Cohen's f for the treatment effect (for 2 groups, f = d/2)" },
    { symbol: 'g', description: 'Number of treatment groups' },
    { symbol: 'c', description: 'Clusters per group' },
    { symbol: 'm', description: 'Observations per cluster' },
    { symbol: 'ICC', description: 'Intraclass correlation (share of variance between clusters)' },
  ],
  notes: [
    'Total effective sample size = g x c x m / DE',
    'Higher ICC inflates DE and reduces power; adding clusters helps more than adding observations per cluster',
  ],
};

function calculateNestedAnovaPower(
  nPerCluster: number,
  clusters: number,
  groups: number,
  effectSize: number,
  icc: number,
  alpha: number = 0.05
): NestedPowerResult {
  const designEffect = 1 + (nPerCluster - 1) * icc;
  const totalN = nPerCluster * clusters * groups;
  const effectiveTotalN = totalN / designEffect;
  const powerBetween = nestedPowerAt(nPerCluster, clusters, groups, effectSize, icc, alpha);

  const summaryBetween = `Treatment effect power: ${(powerBetween * 100).toFixed(1)}% with ${clusters} clusters per group, ${nPerCluster} per cluster, ICC=${icc.toFixed(2)}, f=${effectSize.toFixed(2)}. ${
    powerBetween < 0.8 ? '⚠️ Power is below 80%.' : '✓ Adequate power.'
  }`;

  const summaryDesign = `Total effective sample size: ${effectiveTotalN.toFixed(0)} of ${totalN} observations (design effect: ${designEffect.toFixed(2)}). ${
    icc > 0.2 ? '⚠️ High ICC reduces power substantially.' : 'Moderate clustering effect.'
  }`;

  // Power curve: vary the number of clusters per group
  const curveData: Array<{ x: number; y: number }> = [];
  const maxC = Math.max(100, Math.ceil(clusters * 1.5));
  for (let c = 2; c <= maxC; c += 1) {
    curveData.push({ x: c, y: nestedPowerAt(nPerCluster, c, groups, effectSize, icc, alpha) });
  }

  return {
    powerBetween,
    designEffect,
    totalN,
    effectiveTotalN,
    summaryBetween,
    summaryDesign,
    curveData
  };
}

export const NestedAnovaCalculator = () => {
  const { toast } = useToast();
  const [nPerCluster, setNPerCluster] = useState(10);
  const [clusters, setClusters] = useState(6);
  const [groups, setGroups] = useState(2);
  const [effectSize, setEffectSize] = useState(0.25);
  const [icc, setIcc] = useState(0.1);
  const [alpha, setAlpha] = useState(0.05);
  const result = useMemo<NestedPowerResult>(
    () => calculateNestedAnovaPower(nPerCluster, clusters, groups, effectSize, icc, alpha),
    [nPerCluster, clusters, groups, effectSize, icc, alpha]
  );

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
        effectSize, // Cohen's f
        effectSizeType: 'f',
        icc,
        groups,
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
        effectSize, // Cohen's f
        effectSizeType: 'f',
        icc,
        groups,
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
              label="Effect Size (Cohen's f)"
              value={effectSize}
              onChange={setEffectSize}
              min={0.05}
              max={1.0}
              step={0.01}
              tooltip="Cohen's f for the treatment effect: SD of the group means divided by the total within-group SD. Small 0.10, medium 0.25, large 0.40. For two groups, f = d/2."
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
              <FormulaDisplay formula={NESTED_FORMULA} buttonVariant="ghost" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Treatment Effect Power</div>
              <div className="text-3xl font-bold text-primary">
                {(result.powerBetween * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">{result.summaryBetween}</p>
            </div>

            <div className="text-sm text-muted-foreground">
              {result.summaryDesign}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Design Effect Impact</h4>
              <div className="text-xs space-y-1">
                <div>Design Effect: {result.designEffect.toFixed(2)}</div>
                <div>Total Effective Sample Size: {result.effectiveTotalN.toFixed(0)} 
                  (vs {result.totalN} total observations)</div>
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
