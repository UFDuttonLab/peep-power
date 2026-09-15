import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ControlSlider from '@/components/ControlSlider';
import {
  calculateMinimumDetectableEffect,
  calculateRequiredSampleSize,
  PLANNING_SUPPORTED,
  type PlanningTestType,
  type PlanningParams,
} from '@/utils/powerCalculations';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type MdeTestType = Exclude<PlanningTestType, 'nested-anova'>;
type TwoWayEffect = 'A' | 'B' | 'AB';

interface TestConfig {
  label: string;
  /** Name of the effect-size metric */
  effectName: string;
  /** Short symbol used in sentences */
  effectSymbol: string;
  /** How the sample size is counted */
  unit: 'per group' | 'per cell' | 'subjects' | 'total';
  sampleLabel: string;
  minN: number;
  /** Range for the "expected effect" slider */
  effectMin: number;
  effectMax: number;
  effectStep: number;
  effectDefault: number;
}

const TEST_CONFIG: Record<MdeTestType, TestConfig> = {
  ttest: { label: 'Two-Sample t-test', effectName: "Cohen's d", effectSymbol: 'd', unit: 'per group', sampleLabel: 'Sample Size per Group', minN: 2, effectMin: 0.05, effectMax: 2.0, effectStep: 0.01, effectDefault: 0.5 },
  anova: { label: 'One-Way ANOVA', effectName: "Cohen's f", effectSymbol: 'f', unit: 'per group', sampleLabel: 'Sample Size per Group', minN: 2, effectMin: 0.05, effectMax: 1.0, effectStep: 0.01, effectDefault: 0.25 },
  'twoway-anova': { label: 'Two-Way ANOVA', effectName: "Cohen's f", effectSymbol: 'f', unit: 'per cell', sampleLabel: 'Sample Size per Cell', minN: 2, effectMin: 0.05, effectMax: 1.0, effectStep: 0.01, effectDefault: 0.25 },
  'repeated-measures': { label: 'Repeated Measures ANOVA', effectName: "Cohen's f", effectSymbol: 'f', unit: 'subjects', sampleLabel: 'Number of Subjects', minN: 2, effectMin: 0.05, effectMax: 1.0, effectStep: 0.01, effectDefault: 0.25 },
  correlation: { label: 'Correlation', effectName: 'Correlation coefficient (r)', effectSymbol: 'r', unit: 'total', sampleLabel: 'Total Sample Size', minN: 4, effectMin: 0.05, effectMax: 0.95, effectStep: 0.01, effectDefault: 0.3 },
  chisquare: { label: 'Chi-Square Test', effectName: "Cohen's w", effectSymbol: 'w', unit: 'total', sampleLabel: 'Total Sample Size', minN: 2, effectMin: 0.05, effectMax: 1.0, effectStep: 0.01, effectDefault: 0.3 },
  permanova: { label: 'PERMANOVA', effectName: 'R² (proportion of variance)', effectSymbol: 'R²', unit: 'per group', sampleLabel: 'Sample Size per Group', minN: 2, effectMin: 0.01, effectMax: 0.9, effectStep: 0.01, effectDefault: 0.1 },
  'repeated-permanova': { label: 'RM-PERMANOVA', effectName: 'R² (proportion of variance)', effectSymbol: 'R²', unit: 'subjects', sampleLabel: 'Number of Subjects', minN: 2, effectMin: 0.01, effectMax: 0.9, effectStep: 0.01, effectDefault: 0.1 },
};

const TEST_TYPES = (PLANNING_SUPPORTED as PlanningTestType[]).filter(
  (t): t is MdeTestType => t in TEST_CONFIG
);

const unitText = (unit: TestConfig['unit'], n: number): string => {
  switch (unit) {
    case 'per group': return `${n} per group`;
    case 'per cell': return `${n} per cell`;
    case 'subjects': return `${n} subjects`;
    case 'total': return `N = ${n} in total`;
  }
};

