import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataType, TestType } from './wizardConfig';
import { cn } from '@/lib/utils';

interface QuestionFlowProps {
  dataType: DataType;
  onTestSelected: (test: TestType) => void;
}

const QuestionFlow = ({ dataType, onTestSelected }: QuestionFlowProps) => {
  if (dataType === 'continuous') {
    return <ContinuousFlow onTestSelected={onTestSelected} />;
  } else if (dataType === 'categorical') {
    return <CategoricalFlow onTestSelected={onTestSelected} />;
  } else if (dataType === 'microbiome') {
    return <MicrobiomeFlow onTestSelected={onTestSelected} />;
  } else if (dataType === 'correlation') {
    onTestSelected('correlation');
    return null;
  }
  return null;
};

const ContinuousFlow = ({ onTestSelected }: { onTestSelected: (test: TestType) => void }) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">How many groups are you comparing?</h2>
        <p className="text-muted-foreground">This will help determine the right test</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OptionCard
          title="2 Groups"
          description="Comparing two independent groups (e.g., control vs. treatment)"
          onClick={() => onTestSelected('ttest')}
        />
        <OptionCard
          title="3+ Groups (1 Factor)"
          description="Comparing multiple groups with one factor (e.g., 3 fertilizer types)"
          onClick={() => onTestSelected('oneway')}
        />
        <OptionCard
          title="Multiple Factors"
          description="Two or more factors interacting (e.g., temperature × moisture)"
          onClick={() => onTestSelected('twoway')}
        />
      </div>

      <Card className="p-4 bg-muted/50">
        <p className="text-sm">
          <strong>Repeated measures?</strong> If you're measuring the same subjects over time or conditions,{' '}
          <button
            className="text-primary underline hover:no-underline"
            onClick={() => onTestSelected('repeated')}
          >
            click here for Repeated Measures
          </button>
        </p>
      </Card>
    </div>
  );
};

const CategoricalFlow = ({ onTestSelected }: { onTestSelected: (test: TestType) => void }) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What are you testing?</h2>
        <p className="text-muted-foreground">Select your research question</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OptionCard
          title="Association Between Variables"
          description="Are two categorical variables related? (e.g., habitat type and species presence)"
          onClick={() => onTestSelected('chisquare')}
        />
        <OptionCard
          title="Comparing Proportions"
          description="Do proportions differ across groups? (e.g., survival rates by treatment)"
          onClick={() => onTestSelected('chisquare')}
        />
      </div>
    </div>
  );
};

const MicrobiomeFlow = ({ onTestSelected }: { onTestSelected: (test: TestType) => void }) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What is your research question?</h2>
        <p className="text-muted-foreground">Choose the analysis that matches your goal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OptionCard
          title="Community Composition"
          description="Do community compositions differ between groups? (PERMANOVA)"
          onClick={() => onTestSelected('microbiome')}
        />
        <OptionCard
          title="Diversity Comparison"
          description="Does alpha diversity (richness/evenness) differ between groups?"
          onClick={() => onTestSelected('ttest')}
        />
      </div>
    </div>
  );
};

const OptionCard = ({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) => {
  return (
    <Card
      className="p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-primary"
      onClick={onClick}
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
};

export default QuestionFlow;
