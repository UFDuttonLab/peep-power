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
  lambda = N × f²  (non-centrality parameter)
  F_crit = critical F-value at alpha with df1 = k-1, df2 = N-k
  
Non-central F CDF via Poisson series expansion:
  CDF = Sum[j=0 to inf] P(lambda/2; j) × I_y(df1/2+j, df2/2)
  where y = (x×df1)/(df2 + x×df1)`,
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

  TWO_WAY_ANOVA: {
    title: 'Two-Way ANOVA Power Formula',
    formula: `For each effect (A, B, A×B):
Power = P(F > F_crit | lambda)

Main Effect A:
  lambda_A = N × f²_A
  df1 = a-1, df2 = ab(n-1)

Main Effect B:
  lambda_B = N × f²_B
  df1 = b-1, df2 = ab(n-1)

Interaction:
  lambda_AB = N × f²_AB
  df1 = (a-1)(b-1), df2 = ab(n-1)`,
    variables: [
      { symbol: 'a', description: 'Levels of Factor A' },
      { symbol: 'b', description: 'Levels of Factor B' },
      { symbol: 'n', description: 'Sample size per cell' },
      { symbol: 'f_A, f_B, f_AB', description: 'Effect sizes for each effect' },
    ],
    notes: [
      'Each effect has independent power',
      'Interaction requires larger samples',
    ],
    limitations: [
      'Assumes homogeneity of variance',
      'Balanced design assumed',
    ],
    references: [
      { text: 'Cohen, J. (1988). Statistical Power Analysis' },
    ],
  },

  REPEATED_MEASURES: {
    title: 'Repeated Measures ANOVA Power',
    formula: `Power = P(F > F_crit | lambda)

Design Effect = 1 + (k-1)×rho
Effective N = (n × k) / Design Effect
lambda = Effective N × f²

df1 = (k-1)×epsilon
df2 = (n-1)(k-1)×epsilon`,
    variables: [
      { symbol: 'n', description: 'Number of subjects' },
      { symbol: 'k', description: 'Number of timepoints' },
      { symbol: 'rho', description: 'Within-subject correlation' },
      { symbol: 'epsilon', description: 'Sphericity correction (default=1)' },
    ],
    notes: [
      'Higher correlation reduces effective sample size',
      'Apply Greenhouse-Geisser correction if sphericity violated',
    ],
    limitations: [
      'Assumes compound symmetry',
    ],
    references: [
      { text: 'Maxwell & Delaney (2004). Designing Experiments' },
    ],
  },

  NESTED_ANOVA: {
    title: 'Nested ANOVA Power Formula',
    formula: `Between-Cluster Power:
Design Effect = 1 + (m-1)×ICC
Effective N = (n × m) / Design Effect
lambda = (Effective N × f²) / (1 + f²)

Within-Cluster Power:
lambda = [n × m × k × f² × (1-ICC)] / (1+f²)`,
    variables: [
      { symbol: 'n', description: 'Observations per cluster' },
      { symbol: 'm', description: 'Clusters per group' },
      { symbol: 'k', description: 'Number of groups' },
      { symbol: 'ICC', description: 'Intraclass correlation' },
    ],
    notes: [
      'ICC measures clustering effect',
      'Higher ICC reduces power',
    ],
    limitations: [
      'Assumes balanced clusters',
    ],
    references: [
      { text: 'Donner & Klar (2000). Cluster Randomization Trials' },
    ],
  },

  PERMANOVA: {
    title: 'PERMANOVA Power Formula',
    formula: `Power = P(F > F_crit | lambda)

