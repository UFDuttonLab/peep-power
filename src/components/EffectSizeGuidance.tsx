import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BookOpen, Database } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface EffectSizeGuidanceProps {
  effectType: 'cohens-d' | 'cohens-f' | 'cohens-w';
}

const EffectSizeGuidance = ({ effectType }: EffectSizeGuidanceProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const benchmarks = {
    'cohens-d': { small: 0.2, medium: 0.5, large: 0.8 },
    'cohens-f': { small: 0.1, medium: 0.25, large: 0.4 },
    'cohens-w': { small: 0.1, medium: 0.3, large: 0.5 }
  };

  const examples = {
    'cohens-d': [
      'Restoration vs. control species richness: ~0.5-0.7',
      'Pollution impact on macroinvertebrates: ~0.8-1.0',
      'Temperature effects on fish growth: ~0.4-0.6'
    ],
    'cohens-f': [
      'Nutrient enrichment on productivity (3 levels): ~0.3-0.4',
      'Fire management on plant community: ~0.4-0.5',
      'Grazing intensity on vegetation: ~0.3-0.5'
    ],
    'cohens-w': [
      'Habitat preference in birds: ~0.3-0.5',
      'Sex ratio deviations: ~0.2-0.4',
      'Species distribution patterns: ~0.3-0.6'
    ]
  };

  const currentBenchmarks = benchmarks[effectType];
  const currentExamples = examples[effectType];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-accent/20 border-l-4 border-primary">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center p-4 hover:bg-accent/30"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <span className="font-semibold">How do I choose the right effect size?</span>
            </div>
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Use pilot data or published studies (BEST)</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Calculate effect size from your own preliminary data or similar studies in the literature. 
                Visit the <strong>Effect Size Library</strong> tab for examples from published ecology papers.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Use Cohen's benchmarks (when no data available)</h4>
              <div className="bg-background p-3 rounded text-sm">
                <p className="font-medium mb-1">Standard benchmarks:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Small: {currentBenchmarks.small} (subtle effect, may need large sample)</li>
                  <li>• Medium: {currentBenchmarks.medium} (moderate effect, typical in ecology)</li>
                  <li>• Large: {currentBenchmarks.large} (strong effect, easier to detect)</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Typical ecological effect sizes</h4>
              <div className="bg-background p-3 rounded text-sm">
                <ul className="space-y-1 text-muted-foreground">
                  {currentExamples.map((ex, idx) => (
                    <li key={idx}>• {ex}</li>
                  ))}
                </ul>
              </div>
            </div>

            <Card className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500">
              <p className="text-sm">
                <strong>Conservative approach:</strong> When uncertain, choose a smaller effect size. 
                This ensures your study will have adequate power even if the true effect is modest. 
                It's better to be slightly overpowered than underpowered.
              </p>
            </Card>

            <div className="flex gap-2 text-sm">
              <Database className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-muted-foreground">
                <strong>Pro tip:</strong> Search for meta-analyses in your research area—they often 
                report mean effect sizes across multiple studies.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default EffectSizeGuidance;
