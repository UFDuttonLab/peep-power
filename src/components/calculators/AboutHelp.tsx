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
            <h3 className="text-xl font-bold mb-3">Available Tests</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">t-test</h4>
                <p className="text-sm text-muted-foreground">Compare means of two groups</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">One-Way ANOVA</h4>
                <p className="text-sm text-muted-foreground">Compare means of 3+ groups</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Two-Way ANOVA</h4>
                <p className="text-sm text-muted-foreground">Analyze two factors and their interaction</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Repeated Measures ANOVA</h4>
                <p className="text-sm text-muted-foreground">Analyze changes over time</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Correlation</h4>
                <p className="text-sm text-muted-foreground">Test linear relationships</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Chi-Square</h4>
                <p className="text-sm text-muted-foreground">Test categorical associations</p>
              </Card>
            </div>
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
