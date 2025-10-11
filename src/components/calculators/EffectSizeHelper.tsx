import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cohensD, cohensF, cohensW } from '@/utils/powerCalculations';
import { Calculator, Lightbulb, BookOpen } from 'lucide-react';
import EffectSizeGuidance from '../EffectSizeGuidance';

const EffectSizeHelper = () => {
  // Cohen's d calculator
  const [mean1, setMean1] = useState<string>('');
  const [mean2, setMean2] = useState<string>('');
  const [sd, setSd] = useState<string>('');
  const [dResult, setDResult] = useState<number | null>(null);

  // Cohen's f calculator
  const [groupMeans, setGroupMeans] = useState<string>('');
  const [sdF, setSdF] = useState<string>('');
  const [fResult, setFResult] = useState<number | null>(null);

  // Cohen's w calculator
  const [observed, setObserved] = useState<string>('');
  const [expected, setExpected] = useState<string>('');
  const [wResult, setWResult] = useState<number | null>(null);

  const calculateD = () => {
    const m1 = parseFloat(mean1);
    const m2 = parseFloat(mean2);
    const s = parseFloat(sd);
    if (!isNaN(m1) && !isNaN(m2) && !isNaN(s) && s > 0) {
      setDResult(cohensD(m1, m2, s));
    }
  };

  const calculateF = () => {
    const means = groupMeans.split(',').map(m => parseFloat(m.trim())).filter(m => !isNaN(m));
    const s = parseFloat(sdF);
    if (means.length >= 2 && !isNaN(s) && s > 0) {
      const overallMean = means.reduce((a, b) => a + b, 0) / means.length;
      setFResult(cohensF(means, overallMean, s));
    }
  };

  const calculateW = () => {
    const obs = observed.split(',').map(o => parseFloat(o.trim())).filter(o => !isNaN(o));
    const exp = expected.split(',').map(e => parseFloat(e.trim())).filter(e => !isNaN(e));
    if (obs.length === exp.length && obs.length > 0) {
      setWResult(cohensW(obs, exp));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-8">
        <h2 className="text-3xl font-bold mb-6">Effect Size Helper</h2>
        <p className="mb-6 text-muted-foreground">
          Calculate standardized effect sizes from your pilot data or expected values.
        </p>

        <Card className="p-4 bg-accent/20 mb-6 border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Pilot Study Guide</p>
              <p className="text-muted-foreground">
                Even small pilot studies (5-10 per group) can provide valuable effect size estimates. 
                Enter your pilot data below to calculate effect size, then use it in the power calculators 
                to determine your final sample size. Visit the <strong>Effect Library</strong> tab for published examples.
              </p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="cohens-d" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cohens-d">Cohen's d</TabsTrigger>
            <TabsTrigger value="cohens-f">Cohen's f</TabsTrigger>
            <TabsTrigger value="cohens-w">Cohen's w</TabsTrigger>
          </TabsList>

          <TabsContent value="cohens-d" className="space-y-6">
            <Card className="p-6 bg-secondary/30">
              <h3 className="font-bold text-lg mb-4">Cohen's d (t-test)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For comparing two group means. Formula: d = |μ₁ - μ₂| / σ
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mean1">Group 1 Mean</Label>
                  <Input
                    id="mean1"
                    type="number"
                    value={mean1}
                    onChange={(e) => setMean1(e.target.value)}
                    placeholder="e.g., 25.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mean2">Group 2 Mean</Label>
                  <Input
                    id="mean2"
                    type="number"
                    value={mean2}
                    onChange={(e) => setMean2(e.target.value)}
                    placeholder="e.g., 30.2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sd">Pooled SD</Label>
                  <Input
                    id="sd"
                    type="number"
                    value={sd}
                    onChange={(e) => setSd(e.target.value)}
                    placeholder="e.g., 5.3"
                  />
                </div>
              </div>

              <Button onClick={calculateD} className="mt-4 w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Cohen's d
              </Button>

              {dResult !== null && (
                <Card className="mt-4 p-6 bg-primary text-primary-foreground text-center">
                  <p className="text-lg">
                    Cohen's d = <strong className="text-2xl">{dResult.toFixed(3)}</strong>
                  </p>
                  <p className="mt-2 text-sm opacity-90">
                    {dResult < 0.2 ? 'Very Small' : dResult < 0.5 ? 'Small' : dResult < 0.8 ? 'Medium' : 'Large'} effect size
                  </p>
                </Card>
              )}

              <div className="mt-4">
                <EffectSizeGuidance effectType="cohens-d" />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="cohens-f" className="space-y-6">
            <Card className="p-6 bg-secondary/30">
              <h3 className="font-bold text-lg mb-4">Cohen's f (ANOVA)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For comparing multiple group means. Formula: f = σ_means / σ_pooled
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupMeans">Group Means (comma-separated)</Label>
                  <Input
                    id="groupMeans"
                    type="text"
                    value={groupMeans}
                    onChange={(e) => setGroupMeans(e.target.value)}
                    placeholder="e.g., 20, 25, 30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sdF">Pooled Standard Deviation</Label>
                  <Input
                    id="sdF"
                    type="number"
                    value={sdF}
                    onChange={(e) => setSdF(e.target.value)}
                    placeholder="e.g., 5.5"
                  />
                </div>
              </div>

              <Button onClick={calculateF} className="mt-4 w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Cohen's f
              </Button>

              {fResult !== null && (
                <Card className="mt-4 p-6 bg-primary text-primary-foreground text-center">
                  <p className="text-lg">
                    Cohen's f = <strong className="text-2xl">{fResult.toFixed(3)}</strong>
                  </p>
                  <p className="mt-2 text-sm opacity-90">
                    {fResult < 0.1 ? 'Very Small' : fResult < 0.25 ? 'Small' : fResult < 0.4 ? 'Medium' : 'Large'} effect size
                  </p>
                </Card>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="cohens-w" className="space-y-6">
            <Card className="p-6 bg-secondary/30">
              <h3 className="font-bold text-lg mb-4">Cohen's w (Chi-Square)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For categorical data. Formula: w = √(χ² / N)
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="observed">Observed Frequencies (comma-separated)</Label>
                  <Input
                    id="observed"
                    type="text"
                    value={observed}
                    onChange={(e) => setObserved(e.target.value)}
                    placeholder="e.g., 30, 45, 25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected">Expected Frequencies (comma-separated)</Label>
                  <Input
                    id="expected"
                    type="text"
                    value={expected}
                    onChange={(e) => setExpected(e.target.value)}
                    placeholder="e.g., 33, 33, 33"
                  />
                </div>
              </div>

              <Button onClick={calculateW} className="mt-4 w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Cohen's w
              </Button>

              {wResult !== null && (
                <Card className="mt-4 p-6 bg-primary text-primary-foreground text-center">
                  <p className="text-lg">
                    Cohen's w = <strong className="text-2xl">{wResult.toFixed(3)}</strong>
                  </p>
                  <p className="mt-2 text-sm opacity-90">
                    {wResult < 0.1 ? 'Very Small' : wResult < 0.3 ? 'Small' : wResult < 0.5 ? 'Medium' : 'Large'} effect size
                  </p>
                </Card>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6 p-6 bg-secondary/30 border-l-4 border-accent">
          <h3 className="font-bold text-lg mb-3">Effect Size Interpretation</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Cohen's d (t-test)</h4>
              <ul className="space-y-1">
                <li>Small: 0.2</li>
                <li>Medium: 0.5</li>
                <li>Large: 0.8</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Cohen's f (ANOVA)</h4>
              <ul className="space-y-1">
                <li>Small: 0.1</li>
                <li>Medium: 0.25</li>
                <li>Large: 0.4</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Cohen's w (χ²)</h4>
              <ul className="space-y-1">
                <li>Small: 0.1</li>
                <li>Medium: 0.3</li>
                <li>Large: 0.5</li>
              </ul>
            </div>
          </div>
        </Card>
      </Card>
    </div>
  );
};

export default EffectSizeHelper;
