import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dna, BookOpen, Lightbulb, FlaskConical } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const MicrobiomeCalculator = () => {
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

      {/* PERMANOVA Section */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          PERMANOVA Power Analysis
        </h2>
        
        <div className="space-y-4">
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

          <div className="bg-secondary/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Sample Size Estimation</h3>
            <p className="text-sm mb-2">
              Use R packages for PERMANOVA power analysis:
            </p>
            <code className="block bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
              # Install micropower package<br/>
              install.packages("micropower")<br/>
              library(micropower)<br/>
              <br/>
              # Estimate sample size<br/>
              micropower.permanova(<br/>
              &nbsp;&nbsp;effect.size = 0.08,  # Medium effect<br/>
              &nbsp;&nbsp;groups = 2,          # Number of groups<br/>
              &nbsp;&nbsp;power = 0.8,         # Desired power<br/>
              &nbsp;&nbsp;alpha = 0.05         # Significance level<br/>
              )
            </code>
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
