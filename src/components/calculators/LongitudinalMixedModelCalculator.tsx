import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ControlSlider from '@/components/ControlSlider';
import SimplePowerChart from '@/components/SimplePowerChart';
import TimelineVisualization from '@/components/TimelineVisualization';
import { calculateLMMPower, calculateRequiredSampleSizeLMM } from '@/utils/microbiomePowerCalculations';
import { AlertCircle, TrendingUp, Clock, Info, Download, Code2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';

const LongitudinalMixedModelCalculator = () => {
  const { toast } = useToast();
  const [nSubjects, setNSubjects] = useState(30);
  const [nTimepoints, setNTimepoints] = useState(4);
  const [effectSize, setEffectSize] = useState(0.25);
  const [withinCorr, setWithinCorr] = useState(0.6);
  const [randomSlopeVar, setRandomSlopeVar] = useState(0.3);
  const [nCovariates, setNCovariates] = useState(0);
  const [dropoutRate, setDropoutRate] = useState(0.1);
  const [alpha, setAlpha] = useState(0.05);

  const power = calculateLMMPower(nSubjects, nTimepoints, effectSize, withinCorr, randomSlopeVar, nCovariates, dropoutRate, alpha);
  const requiredN = calculateRequiredSampleSizeLMM(0.8, nTimepoints, effectSize, withinCorr, randomSlopeVar, nCovariates, dropoutRate, alpha);

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'lmm-microbiome',
      parameters: { nSubjects, nTimepoints, effectSize, withinCorr, randomSlopeVar, nCovariates, dropoutRate, alpha }
    });
    downloadRFile(rCode, 'lmm_microbiome_power.R');
    toast({ title: "R code exported", description: "Data downloaded successfully" });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'lmm-microbiome',
      parameters: { nSubjects, nTimepoints, effectSize, withinCorr, randomSlopeVar, nCovariates, dropoutRate, alpha }
    });
    const success = await copyToClipboard(rCode);
    if (success) {
      toast({ title: "Copied to clipboard", description: "R code ready to paste" });
    } else {
      toast({ title: "Error", description: "Failed to copy R code", variant: "destructive" });
    }
  };

  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'antibiotic':
        setNSubjects(25);
        setNTimepoints(3);
        setEffectSize(0.4);
        setWithinCorr(0.8);
        setDropoutRate(0.05);
        toast({ title: "Preset applied", description: "Antibiotic trial preset" });
        break;
      case 'diet':
        setNSubjects(40);
        setNTimepoints(6);
        setEffectSize(0.25);
        setWithinCorr(0.6);
        setDropoutRate(0.15);
        toast({ title: "Preset applied", description: "Diet intervention preset" });
        break;
      case 'disease':
        setNSubjects(50);
        setNTimepoints(10);
        setEffectSize(0.2);
        setWithinCorr(0.4);
        setDropoutRate(0.20);
        toast({ title: "Preset applied", description: "Disease progression preset" });
        break;
    }
  };

  const generatePowerCurve = () => {
    return Array.from({ length: 30 }, (_, i) => {
      const subjects = (i + 1) * 3;
      return {
        x: subjects,
        y: calculateLMMPower(subjects, nTimepoints, effectSize, withinCorr, randomSlopeVar, nCovariates, dropoutRate, alpha),
      };
    });
  };

  const getPowerInterpretation = () => {
    if (power >= 0.8) return { color: 'text-green-600', icon: TrendingUp, message: 'Excellent power' };
    if (power >= 0.6) return { color: 'text-yellow-600', icon: AlertCircle, message: 'Moderate power' };
    return { color: 'text-red-600', icon: AlertCircle, message: 'Low power' };
  };

  const interpretation = getPowerInterpretation();
  const Icon = interpretation.icon;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Longitudinal Mixed Model Power Analysis
            </h2>
            <p className="text-muted-foreground">
              Calculate power for complex longitudinal microbiome studies with covariates, 
              random effects, and missing data. More flexible than repeated measures PERMANOVA.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Quick Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => applyPreset('antibiotic')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Antibiotic Trial</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              3 timepoints, high correlation
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('diet')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Diet Intervention</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              6 timepoints, moderate correlation
            </div>
          </Button>
          <Button variant="outline" onClick={() => applyPreset('disease')} className="h-auto py-3 flex-col items-start">
            <div className="font-semibold">Disease Progression</div>
            <div className="text-xs text-muted-foreground text-left mt-1">
              10 timepoints, low correlation
            </div>
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
        <h2 className="text-2xl font-bold mb-4">Power Analysis</h2>
        
        <div className="grid md:grid-cols-[1fr_2fr] gap-6">
          {/* Left Column: Study Parameters */}
          <Card className="p-4 bg-background">
            <h3 className="font-semibold mb-4">Study Parameters</h3>
            <div className="space-y-6">
              <ControlSlider
                id="nsubjects"
                label="Number of Subjects"
                value={nSubjects}
                min={10}
                max={200}
                step={5}
                onChange={setNSubjects}
                decimals={0}
                tooltip="Total subjects across all groups"
              />
              
              <ControlSlider
                id="ntimepoints"
                label="Timepoints per Subject"
                value={nTimepoints}
                min={2}
                max={10}
                step={1}
                onChange={setNTimepoints}
                decimals={0}
                tooltip="Number of measurements per subject"
              />

              <ControlSlider
                id="effectsize"
                label="Effect Size (Cohen's f)"
                value={effectSize}
                min={0.1}
                max={1.0}
                step={0.05}
                onChange={setEffectSize}
                tooltip="Time × treatment interaction effect. 0.1=small, 0.25=medium, 0.4=large"
              />

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                <strong>Effect Size Guide:</strong>
                <ul className="mt-1 ml-4 list-disc space-y-1">
                  <li>0.1: Small effect</li>
                  <li>0.25: Medium effect</li>
                  <li>0.4+: Large effect</li>
                  <li>Current: {effectSize >= 0.4 ? 'Large' : effectSize >= 0.25 ? 'Medium' : 'Small'}</li>
                </ul>
              </div>

              <ControlSlider
                id="withincorr"
                label="Within-Subject Correlation"
                value={withinCorr}
                min={0}
                max={0.95}
                step={0.05}
                onChange={setWithinCorr}
                tooltip="How correlated are repeated measures within subjects? 0.6-0.8 typical for microbiome"
              />

              <ControlSlider
                id="randomslope"
                label="Random Slope Variance"
                value={randomSlopeVar}
                min={0}
                max={1.0}
                step={0.1}
                onChange={setRandomSlopeVar}
                tooltip="How much do individual trajectories vary? 0=parallel, 1=highly variable"
              />

              <ControlSlider
                id="dropoutrate"
                label="Dropout Rate per Timepoint"
                value={dropoutRate}
                min={0}
                max={0.3}
                step={0.05}
                onChange={setDropoutRate}
                tooltip="Proportion of subjects lost at each timepoint"
              />

              <div className="space-y-3">
                <label className="text-sm font-medium">Number of Covariates</label>
                <Select value={nCovariates.toString()} onValueChange={(v) => setNCovariates(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    <SelectItem value="1">1 covariate</SelectItem>
                    <SelectItem value="2">2 covariates</SelectItem>
                    <SelectItem value="3">3+ covariates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ControlSlider
                id="alpha"
                label="Significance Level (α)"
                value={alpha}
                min={0.01}
                max={0.10}
                step={0.01}
                onChange={setAlpha}
              />
            </div>
          </Card>

          {/* Right Column: Results */}
          <div className="space-y-4">
            <Card className="p-4 bg-background">
              <div className="flex items-start gap-4 mb-4">
                <Icon className={`h-8 w-8 ${interpretation.color}`} />
                <div>
                  <h3 className="text-2xl font-bold">
                    Statistical Power: {(power * 100).toFixed(1)}%
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (approximation)
                    </span>
                  </h3>
                  <p className={`text-sm ${interpretation.color}`}>{interpretation.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Current Subjects</div>
                  <div className="text-2xl font-bold">{nSubjects}</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">For 80% Power</div>
                  <div className="text-2xl font-bold">{requiredN} subjects</div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Study Design Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total timepoints:</span>
                    <span className="font-semibold">{nTimepoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total measurements:</span>
                    <span className="font-semibold">{nSubjects * nTimepoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected final N:</span>
                    <span className="font-semibold">{Math.round(nSubjects * Math.pow(1 - dropoutRate, nTimepoints - 1))}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Power Curve</h3>
              <SimplePowerChart
                data={generatePowerCurve()}
                currentValue={nSubjects}
                xLabel="Number of Subjects"
                title="Power vs Sample Size"
              />
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Timeline & Retention</h3>
              <TimelineVisualization
                nTimepoints={nTimepoints}
                dropoutRate={dropoutRate}
              />
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Export R Code
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Generate R code to replicate this analysis using nlme/lme4
              </p>
              <div className="space-y-2">
                <Button onClick={exportToR} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download R Script
                </Button>
                <Button onClick={copyRCode} variant="outline" className="w-full">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      {/* Educational Content */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="when-to-use">
          <AccordionTrigger>When to Use LMM</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Complex longitudinal design with covariates</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Missing data or irregular sampling intervals</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Individual trajectories vary (random slopes needed)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Want to model continuous time effects</span>
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="comparison">
          <AccordionTrigger>LMM vs RM-PERMANOVA</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Use LMM when:</strong> You have covariates, missing data, or need to model individual trajectories. LMM is more flexible but requires assumptions about the covariance structure.
                </AlertDescription>
              </Alert>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Use RM-PERMANOVA when:</strong> You have complete balanced data and want a non-parametric test. Simpler but less flexible than LMM.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="missing-data">
          <AccordionTrigger>Handling Missing Data</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Missing at Random (MAR):</strong> LMM handles this well using maximum likelihood. No need to impute or remove subjects with missing timepoints.
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Missing Not at Random (MNAR):</strong> If dropout is related to outcomes, standard LMM may be biased. Consider pattern-mixture models or sensitivity analyses.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="software">
          <AccordionTrigger>Recommended Software</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• lme4 package in R (lmer function)</li>
              <li>• nlme package in R for complex covariance structures</li>
              <li>• SAS PROC MIXED for comprehensive LMM analysis</li>
              <li>• Python statsmodels.MixedLM for mixed models</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="approximation">
          <AccordionTrigger>Understanding LMM Power Approximations</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Why approximations?</strong> Exact power for LMM with random slopes,
                  unequal spacing, and dropout requires simulation. This calculator provides
                  a <em>rough estimate</em> using a design effect approach.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <p><strong>When approximation is adequate:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Balanced design with equal timepoints</li>
                  <li>Compound symmetry correlation</li>
                  <li>Small random slope variance (&lt;0.3)</li>
                  <li>Low dropout (&lt;15%)</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <p><strong>When simulation is required:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Large random slope variance (&gt;0.5)</li>
                  <li>High dropout (&gt;20%)</li>
                  <li>Irregular measurement intervals</li>
                  <li>Multiple nested random effects</li>
                </ul>
              </div>
              
              <Alert className="bg-primary/5 border-primary/20">
                <AlertDescription>
                  <strong>Recommended workflow:</strong> Use this calculator for quick
                  planning, then validate with R simulation (export button above) before
                  finalizing your sample size.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default LongitudinalMixedModelCalculator;