lambda = N × (R²/(1-R²))
Pseudo-F = [R²/(k-1)] / [(1-R²)/(N-k)]
df1 = k-1, df2 = N-k`,
    variables: [
      { symbol: 'R²', description: 'Proportion of variance explained' },
      { symbol: 'N', description: 'Total sample size' },
      { symbol: 'k', description: 'Number of groups' },
    ],
    notes: [
      'Used for multivariate community data',
      'Small R²≈0.01, Medium≈0.06, Large≈0.14',
    ],
    limitations: [
      'Assumes homogeneity of dispersion',
      'Sensitive to distance metric choice',
    ],
    references: [
      { text: 'Anderson (2001). Austral Ecology, 26, 32-46' },
    ],
  },

  DIFFERENTIAL_ABUNDANCE: {
    title: 'Differential Abundance Power (DESeq2)',
    formula: `Power = 1 - Phi(z_crit - ncp) + Phi(-z_crit - ncp)

se = sqrt(phi/n + 1/mu)
ncp = |log2FC| / se
z_crit = inverse_normal(1 - alpha_adj/2)

Multiple testing:
alpha_adj = alpha / m  (Bonferroni)`,
    variables: [
      { symbol: 'log2FC', description: 'Log2 fold-change' },
      { symbol: 'phi', description: 'Dispersion parameter' },
      { symbol: 'mu', description: 'Base mean count' },
      { symbol: 'm', description: 'Number of taxa tested' },
    ],
    notes: [
      'Negative binomial model for count data',
      'Higher dispersion reduces power',
    ],
    limitations: [
      'Dispersion estimates unstable with n<5',
    ],
    references: [
      { text: 'Love et al. (2014). DESeq2. Genome Biology, 15, 550' },
    ],
  },

  ZERO_INFLATED: {
    title: 'Zero-Inflated Negative Binomial Power',
    formula: `Count Power:
Effective N = n × (1-pi)
se_count = sqrt(phi/Effective_N + 1/mu)
Power_count = 1 - Phi(z_crit - |log2FC|/se_count)

Zero Power:
se_zero = sqrt(pi×(1-pi)/n)
Power_zero = 1 - Phi(z_crit - Delta_pi/se_zero)

Combined: 1 - (1-Power_count)×(1-Power_zero)`,
    variables: [
      { symbol: 'pi', description: 'Zero-inflation proportion' },
      { symbol: 'Delta_pi', description: 'Change in zero proportion' },
    ],
    notes: [
      'Models structural zeros separately',
      'High zero-inflation reduces effective N',
    ],
    limitations: [
      'Requires distinguishing structural vs sampling zeros',
    ],
    references: [
      { text: 'Xu et al. (2015). Journal of Applied Statistics' },
    ],
  },

  LINEAR_MIXED_MODEL: {
    title: 'Linear Mixed Model Power (Approximation)',
    formula: `Power ~= P(F > F_crit | lambda)  [APPROXIMATION]

Design Effect = 1 + (k-1)×rho
Slope Inflation = 1 + sigma²_slope×(k-1)/k
Adjusted DE = Design Effect × Slope Inflation

Retained N = n × (1-dropout)^(k-1)
Effective N = (Retained N × k) / Adjusted DE
lambda = (f² × n_per_group × k) / Adjusted DE`,
    variables: [
      { symbol: 'k', description: 'Number of timepoints' },
      { symbol: 'rho', description: 'Within-subject correlation' },
      { symbol: 'sigma²_slope', description: 'Random slope variance' },
      { symbol: 'dropout', description: 'Per-timepoint dropout rate' },
    ],
    notes: [
      'THIS IS AN APPROXIMATION',
      'Use simulation (simr in R) for exact power',
    ],
    limitations: [
      'Less accurate with large random slopes (>0.5)',
      'Less accurate with high dropout (>20%)',
    ],
    references: [
      { text: 'Green & MacLeod (2016). SIMR package. Methods in Ecology' },
    ],
  },

  BAYESIAN_ASSURANCE: {
    title: 'Bayesian Assurance Formula',
    formula: `Assurance = P(Power >= target | prior)

