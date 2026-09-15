import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const ReplicationChecker = () => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);

  const handleAnswer = (question: string, answer: string) => {
    setAnswers({ ...answers, [question]: answer });
  };

  const analyzeReplication = () => {
    const hasSubsamples = answers.subsamples === 'yes';
    const sampleType = answers.sampleType;
    const independence = answers.independence;

    let resultText = '';
    
    if (independence === 'no') {
      resultText = '⚠️ PSEUDOREPLICATION DETECTED: Your experimental units are not independent. You need to either: (1) Use mixed-effects models that account for non-independence, or (2) Average subsamples within each true replicate and use that as your sample size (n).';
    } else if (independence === 'unsure') {
      resultText = '⚠️ UNCLEAR: You are not sure your experimental units are independent. Review the independence criteria (shared conditions, physical connections, repeated measurement of the same unit) or consult a statistician before deciding on your sample size (n).';
    } else if (hasSubsamples) {
      resultText = '✓ PROPER DESIGN with subsamples: Your true sample size (n) is the number of independent experimental units, NOT the total number of subsamples. Average measurements within each unit before analysis.';
    } else if (sampleType === 'plots' || sampleType === 'tanks' || sampleType === 'individuals') {
      resultText = '✓ PROPER REPLICATION: Each experimental unit appears to be independent. Your sample size (n) is correct as stated.';
    } else {
      resultText = '⚠️ UNCLEAR: Please review the independence criteria. Consult with a statistician if unsure.';
    }

    setResult(resultText);
  };

  const reset = () => {
    setStep(1);
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Replication Checker</h2>
        </div>
        <p className="mb-6 text-muted-foreground">
          Use this tool to verify that you're correctly identifying your true sample size and avoiding pseudoreplication.
        </p>

        {!result ? (
          <div className="space-y-6">
            {step >= 1 && (
              <Card className="p-6 bg-secondary/20">
                <Label className="text-lg font-semibold mb-4 block">
                  Question 1: What are your experimental units?
                </Label>
                <RadioGroup
                  value={answers.sampleType}
                  onValueChange={(val) => handleAnswer('sampleType', val)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="plots" id="plots" />
                    <Label htmlFor="plots" className="font-normal cursor-pointer">
                      Field plots or quadrats (spatially separated)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tanks" id="tanks" />
                    <Label htmlFor="tanks" className="font-normal cursor-pointer">
                      Tanks, mesocosms, or enclosures (physically separated)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individuals" id="individuals" />
                    <Label htmlFor="individuals" className="font-normal cursor-pointer">
                      Individual organisms (e.g., separate plants, animals)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="time" id="time" />
                    <Label htmlFor="time" className="font-normal cursor-pointer">
                      Time points or repeated measures on the same units
                    </Label>
                  </div>
                </RadioGroup>
              </Card>
            )}

            {step >= 2 && answers.sampleType && (
              <Card className="p-6 bg-secondary/20">
                <Label className="text-lg font-semibold mb-4 block">
                  Question 2: Are your experimental units truly independent?
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Independent means: no shared environmental conditions, no physical connections, 
                  measurements from one unit don't affect another, and no pseudoreplication over time.
                </p>
                <RadioGroup
                  value={answers.independence}
                  onValueChange={(val) => handleAnswer('independence', val)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="ind-yes" />
                    <Label htmlFor="ind-yes" className="font-normal cursor-pointer">
                      Yes - each unit is completely independent
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="ind-no" />
                    <Label htmlFor="ind-no" className="font-normal cursor-pointer">
                      No - units share conditions or are measured repeatedly
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unsure" id="ind-unsure" />
                    <Label htmlFor="ind-unsure" className="font-normal cursor-pointer">
                      Not sure
                    </Label>
                  </div>
                </RadioGroup>
              </Card>
            )}

            {step >= 3 && answers.independence && (
              <Card className="p-6 bg-secondary/20">
                <Label className="text-lg font-semibold mb-4 block">
                  Question 3: Do you have multiple measurements (subsamples) within each experimental unit?
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Example: 5 tanks (units) with 10 fish measured in each tank (subsamples)
                </p>
                <RadioGroup
                  value={answers.subsamples}
                  onValueChange={(val) => handleAnswer('subsamples', val)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="sub-yes" />
                    <Label htmlFor="sub-yes" className="font-normal cursor-pointer">
                      Yes - I have multiple subsamples per unit
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="sub-no" />
                    <Label htmlFor="sub-no" className="font-normal cursor-pointer">
                      No - one measurement per unit
                    </Label>
                  </div>
                </RadioGroup>
              </Card>
            )}

            <div className="flex gap-4">
              {step < 3 && (step === 1 ? answers.sampleType : answers.independence) && (
                <Button onClick={() => setStep(step + 1)}>
                  Next Question
                </Button>
              )}
              {step === 3 && answers.subsamples && (
                <Button onClick={analyzeReplication} className="w-full">
                  Analyze My Design
                </Button>
              )}
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Previous
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className={`p-6 border-l-4 ${result.includes('✓') ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'}`}>
              <div className="flex items-start gap-3">
                {result.includes('✓') ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" />
                )}
                <div>
                  <h3 className="font-bold text-lg mb-2">Analysis Result</h3>
                  <p className="text-foreground">{result}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-secondary/30">
              <h3 className="font-bold mb-3">Key Takeaways</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ <strong>True replicates (n)</strong> = number of independent experimental units</li>
                <li>✓ <strong>Subsamples</strong> should be averaged within each replicate</li>
                <li>⚠️ <strong>Pseudoreplication</strong> = treating non-independent observations as replicates</li>
                <li>⚠️ If units are not independent, use appropriate mixed models or nested designs</li>
              </ul>
            </Card>

            <Button onClick={reset} variant="outline" className="w-full">
              Check Another Design
            </Button>
          </div>
        )}
      </Card>

      <Card className="mt-6 p-6 bg-secondary/30 border-l-4 border-destructive">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Common Pseudoreplication Mistakes in Ecology
        </h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">❌ Wrong: "I have 5 plots with 20 plants each = n=100"</p>
            <p className="text-muted-foreground">✓ Correct: n=5 (plots are your units, average the 20 plants per plot)</p>
          </div>
          <div>
            <p className="font-semibold">❌ Wrong: "I measured 3 tanks over 10 time points = n=30"</p>
            <p className="text-muted-foreground">✓ Correct: Use repeated measures ANOVA with n=3 tanks</p>
          </div>
          <div>
            <p className="font-semibold">❌ Wrong: "I have 100 fish in 5 tanks = n=100"</p>
            <p className="text-muted-foreground">✓ Correct: n=5 (tanks are independent units, not fish)</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReplicationChecker;
