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
import ProgressIndicator from '@/components/wizard/ProgressIndicator';
import { WizardState, initialState, DataType, TestType } from '@/components/wizard/wizardConfig';

interface HoldMyHandCalculatorProps {
  onNavigateToCalculator?: (testType: TestType) => void;
}

const HoldMyHandCalculator = ({ onNavigateToCalculator }: HoldMyHandCalculatorProps) => {
  const [state, setState] = useState<WizardState>(initialState);

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

  const handleEffectSizeSelect = (effectSize: number) => {
    setState((prev) => ({ 
      ...prev, 
      selectedEffectSize: effectSize,
      parameters: { ...prev.parameters, effectSize }
    }));
    handleNext();
  };

  const handleGroupsSubmit = (groups: number) => {
    setState((prev) => ({ 
      ...prev, 
      numGroups: groups,
      parameters: { ...prev.parameters, groups }
    }));
    handleNext();
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
          onSelect={handleEffectSizeSelect}
          onBack={handleBack}
        />
      )}

      {state.step === 4 && state.selectedTest && state.selectedEffectSize && (
        <GroupsInput
          testType={state.selectedTest}
          onSubmit={handleGroupsSubmit}
          onBack={handleBack}
        />
      )}

      {state.step === 5 && state.selectedTest && state.selectedEffectSize && state.numGroups && (
        <>
          <MinimumSampleSize
            testType={state.selectedTest}
            effectSize={state.selectedEffectSize}
            groups={state.numGroups}
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