Monte Carlo:
1. Sample theta_i ~ N(mu_prior, sigma²_prior)
2. Calculate Power(theta_i, n)
3. Assurance = proportion where Power >= target`,
    variables: [
      { symbol: 'mu_prior', description: 'Prior mean effect size' },
      { symbol: 'sigma_prior', description: 'Prior uncertainty (SD)' },
      { symbol: 'target', description: 'Target power (e.g., 0.80)' },
    ],
    notes: [
      'Accounts for effect size uncertainty',
      'Sample size inflation typically 10-50%',
    ],
    limitations: [
      'Sensitive to prior specification',
    ],
    references: [
      { text: 'O\'Hagan et al. (2005). Pharmaceutical Statistics' },
    ],
  },

  BAYESIAN_SEQUENTIAL: {
    title: 'Bayesian Sequential Design',
    formula: `At interim look i:
Predictive Power = P(reject H0 at n_max | data)

Stop for futility if: Pred Power < threshold_low
Stop for superiority if: Pred Power > threshold_high

Expected N = Sum n_i × P(stop at i)`,
    variables: [
      { symbol: 'n_i', description: 'Sample size at look i' },
      { symbol: 'threshold_low', description: 'Futility threshold' },
      { symbol: 'threshold_high', description: 'Superiority threshold' },
    ],
    notes: [
      'Can reduce expected N by 20-40%',
      'Requires pre-specified stopping rules',
    ],
    limitations: [
      'Type I error inflation if not calibrated',
    ],
    references: [
      { text: 'Berry et al. (2010). Bayesian Adaptive Methods' },
    ],
  },

  BAYESIAN_CALIBRATION: {
    title: 'Bayesian Calibration Formula',
    formula: `Frequentist to Bayesian Calibration:

Assurance = P(Power >= target | prior)
Sample Size Inflation = 1 + k × CV²
where CV = sigma_effect / mu_effect

Bayesian N = Frequentist N × Inflation`,
    variables: [
      { symbol: 'CV', description: 'Coefficient of variation of effect size' },
      { symbol: 'k', description: 'Adjustment factor (0.5-2.0)' },
    ],
    notes: [
      'Converts frequentist power to Bayesian assurance',
      'Inflation typically 10-50%',
    ],
    references: [
      { text: 'O\'Hagan et al. (2005). Pharmaceutical Statistics' },
    ],
  },

  BAYESIAN_REPLICATION: {
    title: 'Bayesian Replication Probability',
    formula: `Replication Probability = P(p_rep < alpha | Data_orig)

Using posterior from original:
theta ~ N(theta_hat, SE²)
P(rep) = Integral Power_rep(theta) × p(theta|data) dtheta`,
    variables: [
      { symbol: 'theta_hat', description: 'Original effect estimate' },
      { symbol: 'SE', description: 'Standard error from original' },
    ],
    notes: [
      'Accounts for winner\'s curse',
      'Often lower than classical power',
    ],
    references: [
      { text: 'Anderson & Maxwell (2016). Psychological Methods' },
    ],
  },

  BAYESIAN_EQUIVALENCE: {
    title: 'Bayesian Equivalence Testing',
    formula: `P(equivalence) = P(theta in ROPE | data)
ROPE = [-delta, delta]

Required N: Find n where P(theta in ROPE) > threshold`,
    variables: [
      { symbol: 'ROPE', description: 'Region of Practical Equivalence' },
      { symbol: 'delta', description: 'Equivalence margin' },
    ],
    notes: [
      'More informative than TOST',
      'Requires scientific justification of ROPE',
    ],
    references: [
      { text: 'Kruschke (2018). Advances in Methods' },
    ],
  },

  BAYESIAN_HIERARCHICAL: {
    title: 'Bayesian Hierarchical Design',
    formula: `Design Effect = 1 + (m-1)×ICC
ICC ~ Beta(alpha_ICC, beta_ICC)

Expected DE = E[1 + (m-1)×ICC]
Required J = n_total / (m × DE)`,
    variables: [
      { symbol: 'J', description: 'Number of clusters' },
      { symbol: 'm', description: 'Cluster size' },
      { symbol: 'ICC', description: 'Intraclass correlation' },
    ],
    notes: [
      'Accounts for ICC uncertainty',
    ],
    references: [
      { text: 'Raudenbush & Bryk (2002). HLM' },
    ],
  },

  BAYESIAN_PERMANOVA: {
    title: 'Bayesian PERMANOVA Assurance',
    formula: `Assurance = P(Power >= target | R² prior)

