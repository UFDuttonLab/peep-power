import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { TestType } from './wizardConfig';

interface GroupsInputProps {
  testType: TestType;
  onSubmit: (groups: number) => void;
  onBack: () => void;
}

const GroupsInput = ({ testType, onSubmit, onBack }: GroupsInputProps) => {
  const [groups, setGroups] = useState<string>('');

  const handleSubmit = () => {
    const value = parseInt(groups);
    if (!isNaN(value) && value >= 2 && value <= 20) {
      onSubmit(value);
    }
  };

  const getPromptText = () => {
    switch (testType) {
      case 'ttest':
        return {
          title: 'Confirm Number of Groups',
          description: 'For a t-test, you are comparing 2 groups',
          prompt: 'Number of groups',
          default: 2,
          fixed: true,
        };
      case 'oneway':
      case 'twoway':
        return {
          title: 'How many groups are you comparing?',
          description: 'Enter the total number of independent groups in your study',
          prompt: 'Number of groups',
          default: 3,
          fixed: false,
        };
      case 'repeated':
        return {
          title: 'How many time points or conditions?',
          description: 'Enter the number of repeated measurements per subject',
          prompt: 'Number of time points',
          default: 3,
          fixed: false,
        };
      case 'correlation':
        return {
          title: 'Sample Size Information',
          description: 'For correlation, we need the total sample size',
          prompt: 'This step is not needed for correlation',
          default: 0,
          fixed: true,
        };
      case 'microbiome':
        return {
          title: 'How many groups are you comparing?',
          description: 'Enter the number of groups for PERMANOVA analysis',
          prompt: 'Number of groups',
          default: 2,
          fixed: false,
        };
      case 'repeated-microbiome':
        return {
          title: 'How many timepoints will you measure?',
          description: 'Enter the number of repeated measurements per subject (e.g., 2 for before/after, 4 for quarterly)',
          prompt: 'Number of timepoints',
          default: 2,
          fixed: false,
        };
      default:
        return {
          title: 'How many groups?',
          description: 'Enter the number of groups in your study',
          prompt: 'Number of groups',
          default: 2,
          fixed: false,
        };
    }
  };

  const config = getPromptText();

  // For t-test, auto-submit with 2 groups
  if (config.fixed && config.default === 2) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{config.title}</h2>
          <p className="text-muted-foreground">{config.description}</p>
        </div>

        <Card className="p-8 text-center space-y-4">
          <div className="text-6xl font-bold text-primary">2</div>
          <p className="text-lg">Groups</p>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={() => onSubmit(2)} className="flex-1">
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{config.title}</h2>
        <p className="text-muted-foreground">{config.description}</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {testType === 'repeated-microbiome' 
            ? 'For repeated measures, enter the number of times each subject will be measured.'
            : testType === 'repeated'
            ? 'For repeated measures, enter the number of times each subject will be measured.'
            : 'This should be the number of independent treatment groups or conditions you\'re comparing. Each group should have multiple replicate samples.'
          }
        </AlertDescription>
      </Alert>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <Label htmlFor="groups" className="text-base">{config.prompt}</Label>
          <Input
            id="groups"
            type="number"
            min="2"
            max="20"
            value={groups}
            onChange={(e) => setGroups(e.target.value)}
            placeholder={`e.g., ${config.default}`}
            className="text-2xl h-16 text-center"
          />
          <p className="text-sm text-muted-foreground text-center">
            Enter a number between 2 and 20
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">Quick Presets:</h4>
          <div className="flex gap-2 flex-wrap">
            {testType === 'repeated-microbiome' || testType === 'repeated' ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setGroups('2')}>
                  2 Timepoints
                </Button>
                <Button variant="outline" size="sm" onClick={() => setGroups('3')}>
                  3 Timepoints
                </Button>
                <Button variant="outline" size="sm" onClick={() => setGroups('4')}>
                  4 Timepoints
                </Button>
                <Button variant="outline" size="sm" onClick={() => setGroups('8')}>
                  8 Timepoints
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setGroups('2')}>
                  2 Groups
                </Button>
                <Button variant="outline" size="sm" onClick={() => setGroups('3')}>
                  3 Groups
                </Button>
                <Button variant="outline" size="sm" onClick={() => setGroups('4')}>
                  4 Groups
                </Button>
                <Button variant="outline" size="sm" onClick={() => setGroups('5')}>
                  5 Groups
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="flex-1"
          disabled={!groups || parseInt(groups) < 2 || parseInt(groups) > 20}
        >
          Calculate Sample Size
        </Button>
      </div>
    </div>
  );
};

export default GroupsInput;