export const MinimumDetectableEffectCalculator = () => {
  const [n, setN] = useState(30);
  const [targetPower, setTargetPower] = useState(0.8);
  const [alpha, setAlpha] = useState(0.05);
  const [testType, setTestType] = useState<MdeTestType>('ttest');
  const [groups, setGroups] = useState(3);
  const [factorALevels, setFactorALevels] = useState(2);
  const [factorBLevels, setFactorBLevels] = useState(2);
  const [twoWayEffect, setTwoWayEffect] = useState<TwoWayEffect>('AB');
  const [timepoints, setTimepoints] = useState(3);
  const [correlation, setCorrelation] = useState(0.5);
  const [df, setDf] = useState(1);
  const [givenEffect, setGivenEffect] = useState(0.5);

  const cfg = TEST_CONFIG[testType];

  const handleTestTypeChange = (v: string) => {
    const next = v as MdeTestType;
    const nextCfg = TEST_CONFIG[next];
    setTestType(next);
    setN(prev => Math.max(prev, nextCfg.minN));
    setGivenEffect(nextCfg.effectDefault);
  };

  const params: PlanningParams = useMemo(
    () => ({ df, factorALevels, factorBLevels, twoWayEffect, timepoints, correlation }),
    [df, factorALevels, factorBLevels, twoWayEffect, timepoints, correlation]
  );

  const mde = useMemo(
    () => calculateMinimumDetectableEffect(n, targetPower, alpha, testType, groups, params),
    [n, targetPower, alpha, testType, groups, params]
  );

  const requiredN = useMemo(
    () => calculateRequiredSampleSize(givenEffect, targetPower, alpha, testType, groups, params),
    [givenEffect, targetPower, alpha, testType, groups, params]
  );

  const cellsOrGroups =
    testType === 'twoway-anova' ? factorALevels * factorBLevels :
    testType === 'anova' || testType === 'permanova' ? groups :
    testType === 'ttest' ? 2 : null;

  const effectLabelFor = (t: MdeTestType) =>
    t === 'twoway-anova'
      ? `Cohen's f (${twoWayEffect === 'AB' ? 'A×B interaction' : `main effect ${twoWayEffect}`})`
      : TEST_CONFIG[t].effectName;

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
              <Select value={testType} onValueChange={handleTestTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{TEST_CONFIG[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Nested designs: use the Nested ANOVA calculator, which accounts for the ICC.
              </p>
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
                <div>
                  <label className="block text-sm font-medium mb-2">Effect to Plan For</label>
                  <Select value={twoWayEffect} onValueChange={(v) => setTwoWayEffect(v as TwoWayEffect)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Main effect of Factor A</SelectItem>
                      <SelectItem value="B">Main effect of Factor B</SelectItem>
                      <SelectItem value="AB">A×B interaction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              label={cfg.sampleLabel}
              value={Math.max(n, cfg.minN)}
              onChange={setN}
              min={cfg.minN}
              max={200}
              step={1}
              decimals={0}
            />

            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Minimum Detectable Effect Size</div>
              {Number.isFinite(mde) ? (
                <>
                  <div className="text-3xl font-bold text-primary">{mde.toFixed(3)}</div>
                  <div className="text-xs text-muted-foreground mt-2">{effectLabelFor(testType)}</div>
                  <div className="text-xs mt-2">
                    With {unitText(cfg.unit, n)}, you can detect effects of {cfg.effectSymbol} = {mde.toFixed(3)} or larger
                    with {(targetPower * 100).toFixed(0)}% power at α={alpha}.
                  </div>
                </>
              ) : Number.isNaN(mde) ? (
                <div className="text-lg font-semibold text-muted-foreground">
                  Not available for these settings
                </div>
              ) : (
                <>
                  <div className="text-lg font-semibold text-destructive">Not reachable</div>
                  <div className="text-xs mt-2">
                    With {unitText(cfg.unit, n)}, no effect size in the valid range reaches {(targetPower * 100).toFixed(0)}% power
                    at α={alpha}. Increase the sample size.
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Required Sample Size</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ControlSlider
              id="mde-effect-size"
              label={cfg.effectSymbol === 'R²' ? 'Expected R²' : `Expected Effect Size (${effectLabelFor(testType)})`}
              value={Math.min(Math.max(givenEffect, cfg.effectMin), cfg.effectMax)}
              onChange={setGivenEffect}
              min={cfg.effectMin}
              max={cfg.effectMax}
              step={cfg.effectStep}
            />

            <div className="p-4 bg-secondary/5 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Required Sample Size</div>
              {Number.isFinite(requiredN) ? (
                <>
                  <div className="text-3xl font-bold text-secondary">
                    {cfg.unit === 'total' ? `N = ${requiredN}` : cfg.unit === 'subjects' ? `${requiredN} subjects` : `n = ${requiredN} ${cfg.unit}`}
                  </div>
                  <div className="text-xs mt-2">
                    To detect {cfg.effectSymbol} = {givenEffect.toFixed(3)} with {(targetPower * 100).toFixed(0)}% power at α={alpha},
                    you need {unitText(cfg.unit, requiredN)}.
                  </div>
                  {cellsOrGroups !== null && (
                    <div className="text-xs mt-1 font-semibold">
                      Total N = {requiredN * cellsOrGroups}
                    </div>
                  )}
                  {cfg.unit === 'subjects' && (
                    <div className="text-xs mt-1 font-semibold">
                      Total observations = {requiredN * timepoints} ({timepoints} timepoints each)
                    </div>
                  )}
                </>
              ) : Number.isNaN(requiredN) ? (
                <div className="text-lg font-semibold text-muted-foreground">
                  Not available for these settings
                </div>
              ) : (
                <>
                  <div className="text-lg font-semibold text-destructive">Not reachable</div>
                  <div className="text-xs mt-2">
                    {(targetPower * 100).toFixed(0)}% power is not reached with up to 100,000 units for this effect size.
                  </div>
                </>
              )}
            </div>
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
