import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ControlSlider from '@/components/ControlSlider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, TrendingUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { elicitPrior, PriorElicitationResult } from '@/utils/bayesianPowerCalculations';

export const PriorElicitationTool = () => {
  const [method, setMethod] = useState<'quantile' | 'literature' | 'bounds'>('quantile');
  
  // Quantile method states
  const [lowerValue, setLowerValue] = useState(0.2);
  const [lowerPercentile, setLowerPercentile] = useState(10);
  const [upperValue, setUpperValue] = useState(0.6);
  const [upperPercentile, setUpperPercentile] = useState(90);
  
  // Literature method states
  const [literatureInput, setLiteratureInput] = useState('');
  
  // Bounds method states
  const [pessimistic, setPessimistic] = useState(0.2);
  const [mostLikely, setMostLikely] = useState(0.5);
  const [optimistic, setOptimistic] = useState(0.8);
  
  const [prior, setPrior] = useState<PriorElicitationResult | null>(null);
  const [priorMethod, setPriorMethod] = useState<'quantile' | 'literature' | 'bounds'>('quantile');

  const runElicitation = (input: Parameters<typeof elicitPrior>[0]) => {
    try {
      setPrior(elicitPrior(input));
      setPriorMethod(input.method);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not calculate the prior from these inputs');
    }
  };
  
  const calculatePriorFromQuantiles = () => {
    runElicitation({
      method: 'quantile',
      lowerQuantile: { value: lowerValue, percentile: lowerPercentile },
      upperQuantile: { value: upperValue, percentile: upperPercentile }
    });
  };
  
  const calculatePriorFromLiterature = () => {
    // Parse literature input (comma or newline separated numbers)
    const effects = literatureInput
      .split(/[,\n]/)
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n) && n > 0);
    
    if (effects.length < 2) {
      alert('Please enter at least two valid effect sizes (comma or newline separated)');
      return;
    }
    
    runElicitation({
      method: 'literature',
      publishedEffects: effects
    });
  };
  
  const calculatePriorFromBounds = () => {
    runElicitation({
      method: 'bounds',
      pessimisticEffect: pessimistic,
      mostLikely: mostLikely,
      optimisticEffect: optimistic
    });
  };
  
  return (
    <div className="space-y-6">
      <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-500">
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          <strong>Prior Elicitation Tool</strong>: Translate your expert knowledge into a 
          statistical prior distribution for Bayesian analysis. This helps you formalize what 
          you believe about effect sizes before collecting data.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Method</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={method} onValueChange={(v: any) => setMethod(v)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quantile">Quantile Method</TabsTrigger>
                <TabsTrigger value="literature">Literature Review</TabsTrigger>
                <TabsTrigger value="bounds">Optimistic/Pessimistic</TabsTrigger>
              </TabsList>
              
              <TabsContent value="quantile" className="space-y-4 mt-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Specify two percentiles of your belief distribution. For example: "I'm 90% confident 
                  the effect is between 0.2 and 0.6"
                </div>
                
                <ControlSlider
                  id="lower-value"
                  label="Lower Bound Effect Size"
                  value={lowerValue}
                  onChange={setLowerValue}
                  min={0}
                  max={2}
                  step={0.05}
                />
                
                <ControlSlider
                  id="lower-percentile"
                  label="Lower Percentile (%)"
                  value={lowerPercentile}
                  onChange={setLowerPercentile}
                  min={1}
                  max={50}
                  step={1}
                  decimals={0}
                  tooltip="E.g., 10th percentile = 'I'm 90% sure the effect is above this value'"
                />
                
                <ControlSlider
                  id="upper-value"
                  label="Upper Bound Effect Size"
                  value={upperValue}
                  onChange={setUpperValue}
                  min={0}
                  max={2}
                  step={0.05}
                />
                
                <ControlSlider
                  id="upper-percentile"
                  label="Upper Percentile (%)"
                  value={upperPercentile}
                  onChange={setUpperPercentile}
                  min={50}
                  max={99}
                  step={1}
                  decimals={0}
                  tooltip="E.g., 90th percentile = 'I'm 90% sure the effect is below this value'"
                />
                
                <Button onClick={calculatePriorFromQuantiles} className="w-full">
                  Calculate Prior Distribution
                </Button>
                
                <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                  <strong>Example:</strong> "I'm {100-lowerPercentile}% confident the effect is above {lowerValue.toFixed(2)}, 
                  and {upperPercentile}% confident it's below {upperValue.toFixed(2)}."
                </div>
              </TabsContent>
              
              <TabsContent value="literature" className="space-y-4 mt-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Enter effect sizes from published studies (one per line or comma-separated). 
                  The tool will create a meta-analytic prior.
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Published Effect Sizes</label>
                  <Textarea
                    value={literatureInput}
                    onChange={(e) => setLiteratureInput(e.target.value)}
                    placeholder="Enter effect sizes, e.g.:&#10;0.45&#10;0.62&#10;0.38&#10;0.71"
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="text-xs text-muted-foreground">
                    Enter Cohen's d or r values from previous studies
                  </div>
                </div>
                
                <Button onClick={calculatePriorFromLiterature} className="w-full">
                  Calculate Meta-Analytic Prior
                </Button>
                
                <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                  <strong>Example:</strong> If you found 5 papers reporting effect sizes of 0.4, 0.5, 0.6, 0.7, and 0.3, 
                  the tool will calculate mean = 0.5 and SD based on the variation between studies.
                </div>
              </TabsContent>
              
              <TabsContent value="bounds" className="space-y-4 mt-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Specify optimistic, most likely, and pessimistic effect sizes. 
                  Uses PERT distribution to create a realistic prior.
                </div>
                
                <ControlSlider
                  id="pessimistic"
                  label="Pessimistic Scenario (Worst Case)"
                  value={pessimistic}
                  onChange={setPessimistic}
                  min={0}
                  max={2}
                  step={0.05}
                  tooltip="Smallest effect size you think is plausible"
                />
                
                <ControlSlider
                  id="most-likely"
                  label="Most Likely Scenario"
                  value={mostLikely}
                  onChange={setMostLikely}
                  min={0}
                  max={2}
                  step={0.05}
                  tooltip="Your best guess for the effect size"
                />
                
                <ControlSlider
                  id="optimistic"
                  label="Optimistic Scenario (Best Case)"
                  value={optimistic}
                  onChange={setOptimistic}
                  min={0}
                  max={2}
                  step={0.05}
                  tooltip="Largest effect size you think is plausible"
                />
                
                <Button onClick={calculatePriorFromBounds} className="w-full">
                  Calculate Prior from Scenarios
                </Button>
                
                <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                  <strong>Example:</strong> Pessimistic: coral growth differs by 10% (d={pessimistic.toFixed(2)}), 
                  Most likely: 30% difference (d={mostLikely.toFixed(2)}), 
                  Optimistic: 50% difference (d={optimistic.toFixed(2)})
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {prior && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Prior Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-primary/5 rounded-lg border-2 border-primary mb-4">
                  <div className="text-lg font-semibold mb-2">
                    {prior.distribution === 'normal' && 'mean' in prior.parameters && (priorMethod === 'bounds' ? 'PERT distribution, Normal approximation: ' : '') + `Normal(μ=${prior.parameters.mean.toFixed(2)}, σ=${prior.parameters.sd.toFixed(2)})`}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div><strong>Median:</strong> {prior.summaryStats.median.toFixed(2)}</div>
                    <div><strong>Mode (Most Likely):</strong> {prior.summaryStats.mode.toFixed(2)}</div>
                    <div><strong>95% Credible Interval:</strong> [{prior.summaryStats.ci95[0].toFixed(2)}, {prior.summaryStats.ci95[1].toFixed(2)}]</div>
                  </div>
                </div>
                
                {/* Visualization of prior distribution */}
                {prior.densityCurve.length > 0 && (
                  <div className="h-48 relative">
                    <svg width="100%" height="192" className="border rounded bg-muted/30">
                      {/* Axes */}
                      <line x1="40" y1="170" x2="100%" y2="170" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                      <line x1="40" y1="10" x2="40" y2="170" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                      
                      {/* Distribution curve */}
                      <path
                        d={prior.densityCurve.map((d, i) => {
                          const x = 40 + (i / prior.densityCurve.length) * 300;
                          const maxY = Math.max(...prior.densityCurve.map(p => p.y));
                          const y = 170 - (d.y / maxY) * 150;
                          return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                        }).join(' ')}
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        fill="hsl(var(--primary))"
                        fillOpacity="0.2"
                      />
                      
                      {/* Labels */}
                      <text x="50%" y="185" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">
                        Effect Size
                      </text>
                      <text x="15" y="90" fontSize="10" fill="currentColor" opacity="0.6" transform="rotate(-90, 15, 90)">
                        Probability Density
                      </text>
                    </svg>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-500">
              <TrendingUp className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Next Steps:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Use these parameters {'mean' in prior.parameters && `(μ=${prior.parameters.mean.toFixed(2)}, σ=${prior.parameters.sd.toFixed(2)})`} in the Bayesian Assurance Calculator</li>
                  <li>If your prior seems too wide or narrow, adjust your inputs and recalculate</li>
                  <li>Consider sensitivity analysis: try pessimistic and optimistic priors</li>
                  <li>Document your prior elicitation process for research transparency</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
      
      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-500">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Tips for Prior Elicitation:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Be honest:</strong> Your prior should reflect genuine uncertainty, not wishful thinking</li>
            <li><strong>Use domain expertise:</strong> Consult with colleagues or review literature to inform your beliefs</li>
            <li><strong>Consider multiple scenarios:</strong> Try pessimistic, realistic, and optimistic priors</li>
            <li><strong>Test your prior:</strong> Ask yourself "Would I be surprised if the true effect was X?" for various X values</li>
            <li><strong>Document everything:</strong> Record how you arrived at your prior for research transparency</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PriorElicitationTool;
