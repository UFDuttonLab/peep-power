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
  betaDiversity: "For PERMANOVA/beta diversity: pilot with 8-15 samples per group. Calculate observed R² using adonis2() in vegan package. Account for within-group heterogeneity using betadisper().",
  differentialAbundance: "For DESeq2/edgeR: pilot with 3-5 samples per group. Estimate dispersion using estimateDispersions() and effect sizes using results(). Focus on medium-abundance taxa (10-1000 mean counts).",
  zeroInflated: "For rare/zero-inflated taxa: pilot needs larger N (10-15 per group) to reliably estimate zero-inflation rates and distinguish structural from sampling zeros."
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
