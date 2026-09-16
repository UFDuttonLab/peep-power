import { Card } from '@/components/ui/card';
import { BookOpen, GraduationCap, FlaskConical, Github, AlertTriangle, CheckCircle2, Dna } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EFFECT_SIZE_INTERPRETATIONS } from '@/constants/effectSizeConstants';
import { EFFECT_SIZE_LIBRARY } from '@/data/effectSizeLibrary';

const MICROBIOME_R2 = EFFECT_SIZE_LIBRARY.filter((e) => e.effectType === 'R² (PERMANOVA)' && e.basis !== 'Correlational' && !e.wizard)
  .sort((x, y) => x.effectSize - y.effectSize);

const R2 = EFFECT_SIZE_INTERPRETATIONS.rSquared.benchmarks;
const pct = (v: number) => `${Math.round(v * 100)}%`;

const AboutHelp = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-8">
        <h2 className="text-3xl font-bold mb-6">About This Toolkit</h2>
        
        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Purpose</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              PEEP is designed to help researchers, students, and field biologists 
              determine the appropriate sample sizes for their studies. Statistical power analysis is critical for 
              designing effective experiments and avoiding underpowered studies that waste resources.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <FlaskConical className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">What is Statistical Power?</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Statistical power is the probability that your study will detect an effect when there truly is one. 
              A power of 80% (0.80) is generally considered the minimum acceptable level, meaning you have an 80% 
              chance of detecting a real effect.
            </p>
            <Card className="p-4 bg-accent/20">
              <p className="text-sm">
                <strong>Key Concept:</strong> Higher power = better chance of detecting real effects. Low power 
                increases the risk of missing important findings (Type II error).
              </p>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">How to Use This Tool</h3>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li><strong>Choose your statistical test</strong> from the tabs above</li>
              <li><strong>Adjust the parameters</strong> using the sliders (sample size, effect size, alpha)</li>
              <li><strong>Read the results</strong> showing your estimated statistical power</li>
              <li><strong>View the power curve</strong> to see how sample size affects power</li>
              <li><strong>Export your analysis</strong> for grant proposals or study protocols</li>
            </ol>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3">Which Test Should I Use?</h3>
            <p className="text-muted-foreground mb-4">
              Choosing the right statistical test is crucial for valid results. Use this guide to 
              select the appropriate analysis based on your research question and data structure.
            </p>

            <Card className="p-4 bg-primary/10 border-l-4 border-primary mb-4">
              <h4 className="font-semibold mb-3">Decision Framework: Ask These Questions</h4>
              <ol className="space-y-2 text-sm">
                <li><strong>1. What type of data do you have?</strong>
                  <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                    <li>• Continuous (measurements like weight, height, temperature) → t-test, ANOVA, correlation</li>
                    <li>• Categorical (counts or frequencies like alive/dead, species A/B/C) → Chi-square</li>
                  </ul>
                </li>
                <li><strong>2. How many groups or treatments?</strong>
                  <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                    <li>• Two groups (control vs. treatment) → t-test</li>
                    <li>• Three or more groups (multiple treatments) → One-Way ANOVA</li>
                    <li>• Testing a relationship (no groups) → Correlation</li>
                  </ul>
                </li>
                <li><strong>3. How many factors (independent variables)?</strong>
                  <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                    <li>• One factor → t-test or One-Way ANOVA</li>
                    <li>• Two factors (e.g., light AND nutrients) → Two-Way ANOVA</li>
                  </ul>
                </li>
                <li><strong>4. Are measurements independent or repeated?</strong>
                  <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                    <li>• Independent (different individuals/plots) → t-test or ANOVA</li>
                    <li>• Repeated on same units over time → Repeated Measures ANOVA</li>
                  </ul>
                </li>
              </ol>
            </Card>

            <h4 className="font-semibold mb-3">Common Ecological Scenarios</h4>
            <div className="space-y-3 mb-4">
              <Card className="p-3 bg-secondary/30">
                <p className="text-sm font-semibold mb-1">📊 "I want to compare pollinator visits between restored vs. unrestored prairie"</p>
                <p className="text-sm text-muted-foreground">→ <strong>t-test</strong> (2 groups, continuous data, independent samples)</p>
              </Card>
              <Card className="p-3 bg-secondary/30">
                <p className="text-sm font-semibold mb-1">📊 "Does water temperature predict coral growth rate?"</p>
                <p className="text-sm text-muted-foreground">→ <strong>Correlation</strong> (testing linear relationship between two continuous variables)</p>
              </Card>
              <Card className="p-3 bg-secondary/30">
                <p className="text-sm font-semibold mb-1">📊 "Compare plant height across 5 fertilizer treatments"</p>
                <p className="text-sm text-muted-foreground">→ <strong>One-Way ANOVA</strong> (3+ groups, one factor, continuous data)</p>
              </Card>
              <Card className="p-3 bg-secondary/30">
                <p className="text-sm font-semibold mb-1">📊 "Test effects of light (low/high) AND nutrients (low/high) on algal growth"</p>
                <p className="text-sm text-muted-foreground">→ <strong>Two-Way ANOVA</strong> (2 factors, tests main effects + interaction)</p>
              </Card>
              <Card className="p-3 bg-secondary/30">
                <p className="text-sm font-semibold mb-1">📊 "Track frog body mass monthly over 6 months"</p>
                <p className="text-sm text-muted-foreground">→ <strong>Repeated Measures ANOVA</strong> (same individuals measured multiple times)</p>
              </Card>
              <Card className="p-3 bg-secondary/30">
                <p className="text-sm font-semibold mb-1">📊 "Does nest success (yes/no) differ between 3 habitat types?"</p>
                <p className="text-sm text-muted-foreground">→ <strong>Chi-Square</strong> (categorical outcome, frequency data)</p>
              </Card>
            </div>

            <h4 className="font-semibold mb-3">Available Tests in This Toolkit</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">t-test</h4>
                <p className="text-sm text-muted-foreground mb-2">Compare means of two groups</p>
                <p className="text-xs text-muted-foreground"><strong>When:</strong> 2 independent groups, continuous data</p>
                <p className="text-xs text-muted-foreground"><strong>Example:</strong> Invaded vs. native sites</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">One-Way ANOVA</h4>
                <p className="text-sm text-muted-foreground mb-2">Compare means of 3+ groups</p>
                <p className="text-xs text-muted-foreground"><strong>When:</strong> 3+ groups, one factor</p>
                <p className="text-xs text-muted-foreground"><strong>Example:</strong> 4 restoration methods</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Two-Way ANOVA</h4>
                <p className="text-sm text-muted-foreground mb-2">Analyze two factors and their interaction</p>
                <p className="text-xs text-muted-foreground"><strong>When:</strong> 2 independent factors</p>
                <p className="text-xs text-muted-foreground"><strong>Example:</strong> Light × Nutrients</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Repeated Measures ANOVA</h4>
                <p className="text-sm text-muted-foreground mb-2">Analyze changes over time</p>
                <p className="text-xs text-muted-foreground"><strong>When:</strong> Same units measured multiple times</p>
                <p className="text-xs text-muted-foreground"><strong>Example:</strong> Monthly growth measurements</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Correlation</h4>
                <p className="text-sm text-muted-foreground mb-2">Test linear relationships</p>
                <p className="text-xs text-muted-foreground"><strong>When:</strong> Both variables continuous</p>
                <p className="text-xs text-muted-foreground"><strong>Example:</strong> Temperature vs. growth rate</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Chi-Square</h4>
                <p className="text-sm text-muted-foreground mb-2">Test categorical associations</p>
                <p className="text-xs text-muted-foreground"><strong>When:</strong> Frequency/count data</p>
                <p className="text-xs text-muted-foreground"><strong>Example:</strong> Survival (yes/no) by habitat</p>
              </Card>
            </div>

            <Card className="p-4 bg-destructive/10 border-l-4 border-destructive mt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Common Mistakes to Avoid
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>❌ <strong>Using multiple t-tests for 3+ groups:</strong> This inflates Type I error. Use One-Way ANOVA instead.</li>
                <li>❌ <strong>Using regular ANOVA for repeated measures:</strong> Violates independence assumption. Use Repeated Measures ANOVA.</li>
                <li>❌ <strong>Using t-test for proportions/percentages:</strong> These are not normally distributed. Use Chi-Square or logistic regression.</li>
                <li>❌ <strong>Ignoring interactions in Two-Way ANOVA:</strong> If factors interact, you can't interpret main effects alone.</li>
                <li>❌ <strong>Using correlation to test group differences:</strong> Correlation tests relationships, not differences between groups.</li>
              </ul>
            </Card>

            <Card className="p-4 bg-accent/20 mt-4">
              <h4 className="font-semibold mb-2">Key Assumptions to Check</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold mb-1">t-test & ANOVA:</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>✓ Normality (or large sample n≥30)</li>
                    <li>✓ Homogeneity of variance</li>
                    <li>✓ Independence of observations</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Correlation:</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>✓ Linear relationship</li>
                    <li>✓ Bivariate normality</li>
                    <li>✓ No extreme outliers</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Chi-Square:</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>✓ Expected frequencies ≥5</li>
                    <li>✓ Independence of observations</li>
                    <li>✓ Categorical data</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Repeated Measures:</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>✓ Sphericity (equal variances of differences)</li>
                    <li>✓ Normality within subjects</li>
                    <li>✓ No missing time points</li>
                  </ul>
                </div>
              </div>
            </Card>

            <p className="text-sm text-muted-foreground mt-4">
              <strong>Still unsure?</strong> Consult a statistician or consider using non-parametric alternatives 
              (e.g., Mann-Whitney U instead of t-test, Kruskal-Wallis instead of ANOVA) if assumptions are violated.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3">Important Considerations</h3>
            <Card className="p-4 bg-secondary/30 border-l-4 border-destructive">
              <ul className="space-y-2 text-sm">
                <li>⚠️ <strong>Effect Size:</strong> Estimate realistic effect sizes from pilot data or literature</li>
                <li>⚠️ <strong>Assumptions:</strong> Each test has assumptions (normality, independence, etc.)</li>
                <li>⚠️ <strong>Multiple Testing:</strong> Adjust alpha when performing multiple comparisons</li>
                <li>⚠️ <strong>Practical Constraints:</strong> Balance statistical requirements with logistical feasibility</li>
              </ul>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <h3 className="text-xl font-bold">Understanding Replication</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              One of the most critical—and most commonly misunderstood—concepts in experimental design 
              is identifying your true sample size (n). Pseudoreplication occurs when non-independent 
              observations are incorrectly treated as independent replicates, leading to inflated 
              statistical power and incorrect conclusions.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-2">True Replicates</h4>
                    <p className="text-sm text-muted-foreground">
                      Independent experimental units that can be randomly assigned to treatments. 
                      Each unit experiences conditions independently of others.
                    </p>
                    <p className="text-sm mt-2 font-medium">Examples:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                      <li>• Individual field plots</li>
                      <li>• Separate aquarium tanks</li>
                      <li>• Independent mesocosms</li>
                      <li>• Isolated plant individuals</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-2">Pseudoreplicates</h4>
                    <p className="text-sm text-muted-foreground">
                      Non-independent observations that share environmental conditions or are 
                      measured repeatedly. These cannot be treated as independent replicates.
                    </p>
                    <p className="text-sm mt-2 font-medium">Examples:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                      <li>• Multiple fish in one tank</li>
                      <li>• Repeated measures over time</li>
                      <li>• Subsamples within a plot</li>
                      <li>• Leaves from the same plant</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-secondary/30">
              <h4 className="font-semibold mb-3">The Golden Rule of Sample Size</h4>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="font-bold text-primary text-lg">n =</span>
                  <p className="flex-1">
                    <strong>Number of independent experimental units</strong>, NOT the total number 
                    of measurements, individuals, or observations.
                  </p>
                </div>
                <div className="bg-background p-3 rounded">
                  <p className="font-semibold mb-2">Example: Tank Experiment</p>
                  <p className="text-muted-foreground mb-2">
                    You have 5 tanks per treatment with 10 fish measured in each tank (total 50 fish per treatment).
                  </p>
                  <p className="text-destructive font-medium">❌ WRONG: n = 50 (counting all fish)</p>
                  <p className="text-green-600 dark:text-green-400 font-medium">✓ CORRECT: n = 5 (counting tanks)</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    The tank is your experimental unit. Fish within a tank share the same water, 
                    temperature, and conditions—they are not independent. Average the 10 fish 
                    measurements within each tank to get one value per tank.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-accent/20 mt-4">
              <h4 className="font-semibold mb-2">What should I do with subsamples?</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li><strong>1. Average within units:</strong> Calculate the mean of all subsamples within each experimental unit</li>
                <li><strong>2. Use this average:</strong> Treat the averaged value as your single observation for that unit</li>
                <li><strong>3. Analyze with true n:</strong> Your sample size is the number of experimental units, not subsamples</li>
              </ol>
              <p className="text-sm mt-3">
                <strong>Need help?</strong> Use the <strong>Replication Checker</strong> tab to verify your design.
              </p>
            </Card>

            <Card className="p-4 bg-destructive/10 border-l-4 border-destructive mt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Classic Pseudoreplication Mistakes
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">Mistake #1: Temporal Pseudoreplication</p>
                  <p className="text-muted-foreground">❌ "I measured 3 plots at 10 time points = n=30"</p>
                  <p className="text-green-600 dark:text-green-400">✓ Use repeated measures ANOVA with n=3 plots</p>
                </div>
                <div>
                  <p className="font-semibold">Mistake #2: Spatial Pseudoreplication</p>
                  <p className="text-muted-foreground">❌ "I have 2 sites with 25 quadrats each = n=50"</p>
                  <p className="text-green-600 dark:text-green-400">✓ Either n=2 (sites) or use nested/hierarchical analysis</p>
                </div>
                <div>
                  <p className="font-semibold">Mistake #3: Subsample Pseudoreplication</p>
                  <p className="text-muted-foreground">❌ "I measured 20 leaves from 4 trees = n=80"</p>
                  <p className="text-green-600 dark:text-green-400">✓ n=4 trees (average the 20 leaves per tree first)</p>
                </div>
              </div>
            </Card>

            <p className="text-sm text-muted-foreground mt-4">
              <strong>Further Reading:</strong> Hurlbert, S.H. (1984). Pseudoreplication and the design 
              of ecological field experiments. <em>Ecological Monographs</em>, 54(2): 187-211.
            </p>
          </section>

          {/* Power Analysis for Microbiome & Community Data */}
          <section className="pt-6 border-t-2 border-primary/20">
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-3 w-full text-left hover:text-primary transition-colors">
                <Dna className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold">Power Analysis for Microbiome & Community Data</h3>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500">
                  <p className="font-semibold mb-2">⚠️ Standard power calculators on this site are NOT appropriate for microbiome data</p>
                  <p className="text-sm text-muted-foreground">
                    If you have thousands of taxa per sample (16S/ITS sequencing, metabarcoding, shotgun metagenomics), 
                    you need specialized multivariate power analysis approaches.
                  </p>
                </Card>

                <div>
                  <h4 className="font-semibold text-lg mb-2">Why Standard Power Analysis Doesn't Work for Microbiome Data</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                    <li><strong>Compositional constraints:</strong> Relative abundance data sum to 1 (or 100%), creating dependencies between taxa</li>
                    <li><strong>High dimensionality:</strong> Thousands of correlated variables (taxa) analyzed simultaneously</li>
                    <li><strong>Sparsity & zero-inflation:</strong> Most taxa are rare or absent in most samples</li>
                    <li><strong>Multiple testing burden:</strong> Testing thousands of taxa inflates Type I error rates dramatically</li>
                    <li><strong>Non-independence:</strong> Taxonomic relationships and ecological interactions create complex correlation structures</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2">Appropriate Effect Sizes for Microbiome Studies</h4>
                  <div className="space-y-3">
                    <Card className="p-3 bg-secondary/30">
                      <p className="font-semibold">1. PERMANOVA R² (Recommended for Beta Diversity)</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>What it measures:</strong> Proportion of variance in community composition explained by treatment
                      </p>
                      <ul className="text-sm mt-2 ml-4 space-y-1 text-muted-foreground">
                        <li>• <strong>Small effect:</strong> R² = {R2.small.value} ({pct(R2.small.value)} variance explained)</li>
                        <li>• <strong>Medium effect:</strong> R² = {R2.medium.value} ({pct(R2.medium.value)} variance explained)</li>
                        <li>• <strong>Large effect:</strong> R² = {R2.large.value} ({pct(R2.large.value)} variance explained)</li>
                      </ul>
                      <p className="text-xs mt-2 text-muted-foreground">
                        These are Cohen's general benchmarks for variance explained. In microbiome studies, treatment R² values of 0.05 to 0.15 are common and meaningful.
                      </p>
                      <p className="text-xs mt-2 text-muted-foreground">
                        Note: Microbiome effect sizes are often smaller than traditional ecological studies due to high natural variability
                      </p>
                    </Card>

                    <Card className="p-3 bg-secondary/30">
                      <p className="font-semibold">2. Alpha Diversity (Shannon, Simpson, Richness)</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        For comparing diversity metrics between groups, you CAN use Cohen's d from standard calculators.
                        However, ensure you account for sequencing depth normalization (rarefaction or other methods).
                      </p>
                    </Card>

                    <Card className="p-3 bg-secondary/30">
                      <p className="font-semibold">3. Distance Metrics (Bray-Curtis, UniFrac)</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Report the average within-group vs. between-group distances. Power depends on the ratio and dispersion.
                      </p>
                    </Card>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2">Recommended Approaches & Tools</h4>
                  <div className="space-y-3">
                    <Card className="p-3 border-l-4 border-accent">
                      <p className="font-semibold">R Packages:</p>
                      <ul className="text-sm space-y-1 mt-1 text-muted-foreground">
                        <li>• <code className="bg-muted px-1 rounded">micropower</code> - PERMANOVA-based power analysis for microbiome studies</li>
                        <li>• <code className="bg-muted px-1 rounded">vegan::adonis2()</code> - PERMANOVA to calculate R² from pilot data</li>
                      </ul>
                    </Card>

                    <Card className="p-3 border-l-4 border-accent">
                      <p className="font-semibold">Pilot Study Strategy:</p>
                      <ul className="text-sm space-y-1 mt-1 text-muted-foreground">
                        <li>• Collect <strong>minimum 5-10 samples per group</strong> in a pilot study</li>
                        <li>• Run PERMANOVA to estimate R² effect size</li>
                        <li>• Use R² to calculate required sample size for your full study</li>
                        <li>• Account for sequencing depth variation (aim for 10,000+ reads per sample minimum)</li>
                      </ul>
                    </Card>

                    <Card className="p-3 border-l-4 border-accent">
                      <p className="font-semibold">Literature-Based Estimates:</p>
                      <p className="text-sm mt-1 text-muted-foreground">
                        If pilot data isn't available, consult published meta-analyses in your field. The Effect Size Library 
                        tab lists the published microbiome PERMANOVA R² values below with their sample sizes.
                      </p>
                    </Card>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-2">Example Microbiome Effect Sizes from Literature</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border">
                          <th className="text-left p-2">Comparison</th>
                          <th className="text-left p-2">Community</th>
                          <th className="text-left p-2">R² (PERMANOVA)</th>
                          <th className="text-left p-2">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MICROBIOME_R2.map((e) => (
                          <tr key={e.id} className="border-b border-border">
                            <td className="p-2">{e.studyType}</td>
                            <td className="p-2">{e.taxonomicGroup}</td>
                            <td className="p-2">{e.effectSize}</td>
                            <td className="p-2">
                              <a href={`https://doi.org/${e.doi}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{e.shortRef}</a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500">
                  <p className="font-semibold mb-2">⚠️ Key Considerations:</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Values in the table above range from R² = {Math.min(...MICROBIOME_R2.map((e) => e.effectSize))} to {Math.max(...MICROBIOME_R2.map((e) => e.effectSize))}; see the Effect Size Library for sample sizes and limits of each value</li>
                    <li>• Sample size requirements are often higher (30-50+ per group for R²=0.08)</li>
                    <li>• Sequencing depth, rarefaction method, and distance metric choice all impact statistical power</li>
                    <li>• Consider blocking by batch/plate if using multiple sequencing runs</li>
                  </ul>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </section>


          <section>
            <h3 className="text-xl font-bold mb-3">References & Further Reading</h3>
            <Card className="p-4 bg-secondary/20">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences</li>
                <li>• Zar, J. H. (2010). Biostatistical Analysis, 5th Edition</li>
                <li>• Sokal, R. R., & Rohlf, F. J. (2012). Biometry, 4th Edition</li>
                <li>• Quinn, G. P., & Keough, M. J. (2002). Experimental Design and Data Analysis for Biologists</li>
              </ul>
            </Card>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default AboutHelp;
