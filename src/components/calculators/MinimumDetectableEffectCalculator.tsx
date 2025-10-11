import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ControlSlider from '@/components/ControlSlider';
import { calculateMinimumDetectableEffect, calculateRequiredSampleSize } from '@/utils/powerCalculations';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const MinimumDetectableEffectCalculator = () => {
  const [n, setN] = useState(30);
  const [targetPower, setTargetPower] = useState(0.8);
  const [alpha, setAlpha] = useState(0.05);
  const [testType, setTestType] = useState<'ttest' | 'anova' | 'correlation'>('ttest');
  const [groups, setGroups] = useState(3);
  const [mde, setMde] = useState<number | null>(null);
  const [requiredN, setRequiredN] = useState<number | null>(null);
  const [givenEffect, setGivenEffect] = useState(0.5);

  useEffect(() => {
    const calculatedMde = calculateMinimumDetectableEffect(n, targetPower, alpha, testType, groups);
    setMde(calculatedMde);
  }, [n, targetPower, alpha, testType, groups]);

  useEffect(() => {
    const calculatedN = calculateRequiredSampleSize(givenEffect, targetPower, alpha, testType, groups);
    setRequiredN(calculatedN);
  }, [givenEffect, targetPower, alpha, testType, groups]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sample Size Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Statistical Test</label>
              <Select value={testType} onValueChange={(v) => setTestType(v as any)}>
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
              <ControlSlider
                id="mde-groups"
                label="Number of Groups"
                value={groups}
                onChange={setGroups}
                min={2}
                max={10}
                step={1}
                decimals={0}
              />
            )}

            <ControlSlider
              id="mde-target-power"
              label="Target Power (1-β)"
              value={targetPower}
              onChange={setTargetPower}
              min={0.5}
              max={0.99}
              step={0.01}
            />

            <ControlSlider
              id="mde-alpha"
              label="Significance Level (α)"
              value={alpha}
              onChange={setAlpha}
              min={0.001}
              max={0.1}
              step={0.001}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Minimum Detectable Effect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ControlSlider
              id="mde-sample-size"
              label={testType === 'ttest' ? 'Sample Size per Group' : testType === 'anova' ? 'Sample Size per Group' : 'Total Sample Size'}
              value={n}
              onChange={setN}
              min={2}
              max={200}
              step={1}
              decimals={0}
            />

            {mde !== null && (
              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Minimum Detectable Effect Size</div>
                <div className="text-3xl font-bold text-primary">
                  {mde.toFixed(3)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {testType === 'ttest' && "Cohen's d"}
                  {testType === 'anova' && "Cohen's f"}
                  {testType === 'correlation' && "Correlation coefficient (r)"}
                </div>
                <div className="text-xs mt-2">
                  With n={n}{testType !== 'correlation' && ' per group'}, you can detect effects of {mde.toFixed(3)} or larger 
                  with {(targetPower * 100).toFixed(0)}% power at α={alpha}.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Required Sample Size</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ControlSlider
              id="mde-effect-size"
              label={testType === 'correlation' ? 'Expected Correlation (r)' : 'Expected Effect Size'}
              value={givenEffect}
              onChange={setGivenEffect}
              min={0.01}
              max={testType === 'correlation' ? 0.95 : 2.0}
              step={0.01}
            />

            {requiredN !== null && (
              <div className="p-4 bg-secondary/5 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Required Sample Size</div>
                <div className="text-3xl font-bold text-secondary">
                  n = {requiredN}{testType !== 'correlation' && ' per group'}
                </div>
                <div className="text-xs mt-2">
                  To detect an effect of {givenEffect.toFixed(3)} with {(targetPower * 100).toFixed(0)}% power at α={alpha}, 
                  you need {requiredN} participants{testType !== 'correlation' && ' per group'}.
                </div>
                {testType !== 'correlation' && (
                  <div className="text-xs mt-1 font-semibold">
                    Total N = {requiredN * (testType === 'anova' ? groups : 2)}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>How to use this calculator:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>MDE:</strong> Given your sample size, what's the smallest effect you can reliably detect?</li>
              <li><strong>Required N:</strong> Given an expected effect size, how many participants do you need?</li>
              <li>Use this for grant proposals and study planning</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
