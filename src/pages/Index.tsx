import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TTestCalculator from '@/components/calculators/TTestCalculator';
import OneWayAnovaCalculator from '@/components/calculators/OneWayAnovaCalculator';
import TwoWayAnovaCalculator from '@/components/calculators/TwoWayAnovaCalculator';
import RepeatedMeasuresCalculator from '@/components/calculators/RepeatedMeasuresCalculator';
import CorrelationCalculator from '@/components/calculators/CorrelationCalculator';
import ChiSquareCalculator from '@/components/calculators/ChiSquareCalculator';
import EffectSizeHelper from '@/components/calculators/EffectSizeHelper';
import AboutHelp from '@/components/calculators/AboutHelp';
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
            A professional tool for planning field studies, grant proposals, and experimental designs 
            with a focus on real ecological research scenarios
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="ttest" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 w-full bg-secondary rounded-lg p-1 mb-8">
            <TabsTrigger value="ttest" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              t-test
            </TabsTrigger>
            <TabsTrigger value="oneway" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              One-Way ANOVA
            </TabsTrigger>
            <TabsTrigger value="twoway" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Two-Way ANOVA
            </TabsTrigger>
            <TabsTrigger value="repeated" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Repeated Measures
            </TabsTrigger>
            <TabsTrigger value="correlation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Correlation
            </TabsTrigger>
            <TabsTrigger value="chisquare" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Chi-Square
            </TabsTrigger>
            <TabsTrigger value="effect" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Effect Size
            </TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              About/Help
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ttest" className="mt-0">
            <TTestCalculator />
          </TabsContent>

          <TabsContent value="oneway" className="mt-0">
            <OneWayAnovaCalculator />
          </TabsContent>

          <TabsContent value="twoway" className="mt-0">
            <TwoWayAnovaCalculator />
          </TabsContent>

          <TabsContent value="repeated" className="mt-0">
            <RepeatedMeasuresCalculator />
          </TabsContent>

          <TabsContent value="correlation" className="mt-0">
            <CorrelationCalculator />
          </TabsContent>

          <TabsContent value="chisquare" className="mt-0">
            <ChiSquareCalculator />
          </TabsContent>

          <TabsContent value="effect" className="mt-0">
            <EffectSizeHelper />
          </TabsContent>

          <TabsContent value="about" className="mt-0">
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
          <p className="text-sm text-muted-foreground mt-1">
            Built for researchers, by researchers
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
