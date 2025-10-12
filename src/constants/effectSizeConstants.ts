/**
 * Effect size constants and guidance for power analysis
 * Based on Cohen (1988) and ecological research conventions
 */

export const EFFECT_SIZE_INTERPRETATIONS = {
  cohensD: {
    name: "Cohen's d",
    description: "Standardized mean difference between two groups",
    benchmarks: {
      small: { value: 0.2, description: "Small effect: subtle difference, ~10% non-overlap" },
      medium: { value: 0.5, description: "Medium effect: noticeable difference, ~33% non-overlap" },
      large: { value: 0.8, description: "Large effect: substantial difference, ~50% non-overlap" }
    },
    formula: "d = (μ₁ - μ₂) / σ",
    example: "d=0.5 means groups differ by half a standard deviation"
  },
  cohensF: {
    name: "Cohen's f",
    description: "Effect size for ANOVA (standardized variance explained)",
    benchmarks: {
      small: { value: 0.1, description: "Small effect: η²=1%, subtle group differences" },
      medium: { value: 0.25, description: "Medium effect: η²=6%, moderate group differences" },
      large: { value: 0.4, description: "Large effect: η²=14%, substantial group differences" }
    },
    formula: "f = √(η² / (1 - η²))",
    conversion: "η² = f² / (1 + f²)",
    example: "f=0.25 corresponds to 6% variance explained"
  },
  rSquared: {
    name: "R²",
    description: "Proportion of variance explained (PERMANOVA, regression)",
    benchmarks: {
      small: { value: 0.02, description: "Small effect: 2% variance explained" },
      medium: { value: 0.13, description: "Medium effect: 13% variance explained" },
      large: { value: 0.26, description: "Large effect: 26% variance explained" }
    },
    formula: "R² = SSₑffₑct / SSₜₒₜₐₗ",
    example: "R²=0.13 means treatment explains 13% of community variation"
  },
  pearsonR: {
    name: "Pearson's r",
    description: "Correlation coefficient",
    benchmarks: {
      small: { value: 0.1, description: "Small correlation: weak linear relationship" },
      medium: { value: 0.3, description: "Medium correlation: moderate linear relationship" },
      large: { value: 0.5, description: "Large correlation: strong linear relationship" }
    },
    formula: "r = Cov(X,Y) / (σₓσᵧ)",
    example: "r=0.3 means 9% shared variance (R²=0.09)"
  },
  cohensW: {
    name: "Cohen's w",
    description: "Effect size for chi-square tests",
    benchmarks: {
      small: { value: 0.1, description: "Small effect: subtle deviation from expected" },
      medium: { value: 0.3, description: "Medium effect: moderate deviation from expected" },
      large: { value: 0.5, description: "Large effect: substantial deviation from expected" }
    },
    formula: "w = √(Σ(Pᵢ - P₀ᵢ)² / P₀ᵢ)",
    example: "w=0.3 for 2×2 table means odds ratio ≈ 2.5"
  }
};

export const MINIMUM_SAMPLE_SIZES = {
  ttest: {
    recommended: 10,
    absolute_minimum: 3,
    warning: "Power is very low with n<10 per group unless effect size is very large (d>1.0)"
  },
  anova: {
    recommended: 5,
    absolute_minimum: 2,
    warning: "ANOVA requires at least 5 per group for reliable results. Consider pilot study if n<5."
  },
  correlation: {
    recommended: 30,
    absolute_minimum: 10,
    warning: "Correlations are unstable with n<30. Need n≈85 for 80% power to detect r=0.3."
  },
  permanova: {
    recommended: 8,
    absolute_minimum: 5,
    warning: "PERMANOVA needs 8-15 per group for multivariate community data. Lower n increases Type II error."
  },
  chisquare: {
    recommended: 20,
    absolute_minimum: 10,
    warning: "Chi-square test requires expected counts ≥5 in each cell. Total n≥20 recommended."
  },
  repeatedMeasures: {
    recommended: 15,
    absolute_minimum: 10,
    warning: "Repeated measures needs adequate subjects for between-subject error. Consider 15+ subjects."
  },
  deseq: {
    recommended: 6,
    absolute_minimum: 3,
    warning: "DESeq2 works with n≥3 but 6+ per group recommended for accurate dispersion estimates."
  },
  microbiomeLMM: {
    recommended: 10,
    absolute_minimum: 8,
    warning: "Longitudinal microbiome studies need sufficient subjects to estimate random effects. 10+ recommended."
  }
};

export const ECOLOGICAL_EFFECT_SIZE_GUIDANCE = `
### Effect Size Estimation in Ecology

**From Pilot Data:**
- Calculate observed effect size (e.g., Cohen's d from means and SD)
- Adjust downward by 20-30% to account for "winner's curse" (pilot effects are often inflated)
- Consider using confidence intervals: plan for lower bound of 95% CI

**From Literature:**
- Meta-analysis: use pooled effect size
- Single studies: average effect from 3-5 similar studies
- Account for publication bias: published effects typically 1.5-2× larger than true effects

**Microbiome-Specific:**
- **Alpha diversity:** Effect sizes (d) typically 0.3-0.8 for treatment effects
- **Beta diversity (R²):** 
  - Strong treatments (antibiotics): R²=0.2-0.5
  - Diet/lifestyle: R²=0.05-0.15
  - Subtle factors: R²=0.01-0.05
- **Differential abundance (log2FC):**
  - Dominant taxa: log2FC = 0.5-2.0 (1.4-4× change)
  - Rare taxa: log2FC = 2.0-4.0 (4-16× change)

**What if you have no prior data?**
1. Use Cohen's benchmarks (small/medium/large) as starting point
2. Run power analysis for range of plausible effects
3. Consider two-stage design: pilot study → main study
4. Use Bayesian assurance to account for uncertainty

**Conservative Planning:**
If uncertain, plan for smaller effects to avoid underpowered studies.
`;
