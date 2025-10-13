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
  onNavigateToCalculator?: (testType: TestType) => void;
}

const HoldMyHandCalculator = ({ onNavigateToCalculator }: HoldMyHandCalculatorProps) => {
  const [state, setState] = useState<WizardState & { microbiomeParams?: MicrobiomeParams }>({
    ...initialState,
    microbiomeParams: undefined,
  });

  const steps = ['Welcome', 'Data Type', 'Questions', 'Effect Size', 'Groups', 'Sample Size'];

  const handleNext = () => {
    setState((prev) => ({ ...prev, step: prev.step + 1 }));
  };

  const handleBack = () => {
    setState((prev) => ({ ...prev, step: Math.max(0, prev.step - 1) }));
  };

  const handleDataTypeSelect = (dataType: DataType) => {
    setState((prev) => ({ ...prev, dataType }));
    handleNext();
  };

  const handleTestSelected = (test: TestType) => {
    setState((prev) => ({ ...prev, selectedTest: test }));
    handleNext();
  };

  const handleEffectSizeSelect = (effectSize: number, effectType: string) => {
    let convertedEffect = effectSize;
    
    // Convert effect sizes based on test type if needed
    if ((state.selectedTest === 'microbiome' || state.selectedTest === 'repeated-microbiome') && 
        (effectType === "Cohen's d" || effectType === "Cohen's f")) {
      // Only convert for 2-group comparisons
      if (state.numGroups === 2) {
        const f = effectType === "Cohen's d" ? effectSize / 2 : effectSize;
        convertedEffect = (f * f) / (1 + f * f);
        console.warn(`Converted ${effectType}=${effectSize.toFixed(2)} to R²=${convertedEffect.toFixed(3)} for 2-group PERMANOVA`);
      } else {
        // For multi-group, this conversion is inappropriate - should not happen now
        console.error(`Cannot convert ${effectType} to R² for ${state.numGroups}-group PERMANOVA. Use R² directly.`);
        return; // Don't proceed
      }
    } else if ((state.selectedTest === 'oneway' || state.selectedTest === 'twoway') && 
               effectType === "Cohen's d") {
      // Convert Cohen's d to Cohen's f for ANOVA: f = d/2 (for 2 groups)
      convertedEffect = effectSize / 2;
      if (state.numGroups && state.numGroups > 2) {
        console.warn(`Cohen's d to f conversion (f=d/2) is only exact for 2 groups. For ${state.numGroups} groups, this is an approximation assuming all pairs have similar effect sizes.`);
      } else {
        console.warn(`Converted Cohen's d=${effectSize.toFixed(2)} to Cohen's f=${convertedEffect.toFixed(3)} for ANOVA`);
      }
    } else if ((state.selectedTest === 'oneway' || state.selectedTest === 'twoway') && 
               effectType === 'R² (PERMANOVA)') {
      // Convert R² to Cohen's f: f = √(R²/(1-R²))
      convertedEffect = Math.sqrt(effectSize / (1 - effectSize));
      console.warn(`Converted R²=${effectSize.toFixed(3)} to Cohen's f=${convertedEffect.toFixed(3)} for ANOVA`);
    } else if ((state.selectedTest === 'microbiome' || state.selectedTest === 'repeated-microbiome') && 
               effectType === 'R² (PERMANOVA)') {
      // R² is already correct for PERMANOVA - no conversion needed
      convertedEffect = effectSize;
    }
    
    setState((prev) => ({ 
      ...prev, 
      selectedEffectSize: convertedEffect,
      parameters: { ...prev.parameters, effectSize: convertedEffect }
    }));
    handleNext();
  };

  const handleGroupsSubmit = (groups: number) => {
    // Check if this test type needs microbiome-specific parameters
    if (state.selectedTest === 'deseq' || state.selectedTest === 'zinb' || state.selectedTest === 'lmm-microbiome') {
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
      {state.step > 0 && state.step < 5 && (
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
                onClick={() => onNavigateToCalculator && onNavigateToCalculator('ttest' as TestType)}
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
