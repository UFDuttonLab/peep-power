import { Card } from '@/components/ui/card';
import { BookOpen, GraduationCap, FlaskConical, Github } from 'lucide-react';

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
