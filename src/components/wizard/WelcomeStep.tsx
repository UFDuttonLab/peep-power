import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <Card className="p-8 max-w-3xl mx-auto">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Welcome to the Power Analysis Wizard!</h2>
          <p className="text-lg text-muted-foreground">
            Not sure which test to use? Let me guide you step-by-step.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 text-left space-y-3">
          <h3 className="font-semibold text-lg">What we'll do together:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>Identify your data type and research question</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>Select the most appropriate statistical test</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>Set up your parameters with contextual guidance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>Calculate your statistical power with interpretation</span>
            </li>
          </ul>
        </div>

        <Button onClick={onNext} size="lg" className="gap-2">
          Let's Get Started <ArrowRight className="h-5 w-5" />
        </Button>

        <p className="text-sm text-muted-foreground">
          Takes about 2-3 minutes
        </p>
      </div>
    </Card>
  );
};

export default WelcomeStep;
