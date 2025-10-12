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
  const [testType, setTestType] = useState<'ttest' | 'anova' | 'correlation' | 'chisquare' | 'twoway-anova' | 'repeated-measures' | 'nested-anova' | 'permanova' | 'repeated-permanova'>('ttest');
  const [groups, setGroups] = useState(3);
  const [factorALevels, setFactorALevels] = useState(2);
  const [factorBLevels, setFactorBLevels] = useState(2);
  const [timepoints, setTimepoints] = useState(3);
  const [correlation, setCorrelation] = useState(0.5);
  const [nests, setNests] = useState(3);
  const [df, setDf] = useState(1);
  const [mde, setMde] = useState<number | null>(null);
  const [requiredN, setRequiredN] = useState<number | null>(null);
  const [givenEffect, setGivenEffect] = useState(0.5);

  useEffect(() => {
    const additionalParams = {
      df,
      factorALevels,
      factorBLevels,
      timepoints,
      correlation,
      nests
    };
    const calculatedMde = calculateMinimumDetectableEffect(n, targetPower, alpha, testType, groups, additionalParams);
    setMde(calculatedMde);
  }, [n, targetPower, alpha, testType, groups, df, factorALevels, factorBLevels, timepoints, correlation, nests]);

  useEffect(() => {
    const additionalParams = {
      df,
      factorALevels,
      factorBLevels,
      timepoints,
      correlation,
      nests
    };
    const calculatedN = calculateRequiredSampleSize(givenEffect, targetPower, alpha, testType, groups, additionalParams);
    setRequiredN(calculatedN);
  }, [givenEffect, targetPower, alpha, testType, groups, df, factorALevels, factorBLevels, timepoints, correlation, nests]);

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
                  <SelectItem value="twoway-anova">Two-Way ANOVA</SelectItem>
                  <SelectItem value="repeated-measures">Repeated Measures ANOVA</SelectItem>
                  <SelectItem value="nested-anova">Nested ANOVA</SelectItem>
                  <SelectItem value="correlation">Correlation</SelectItem>
                  <SelectItem value="chisquare">Chi-Square Test</SelectItem>
                  <SelectItem value="permanova">PERMANOVA</SelectItem>
                  <SelectItem value="repeated-permanova">RM-PERMANOVA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(testType === 'anova' || testType === 'permanova') && (
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

            {testType === 'twoway-anova' && (
              <>
                <ControlSlider
                  id="mde-factor-a"
                  label="Factor A Levels"
                  value={factorALevels}
                  onChange={setFactorALevels}
                  min={2}
                  max={5}
                  step={1}
                  decimals={0}
                />
                <ControlSlider
                  id="mde-factor-b"
                  label="Factor B Levels"
                  value={factorBLevels}
                  onChange={setFactorBLevels}
                  min={2}
                  max={5}
                  step={1}
                  decimals={0}
                />
              </>
            )}

            {(testType === 'repeated-measures' || testType === 'repeated-permanova') && (
              <>
                <ControlSlider
                  id="mde-timepoints"
                  label="Number of Timepoints"
                  value={timepoints}
                  onChange={setTimepoints}
                  min={2}
                  max={10}
                  step={1}
                  decimals={0}
                />
                <ControlSlider
                  id="mde-correlation"
                  label="Within-Subject Correlation"
                  value={correlation}
                  onChange={setCorrelation}
                  min={0}
                  max={0.95}
                  step={0.05}
                />
              </>
            )}

            {testType === 'nested-anova' && (
              <>
                <ControlSlider
                  id="mde-groups-nested"
                  label="Number of Groups"
                  value={groups}
                  onChange={setGroups}
                  min={2}
                  max={10}
                  step={1}
                  decimals={0}
                />
                <ControlSlider
                  id="mde-nests"
                  label="Nests per Group"
                  value={nests}
                  onChange={setNests}
                  min={2}
                  max={10}
                  step={1}
                  decimals={0}
                />
              </>
            )}

            {testType === 'chisquare' && (
              <ControlSlider
                id="mde-df"
                label="Degrees of Freedom"
                value={df}
                onChange={setDf}
                min={1}
                max={20}
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
              label={
                testType === 'correlation' ? 'Total Sample Size' :
                testType === 'twoway-anova' ? 'Sample Size per Cell' :
                testType === 'repeated-measures' ? 'Number of Subjects' :
                testType === 'nested-anova' ? 'Sample Size per Nest' :
                testType === 'repeated-permanova' ? 'Number of Subjects' :
                'Sample Size per Group'
              }
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
                  {testType === 'twoway-anova' && "Cohen's f"}
                  {testType === 'repeated-measures' && "Cohen's f"}
                  {testType === 'nested-anova' && "Cohen's f"}
                  {testType === 'correlation' && "Correlation coefficient (r)"}
                  {testType === 'chisquare' && "Cohen's w"}
                  {testType === 'permanova' && "R² (proportion of variance)"}
                  {testType === 'repeated-permanova' && "R² (proportion of variance)"}
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
              label={
                testType === 'correlation' ? 'Expected Correlation (r)' :
                (testType === 'permanova' || testType === 'repeated-permanova') ? 'Expected R²' :
                'Expected Effect Size'
              }
              value={givenEffect}
              onChange={setGivenEffect}
              min={0.01}
              max={testType === 'correlation' || testType === 'permanova' || testType === 'repeated-permanova' ? 0.95 : 2.0}
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
                {testType === 'anova' && (
                  <div className="text-xs mt-1 font-semibold">
                    Total N = {requiredN * groups}
                  </div>
                )}
                {testType === 'ttest' && (
                  <div className="text-xs mt-1 font-semibold">
                    Total N = {requiredN * 2}
                  </div>
                )}
                {testType === 'twoway-anova' && (
                  <div className="text-xs mt-1 font-semibold">
                    Total N = {requiredN * factorALevels * factorBLevels}
                  </div>
                )}
                {testType === 'nested-anova' && (
                  <div className="text-xs mt-1 font-semibold">
                    Total N = {requiredN * groups * nests}
                  </div>
                )}
                {testType === 'permanova' && (
                  <div className="text-xs mt-1 font-semibold">
                    Total N = {requiredN * groups}
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
