import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TTestCalculator from '@/components/calculators/TTestCalculator';
import OneWayAnovaCalculator from '@/components/calculators/OneWayAnovaCalculator';
import TwoWayAnovaCalculator from '@/components/calculators/TwoWayAnovaCalculator';
import RepeatedMeasuresCalculator from '@/components/calculators/RepeatedMeasuresCalculator';
import CorrelationCalculator from '@/components/calculators/CorrelationCalculator';
import ChiSquareCalculator from '@/components/calculators/ChiSquareCalculator';
import MicrobiomeCalculator from '@/components/calculators/MicrobiomeCalculator';
import RepeatedMeasuresMicrobiomeCalculator from '@/components/calculators/RepeatedMeasuresMicrobiomeCalculator';
import DifferentialAbundanceCalculator from '@/components/calculators/DifferentialAbundanceCalculator';
import ZeroInflatedCalculator from '@/components/calculators/ZeroInflatedCalculator';
import LongitudinalMixedModelCalculator from '@/components/calculators/LongitudinalMixedModelCalculator';
import EffectSizeHelper from '@/components/calculators/EffectSizeHelper';
import EffectSizeLibrary from '@/components/calculators/EffectSizeLibrary';
import ReplicationChecker from '@/components/calculators/ReplicationChecker';
import AboutHelp from '@/components/calculators/AboutHelp';
import { MinimumDetectableEffectCalculator } from '@/components/calculators/MinimumDetectableEffectCalculator';
import { NestedAnovaCalculator } from '@/components/calculators/NestedAnovaCalculator';
import HoldMyHandCalculator from '@/components/calculators/HoldMyHandCalculator';
import BayesianAssuranceCalculator from '@/components/calculators/BayesianAssuranceCalculator';
import PriorElicitationTool from '@/components/calculators/PriorElicitationTool';
import BayesianSequentialCalculator from '@/components/calculators/BayesianSequentialCalculator';
import BayesianReplicationCalculator from '@/components/calculators/BayesianReplicationCalculator';
import BayesianInformationDesignCalculator from '@/components/calculators/BayesianInformationDesignCalculator';
import BayesianHierarchicalCalculator from '@/components/calculators/BayesianHierarchicalCalculator';
import BayesianAdaptiveAllocationCalculator from '@/components/calculators/BayesianAdaptiveAllocationCalculator';
import BayesianEquivalenceCalculator from '@/components/calculators/BayesianEquivalenceCalculator';
import BayesianModelComparisonCalculator from '@/components/calculators/BayesianModelComparisonCalculator';
import BayesianCalibrationCalculator from '@/components/calculators/BayesianCalibrationCalculator';
import BayesianMicrobiomePERMANOVACalculator from '@/components/calculators/BayesianMicrobiomePERMANOVACalculator';
import BayesianDifferentialAbundanceCalculator from '@/components/calculators/BayesianDifferentialAbundanceCalculator';
import BayesianLongitudinalMicrobiomeCalculator from '@/components/calculators/BayesianLongitudinalMicrobiomeCalculator';
import { Brain, Lightbulb, FlaskConical, Dna, Wrench, HelpCircle, HandHeart } from 'lucide-react';
import { TestType } from '@/components/wizard/wizardConfig';
import peepImage from '@/assets/peep.png';

