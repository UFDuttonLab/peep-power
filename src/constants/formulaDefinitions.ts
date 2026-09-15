import { FormulaInfo } from '@/components/FormulaDisplay';

export const FORMULAS: Record<string, FormulaInfo> = {
  TTEST: {
    title: 'Two-Sample T-Test Power Formula',
    formula: `Power = 1 - T'(t_crit; df, delta) + T'(-t_crit; df, delta)

where:
  delta = d × sqrt(n/2)  (non-centrality parameter)
  df = 2n - 2
  t_crit = critical t-value at 1 - alpha/2 with df degrees of freedom
  T'(x; df, delta) = cumulative noncentral t distribution (computed exactly)`,
    variables: [
      { symbol: 'd', description: 'Cohen\'s d effect size (standardized mean difference)' },
      { symbol: 'n', description: 'Sample size per group' },
      { symbol: 'alpha', description: 'Type I error rate (significance level)' },
      { symbol: 'df', description: 'Degrees of freedom = 2n - 2' },
    ],
    notes: [
      'This formula assumes equal sample sizes and variances between groups',
      'The exact noncentral t distribution is used at every sample size (same as pwr::pwr.t.test in R)',
      'Two-tailed test is assumed',
    ],
    limitations: [
      'Assumes normality of data within groups',
      'Assumes independence of observations',
    ],
    references: [
      { text: 'Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.)' },
    ],
  },

  ONE_WAY_ANOVA: {
    title: 'One-Way ANOVA Power Formula',
    formula: `Power = P(F > F_crit | lambda)

where:
  lambda = f² × k × n = f² × N  (non-centrality parameter)
  F_crit = critical F-value at alpha with df1 = k-1, df2 = N-k

Non-central F CDF via Poisson series expansion:
  CDF = Sum[j=0 to inf] P(lambda/2; j) × I_y(df1/2+j, df2/2)
  where y = (x×df1)/(df2 + x×df1)`,
    variables: [
      { symbol: 'f', description: 'Cohen\'s f effect size' },
      { symbol: 'n', description: 'Sample size per group' },
      { symbol: 'N', description: 'Total sample size across all groups (N = k × n)' },
      { symbol: 'k', description: 'Number of groups' },
      { symbol: 'alpha', description: 'Type I error rate' },
    ],
    notes: [
      'Small f = 0.10, Medium f = 0.25, Large f = 0.40 (Cohen, 1988)',
      'The Poisson series is summed to convergence, so the result is exact (same as pwr::pwr.anova.test)',
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
  ncp = atanh(|rho|) × sqrt(n - 3)  (Fisher's z transformation)
  atanh(r) = 0.5 × ln[(1 + r)/(1 - r)]
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
      = 1 - CDF_ncchi²(chi²_crit; df, lambda)

where:
  lambda = w² × N
  chi²_crit = critical chi-square value at 1 - alpha with df degrees of freedom
  CDF_ncchi² = cumulative noncentral chi-square distribution (computed exactly)`,
    variables: [
      { symbol: 'w', description: 'Cohen\'s w effect size' },
      { symbol: 'N', description: 'Total sample size' },
      { symbol: 'df', description: 'Degrees of freedom' },
    ],
    notes: [
      'Small w = 0.10, Medium w = 0.30, Large w = 0.50',
      'All expected frequencies should be >= 5',
      'Same method as pwr::pwr.chisq.test in R',
    ],
    limitations: [
      'Relies on the large-sample chi-square approximation of the test statistic',
    ],
    references: [
      { text: 'Cohen, J. (1988). Statistical Power Analysis' },
    ],
  },

  TWO_WAY_ANOVA: {
    title: 'Two-Way ANOVA Power Formula',
    formula: `For each effect (A, B, A×B):
Power = P(F > F_crit | lambda)
N = a × b × n

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
      { symbol: 'N', description: 'Total sample size' },
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

Within-subject effect (compound symmetry):
lambda = f² × n × k / (1 - rho)

df1 = (k-1)×epsilon
df2 = (n-1)(k-1)×epsilon`,
    variables: [
      { symbol: 'f', description: 'Cohen\'s f for the within-subject effect' },
      { symbol: 'n', description: 'Number of subjects' },
      { symbol: 'k', description: 'Number of timepoints' },
      { symbol: 'rho', description: 'Correlation between repeated measurements' },
      { symbol: 'epsilon', description: 'Sphericity correction (default = 1)' },
    ],
    notes: [
      'Higher correlation increases power for within-subject effects, because subject differences are removed from the error term',
      'Apply Greenhouse-Geisser correction if sphericity is violated',
    ],
    limitations: [
      'Assumes compound symmetry',
      'Does not apply to between-subject effects, where higher correlation reduces power',
    ],
    references: [
      { text: 'Maxwell & Delaney (2004). Designing Experiments' },
      { text: 'Faul et al. (2007). G*Power 3. Behavior Research Methods, 39, 175-191' },
    ],
  },

  NESTED_ANOVA: {
    title: 'Nested ANOVA Power Formula',
    formula: `Treatment (between-cluster) effect:
Power = P(F > F_crit | lambda)

Design Effect = 1 + (m-1)×ICC
lambda = f² × g × c × m / Design Effect
df1 = g - 1
df2 = g × (c - 1)`,
    variables: [
      { symbol: 'f', description: 'Cohen\'s f for the treatment effect' },
      { symbol: 'g', description: 'Number of treatment groups' },
      { symbol: 'c', description: 'Clusters (sites) per group' },
      { symbol: 'm', description: 'Observations (subplots) per cluster' },
      { symbol: 'ICC', description: 'Intraclass correlation' },
    ],
    notes: [
      'ICC measures the clustering effect',
      'Higher ICC reduces power; adding clusters helps more than adding observations per cluster',
      'The error degrees of freedom come from clusters, not individual observations',
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

f² = R²/(1-R²)
lambda = N × R²/(1-R²)
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
      'Parametric F approximation to the permutation test',
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

mu2 = mu1 × 2^log2FC
se = sqrt([(phi + 1/mu1) + (phi + 1/mu2)] / n)   (natural-log scale)
ncp = |log2FC| × ln(2) / se
z_crit = inverse_normal(1 - alpha_adj/2)

Multiple testing:
alpha_adj = alpha / m  (Bonferroni)`,
    variables: [
      { symbol: 'log2FC', description: 'Log2 fold-change' },
      { symbol: 'phi', description: 'Dispersion parameter (Var = mu + phi × mu²)' },
      { symbol: 'mu1', description: 'Base mean count (control group)' },
      { symbol: 'n', description: 'Samples per group' },
      { symbol: 'm', description: 'Number of taxa tested' },
    ],
    notes: [
      'Wald test for a negative binomial GLM',
      'Higher dispersion reduces power',
    ],
    limitations: [
      'Dispersion estimates unstable with n<5',
      'Ignores the dispersion shrinkage DESeq2 applies across taxa',
    ],
    references: [
      { text: 'Love et al. (2014). DESeq2. Genome Biology, 15, 550' },
      { text: 'Hart et al. (2013). Journal of Computational Biology, 20, 970-978' },
    ],
  },

  ZERO_INFLATED: {
    title: 'Zero-Inflated Negative Binomial Power',
    formula: `Count Power (negative binomial Wald test):
Effective n = n × (1-pi)
mu2 = mu × 2^log2FC
se_count = sqrt([(phi + 1/mu) + (phi + 1/mu2)] / Effective n)
Power_count = 1 - Phi(z_crit - ncp) + Phi(-z_crit - ncp),  ncp = |log2FC| × ln(2) / se_count

Zero Power (difference in zero proportions):
p1 = pi,  Delta_pi = min(0.2, pi/2),  p2 = p1 - Delta_pi
se_zero = sqrt([p1(1-p1) + p2(1-p2)] / n)
Power_zero = 1 - Phi(z_crit - ncp) + Phi(-z_crit - ncp),  ncp = Delta_pi / se_zero

Both: each part tested at alpha/2
Combined = 1 - (1-Power_count)×(1-Power_zero)`,
    variables: [
      { symbol: 'n', description: 'Samples per group' },
      { symbol: 'pi', description: 'Zero-inflation proportion (control group)' },
      { symbol: 'Delta_pi', description: 'Assumed reduction in the zero proportion' },
      { symbol: 'mu', description: 'Mean of the count component' },
      { symbol: 'phi', description: 'Dispersion parameter' },
    ],
    notes: [
      'Models structural zeros separately',
      'High zero-inflation reduces the effective sample size for the count part',
      'z_crit uses alpha for a single part and alpha/2 per part when both are tested',
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
Time × treatment interaction, 2 groups, compound symmetry

Retained N = N × (1 - dropout)
Slope Inflation = 1 + sigma²_slope × (k-1)/k
lambda = f² × Retained N × k / [(1 - rho) × Slope Inflation]

df1 = k - 1
df2 = (Retained N - 2 - covariates) × (k - 1)`,
    variables: [
      { symbol: 'N', description: 'Total number of subjects (both groups)' },
      { symbol: 'k', description: 'Number of timepoints' },
      { symbol: 'f', description: 'Cohen\'s f for the time × treatment interaction' },
      { symbol: 'rho', description: 'Within-subject correlation' },
      { symbol: 'sigma²_slope', description: 'Random slope variance' },
      { symbol: 'dropout', description: 'Proportion of subjects lost by the final timepoint' },
    ],
    notes: [
      'THIS IS AN APPROXIMATION',
      'The interaction is a within-subject effect, so higher correlation increases power',
      'Use simulation (the exported R script, or simr in R) for power in complex designs',
    ],
    limitations: [
      'Less accurate with large random slopes (>0.5)',
      'Less accurate with high dropout (>20%)',
      'Treats dropouts as providing no information',
    ],
    references: [
      { text: 'Green & MacLeod (2016). SIMR package. Methods in Ecology and Evolution' },
    ],
  },

  BAYESIAN_ASSURANCE: {
    title: 'Bayesian Assurance Formula',
    formula: `Prior: theta ~ N(mu_prior, sigma²_prior), truncated to the valid range

Assurance(n) = P(Power(theta, n) >= target | prior)
             = P(theta >= MDE(n))
MDE(n) = smallest effect with Power(theta, n) >= target

Expected power(n) = E[Power(theta, n)] over the prior

Required n = smallest n with Assurance(n) >= target assurance`,
    variables: [
      { symbol: 'mu_prior', description: 'Prior mean effect size' },
      { symbol: 'sigma_prior', description: 'Prior uncertainty (SD)' },
      { symbol: 'target', description: 'Target power (e.g., 0.80)' },
      { symbol: 'MDE', description: 'Minimum detectable effect at sample size n' },
    ],
    notes: [
      'Accounts for effect size uncertainty',
      'Power counts rejections in the hypothesised (positive) direction',
      'Both probabilities are computed exactly (no Monte Carlo noise)',
    ],
    limitations: [
      'Sensitive to prior specification',
    ],
    references: [
      { text: 'O\'Hagan, Stevens & Campbell (2005). Pharmaceutical Statistics, 4, 187-201' },
    ],
  },

  BAYESIAN_SEQUENTIAL: {
    title: 'Bayesian Sequential Design',
    formula: `At interim look i (information I_i, final information T):
PP_i = P(final test significant at n_max | data so far)
       under a non-informative analysis prior

Stop for futility if: PP_i <= threshold_low
Stop for success if:  PP_i >= threshold_high

Expected N = Sum n_i × P(stop at i)
Power and type I error estimated by simulating trials
(effect drawn from the prior, or zero for type I error)`,
    variables: [
      { symbol: 'n_i', description: 'Sample size at look i' },
      { symbol: 'PP_i', description: 'Predictive probability of final success' },
      { symbol: 'threshold_low', description: 'Futility threshold' },
      { symbol: 'threshold_high', description: 'Success (superiority) threshold' },
    ],
    notes: [
      'Can reduce expected N substantially',
      'Requires pre-specified stopping rules',
      'Information scale: n/2 (t-test), n - 3 (correlation), n per group (ANOVA)',
    ],
    limitations: [
      'Early success stopping can inflate the type I error; check the simulated value',
    ],
    references: [
      { text: 'Berry et al. (2010). Bayesian Adaptive Methods' },
    ],
  },

  BAYESIAN_CALIBRATION: {
    title: 'Bayesian Calibration Formula',
    formula: `Frequentist to Bayesian Calibration:

Prior: theta ~ N(effect size, uncertainty²), truncated to the valid range
Assurance(n) = E[Power(theta, n)]   (expected power)

Point power = Power(effect size, n)
Recommended n = smallest n with Assurance(n) >= target power`,
    variables: [
      { symbol: 'theta', description: 'True effect size' },
      { symbol: 'uncertainty', description: 'Prior SD of the effect size' },
      { symbol: 'n', description: 'Sample size per group' },
    ],
    notes: [
      'Equals the frequentist power when the uncertainty is zero',
      'Uncertainty usually lowers assurance below the point power',
    ],
    references: [
      { text: 'O\'Hagan, Stevens & Campbell (2005). Pharmaceutical Statistics, 4, 187-201' },
    ],
  },

  BAYESIAN_REPLICATION: {
    title: 'Bayesian Replication Probability',
    formula: `Replication Probability = E[Power_rep(theta) | Data_orig]

Prior: theta ~ N(theta_hat / TypeM × s_m, (theta_hat / TypeM × s_sd)²)
Likelihood: theta_hat ~ N(theta, SE²)
Posterior: theta | data ~ N(m_post, sd_post²)  (conjugate normal)

P(rep) = Integral Power_rep(theta) × p(theta|data) dtheta`,
    variables: [
      { symbol: 'theta_hat', description: 'Original (published) effect estimate' },
      { symbol: 'SE', description: 'Standard error of the original estimate' },
      { symbol: 'TypeM', description: 'Exaggeration factor for the assumed publication bias (1, 1.2, 1.5, 2.2)' },
      { symbol: 's_m, s_sd', description: 'Skepticism settings for the prior mean and SD' },
    ],
    notes: [
      'Accounts for winner\'s curse',
      'Often lower than classical power',
    ],
    references: [
      { text: 'Anderson & Maxwell (2016). Psychological Methods' },
      { text: 'Gelman & Carlin (2014). Perspectives on Psychological Science, 9, 641-651' },
    ],
  },

  BAYESIAN_EQUIVALENCE: {
    title: 'Bayesian Equivalence Testing',
    formula: `P(equivalence) = P(theta in ROPE | data)
ROPE = [-delta, delta]

Declare equivalence if P(theta in ROPE | data) >= threshold
Assurance(n) = P(declare equivalence), simulated from the prior

Required N: smallest n with Assurance(n) >= target assurance`,
    variables: [
      { symbol: 'ROPE', description: 'Region of Practical Equivalence' },
      { symbol: 'delta', description: 'Equivalence margin' },
      { symbol: 'threshold', description: 'Required posterior probability inside the ROPE' },
    ],
    notes: [
      'More informative than TOST',
      'Requires scientific justification of ROPE',
      'Correlations are analysed on the Fisher z scale',
    ],
    references: [
      { text: 'Kruschke (2018). Advances in Methods and Practices in Psychological Science' },
    ],
  },

  BAYESIAN_HIERARCHICAL: {
    title: 'Bayesian Hierarchical Design',
    formula: `Design Effect = 1 + (m-1)×ICC
ICC ~ Beta(alpha_ICC, beta_ICC)
Effective n per group = J × m / Design Effect

Assurance(J) = E_ICC[ P(Power(theta, effective n) >= target) ]

Without uncertainty:
Required J = n_total × Design Effect / m`,
    variables: [
      { symbol: 'J', description: 'Number of clusters per group' },
      { symbol: 'm', description: 'Cluster size' },
      { symbol: 'n_total', description: 'Sample size per group needed without clustering' },
      { symbol: 'ICC', description: 'Intraclass correlation' },
    ],
    notes: [
      'Accounts for uncertainty in both the ICC and the effect size',
      'Clustering multiplies the number of observations needed by the design effect',
    ],
    references: [
      { text: 'Raudenbush & Bryk (2002). HLM' },
    ],
  },

  BAYESIAN_PERMANOVA: {
    title: 'Bayesian PERMANOVA Assurance',
    formula: `Assurance = P(Power >= target | R² prior)

R² ~ N(mu_R2, sigma²_R2), truncated to [0, 1)
Power(R², n) = P(F > F_crit | lambda)
lambda = n × k × R²/(1-R²),  df1 = k-1, df2 = k(n-1)
Assurance = P(R² >= MDE(n))`,
    variables: [
      { symbol: 'mu_R2', description: 'Prior mean R²' },
      { symbol: 'sigma_R2', description: 'Prior uncertainty in R²' },
      { symbol: 'n', description: 'Samples per group' },
      { symbol: 'k', description: 'Number of groups' },
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
    formula: `Outcomes: y ~ N(mu_i, 1), mu_i drawn from each treatment's prior
Posterior (conjugate normal) after n_i observations:
  precision_i = 1/sd_i² + n_i
  mean_i = (mu0_i/sd_i² + sum y) / precision_i

Allocation of each new participant (after a 20% burn-in in rotation):
  Thompson: draw from each posterior, pick the largest
  Optimal: pick the largest posterior mean
  Equal: rotate

Power (ANOVA with unequal n at the prior means):
  lambda = Sum n_i (mu_i - weighted mean)²`,
    variables: [
      { symbol: 'mu_i', description: 'Mean outcome of treatment i (in outcome SD units)' },
      { symbol: 'n_i', description: 'Samples allocated to treatment i' },
      { symbol: 'mu0_i, sd_i', description: 'Prior mean and SD for treatment i' },
    ],
    notes: [
      'Allocates more participants to better-performing treatments',
      'Can improve ethical outcomes',
      'Requires careful calibration to control Type I error',
    ],
    limitations: [
      'Unequal allocation usually lowers power for the overall test',
      'Interim analyses must be pre-specified',
    ],
    references: [
      { text: 'Berry et al. (2010). Bayesian Adaptive Methods for Clinical Trials' },
    ],
  },

  BAYESIAN_INFORMATION_DESIGN: {
    title: 'Bayesian Information-Based Design',
    formula: `Fisher information for each design:
  t-test: I = n / (2 sigma²)   (difference of two means, n per group)
  ANOVA:  I = n / sigma²

Posterior SD = sqrt(1 / (1/sd_prior² + I))
Uncertainty reduction = 1 - Posterior SD / sd_prior
Cost per information = Cost / I

Designs are ranked by the chosen objective
(maximum I, lowest cost per information, or lowest posterior SD)`,
    variables: [
      { symbol: 'I', description: 'Fisher information about the effect' },
      { symbol: 'sigma', description: 'Measurement error SD of the design' },
      { symbol: 'sd_prior', description: 'Prior SD of the effect' },
    ],
    notes: [
      'Balances information gain against cost',
      'Particularly useful for expensive experiments',
    ],
    limitations: [
      'Assumes a normal model with known measurement error',
    ],
    references: [
      { text: 'Chaloner & Verdinelli (1995). Bayesian Experimental Design' },
      { text: 'Ryan et al. (2016). Statistical Science' },
    ],
  },

  REPEATED_MEASURES_MICROBIOME: {
    title: 'Repeated Measures Microbiome Power (PERMANOVA)',
    formula: `F approximation for the time effect:

f² = R²/(1 - R²)
lambda = n × R²/(1 - R²) × k / (1 - rho)
Power = P(F > F_crit | lambda)
df1 = k - 1, df2 = (n - 1)(k - 1)`,
    variables: [
      { symbol: 'n', description: 'Number of subjects' },
      { symbol: 'k', description: 'Number of timepoints' },
      { symbol: 'rho', description: 'Within-subject correlation' },
      { symbol: 'R²', description: 'Effect size (variance explained by time)' },
    ],
    notes: [
      'Accounts for repeated sampling from the same subjects',
      'Higher correlation increases power for the within-subject time effect',
      'Restrict permutations within subjects in the analysis',
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
