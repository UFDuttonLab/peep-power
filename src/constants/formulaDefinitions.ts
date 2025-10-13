import { FormulaInfo } from '@/components/FormulaDisplay';

export const FORMULAS: Record<string, FormulaInfo> = {
  TTEST: {
    title: 'Two-Sample T-Test Power Formula',
    formula: `Power = 1 - Phi(t_crit - delta) + Phi(-t_crit - delta)

where:
  delta = d × sqrt(n/2)  (non-centrality parameter)
  t_crit = critical t-value at alpha/2 with df = 2n - 2
  Phi = cumulative standard normal distribution (for df > 30)
  
For df <= 30:
  Power = 1 - T(t_crit - shift, df) + T(-t_crit - shift, df)
  shift = delta × sqrt(df/(df + delta²))
  T = cumulative Student's t distribution`,
    variables: [
      { symbol: 'd', description: 'Cohen\'s d effect size (standardized mean difference)' },
      { symbol: 'n', description: 'Sample size per group' },
      { symbol: 'alpha', description: 'Type I error rate (significance level)' },
      { symbol: 'df', description: 'Degrees of freedom = 2n - 2' },
    ],
    notes: [
      'This formula assumes equal sample sizes and variances between groups',
      'For df > 30, normal approximation is used; for df <= 30, shifted t-distribution provides better accuracy',
      'Two-tailed test is assumed (adjust alpha accordingly for one-tailed tests)',
    ],
    limitations: [
      'Assumes normality of data within groups',
      'Assumes independence of observations',
      'Small sample sizes (n < 10) may reduce approximation accuracy',
    ],
    references: [
      { text: 'Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.)' },
    ],
  },
  
  ONE_WAY_ANOVA: {
    title: 'One-Way ANOVA Power Formula',
    formula: `Power = P(F > F_crit | lambda)

where:
  lambda = (N × f²) / (1 + f²)  (non-centrality parameter)
  F_crit = critical F-value at alpha with df1 = k-1, df2 = N-k
  
Patnaik's approximation:
  h = 1 - (2×lambda)/(3×df1)
  Power ~= 1 - CDF_F(F_crit/h, df1, df2) + correction`,
    variables: [
      { symbol: 'f', description: 'Cohen\'s f effect size' },
      { symbol: 'N', description: 'Total sample size across all groups' },
      { symbol: 'k', description: 'Number of groups' },
      { symbol: 'alpha', description: 'Type I error rate' },
    ],
    notes: [
      'Small f = 0.10, Medium f = 0.25, Large f = 0.40 (Cohen, 1988)',
      'Approximation accuracy decreases when lambda > 30',
    ],
    limitations: [
      'Assumes homogeneity of variance across groups',
      'Assumes normality within groups',
    ],
    references: [
      { text: 'Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences' },
    ],
  },

  CORRELATION: {
    title: 'Pearson Correlation Power Formula',
    formula: `Power = 1 - Phi(z_crit - ncp) + Phi(-z_crit - ncp)

where:
  z = 0.5 × ln[(1 + |rho|)/(1 - |rho|)]  (Fisher's z)
  se = 1/sqrt(n-3)
  ncp = z / se
  z_crit = inverse_normal(1 - alpha/2)`,
    variables: [
      { symbol: 'rho', description: 'Population correlation coefficient' },
      { symbol: 'n', description: 'Total number of paired observations' },
      { symbol: 'alpha', description: 'Type I error rate' },
    ],
    notes: [
      'Small rho = 0.10, Medium rho = 0.30, Large rho = 0.50',
      'Need n >= 85 for 80% power to detect rho = 0.3',
    ],
    limitations: [
      'Assumes bivariate normality',
      'Only detects linear relationships',
      'Sensitive to outliers',
    ],
    references: [
      { text: 'Cohen, J. (1988). Statistical Power Analysis' },
    ],
  },

  CHI_SQUARE: {
    title: 'Chi-Square Test Power Formula',
    formula: `Power = P(chi² > chi²_crit | lambda)

where:
  lambda = w² × n
  
Patnaik approximation:
  h = 1 - (2/3) × lambda/(df + lambda)
  Power = 1 - CDF_chi²(chi²_crit/h, df + lambda)`,
    variables: [
      { symbol: 'w', description: 'Cohen\'s w effect size' },
      { symbol: 'n', description: 'Total sample size' },
      { symbol: 'df', description: 'Degrees of freedom' },
    ],
    notes: [
      'Small w = 0.10, Medium w = 0.30, Large w = 0.50',
      'All expected frequencies should be >= 5',
    ],
    limitations: [
      'Approximation less accurate for lambda > 30',
    ],
    references: [
      { text: 'Cohen, J. (1988). Statistical Power Analysis' },
    ],
  },
};
