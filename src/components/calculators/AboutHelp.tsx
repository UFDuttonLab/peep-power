import { Card } from '@/components/ui/card';
import { BookOpen, GraduationCap, FlaskConical, Github, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
              The Ecological Power Analysis Toolkit is designed to help researchers, students, and field biologists 
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

          <section>
            <div className="flex items-center gap-3 mb-3">
              <Github className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">About UF Dutton Lab</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              This tool was developed by the Dutton Lab at the University of Florida to support ecological research 
              and education. For questions, suggestions, or to report issues, please visit our GitHub repository.
            </p>
            <a 
              href="https://ufduttonlab.github.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-3 text-primary hover:underline font-medium"
            >
              Visit UF Dutton Lab →
            </a>
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
