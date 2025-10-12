import React from 'react';
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
  const [designType, setDesignType] = React.useState<'independent' | 'repeated' | null>(null);

  if (!designType) {
    return (
      <div className="space-y-6">
        {/* Progress breadcrumb */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              1
            </div>
            <span className="font-medium text-foreground">Study Design</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center text-xs">
              2
            </div>
            <span>Research Question</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Study Design</h2>
          <p className="text-muted-foreground">Are your samples independent or repeated?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OptionCard
            title="Independent Samples"
            description="Different subjects in each group (e.g., healthy vs. diseased individuals)"
            onClick={() => setDesignType('independent')}
          />
          <OptionCard
            title="Repeated Measures"
            description="Same subjects measured multiple times (e.g., before/after treatment, over time)"
            onClick={() => setDesignType('repeated')}
          />
        </div>

        <Card className="p-4 bg-muted/50 border-primary/20">
          <p className="text-sm">
            <strong>Not sure?</strong> If you're sampling the same individuals/sites at multiple timepoints 
            or conditions, use repeated measures. If each sample comes from a different individual, use independent.
          </p>
        </Card>
      </div>
    );
  }

  if (designType === 'repeated') {
    return (
      <div className="space-y-6">
        {/* Progress breadcrumb */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
              ✓
            </div>
            <span>Study Design</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              2
            </div>
            <span className="font-medium text-foreground">Research Question</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">What is your research question?</h2>
          <p className="text-muted-foreground">Choose the analysis for repeated measures</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OptionCard
            title="Community Composition Over Time"
            description="Does community composition change over time/conditions? (Repeated Measures PERMANOVA)"
            onClick={() => onTestSelected('repeated-microbiome')}
          />
          <OptionCard
            title="Diversity Changes"
            description="Does alpha diversity change over time? (Repeated Measures ANOVA)"
            onClick={() => onTestSelected('repeated')}
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDesignType(null)}
          className="w-full"
        >
          ← Back to design selection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress breadcrumb */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
            ✓
          </div>
          <span>Study Design</span>
        </div>
        <span className="text-muted-foreground">→</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            2
          </div>
          <span className="font-medium text-foreground">Research Question</span>
        </div>
      </div>

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
          title="Specific Taxa Differences"
          description="Which taxa are differentially abundant? (DESeq2/edgeR)"
          onClick={() => onTestSelected('deseq')}
        />
        <OptionCard
          title="Rare Taxa Analysis"
          description="Detecting rare taxa with many zeros (Zero-Inflated models)"
          onClick={() => onTestSelected('zinb')}
        />
        <OptionCard
          title="Diversity Comparison"
          description="Does alpha diversity differ between groups? (One-way ANOVA)"
          onClick={() => onTestSelected('oneway')}
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDesignType(null)}
        className="w-full"
      >
        ← Back to design selection
      </Button>
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
