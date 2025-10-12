import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import ControlSlider from '@/components/ControlSlider';
import { TestType } from './wizardConfig';

interface MicrobiomeParametersProps {
  testType: 'deseq' | 'zinb' | 'lmm-microbiome';
  numGroups: number;
  onComplete: (params: MicrobiomeParams) => void;
  onBack: () => void;
}

export interface MicrobiomeParams {
  // DESeq2/ZINB params
  dispersion?: number;
  baseMean?: number;
  numTests?: number;
  zeroInflation?: number;
  
  // LMM params
  withinCorr?: number;
  randomSlopeVar?: number;
  dropoutRate?: number;
}

export const MicrobiomeParameters = ({ testType, numGroups, onComplete, onBack }: MicrobiomeParametersProps) => {
  const [params, setParams] = useState<MicrobiomeParams>({
    dispersion: 0.5,
    baseMean: 100,
    numTests: 100,
    zeroInflation: 0.5,
    withinCorr: 0.5,
    randomSlopeVar: 0.1,
    dropoutRate: 0.1,
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Microbiome-Specific Parameters</h2>
        <p className="text-muted-foreground">
          {testType === 'deseq' && 'Configure parameters for differential abundance analysis'}
          {testType === 'zinb' && 'Configure parameters for zero-inflated model'}
          {testType === 'lmm-microbiome' && 'Configure parameters for longitudinal analysis'}
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {(testType === 'deseq' || testType === 'zinb') && (
          <>
            <div>
              <h3 className="font-semibold mb-4">Count Data Parameters</h3>
              <div className="space-y-6">
                <ControlSlider
                  id="dispersion"
                  label="Dispersion"
                  value={params.dispersion!}
                  onChange={(v) => setParams({ ...params, dispersion: v })}
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  tooltip="Overdispersion parameter (φ). Higher values = more variable counts. Typical microbiome: 0.5. Low for abundant taxa: 0.2. High for rare taxa: 1.0+"
                  decimals={2}
                />
                <ControlSlider
                  id="baseMean"
                  label="Base Mean Count"
                  value={params.baseMean!}
                  onChange={(v) => setParams({ ...params, baseMean: v })}
                  min={10}
                  max={1000}
                  step={10}
                  tooltip="Typical abundance of target taxa. Rare taxa: 10-50. Moderate: 50-200. Abundant: 200+. Use median from pilot data if available."
                  decimals={0}
                />
                <ControlSlider
                  id="numTests"
                  label="Number of Taxa Tested"
                  value={params.numTests!}
                  onChange={(v) => setParams({ ...params, numTests: v })}
                  min={10}
                  max={500}
                  step={10}
                  tooltip="Total number of taxa to test. More taxa = stricter multiple testing correction = larger sample size needed. Typical: 50-200 after filtering."
                  decimals={0}
                  warningThreshold={{
                    max: 300,
                    message: "Testing >300 taxa requires very large samples. Consider pre-filtering rare taxa."
                  }}
                />
              </div>
            </div>
          </>
        )}

        {testType === 'zinb' && (
          <div>
            <h3 className="font-semibold mb-4">Zero-Inflation Parameters</h3>
            <ControlSlider
              id="zeroInflation"
              label="Zero-Inflation Proportion"
              value={params.zeroInflation!}
              onChange={(v) => setParams({ ...params, zeroInflation: v })}
              min={0.1}
              max={0.9}
              step={0.05}
              tooltip="Proportion of structural zeros in your data. Calculate as: (# of zero counts) / (total observations). Check this from pilot data."
              decimals={2}
              warningThreshold={{
                max: 0.7,
                message: "Very high zero-inflation (>70%). Ensure this reflects true data structure."
              }}
            />
          </div>
        )}

        {testType === 'lmm-microbiome' && (
          <div>
            <h3 className="font-semibold mb-4">Longitudinal Design Parameters</h3>
            <div className="space-y-6">
              <ControlSlider
                id="withinCorr"
                label="Within-Subject Correlation"
                value={params.withinCorr!}
                onChange={(v) => setParams({ ...params, withinCorr: v })}
                min={0.1}
                max={0.9}
                step={0.05}
                tooltip="Correlation between repeated measures from the same subject (intraclass correlation coefficient). Typical microbiome longitudinal: 0.5. Higher = more stable communities."
                decimals={2}
              />
              <ControlSlider
                id="randomSlopeVar"
                label="Random Slope Variance"
                value={params.randomSlopeVar!}
                onChange={(v) => setParams({ ...params, randomSlopeVar: v })}
                min={0.0}
                max={0.5}
                step={0.05}
                tooltip="Variability in individual trajectories over time. 0 = all subjects follow parallel trends. 0.3+ = highly individualized responses. Conservative default: 0.1"
                decimals={2}
                warningThreshold={{
                  max: 0.3,
                  message: "High random slope variance increases required sample size substantially."
                }}
              />
              <ControlSlider
                id="dropoutRate"
                label="Expected Dropout Rate"
                value={params.dropoutRate!}
                onChange={(v) => setParams({ ...params, dropoutRate: v })}
                min={0.0}
                max={0.4}
                step={0.05}
                tooltip="Proportion of subjects expected to drop out by final timepoint. Typical clinical studies: 0.1-0.2. Long studies (>1 year): 0.3+"
                decimals={2}
              />
            </div>
          </div>
        )}

        <Alert className="bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Don't have pilot data?</strong> The default values are conservative estimates
            based on typical microbiome studies. You can refine these parameters once you collect
            preliminary data or consult published studies in your system.
          </AlertDescription>
        </Alert>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          ← Back
        </Button>
        <Button onClick={() => onComplete(params)} className="flex-1">
          Continue to Results
        </Button>
      </div>
    </div>
  );
};