R² ~ N(mu_R2, sigma²_R2)
For each sampled R²:
  Calculate PERMANOVA power
Assurance = proportion meeting target`,
    variables: [
      { symbol: 'mu_R2', description: 'Prior mean R²' },
      { symbol: 'sigma_R2', description: 'Prior uncertainty in R²' },
    ],
    notes: [
      'Accounts for R² uncertainty from pilot data',
    ],
    references: [
      { text: 'Kelly et al. (2015). Bioinformatics' },
    ],
  },

  BAYESIAN_ADAPTIVE_ALLOCATION: {
    title: 'Bayesian Adaptive Response Allocation',
    formula: `Response-Adaptive Randomization:
At interim i:
  Success rate: theta_A, theta_B (posterior means)
  Allocation ratio: P(A) = theta_A / (theta_A + theta_B)

Expected Power with RAR:
  E[Power] = Integral Power(n_A, n_B, theta) p(theta|data) dtheta`,
    variables: [
      { symbol: 'theta_A, theta_B', description: 'Treatment success rates' },
      { symbol: 'n_A, n_B', description: 'Adaptive sample allocations' },
      { symbol: 'RAR', description: 'Response-Adaptive Randomization' },
    ],
    notes: [
      'Allocates more participants to better-performing treatment',
      'Can improve ethical outcomes while maintaining power',
      'Requires careful calibration to control Type I error',
    ],
    limitations: [
      'May reduce power if allocation becomes too imbalanced',
      'Interim analyses must be pre-specified',
    ],
    references: [
      { text: 'Berry et al. (2010). Bayesian Adaptive Methods for Clinical Trials' },
    ],
  },

  BAYESIAN_INFORMATION_DESIGN: {
    title: 'Bayesian Information-Based Design',
    formula: `Expected Information Gain:
EIG = H(theta) - E[H(theta|y)]

Utility Function:
U(n) = Information - Cost × n

Optimal n: maximize U(n)
where Information = log det(I(theta))`,
    variables: [
      { symbol: 'H(theta)', description: 'Prior entropy' },
      { symbol: 'I(theta)', description: 'Fisher information matrix' },
      { symbol: 'EIG', description: 'Expected Information Gain' },
    ],
    notes: [
      'Optimizes sample size based on information theory',
      'Balances information gain against cost',
      'Particularly useful for expensive experiments',
    ],
    limitations: [
      'Requires specification of utility function',
      'Computationally intensive for complex models',
    ],
    references: [
      { text: 'Chaloner & Verdinelli (1995). Bayesian Experimental Design' },
      { text: 'Ryan et al. (2016). Statistical Science' },
    ],
  },

  REPEATED_MEASURES_MICROBIOME: {
    title: 'Repeated Measures Microbiome Power (LMM)',
    formula: `Linear Mixed Model Approximation:

Design Effect = 1 + (k-1)×rho
Effective N = (n × k) / Design Effect

For beta-diversity (e.g., Bray-Curtis):
  lambda = (Effective N × R²) / (1 - R²)
  Power = P(F > F_crit | lambda)`,
    variables: [
      { symbol: 'n', description: 'Number of subjects' },
      { symbol: 'k', description: 'Number of timepoints' },
      { symbol: 'rho', description: 'Within-subject correlation' },
      { symbol: 'R²', description: 'Effect size (variance explained)' },
    ],
    notes: [
      'Accounts for repeated sampling from same subjects',
      'Higher correlation reduces effective sample size',
      'Can use PERMANOVA or distance-based methods',
    ],
    limitations: [
      'Assumes compound symmetry',
      'May need permutation-based inference for non-normal data',
    ],
    references: [
      { text: 'Kelly et al. (2015). Microbiome power calculations. Bioinformatics' },
      { text: 'Shields-Cutler et al. (2018). American Journal of Epidemiology' },
    ],
  },
};
