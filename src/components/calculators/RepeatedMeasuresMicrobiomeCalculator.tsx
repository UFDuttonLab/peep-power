import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dna, TrendingUp, Lightbulb, Download, Code2, Copy } from 'lucide-react';
import { generateRCode, downloadRFile, copyToClipboard } from '@/utils/rCodeExport';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ControlSlider from '@/components/ControlSlider';
import SimplePowerChart from '@/components/SimplePowerChart';
import { calculateRepeatedMeasuresPERMANOVAPower } from '@/utils/powerCalculations';
import { Button } from '@/components/ui/button';
import FormulaDisplay from '@/components/FormulaDisplay';
import { FORMULAS } from '@/constants/formulaDefinitions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const RepeatedMeasuresMicrobiomeCalculator = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState(25);
  const [timepoints, setTimepoints] = useState(2);
  const [rSquared, setRSquared] = useState(0.10);
  const [correlation, setCorrelation] = useState(0.5);
  const [alpha, setAlpha] = useState(0.05);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const res = calculateRepeatedMeasuresPERMANOVAPower(
      subjects,
      timepoints,
      rSquared,
      correlation,
      alpha
    );
    setResult(res);
  }, [subjects, timepoints, rSquared, correlation, alpha]);

  const handlePreset = (value: string) => {
    switch (value) {
      case 'beforeafter':
        setSubjects(30);
        setTimepoints(2);
        setRSquared(0.10);
        setCorrelation(0.5);
        break;
      case 'seasonal':
        setSubjects(25);
        setTimepoints(4);
        setRSquared(0.08);
        setCorrelation(0.6);
        break;
      case 'weekly':
        setSubjects(20);
        setTimepoints(8);
        setRSquared(0.12);
        setCorrelation(0.7);
        break;
    }
  };

  const exportResults = () => {
    if (!result) return;
    const csv = [
      ['Subjects', 'Power'],
      ...result.curveData.map((d: any) => [d.x, d.y]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'repeated-measures-permanova-power.csv';
    a.click();
  };

  const exportToR = () => {
    const rCode = generateRCode({
      testType: 'repeated-permanova',
      parameters: { subjects, timepoints, rSquared, correlation, alpha }
    });
    downloadRFile(rCode, 'repeated_permanova_power_analysis.R');
    toast({
      title: "R code exported",
      description: "You can now run this analysis in R/RStudio",
    });
  };

  const copyRCode = async () => {
    const rCode = generateRCode({
      testType: 'repeated-permanova',
      parameters: { subjects, timepoints, rSquared, correlation, alpha }
    });
    const success = await copyToClipboard(rCode);
    if (success) {
      toast({
        title: "Copied to clipboard",
        description: "R code is ready to paste into RStudio",
      });
    }
  };

  const getPowerInterpretation = (power: number) => {
    if (power >= 0.8) return { text: 'Excellent', color: 'text-green-600 dark:text-green-400' };
    if (power >= 0.6) return { text: 'Moderate', color: 'text-yellow-600 dark:text-yellow-400' };
    return { text: 'Low', color: 'text-red-600 dark:text-red-400' };
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Alert className="border-primary bg-primary/5">
        <Dna className="h-5 w-5 text-primary" />
        <AlertTitle className="text-lg">Repeated Measures Microbiome Power Analysis</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            Use this calculator for microbiome studies with <strong>repeated measurements</strong> on the same subjects 
            (e.g., before/after treatment, longitudinal sampling, crossover designs).
          </p>
          <p className="text-sm">
            <strong>Critical:</strong> Your true sample size is the number of <strong>independent subjects</strong>, 
            not total samples. Repeated measures leverage within-subject correlation to increase power.
          </p>
        </AlertDescription>
      </Alert>

      {/* Main Calculator */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
        <div className="grid md:grid-cols-[1fr_2fr] gap-6">
          {/* Controls */}
          <Card className="p-4 bg-background">
            <h3 className="font-semibold mb-4">Study Parameters</h3>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Preset Scenarios</label>
                <Select onValueChange={handlePreset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Load a preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beforeafter">Before/After Treatment</SelectItem>
                    <SelectItem value="seasonal">Seasonal Monitoring</SelectItem>
                    <SelectItem value="weekly">Weekly Sampling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <ControlSlider
                id="rm-subjects"
                label="Number of Subjects"
                value={subjects}
                min={5}
                max={100}
                step={1}
                onChange={setSubjects}
                decimals={0}
                tooltip="Independent subjects/units sampled repeatedly. This is your TRUE sample size."
              />
              
              <ControlSlider
                id="rm-timepoints"
                label="Number of Timepoints"
                value={timepoints}
                min={2}
                max={10}
                step={1}
                onChange={setTimepoints}
                decimals={0}
                tooltip="Repeated measurements per subject (e.g., 2 for before/after, 4 for seasonal)"
              />
              
              <ControlSlider
                id="rm-rsq"
                label="Effect Size (R²)"
                value={rSquared}
                min={0.01}
                max={0.30}
                step={0.01}
                onChange={setRSquared}
                decimals={2}
                tooltip="Proportion of variance explained by time/treatment. 0.02=small, 0.08=medium, 0.15=large"
              />

              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRSquared(0.02)}
                  className="text-xs"
                >
                  Small (0.02)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRSquared(0.08)}
                  className="text-xs"
                >
                  Medium (0.08)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRSquared(0.15)}
                  className="text-xs"
                >
                  Large (0.15)
                </Button>
              </div>
              
              <ControlSlider
                id="rm-correlation"
                label="Within-Subject Correlation"
                value={correlation}
                min={0.1}
                max={0.9}
                step={0.05}
                onChange={setCorrelation}
                decimals={2}
                tooltip="Expected correlation between repeated measures. Higher correlation = more power."
              />
              
              <ControlSlider
                id="rm-alpha"
                label="Alpha Level"
                value={alpha}
                min={0.01}
                max={0.10}
                step={0.01}
                onChange={setAlpha}
                decimals={2}
                tooltip="Significance level (Type I error rate)"
              />
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {result && (
              <>
                <Card className="p-4 bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Statistical Power</h3>
                      <FormulaDisplay formula={FORMULAS.REPEATED_MEASURES_MICROBIOME} buttonVariant="ghost" />
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`h-5 w-5 ${getPowerInterpretation(result.power).color}`} />
                      <span className={`text-2xl font-bold ${getPowerInterpretation(result.power).color}`}>
                        {(result.power * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {getPowerInterpretation(result.power).text} power to detect the specified effect
                  </p>
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: result.summary }}
                  />
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Power Curve</h3>
                  <SimplePowerChart
                    data={result.curveData}
                    currentValue={subjects}
                    xLabel="Number of Subjects"
                    title="Power vs Number of Subjects"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Shows how power changes with the number of subjects for R²={rSquared.toFixed(2)} and {timepoints} timepoints
                  </p>
                </Card>

                <Card className="p-4 bg-muted/50">
                  <h4 className="font-semibold text-sm mb-2">Study Design Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Independent Subjects:</span>
                      <span className="font-bold ml-2">{subjects}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timepoints:</span>
                      <span className="font-bold ml-2">{timepoints}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Measurements:</span>
                      <span className="font-bold ml-2">{subjects * timepoints}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Degrees of Freedom:</span>
                      <span className="font-bold ml-2">{timepoints - 1}, {(subjects - 1) * (timepoints - 1)}</span>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={exportResults} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                  <Button onClick={exportToR} variant="outline" size="sm">
                    <Code2 className="h-4 w-4 mr-1" />
                    R Code
                  </Button>
                  <Button onClick={copyRCode} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Educational Content */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="what">
          <AccordionTrigger className="text-lg font-semibold">
            What is Repeated Measures PERMANOVA?
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm">
            <p>
              <strong>Repeated Measures PERMANOVA</strong> tests whether community composition changes over 
              time or conditions within the same subjects. It's the multivariate equivalent of repeated measures ANOVA.
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-semibold mb-1">When to use:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Paired designs (before/after treatment)</li>
                <li>Longitudinal studies (multiple timepoints)</li>
                <li>Crossover trials (same subjects, different conditions)</li>
                <li>Time series in microbiome research</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Example:</strong> "Does gut microbiome composition change after antibiotic treatment in 30 patients 
              (measured before and after)?" Here, n=30 subjects (not 60 samples).
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="difference">
          <AccordionTrigger className="text-lg font-semibold">
            How is this different from independent PERMANOVA?
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <p className="font-semibold mb-2 text-red-600 dark:text-red-400">Independent PERMANOVA</p>
                <ul className="text-xs space-y-1">
                  <li>• Different subjects in each group</li>
                  <li>• Higher sample size needed</li>
                  <li>• No correlation benefit</li>
                  <li>• Example: 40 healthy vs 40 diseased individuals</li>
                </ul>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <p className="font-semibold mb-2 text-green-600 dark:text-green-400">Repeated Measures PERMANOVA</p>
                <ul className="text-xs space-y-1">
                  <li>• Same subjects measured multiple times</li>
                  <li>• Lower subject count needed</li>
                  <li>• Leverages within-subject correlation</li>
                  <li>• Example: 40 individuals before & after treatment</li>
                </ul>
              </div>
            </div>
            <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200">
              <AlertDescription className="text-xs">
                <strong>Critical distinction:</strong> With 20 subjects at 3 timepoints, your sample size is <strong>n=20</strong> 
                (not 60). Treating repeated measures as independent inflates Type I error rates!
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="correlation">
          <AccordionTrigger className="text-lg font-semibold">
            Understanding Within-Subject Correlation
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm">
            <p>
              <strong>Within-subject correlation (r)</strong> measures how similar repeated measurements are on the same subject. 
              Higher correlation means more stable baseline communities, which gives you more power.
            </p>
            <div className="space-y-2">
              <div className="bg-muted p-3 rounded-lg">
                <span className="font-mono font-bold">r = 0.3</span> — <strong>Low correlation</strong>
                <p className="text-xs text-muted-foreground mt-1">
                  Highly variable individuals. Samples from the same person are barely more similar than samples from different people.
                </p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <span className="font-mono font-bold">r = 0.5</span> — <strong>Moderate correlation</strong> (default)
                <p className="text-xs text-muted-foreground mt-1">
                  Typical for microbiome studies. Individuals have recognizable baseline patterns but some variability.
                </p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <span className="font-mono font-bold">r = 0.7</span> — <strong>High correlation</strong>
                <p className="text-xs text-muted-foreground mt-1">
                  Very stable communities. Each person has a distinct, consistent microbial signature over time.
                </p>
              </div>
            </div>
            <p className="text-xs">
              <strong>Impact on power:</strong> Higher correlation = more power with fewer subjects. Going from r=0.3 to r=0.7 
              can reduce required subjects by 30-40%.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="effectsize">
          <AccordionTrigger className="text-lg font-semibold">
            Effect Size (R²) Guidance for Repeated Measures
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm">
            <p>
              In repeated measures PERMANOVA, R² represents the proportion of <strong>temporal variance</strong> 
              explained by your time/treatment variable.
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold">R² = 0.02</span>
                  <span className="text-xs text-muted-foreground">Small effect</span>
                </div>
                <p className="text-xs">Subtle shifts. May require 50+ subjects to detect.</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold">R² = 0.08</span>
                  <span className="text-xs text-muted-foreground">Medium effect</span>
                </div>
                <p className="text-xs">Moderate changes. Typical for dietary interventions. ~25-30 subjects needed.</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold">R² = 0.15-0.30</span>
                  <span className="text-xs text-muted-foreground">Large effect</span>
                </div>
                <p className="text-xs">Major shifts. Antibiotics, disease states. ~15-20 subjects may suffice.</p>
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-semibold mb-2">Examples from literature:</p>
              <ul className="text-xs space-y-1">
                <li>• <strong>Antibiotic treatment:</strong> R² = 0.15-0.30 (large shift)</li>
                <li>• <strong>Dietary intervention:</strong> R² = 0.08-0.15 (medium effect)</li>
                <li>• <strong>Probiotic supplementation:</strong> R² = 0.03-0.08 (small-medium)</li>
                <li>• <strong>Seasonal changes (environmental):</strong> R² = 0.08-0.12</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pitfalls">
          <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            Common Pitfalls & Best Practices
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm">
            <Alert variant="destructive">
              <AlertTitle className="text-sm">❌ WRONG: Pseudoreplication</AlertTitle>
              <AlertDescription className="text-xs">
                "I have 20 subjects × 3 timepoints = 60 samples, so n=60" — <strong>NO!</strong> Your true sample 
                size is 20 subjects. Repeated measures are not independent samples.
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200">
              <AlertTitle className="text-sm">✓ RIGHT: Account for Non-Independence</AlertTitle>
              <AlertDescription className="text-xs">
                "I have 20 independent subjects measured at 3 timepoints. I'll use repeated measures PERMANOVA 
                with n=20 subjects."
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-3 rounded-lg">
              <p className="font-semibold mb-2">Additional considerations:</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li><strong>Missing data:</strong> Plan for 10-20% attrition in longitudinal studies</li>
                <li><strong>Time spacing:</strong> Ensure timepoints are far enough apart to capture meaningful change</li>
                <li><strong>Baseline variability:</strong> More variable baselines require more subjects</li>
                <li><strong>Sphericity:</strong> This calculator assumes compound symmetry (equal correlations between all timepoint pairs)</li>
                <li><strong>Pilot data:</strong> Use pilot studies to estimate within-subject correlation</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default RepeatedMeasuresMicrobiomeCalculator;
