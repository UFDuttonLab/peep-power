import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import WelcomeStep from '@/components/wizard/WelcomeStep';
import DataTypeSelector from '@/components/wizard/DataTypeSelector';
import QuestionFlow from '@/components/wizard/QuestionFlow';
import ParameterGuide from '@/components/wizard/ParameterGuide';
import ResultsSummary from '@/components/wizard/ResultsSummary';
import ProgressIndicator from '@/components/wizard/ProgressIndicator';
import { WizardState, initialState, DataType, TestType } from '@/components/wizard/wizardConfig';
import { calculateTTestPower, calculateOneWayAnovaPower, calculateCorrelationPower } from '@/utils/powerCalculations';

interface HoldMyHandCalculatorProps {
  onNavigateToCalculator?: (testType: TestType) => void;
}

const HoldMyHandCalculator = ({ onNavigateToCalculator }: HoldMyHandCalculatorProps) => {
  const [state, setState] = useState<WizardState>(initialState);

  const steps = ['Welcome', 'Data Type', 'Questions', 'Parameters', 'Results'];

  const handleNext = () => {
    setState((prev) => ({ ...prev, step: prev.step + 1 }));
  };

  const handleBack = () => {
    setState((prev) => ({ ...prev, step: Math.max(0, prev.step - 1) }));
  };

  const handleDataTypeSelect = (dataType: DataType) => {
    setState((prev) => ({ ...prev, dataType }));
    // Auto-advance for correlation
    if (dataType === 'correlation') {
      setState((prev) => ({ ...prev, dataType, selectedTest: 'correlation', step: 3 }));
    } else {
      handleNext();
    }
  };

  const handleTestSelected = (test: TestType) => {
    setState((prev) => ({ ...prev, selectedTest: test }));
    handleNext();
  };

  const handleParameterChange = (key: string, value: number) => {
    setState((prev) => ({
      ...prev,
      parameters: { ...prev.parameters, [key]: value },
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

  // Calculate power based on selected test
  const calculatePower = (): number => {
    const { selectedTest, parameters } = state;
    
    try {
      if (selectedTest === 'ttest') {
        const result = calculateTTestPower(parameters.n, parameters.effectSize, parameters.alpha);
        return result.power;
      } else if (selectedTest === 'oneway') {
        const result = calculateOneWayAnovaPower(parameters.n, 3, parameters.effectSize, parameters.alpha);
        return result.power;
      } else if (selectedTest === 'correlation') {
        const result = calculateCorrelationPower(parameters.n, parameters.effectSize, parameters.alpha);
        return result.power;
      }
      // For other tests, use t-test as approximation for MVP
      const result = calculateTTestPower(parameters.n, parameters.effectSize, parameters.alpha);
      return result.power;
    } catch {
      return 0.5; // Fallback
    }
  };

  const power = state.step === 4 ? calculatePower() : 0;

  return (
    <div className="max-w-5xl mx-auto">
      {state.step > 0 && state.step < 4 && (
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      )}

      {state.step > 0 && state.step < 5 && (
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
        <ParameterGuide
          testType={state.selectedTest}
          parameters={state.parameters}
          onParameterChange={handleParameterChange}
          onNext={handleNext}
        />
      )}

      {state.step === 4 && state.selectedTest && (
        <ResultsSummary
          testType={state.selectedTest}
          power={power}
          parameters={state.parameters}
          onGoToCalculator={handleGoToCalculator}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default HoldMyHandCalculator;
