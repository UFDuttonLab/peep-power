import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import WelcomeStep from '@/components/wizard/WelcomeStep';
import DataTypeSelector from '@/components/wizard/DataTypeSelector';
import QuestionFlow from '@/components/wizard/QuestionFlow';
import EffectSizeSelector from '@/components/wizard/EffectSizeSelector';
import GroupsInput from '@/components/wizard/GroupsInput';
import MinimumSampleSize from '@/components/wizard/MinimumSampleSize';
import { MicrobiomeParameters, MicrobiomeParams } from '@/components/wizard/MicrobiomeParameters';
import ProgressIndicator from '@/components/wizard/ProgressIndicator';
import { WizardState, initialState, DataType, TestType } from '@/components/wizard/wizardConfig';

interface HoldMyHandCalculatorProps {
  /** Accepts a wizard TestType or any calculator tab id (e.g. 'bayesian-assurance'). */
  onNavigateToCalculator?: (tabId: TestType | 'bayesian-assurance') => void;
}

const HoldMyHandCalculator = ({ onNavigateToCalculator }: HoldMyHandCalculatorProps) => {
  const [state, setState] = useState<WizardState & { microbiomeParams?: MicrobiomeParams }>({
    ...initialState,
    microbiomeParams: undefined,
  });

  const steps = ['Welcome', 'Data Type', 'Questions', 'Effect Size', 'Groups', 'Sample Size'];

  const needsMicrobiomeParams = (t: TestType | null) =>
    t === 'deseq' || t === 'zinb' || t === 'lmm-microbiome';

  const handleNext = () => {
    setState((prev) => ({ ...prev, step: prev.step + 1 }));
  };

  const handleBack = () => {
    setState((prev) => {
      let step: number;
      if (prev.step === 4.5) step = 4;
      else if (prev.step === 5 && needsMicrobiomeParams(prev.selectedTest)) step = 4.5;
      else if (prev.step === 3 && prev.dataType === 'correlation') step = 1; // correlation has no question step
      else step = Math.max(0, prev.step - 1);
      return { ...prev, step };
    });
  };

  const handleDataTypeSelect = (dataType: DataType) => {
    // Reset everything downstream so nothing from a previous path leaks into the calculation
    setState((prev) => ({
      ...prev,
      dataType,
      selectedTest: dataType === 'correlation' ? 'correlation' : null,
      selectedEffectSize: null,
      numGroups: null,
      microbiomeParams: undefined,
      parameters: { ...initialState.parameters },
      step: dataType === 'correlation' ? 3 : prev.step + 1,
    }));
  };

  const handleTestSelected = (test: TestType) => {
    setState((prev) => ({ ...prev, selectedTest: test }));
    handleNext();
  };

  /**
   * Convert the selected effect size to the metric each downstream calculation expects:
   * d (ttest, deseq, zinb), f (ANOVA-type and LMM), r (correlation), w (chi-square), R² (PERMANOVA).
   */
  const handleEffectSizeSelect = (effectSize: number, effectType: string) => {
    const t = state.selectedTest;
    const isD = effectType === "Cohen's d";
    const isF = effectType === "Cohen's f";
    const isR2 = effectType === 'R² (PERMANOVA)';
    // For two groups, f = d/2 exactly; for k > 2 groups d/2 is the minimum-variability approximation
    const toD = (v: number) => (isF ? 2 * v : isR2 ? 2 * Math.sqrt(v / (1 - v)) : v);
    const toF = (v: number) => (isD ? v / 2 : isR2 ? Math.sqrt(v / (1 - v)) : v);
    // Point-biserial r (equal group sizes); also used as w (= phi) for a 2x2 table
    const dToR = (d: number) => d / Math.sqrt(d * d + 4);

    let convertedEffect = effectSize;
    if (t === 'microbiome' || t === 'repeated-microbiome') {
      if (isR2) {
        convertedEffect = effectSize;
      } else {
        const f = toF(effectSize);
        convertedEffect = (f * f) / (1 + f * f);
      }
    } else if (t === 'oneway' || t === 'twoway' || t === 'repeated' || t === 'lmm-microbiome') {
      convertedEffect = toF(effectSize);
    } else if (t === 'ttest' || t === 'deseq' || t === 'zinb') {
      convertedEffect = toD(effectSize);
    } else if (t === 'correlation' || t === 'chisquare') {
      convertedEffect = dToR(toD(effectSize));
    }

    if (!(convertedEffect > 0) || !Number.isFinite(convertedEffect)) return;

    setState((prev) => ({
      ...prev,
      selectedEffectSize: convertedEffect,
      parameters: { ...prev.parameters, effectSize: convertedEffect },
      step: prev.step + 1,
    }));
  };

  const handleGroupsSubmit = (groups: number) => {
    // Check if this test type needs microbiome-specific parameters
    if (needsMicrobiomeParams(state.selectedTest)) {
      setState((prev) => ({ 
        ...prev, 
        numGroups: groups,
        parameters: { ...prev.parameters, groups },
        step: 4.5 // Insert microbiome parameter step
      }));
    } else {
      setState((prev) => ({ 
        ...prev, 
        numGroups: groups,
        parameters: { ...prev.parameters, groups }
      }));
      handleNext();
    }
  };

  const handleMicrobiomeParamsComplete = (params: MicrobiomeParams) => {
    setState((prev) => ({ 
      ...prev, 
      microbiomeParams: params,
      step: 5
    }));
  };

  const handleRestart = () => {
    setState(initialState);
  };

  const handleGoToCalculator = () => {
    if (state.selectedTest && onNavigateToCalculator) {
      onNavigateToCalculator(state.selectedTest);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {state.step > 0 && state.step <= 5 && (
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      )}

      {state.step > 0 && state.step < 6 && (
        <ProgressIndicator currentStep={state.step} totalSteps={steps.length} steps={steps} />
      )}

      {state.step === 0 && <WelcomeStep onNext={handleNext} />}

      {state.step === 1 && (
        <DataTypeSelector onSelect={handleDataTypeSelect} selected={state.dataType} />
      )}

      {state.step === 2 && state.dataType && (
        <QuestionFlow dataType={state.dataType} onTestSelected={handleTestSelected} />
      )}

      {state.step === 3 && state.selectedTest && (
        <EffectSizeSelector
          testType={state.selectedTest}
          numGroups={state.numGroups}
          onSelect={handleEffectSizeSelect}
          onBack={handleBack}
        />
      )}

      {state.step === 4 && state.selectedTest && (
        <GroupsInput
          testType={state.selectedTest}
          onSubmit={handleGroupsSubmit}
          onBack={handleBack}
        />
      )}

      {state.step === 4.5 && state.selectedTest && state.numGroups &&
        (state.selectedTest === 'deseq' || state.selectedTest === 'zinb' || state.selectedTest === 'lmm-microbiome') && (
        <MicrobiomeParameters
          testType={state.selectedTest}
          numGroups={state.numGroups}
          onComplete={handleMicrobiomeParamsComplete}
          onBack={handleBack}
        />
      )}

      {state.step === 5 && state.selectedTest && state.selectedEffectSize && state.numGroups && (
        <>
          <MinimumSampleSize
            testType={state.selectedTest}
            effectSize={state.selectedEffectSize}
            groups={state.numGroups}
            microbiomeParams={state.microbiomeParams}
            onGoToCalculator={handleGoToCalculator}
            onRestart={handleRestart}
          />
          
          <Alert className="mt-6 bg-purple-50 dark:bg-purple-950/20 border-purple-500">
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <strong>Want to account for uncertainty?</strong> The sample size above assumes 
              you know the exact effect size. If you're uncertain about the true effect size, try the 
              <Button 
                variant="link" 
                className="px-1 h-auto py-0 text-purple-700 dark:text-purple-300 underline font-semibold"
                onClick={() => onNavigateToCalculator && onNavigateToCalculator('bayesian-assurance')}
              >
                Bayesian Assurance Calculator
              </Button> 
              for a more robust estimate that accounts for this uncertainty. Bayesian methods 
              typically increase required sample size by 20-40% but provide higher confidence 
              of achieving your target power.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
};

export default HoldMyHandCalculator;
