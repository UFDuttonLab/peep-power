/**
 * Constants for Bayesian power analysis calculators
 * Extracted for maintainability and consistency
 */

export const PUBLICATION_BIAS_DESCRIPTIONS = {
  severe: "Severe bias (e.g., highly competitive fields like psychology, medicine) inflates reported effects by ~75%. Common in fields with low replication rates and high publication pressure.",
  moderate: "Moderate bias (typical academic publishing) inflates reported effects by ~35%. Standard across most scientific disciplines where null results are less likely to be published.",
  mild: "Mild bias (pre-registered studies, large consortia) inflates effects by ~15%. Still present but reduced through open science practices like pre-registration and registered reports.",
  none: "No bias assumed (open science practices in place). Assumes transparent reporting, pre-registration, and publication of all results regardless of significance."
} as const;

export const PUBLICATION_BIAS_CITATIONS = {
  general: "Ioannidis, J. P. A. (2005). Why most published research findings are false. PLoS Medicine, 2(8), e124.",
  ecology: "Møller, A. P., & Jennions, M. D. (2001). Testing and adjusting for publication bias. Trends in Ecology & Evolution, 16(10), 580-586.",
  metaAnalysis: "Kicinski, M. (2013). Publication bias in recent meta-analyses. PLoS ONE, 8(11), e81823."
};

export const ADAPTIVE_ALLOCATION_CITATIONS = {
  ethics: "Berry, D. A. (2006). Bayesian clinical trials. Nature Reviews Drug Discovery, 5(1), 27-36. doi:10.1038/nrd1927",
  efficiency: "Thall, P. F., & Wathen, J. K. (2007). Practical Bayesian adaptive randomisation in clinical trials. European Journal of Cancer, 43(5), 859-866.",
  conservation: "Moore, J. L., Runge, M. C., Webber, B. L., & Wilson, J. R. (2011). Contain or eradicate? Optimizing the management goal for Australian acacia invasions in the face of uncertainty. Diversity and Distributions, 17(5), 1047-1059."
};

export const MICROBIOME_PILOT_GUIDANCE = {
  shortTerm: "For short-term studies (<3 months): collect 5-10 samples per group to estimate dispersion and mean counts. Sequence at similar depth to your planned main study.",
  longTerm: "For longitudinal studies (>3 months): collect 3-5 subjects per group across 2-3 timepoints to estimate within-subject correlation and dropout rates.",
  longitudinal: `**Planning Longitudinal Microbiome Studies:**

**Within-Subject Correlation:**
- High correlation (ρ=0.7-0.9): Stable communities, measurements are redundant
- Medium correlation (ρ=0.5-0.7): Moderate dynamics
- Low correlation (ρ=0.3-0.5): Highly dynamic communities

**Dropout Considerations:**
- Plan for 10-20% dropout per timepoint
- Increase initial n to maintain power
- Consider mixed models for missing data

**Effect Size Estimation:**
Use Cohen's f from pilot LMM results or literature values (0.15-0.35 typical).`,
  betaDiversity: `**From PERMANOVA Results:**
Run permanova on pilot data:
  library(vegan)
  perm <- adonis2(dist_matrix ~ treatment, data=metadata)
  R2 <- perm$R2[1]  # Extract R-squared

**Typical R² values:**
- Strong effects (antibiotics): 0.15-0.30
- Moderate effects (diet change): 0.05-0.15  
- Subtle effects (supplement): 0.01-0.05

**If no pilot data:**
Use conservative estimates from literature (adjust down 20-30% for planning).`,
  differentialAbundance: `**From DESeq2/edgeR Results:**
Run differential abundance on pilot:
  library(DESeq2)
  dds <- DESeq(dds)
  res <- results(dds)
  log2FC <- res$log2FoldChange[significant_taxa]
  
**Typical log2FC values:**
- Abundant genera: 0.5-2.0 (1.4-4× change)
- Moderate abundance: 1.5-3.0 (2.8-8× change)  
- Rare taxa: 2.0-4.0 (4-16× change)

**Dispersion estimates:**
Check plotDispEsts(dds) - typical values 0.1-1.5.`,
  zeroInflated: `**Zero-Inflation Assessment:**
Calculate proportion of zeros in pilot:
  zero_prop <- sum(counts == 0) / length(counts)
  
**Guidelines:**
- <30% zeros: Standard negative binomial OK
- 30-60% zeros: Consider zero-inflation
- >60% zeros: Definitely use ZINB

**Hurdle vs ZINB:**
- Hurdle: Zeros from detection limits
- ZINB: Zeros from biological absence + detection`
};

export const EFFECT_SIZE_BENCHMARKS = {
  permanovaRSquared: {
    small: { value: 0.02, description: "Subtle environmental gradients, modest dietary changes" },
    medium: { value: 0.08, description: "Moderate treatments (diet shift, mild antibiotics), disease vs healthy" },
    large: { value: 0.15, description: "Major perturbations (broad-spectrum antibiotics, extreme environments)" }
  },
  log2FoldChange: {
    small: { value: 1.0, description: "2× change - typical for moderately responsive taxa" },
    medium: { value: 2.0, description: "4× change - strong responders to treatment" },
    large: { value: 3.0, description: "8× change - major shifts (e.g., bloom/crash dynamics)" }
  },
  cohensF: {
    small: { value: 0.1, description: "Small time × treatment interaction" },
    medium: { value: 0.25, description: "Medium interaction - detectable temporal divergence" },
    large: { value: 0.4, description: "Large interaction - clear trajectory differences" }
  }
};