const Index = () => {
  const [categoryTab, setCategoryTab] = useState('start');
  const [activeTab, setActiveTab] = useState('wizard');

  const handleNavigateToCalculator = (testType: TestType) => {
    // Map test types to their categories
    const categoryMap: Record<string, string> = {
      'ttest': 'stats',
      'oneway': 'stats',
      'twoway': 'stats',
      'repeated': 'stats',
      'correlation': 'stats',
      'chisquare': 'stats',
      'nested': 'stats',
      'microbiome': 'microbiome',
      'repeated-microbiome': 'microbiome',
      'deseq': 'microbiome',
      'zinb': 'microbiome',
      'lmm-microbiome': 'microbiome',
    };
    
    const category = categoryMap[testType];
    if (category) {
      setCategoryTab(category);
    }
    setActiveTab(testType);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b-4 border-accent">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img 
              src={peepImage} 
              alt="PEEP mascot - cute chick with calculator" 
              className="h-12 w-12 object-contain"
            />
            <h1 className="text-4xl font-bold">PEEP - Power Estimator for Ecological Planning</h1>
          </div>
          <p className="text-lg opacity-90 max-w-3xl mx-auto">
            Your friendly companion for sample size calculations, power analysis, and experimental design
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Category Level Tabs */}
        <Tabs value={categoryTab} onValueChange={setCategoryTab} className="w-full">
          <TabsList className="flex flex-wrap gap-2 w-full bg-secondary p-3 mb-4 justify-center">
            <TabsTrigger 
              value="start" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[140px] font-semibold"
            >
              <HandHeart className="inline h-4 w-4 mr-2" />
              Get Started
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[140px]"
            >
              <FlaskConical className="inline h-4 w-4 mr-2" />
              Statistical Tests
            </TabsTrigger>
            <TabsTrigger 
              value="microbiome" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[140px]"
            >
              <Dna className="inline h-4 w-4 mr-2" />
              Microbiome
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[140px]"
            >
              <Wrench className="inline h-4 w-4 mr-2" />
              Planning Tools
            </TabsTrigger>
            <TabsTrigger 
              value="bayesian" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[140px]"
            >
              <Brain className="inline h-4 w-4 mr-2" />
              Bayesian
            </TabsTrigger>
            <TabsTrigger 
              value="about" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[100px]"
            >
              <HelpCircle className="inline h-4 w-4 mr-2" />
              About
            </TabsTrigger>
          </TabsList>

          {/* Get Started Category */}
          <TabsContent value="start" className="mt-0">
            <HoldMyHandCalculator onNavigateToCalculator={handleNavigateToCalculator} />
          </TabsContent>

          {/* Statistical Tests Category */}
          <TabsContent value="stats" className="mt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex flex-wrap gap-2 w-full bg-muted p-2 mb-4 justify-start">
                <TabsTrigger value="ttest" className="data-[state=active]:bg-background">
                  t-test
                </TabsTrigger>
                <TabsTrigger value="oneway" className="data-[state=active]:bg-background">
                  One-Way ANOVA
                </TabsTrigger>
                <TabsTrigger value="twoway" className="data-[state=active]:bg-background">
                  Two-Way ANOVA
                </TabsTrigger>
                <TabsTrigger value="repeated" className="data-[state=active]:bg-background">
                  Repeated Measures
                </TabsTrigger>
                <TabsTrigger value="correlation" className="data-[state=active]:bg-background">
                  Correlation
                </TabsTrigger>
                <TabsTrigger value="chisquare" className="data-[state=active]:bg-background">
                  Chi-Square
                </TabsTrigger>
                <TabsTrigger value="nested" className="data-[state=active]:bg-background">
                  Nested/Hierarchical
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ttest" className="mt-6">
                <TTestCalculator />
              </TabsContent>
              <TabsContent value="oneway" className="mt-6">
                <OneWayAnovaCalculator />
              </TabsContent>
              <TabsContent value="twoway" className="mt-6">
                <TwoWayAnovaCalculator />
              </TabsContent>
              <TabsContent value="repeated" className="mt-6">
                <RepeatedMeasuresCalculator />
              </TabsContent>
              <TabsContent value="correlation" className="mt-6">
                <CorrelationCalculator />
              </TabsContent>
              <TabsContent value="chisquare" className="mt-6">
                <ChiSquareCalculator />
              </TabsContent>
              <TabsContent value="nested" className="mt-6">
                <NestedAnovaCalculator />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Microbiome Category */}
          <TabsContent value="microbiome" className="mt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
               <TabsList className="flex flex-wrap gap-2 w-full bg-muted p-2 mb-4 justify-start">
                <TabsTrigger value="microbiome" className="data-[state=active]:bg-background">
                  Independent Samples
                </TabsTrigger>
                <TabsTrigger value="repeated-microbiome" className="data-[state=active]:bg-background">
                  Repeated Measures
                </TabsTrigger>
                <TabsTrigger value="deseq" className="data-[state=active]:bg-background">
                  Differential Abundance
                </TabsTrigger>
                <TabsTrigger value="zinb" className="data-[state=active]:bg-background">
                  Zero-Inflated
                </TabsTrigger>
                <TabsTrigger value="lmm-microbiome" className="data-[state=active]:bg-background">
                  Longitudinal (LMM)
                </TabsTrigger>
                <TabsTrigger value="bayesian-permanova" className="data-[state=active]:bg-background">
                  Bayesian PERMANOVA
                </TabsTrigger>
                <TabsTrigger value="bayesian-deseq" className="data-[state=active]:bg-background">
                  Bayesian DESeq
                </TabsTrigger>
                <TabsTrigger value="bayesian-lmm" className="data-[state=active]:bg-background">
                  Bayesian LMM
                </TabsTrigger>
              </TabsList>

              <TabsContent value="microbiome" className="mt-6">
                <MicrobiomeCalculator />
              </TabsContent>
              <TabsContent value="repeated-microbiome" className="mt-6">
                <RepeatedMeasuresMicrobiomeCalculator />
              </TabsContent>
              <TabsContent value="deseq" className="mt-6">
                <DifferentialAbundanceCalculator />
              </TabsContent>
              <TabsContent value="zinb" className="mt-6">
                <ZeroInflatedCalculator />
              </TabsContent>
              <TabsContent value="lmm-microbiome" className="mt-6">
                <LongitudinalMixedModelCalculator />
              </TabsContent>
              <TabsContent value="bayesian-permanova" className="mt-6">
                <BayesianMicrobiomePERMANOVACalculator />
              </TabsContent>
              <TabsContent value="bayesian-deseq" className="mt-6">
                <BayesianDifferentialAbundanceCalculator />
              </TabsContent>
              <TabsContent value="bayesian-lmm" className="mt-6">
                <BayesianLongitudinalMicrobiomeCalculator />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Planning Tools Category */}
          <TabsContent value="tools" className="mt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex flex-wrap gap-2 w-full bg-muted p-2 mb-4 justify-start">
                <TabsTrigger value="mde" className="data-[state=active]:bg-background">
                  MDE / Sample Size
                </TabsTrigger>
                <TabsTrigger value="effect" className="data-[state=active]:bg-background">
                  Effect Size Calculator
                </TabsTrigger>
                <TabsTrigger value="library" className="data-[state=active]:bg-background">
                  Effect Library
                </TabsTrigger>
                <TabsTrigger value="replication" className="data-[state=active]:bg-background">
                  Replication Checker
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mde" className="mt-6">
                <MinimumDetectableEffectCalculator />
              </TabsContent>
              <TabsContent value="effect" className="mt-6">
                <EffectSizeHelper />
              </TabsContent>
              <TabsContent value="library" className="mt-6">
                <EffectSizeLibrary />
              </TabsContent>
              <TabsContent value="replication" className="mt-6">
                <ReplicationChecker />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Bayesian Category */}
          <TabsContent value="bayesian" className="mt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex flex-wrap gap-2 w-full bg-muted p-2 mb-4 justify-start">
                <TabsTrigger value="bayesian-assurance" className="data-[state=active]:bg-background">Assurance</TabsTrigger>
                <TabsTrigger value="prior-elicitation" className="data-[state=active]:bg-background">Prior Elicitation</TabsTrigger>
                <TabsTrigger value="sequential" className="data-[state=active]:bg-background">Sequential</TabsTrigger>
                <TabsTrigger value="replication" className="data-[state=active]:bg-background">Replication</TabsTrigger>
                <TabsTrigger value="information" className="data-[state=active]:bg-background">Information Design</TabsTrigger>
                <TabsTrigger value="hierarchical" className="data-[state=active]:bg-background">Hierarchical</TabsTrigger>
                <TabsTrigger value="adaptive" className="data-[state=active]:bg-background">Adaptive</TabsTrigger>
                <TabsTrigger value="equivalence" className="data-[state=active]:bg-background">Equivalence</TabsTrigger>
                <TabsTrigger value="model-comparison" className="data-[state=active]:bg-background">Model Comparison</TabsTrigger>
                <TabsTrigger value="calibration" className="data-[state=active]:bg-background">Calibration</TabsTrigger>
              </TabsList>

              <TabsContent value="bayesian-assurance" className="mt-6">
                <BayesianAssuranceCalculator />
              </TabsContent>
              <TabsContent value="prior-elicitation" className="mt-6">
                <PriorElicitationTool />
              </TabsContent>
              <TabsContent value="sequential" className="mt-6">
                <BayesianSequentialCalculator />
              </TabsContent>
              <TabsContent value="replication" className="mt-6">
                <BayesianReplicationCalculator />
              </TabsContent>
              <TabsContent value="information" className="mt-6">
                <BayesianInformationDesignCalculator />
              </TabsContent>
              <TabsContent value="hierarchical" className="mt-6">
                <BayesianHierarchicalCalculator />
              </TabsContent>
              <TabsContent value="adaptive" className="mt-6">
                <BayesianAdaptiveAllocationCalculator />
              </TabsContent>
              <TabsContent value="equivalence" className="mt-6">
                <BayesianEquivalenceCalculator />
              </TabsContent>
              <TabsContent value="model-comparison" className="mt-6">
                <BayesianModelComparisonCalculator />
              </TabsContent>
              <TabsContent value="calibration" className="mt-6">
                <BayesianCalibrationCalculator />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* About Category */}
          <TabsContent value="about" className="mt-0">
            <AboutHelp />
          </TabsContent>
        </Tabs>

      </main>

      {/* Footer */}
      <footer className="bg-secondary text-foreground border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm">
            Developed by{' '}
            <a 
              href="https://ufduttonlab.github.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Dutton Lab @ UF
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
