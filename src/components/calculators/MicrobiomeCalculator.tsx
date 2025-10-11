import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dna, BookOpen, Lightbulb, FlaskConical, TrendingUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ControlSlider from '@/components/ControlSlider';
import SimplePowerChart from '@/components/SimplePowerChart';
import BetaDiversityVisualizer from '@/components/BetaDiversityVisualizer';
import EffectSizeConversionGuide from '@/components/EffectSizeConversionGuide';
import { calculatePERMANOVAPower, calculateTTestPower } from '@/utils/powerCalculations';

const MicrobiomeCalculator = () => {
  // PERMANOVA calculator state
  const [nPerGroup, setNPerGroup] = useState(20);
  const [groups, setGroups] = useState(2);
  const [rSquared, setRSquared] = useState(0.08);
  const [alpha, setAlpha] = useState(0.05);
  const [permanovaResult, setPermanovaResult] = useState<any>(null);

  // Alpha Diversity calculator state
  const [alphaN, setAlphaN] = useState(30);
  const [alphaEffect, setAlphaEffect] = useState(0.5);
  const [alphaAlpha, setAlphaAlpha] = useState(0.05);
  const [alphaResult, setAlphaResult] = useState<any>(null);

  // Beta Diversity Visualizer state
  const [betaN, setBetaN] = useState(20);
  const [betaGroups, setBetaGroups] = useState(2);
  const [betaR2, setBetaR2] = useState(0.08);

  useEffect(() => {
    const res = calculatePERMANOVAPower(nPerGroup, groups, rSquared, alpha);
    setPermanovaResult(res);
  }, [nPerGroup, groups, rSquared, alpha]);

  useEffect(() => {
    const res = calculateTTestPower(alphaN, alphaEffect, alphaAlpha);
    setAlphaResult(res);
  }, [alphaN, alphaEffect, alphaAlpha]);

  const getPowerInterpretation = (power: number) => {
    if (power >= 0.8) return { text: 'Excellent', color: 'text-green-600 dark:text-green-400' };
    if (power >= 0.6) return { text: 'Good', color: 'text-yellow-600 dark:text-yellow-400' };
    return { text: 'Low', color: 'text-red-600 dark:text-red-400' };
  };

  return (
    <div className="space-y-6">
      {/* Introduction Alert */}
      <Alert variant="default" className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
        <Dna className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-lg">Microbiome & Community Data</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            If you have <strong>microbiome data</strong> (16S/ITS/18S amplicons, shotgun metagenomics), 
            <strong> metabarcoding</strong>, or <strong>multivariate community composition</strong> data, 
            standard power analysis methods (t-test, ANOVA) are <strong>not appropriate</strong>.
          </p>
          <p className="text-sm">
            <strong>Why?</strong> Microbiome data involve thousands of correlated variables (taxa), compositional constraints 
            (reads sum to a fixed total), zero-inflation, and sparsity. You need <strong>multivariate statistical approaches</strong>.
          </p>
        </AlertDescription>
      </Alert>

      {/* PERMANOVA Interactive Calculator */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          PERMANOVA Power Calculator
        </h2>
        
        <div className="grid md:grid-cols-[1fr_2fr] gap-6 mb-6">
          {/* Controls */}
          <Card className="p-4 bg-secondary/50">
            <h3 className="font-semibold mb-4">Study Parameters</h3>
            <div className="space-y-4">
              <ControlSlider
                id="permanova-n"
                label="Sample Size per Group"
                value={nPerGroup}
                min={5}
                max={100}
                step={1}
                onChange={setNPerGroup}
                decimals={0}
                tooltip="Number of biological replicates (independent samples) per treatment group"
              />
              
              <ControlSlider
                id="permanova-groups"
                label="Number of Groups"
                value={groups}
                min={2}
                max={6}
                step={1}
                onChange={setGroups}
                decimals={0}
                tooltip="Number of treatment groups or conditions to compare"
              />
              
              <ControlSlider
                id="permanova-rsq"
                label="R² Effect Size"
                value={rSquared}
                min={0.01}
                max={0.30}
                step={0.01}
                onChange={setRSquared}
                decimals={2}
                tooltip="Proportion of variance explained by your grouping variable. 0.02=small, 0.08=medium, 0.15=large"
              />
              
              <ControlSlider
                id="permanova-alpha"
                label="Alpha Level"
                value={alpha}
                min={0.01}
                max={0.10}
                step={0.01}
                onChange={setAlpha}
                decimals={2}
                tooltip="Significance level (Type I error rate). Typically 0.05"
              />
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {permanovaResult && (
              <>
                <Card className="p-4 bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Statistical Power</h3>
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`h-5 w-5 ${getPowerInterpretation(permanovaResult.power).color}`} />
                      <span className={`text-2xl font-bold ${getPowerInterpretation(permanovaResult.power).color}`}>
                        {(permanovaResult.power * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {getPowerInterpretation(permanovaResult.power).text} power to detect the specified effect
                  </p>
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: permanovaResult.summary }}
                  />
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Power Curve</h3>
                  <SimplePowerChart
                    data={permanovaResult.curveData}
                    currentValue={nPerGroup * groups}
                    xLabel="Total Sample Size (N)"
                    title="Power vs Sample Size"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    The curve shows how power changes with total sample size for the specified effect size (R²={rSquared.toFixed(2)})
                  </p>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Educational Content */}
        <div className="space-y-4 pt-4 border-t">
          <div>
            <h3 className="font-semibold text-lg mb-2">What is PERMANOVA?</h3>
            <p className="text-sm text-muted-foreground">
              <strong>Permutational Multivariate Analysis of Variance</strong> tests whether groups differ in their 
              multivariate centroids (e.g., microbial community composition) using distance matrices. 
              It's non-parametric and doesn't assume normality.
            </p>
          </div>

          <div className="bg-background/50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Effect Size: R² (Variance Explained)</h3>
            <p className="text-sm mb-3">
              In PERMANOVA, the effect size is <strong>R²</strong> (proportion of variance explained by your grouping variable).
            </p>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded font-mono text-xs">R² = 0.02</span>
                <span>Small effect (2% variance explained)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded font-mono text-xs">R² = 0.08</span>
                <span>Medium effect (8% variance explained)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded font-mono text-xs">R² = 0.15</span>
                <span>Large effect (15% variance explained)</span>
              </div>
            </div>
          </div>

          <Alert variant="default" className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-sm">Note on Accuracy</AlertTitle>
            <AlertDescription className="text-xs">
              This calculator uses an approximation based on the noncentral F-distribution. 
              Exact PERMANOVA power depends on your distance metric (Bray-Curtis, Jaccard, etc.) and data structure. 
              We recommend conducting a pilot study to validate these estimates.
            </AlertDescription>
          </Alert>
        </div>
      </Card>

      {/* Alpha Diversity Calculator */}
      <Card className="p-6 bg-secondary/20 border-2 border-secondary">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Alpha Diversity Power Calculator
        </h2>
        
        <Alert variant="default" className="mb-4 bg-background/50">
          <AlertDescription className="text-sm">
            Alpha diversity metrics (Shannon, Simpson, Observed Species) are <strong>univariate</strong>, 
            so standard t-test power analysis applies. This calculator uses the same math as the t-test calculator.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-[1fr_2fr] gap-6">
          {/* Controls */}
          <Card className="p-4 bg-secondary/50">
            <h3 className="font-semibold mb-4">Study Parameters</h3>
            <div className="space-y-4">
              <ControlSlider
                id="alpha-n"
                label="Sample Size per Group"
                value={alphaN}
                min={5}
                max={100}
                step={1}
                onChange={setAlphaN}
                decimals={0}
                tooltip="Number of biological replicates per group"
              />
              
              <ControlSlider
                id="alpha-effect"
                label="Cohen's d"
                value={alphaEffect}
                min={0.1}
                max={2.0}
                step={0.1}
                onChange={setAlphaEffect}
                decimals={1}
                tooltip="Effect size: d=0.2 (small), d=0.5 (medium), d=0.8 (large). Calculate as (mean difference) / (pooled SD)"
              />
              
              <ControlSlider
                id="alpha-alpha"
                label="Alpha Level"
                value={alphaAlpha}
                min={0.01}
                max={0.10}
                step={0.01}
                onChange={setAlphaAlpha}
                decimals={2}
                tooltip="Significance level (Type I error rate)"
              />
            </div>

            <div className="mt-4 p-3 bg-background/50 rounded-lg border">
              <h4 className="text-xs font-semibold mb-2">Preset Scenarios</h4>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setAlphaEffect(0.8)}
                  className="w-full text-left px-2 py-1 rounded hover:bg-secondary/50 transition-colors"
                >
                  <strong>Antibiotic treatment:</strong> d=0.8
                </button>
                <button
                  onClick={() => setAlphaEffect(0.5)}
                  className="w-full text-left px-2 py-1 rounded hover:bg-secondary/50 transition-colors"
                >
                  <strong>Diet change:</strong> d=0.5
                </button>
                <button
                  onClick={() => setAlphaEffect(0.3)}
                  className="w-full text-left px-2 py-1 rounded hover:bg-secondary/50 transition-colors"
                >
                  <strong>Probiotic supplement:</strong> d=0.3
                </button>
              </div>
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {alphaResult && (
              <>
                <Card className="p-4 bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Statistical Power</h3>
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`h-5 w-5 ${getPowerInterpretation(alphaResult.power).color}`} />
                      <span className={`text-2xl font-bold ${getPowerInterpretation(alphaResult.power).color}`}>
                        {(alphaResult.power * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {getPowerInterpretation(alphaResult.power).text} power for detecting changes in diversity
                  </p>
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: alphaResult.summary }}
                  />
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Power Curve</h3>
                  <SimplePowerChart
                    data={alphaResult.curveData}
                    currentValue={alphaN * 2}
                    xLabel="Total Sample Size (N)"
                    title="Power vs Sample Size"
                  />
                </Card>

                <div className="bg-background/50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">💡 Calculating Cohen's d for Alpha Diversity</h4>
                  <p className="text-xs text-muted-foreground">
                    Run a pilot study to measure the standard deviation of your diversity metric. 
                    Then: <strong>Cohen's d = (expected mean difference) / (pooled SD)</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Example: If Shannon diversity decreases from 3.5 to 3.0 (difference = 0.5) with SD = 0.8, 
                    then d = 0.5 / 0.8 = 0.625 (medium effect).
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Beta Diversity Visualizer */}
      <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-blue-500/10 border-2 border-purple-500/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          Beta Diversity Visualizer (NMDS Ordination)
        </h2>
        
        <Alert variant="default" className="mb-4 bg-background/50">
          <AlertDescription className="text-sm">
            This interactive visualization simulates an <strong>NMDS ordination plot</strong> to show how 
            sample size and effect size impact group separation. Confidence ellipses represent 
            95% confidence intervals around group centroids.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-[1fr_2fr] gap-6">
          {/* Controls */}
          <Card className="p-4 bg-secondary/50">
            <h3 className="font-semibold mb-4">Simulation Parameters</h3>
            <div className="space-y-4">
              <ControlSlider
                id="beta-n"
                label="Samples per Group"
                value={betaN}
                min={5}
                max={100}
                step={1}
                onChange={setBetaN}
                decimals={0}
                tooltip="Number of samples per group. More samples = tighter ellipses."
              />
              
              <ControlSlider
                id="beta-groups"
                label="Number of Groups"
                value={betaGroups}
                min={2}
                max={10}
                step={1}
                onChange={setBetaGroups}
                decimals={0}
                tooltip="Number of treatment groups to visualize"
              />
              
              <ControlSlider
                id="beta-r2"
                label="Effect Size (R²)"
                value={betaR2}
                min={0.01}
                max={0.60}
                step={0.01}
                onChange={setBetaR2}
                decimals={2}
                tooltip="Larger R² = more separation between groups in ordination space"
              />
            </div>
            
            <div className="mt-4 p-3 bg-background/50 rounded-lg border">
              <h4 className="text-xs font-semibold mb-2">💡 Interpretation Guide</h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• <strong>Overlapping ellipses:</strong> Groups are hard to distinguish</li>
                <li>• <strong>Separated ellipses:</strong> Clear differences between groups</li>
                <li>• <strong>Larger n:</strong> Tighter ellipses, more confidence</li>
                <li>• <strong>Higher R²:</strong> Greater centroid separation</li>
              </ul>
            </div>
          </Card>

          {/* Visualization */}
          <div className="space-y-4">
            <BetaDiversityVisualizer
              nPerGroup={betaN}
              groups={betaGroups}
              rSquared={betaR2}
            />
            
            <Card className="p-4 bg-background/50">
              <h4 className="font-semibold text-sm mb-2">About NMDS Ordination</h4>
              <p className="text-xs text-muted-foreground">
                Non-metric Multidimensional Scaling (NMDS) reduces high-dimensional microbiome data 
                to 2D while preserving rank-order distances between samples. This visualization 
                simulates how samples from different groups cluster in ordination space based on 
                your specified effect size and sample size.
              </p>
            </Card>
          </div>
        </div>
      </Card>

      {/* Other Multivariate Tests */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Other Multivariate Tests</h2>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="anosim">
            <AccordionTrigger className="text-left font-semibold">
              ANOSIM (Analysis of Similarities)
            </AccordionTrigger>
            <AccordionContent className="text-sm space-y-2">
              <p>
                <strong>Use Case:</strong> Tests whether groups differ in composition using rank-based permutations.
              </p>
              <p>
                <strong>Effect Size:</strong> R statistic (-1 to 1). R &gt; 0.75 = well separated, R &gt; 0.5 = separated, R &lt; 0.25 = barely separable.
              </p>
              <p className="font-mono text-xs bg-muted p-2 rounded">
                library(vegan)<br/>
                anosim(dist_matrix, grouping)
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="nmds">
            <AccordionTrigger className="text-left font-semibold">
              NMDS (Non-metric Multidimensional Scaling)
            </AccordionTrigger>
            <AccordionContent className="text-sm space-y-2">
              <p>
                <strong>Use Case:</strong> Ordination method for visualizing differences in community composition. 
                Use with envfit() to test environmental variable effects.
              </p>
              <p>
                <strong>Effect Size:</strong> R² from envfit (proportion of ordination variance explained by variable).
              </p>
              <p className="font-mono text-xs bg-muted p-2 rounded">
                library(vegan)<br/>
                nmds &lt;- metaMDS(community_matrix)<br/>
                envfit(nmds, environmental_vars, permutations = 999)
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dbrda">
            <AccordionTrigger className="text-left font-semibold">
              db-RDA (distance-based Redundancy Analysis)
            </AccordionTrigger>
            <AccordionContent className="text-sm space-y-2">
              <p>
                <strong>Use Case:</strong> Constrained ordination testing direct effects of predictor variables on community composition.
              </p>
              <p>
                <strong>Effect Size:</strong> Adjusted R² (variance explained by model after correction).
              </p>
              <p className="font-mono text-xs bg-muted p-2 rounded">
                library(vegan)<br/>
                dbrda(dist_matrix ~ treatment + site, data = metadata)
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="simper">
            <AccordionTrigger className="text-left font-semibold">
              SIMPER (Similarity Percentage Analysis)
            </AccordionTrigger>
            <AccordionContent className="text-sm space-y-2">
              <p>
                <strong>Use Case:</strong> Identifies which taxa contribute most to differences between groups.
              </p>
              <p>
                <strong>Output:</strong> Percentage contribution of each taxon to between-group dissimilarity.
              </p>
              <p className="font-mono text-xs bg-muted p-2 rounded">
                library(vegan)<br/>
                simper(community_matrix, grouping)
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Alpha Diversity Section */}
      <Card className="p-6 bg-secondary/20">
        <h2 className="text-xl font-bold mb-4">Alpha Diversity Tests</h2>
        <p className="text-sm mb-4">
          Alpha diversity metrics (Shannon, Simpson, Observed Species) are <strong>univariate</strong> measures. 
          You <strong>can</strong> use standard power analysis for these!
        </p>
        <div className="bg-background/50 p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Use Cohen's d for Alpha Diversity</h3>
          <p className="text-sm mb-2">
            If comparing Shannon diversity between two groups, use the <strong>t-test calculator</strong> with Cohen's d.
          </p>
          <p className="text-sm">
            If comparing across multiple groups, use the <strong>One-Way ANOVA calculator</strong> with Cohen's f.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            💡 <strong>Tip:</strong> Run a pilot study to estimate the standard deviation of your diversity metric, 
            then calculate Cohen's d = (mean difference) / (pooled SD).
          </p>
        </div>
      </Card>

      {/* Recommended Tools Section */}
      <Card className="p-6 border-l-4 border-accent">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent" />
          Recommended Tools & Packages
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">R Packages</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <code className="bg-muted px-2 py-1 rounded text-xs">micropower</code> - 
                <span className="ml-2">PERMANOVA power analysis for microbiome studies</span>
              </li>
              <li>
                <code className="bg-muted px-2 py-1 rounded text-xs">pwr2ppl</code> - 
                <span className="ml-2">Power analysis for multivariate designs</span>
              </li>
              <li>
                <code className="bg-muted px-2 py-1 rounded text-xs">vegan</code> - 
                <span className="ml-2">Community ecology analyses (PERMANOVA, ANOSIM, NMDS, db-RDA)</span>
              </li>
              <li>
                <code className="bg-muted px-2 py-1 rounded text-xs">phyloseq</code> - 
                <span className="ml-2">Microbiome data analysis and visualization</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Useful Resources</h3>
            <ul className="space-y-1 text-sm list-disc list-inside">
              <li><a href="https://github.com/cafferychen777/MicrobiomeStat" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">MicrobiomeStat R package</a></li>
              <li><a href="https://doi.org/10.1186/s40168-021-01034-9" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Kelly et al. (2015) - Power and sample size for microbiome studies</a></li>
              <li><a href="https://academic.oup.com/bioinformatics/article/38/3/877/6374994" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">La Rosa et al. (2012) - Sample size estimation for microbiome studies</a></li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Best Practices */}
      <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-2 border-accent/20">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          Best Practices for Microbiome Power Analysis
        </h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="font-bold text-primary">1.</span>
            <div>
              <strong>Run a Pilot Study:</strong> Collect 5-10 samples per group to estimate effect sizes (R²) and variability. 
              Microbiome data are highly variable; don't guess effect sizes.
            </div>
          </div>
          
          <div className="flex gap-3">
            <span className="font-bold text-primary">2.</span>
            <div>
              <strong>Sequencing Depth Matters:</strong> Ensure adequate sequencing depth (≥10,000 reads per sample for 16S, 
              ≥1M for shotgun). Rarefaction curves should plateau.
            </div>
          </div>
          
          <div className="flex gap-3">
            <span className="font-bold text-primary">3.</span>
            <div>
              <strong>Normalization:</strong> Use appropriate normalization (rarefaction, DESeq2, CSS) before analysis. 
              Different methods can affect power.
            </div>
          </div>
          
          <div className="flex gap-3">
            <span className="font-bold text-primary">4.</span>
            <div>
              <strong>Multiple Testing Correction:</strong> With thousands of taxa, use FDR (Benjamini-Hochberg) or 
              Bonferroni correction. This reduces power but controls false positives.
            </div>
          </div>
          
          <div className="flex gap-3">
            <span className="font-bold text-primary">5.</span>
            <div>
              <strong>Technical vs. Biological Replicates:</strong> Your sample size (n) is the number of 
              <strong> biological replicates</strong> (independent samples), NOT technical replicates (sequencing runs). 
              Average technical replicates first.
            </div>
          </div>
          
          <div className="flex gap-3">
            <span className="font-bold text-primary">6.</span>
            <div>
              <strong>Effect Sizes Are Often Small:</strong> In microbiome studies, R² of 0.05-0.10 is common for 
              treatment effects. Don't expect R² &gt; 0.20 unless you have extreme conditions.
            </div>
          </div>
          
          <div className="flex gap-3">
            <span className="font-bold text-primary">7.</span>
            <div>
              <strong>Stratify by Important Variables:</strong> Account for confounders (e.g., sequencing batch, sex, age) 
              in your design and analysis. Use blocked PERMANOVA if needed.
            </div>
          </div>
        </div>
      </Card>

      {/* Example Studies Card */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Example Microbiome Studies</h2>
        <p className="text-sm mb-4 text-muted-foreground">
          Typical R² values from published ecological microbiome studies:
        </p>
        
        <div className="space-y-3 text-sm">
          <div className="bg-secondary/30 p-3 rounded-lg">
            <div className="font-semibold">Gut Microbiome - Diet Intervention</div>
            <div className="text-xs text-muted-foreground">R² = 0.12 (medium-large), n = 30 per group</div>
            <div className="text-xs mt-1">High-fiber vs. control diet, 6-week intervention</div>
          </div>
          
          <div className="bg-secondary/30 p-3 rounded-lg">
            <div className="font-semibold">Soil Microbiome - Agricultural Treatment</div>
            <div className="text-xs text-muted-foreground">R² = 0.08 (medium), n = 25 plots per treatment</div>
            <div className="text-xs mt-1">Conventional vs. organic farming practices</div>
          </div>
          
          <div className="bg-secondary/30 p-3 rounded-lg">
            <div className="font-semibold">Marine Microbiome - Pollution Gradient</div>
            <div className="text-xs text-muted-foreground">R² = 0.18 (large), n = 15 sites</div>
            <div className="text-xs mt-1">Pristine vs. polluted coastal waters</div>
          </div>
          
          <div className="bg-secondary/30 p-3 rounded-lg">
            <div className="font-semibold">Plant Microbiome - Disease Status</div>
            <div className="text-xs text-muted-foreground">R² = 0.06 (small-medium), n = 40 plants per group</div>
            <div className="text-xs mt-1">Healthy vs. diseased leaf endophytes</div>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          💡 <strong>Note:</strong> These are examples only. Your effect size will depend on your specific system, 
          treatment strength, and natural variability.
        </p>
      </Card>
    </div>
  );
};

export default MicrobiomeCalculator;
