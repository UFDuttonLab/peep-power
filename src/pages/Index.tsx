import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TTestCalculator from '@/components/calculators/TTestCalculator';
import OneWayAnovaCalculator from '@/components/calculators/OneWayAnovaCalculator';
import TwoWayAnovaCalculator from '@/components/calculators/TwoWayAnovaCalculator';
import RepeatedMeasuresCalculator from '@/components/calculators/RepeatedMeasuresCalculator';
import CorrelationCalculator from '@/components/calculators/CorrelationCalculator';
import ChiSquareCalculator from '@/components/calculators/ChiSquareCalculator';
import MicrobiomeCalculator from '@/components/calculators/MicrobiomeCalculator';
import EffectSizeHelper from '@/components/calculators/EffectSizeHelper';
import EffectSizeLibrary from '@/components/calculators/EffectSizeLibrary';
import ReplicationChecker from '@/components/calculators/ReplicationChecker';
import AboutHelp from '@/components/calculators/AboutHelp';
import { MinimumDetectableEffectCalculator } from '@/components/calculators/MinimumDetectableEffectCalculator';
import { NestedAnovaCalculator } from '@/components/calculators/NestedAnovaCalculator';
import { Leaf } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b-4 border-accent">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Leaf className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Ecological Power Analysis Toolkit</h1>
          </div>
          <p className="text-lg opacity-90 max-w-3xl mx-auto">
            A tool for planning field studies, grant proposals, and experimental designs 
            with a focus on real ecological research scenarios
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="ttest" className="w-full">
          <TabsList className="flex flex-wrap gap-2 w-full bg-secondary p-3 pb-5 min-h-[100px] justify-start items-start">
            <TabsTrigger value="ttest" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[100px]">
              t-test
            </TabsTrigger>
            <TabsTrigger value="oneway" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[120px]">
              One-Way ANOVA
            </TabsTrigger>
            <TabsTrigger value="twoway" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[120px]">
              Two-Way ANOVA
            </TabsTrigger>
            <TabsTrigger value="repeated" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[120px]">
              Repeated Measures
            </TabsTrigger>
            <TabsTrigger value="correlation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[100px]">
              Correlation
            </TabsTrigger>
            <TabsTrigger value="chisquare" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[100px]">
              Chi-Square
            </TabsTrigger>
            <TabsTrigger value="microbiome" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[160px]">
              Microbiome & Community
            </TabsTrigger>
            <TabsTrigger value="nested" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[120px]">
              Nested/Hierarchical
            </TabsTrigger>
            <TabsTrigger value="mde" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[100px]">
              MDE / Sample Size
            </TabsTrigger>
            <TabsTrigger value="effect" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[100px]">
              Effect Size
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[110px]">
              Effect Library
            </TabsTrigger>
            <TabsTrigger value="replication" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[100px]">
              Replication
            </TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-normal text-center min-w-[100px]">
              About/Help
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

          <TabsContent value="microbiome" className="mt-6">
            <MicrobiomeCalculator />
          </TabsContent>

          <TabsContent value="nested" className="mt-6">
            <NestedAnovaCalculator />
          </TabsContent>

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

          <TabsContent value="about" className="mt-6">
            <AboutHelp />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-foreground border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} UF Dutton Lab | Statistical Power Analysis for Ecological Research
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
