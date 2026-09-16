/**
 * Utility functions to generate R code for power analyses.
 * Each script reproduces the calculation the corresponding PEEP calculator performs
 * (same parameterization, same sample-size units) and, where useful, adds a
 * simulation check. Scripts only use base R unless a package is needed for a
 * simulation model; optional cross-checks are guarded with requireNamespace().
 */

export interface RCodeParams {
  testType: 'ttest' | 'correlation' | 'chisquare' | 'oneway-anova' | 'twoway-anova' |
            'repeated-measures' | 'nested-anova' | 'permanova' | 'repeated-permanova' | 'bayesian' |
            'deseq' | 'zinb' | 'lmm-microbiome' |
            'bayesian-sequential' | 'bayesian-replication' | 'bayesian-information' |
            'bayesian-hierarchical' | 'bayesian-adaptive' | 'bayesian-equivalence' |
            'bayesian-model-comparison' | 'bayesian-calibration' |
            'bayesian-microbiome-deseq' | 'bayesian-microbiome-lmm';
  parameters: Record<string, any>;
}

/** A finite number for interpolation into R; falls back when the value is missing or not finite. */
const num = (value: unknown, fallback: number): number => {
  const v = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
};

/** A safely quoted R string literal (JSON string escaping is valid R string syntax). */
const rStr = (value: unknown): string => JSON.stringify(String(value ?? ''));

/** One of the allowed values, or the fallback. */
const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

const rBool = (value: unknown): string => (value ? 'TRUE' : 'FALSE');

export const generateRCode = (params: RCodeParams): string => {
  const { testType, parameters } = params;
  const p = parameters ?? {};

  switch (testType) {
    case 'ttest':
      return generateTTestRCode(p);
    case 'correlation':
      return generateCorrelationRCode(p);
    case 'chisquare':
      return generateChiSquareRCode(p);
    case 'oneway-anova':
      return generateOneWayAnovaRCode(p);
    case 'twoway-anova':
      return generateTwoWayAnovaRCode(p);
    case 'repeated-measures':
      return generateRepeatedMeasuresRCode(p);
    case 'nested-anova':
      return generateNestedAnovaRCode(p);
    case 'permanova':
      return generatePERMANOVARCode(p);
    case 'repeated-permanova':
      return generateRepeatedPERMANOVARCode(p);
    case 'bayesian':
    case 'bayesian-microbiome-deseq':
    case 'bayesian-microbiome-lmm':
      return generateBayesianRCode(p);
    case 'deseq':
      return generateDESeqRCode(p);
    case 'zinb':
      return generateZINBRCode(p);
    case 'lmm-microbiome':
      return generateLMMMicrobiomeRCode(p);
    case 'bayesian-sequential':
      return generateSequentialRCode(p);
    case 'bayesian-replication':
      return generateReplicationRCode(p);
    case 'bayesian-information':
      return generateInformationDesignRCode(p);
    case 'bayesian-hierarchical':
      return generateHierarchicalRCode(p);
    case 'bayesian-adaptive':
      return generateAdaptiveAllocationRCode(p);
    case 'bayesian-equivalence':
      return generateEquivalenceRCode(p);
    case 'bayesian-model-comparison':
      return generateModelComparisonRCode(p);
    case 'bayesian-calibration':
      return generateCalibrationRCode(p);
    default:
      return '# Unknown test type';
  }
};

// ---------------------------------------------------------------------------
// Shared R helpers
// ---------------------------------------------------------------------------

/** Power helpers used by the Bayesian scripts (mirror src/utils/bayesianPowerCalculations.ts). */
const R_BAYES_HELPERS = `# ---- Helper functions (mirror PEEP's calculations) ----
# Sample-size units: n per group for ttest, anova and permanova; total n for correlation.
# Effect units: d (ttest), f (anova), r (correlation), R2 (permanova).

# Power of the two-sided level-alpha test, counting only rejections in the
# hypothesised (positive) direction.
directional_power <- function(test, n, effect, alpha, groups = 2) {
  if (!is.finite(n) || is.na(effect)) return(0)
  if (test == "ttest") {
    if (n < 2) return(0)
    df <- 2 * n - 2
    return(suppressWarnings(pt(qt(1 - alpha / 2, df), df, ncp = effect * sqrt(n / 2), lower.tail = FALSE)))
  }
  if (test == "correlation") {
    if (n <= 3) return(0)
    r <- min(max(effect, -0.9999), 0.9999)
    return(pnorm(qnorm(1 - alpha / 2) - atanh(r) * sqrt(n - 3), lower.tail = FALSE))
  }
  k <- groups
  if (k < 2 || n < 2) return(0)
  df1 <- k - 1
  df2 <- n * k - k
  if (test == "anova") {
    lambda <- max(0, effect)^2 * n * k
  } else {
    r2 <- min(max(effect, 0), 0.999)
    lambda <- n * k * r2 / (1 - r2)
  }
  pf(qf(1 - alpha, df1, df2), df1, df2, ncp = lambda, lower.tail = FALSE)
}

# Conventional two-sided power (both rejection regions)
two_sided_power <- function(test, n, effect, alpha, groups = 2) {
  if (test == "ttest") {
    if (n < 2) return(0)
    df <- 2 * n - 2
    tc <- qt(1 - alpha / 2, df)
    ncp <- effect * sqrt(n / 2)
    return(suppressWarnings(pt(tc, df, ncp = ncp, lower.tail = FALSE) + pt(-tc, df, ncp = ncp)))
  }
  if (test == "correlation") {
    if (n <= 3) return(0)
    zc <- qnorm(1 - alpha / 2)
    ncp <- atanh(min(abs(effect), 0.9999)) * sqrt(n - 3)
    return(pnorm(ncp - zc) + pnorm(-zc - ncp))
  }
  directional_power(test, n, effect, alpha, groups)
}

# Valid range of the effect size (the prior is truncated to it)
effect_support <- function(test) {
  switch(test, anova = c(0, Inf), permanova = c(0, 1), correlation = c(-1, 1), c(-Inf, Inf))
}

# Smallest effect whose power reaches the target (Inf if unreachable)
mde_for <- function(power_fn, target, hi) {
  if (power_fn(hi) < target) return(Inf)
  if (power_fn(0) >= target) return(0)
  uniroot(function(x) power_fn(x) - target, c(0, hi), tol = 1e-9)$root
}

min_detectable_effect <- function(test, n, target, alpha, groups = 2) {
  hi <- switch(test, correlation = 0.9999, permanova = 0.999, 20)
  mde_for(function(x) directional_power(test, n, x, alpha, groups), target, hi)
}

# P(theta >= m) for theta ~ Normal(mean, sd) truncated to the support
trunc_survival <- function(m, mean, sd, support) {
  point <- min(max(mean, support[1]), support[2])
  if (sd <= 0) return(as.numeric(point >= m))
  z <- pnorm(support[2], mean, sd) - pnorm(support[1], mean, sd)
  if (z <= 1e-300) return(as.numeric(point >= m))
  lo <- max(m, support[1])
  if (lo >= support[2]) return(0)
  min(1, max(0, (pnorm(support[2], mean, sd) - pnorm(lo, mean, sd)) / z))
}

# Expected power E[power(theta, n)] with theta ~ Normal(mean, sd) truncated to the support
expected_power_fn <- function(power_fn, mean, sd, support) {
  if (sd <= 0) return(power_fn(min(max(mean, support[1]), support[2])))
  lo <- max(support[1], mean - 6 * sd)
  hi <- min(support[2], mean + 6 * sd)
  if (hi <= lo) return(power_fn(min(max(mean, support[1]), support[2])))
  z <- pnorm(hi, mean, sd) - pnorm(lo, mean, sd)
  f <- function(x) vapply(x, power_fn, numeric(1)) * dnorm(x, mean, sd) / z
  min(1, max(0, integrate(f, lo, hi, subdivisions = 500L, rel.tol = 1e-6)$value))
}

expected_power <- function(test, n, mean, sd, alpha, groups = 2) {
  expected_power_fn(function(x) directional_power(test, n, x, alpha, groups),
                    mean, sd, effect_support(test))
}

# Smallest integer n in [lo, hi] with pred(n) TRUE (pred must be monotone); NA if none
smallest_n <- function(lo, hi, pred) {
  if (!pred(hi)) return(NA)
  if (pred(lo)) return(lo)
  while (hi - lo > 1) {
    mid <- floor((lo + hi) / 2)
    if (pred(mid)) hi <- mid else lo <- mid
  }
  hi
}

# Conventional sample size for a target power at a fixed effect (Inf if not reachable)
required_n <- function(test, effect, target, alpha, groups = 2) {
  lo <- if (test == "correlation") 4 else 2
  pw <- function(n) two_sided_power(test, n, effect, alpha, groups)
  if (pw(lo) >= target) return(lo)
  hi <- lo
  repeat {
    hi <- hi * 2
    if (hi > 1e5) return(Inf)
    if (pw(hi) >= target) break
  }
  smallest_n(lo, hi, function(n) pw(n) >= target)
}
`;

// ---------------------------------------------------------------------------
// Classical tests
// ---------------------------------------------------------------------------

const generateTTestRCode = (params: any): string => {
  const n = num(params.n, 30);
  const d = num(params.effectSize, 0.5);
  const alpha = num(params.alpha, 0.05);

  return `# Two-Sample t-test Power Analysis
# Generated from PEEP
# Exact noncentral t: ncp = d * sqrt(n / 2), df = 2n - 2, n per group (same as PEEP)

# Parameters
n_per_group <- ${n}
effect_size_d <- ${d}  # Cohen's d
alpha <- ${alpha}

ttest_power <- function(n, d, alpha) {
  df <- 2 * n - 2
  ncp <- d * sqrt(n / 2)
  tc <- qt(1 - alpha / 2, df)
  suppressWarnings(pt(tc, df, ncp = ncp, lower.tail = FALSE) + pt(-tc, df, ncp = ncp))
}

power <- ttest_power(n_per_group, effect_size_d, alpha)
cat("Power:", round(power, 4), "with", n_per_group, "per group (total N =", 2 * n_per_group, ")\\n")

# Optional cross-check with the pwr package (same exact method)
if (requireNamespace("pwr", quietly = TRUE)) {
  print(pwr::pwr.t.test(n = n_per_group, d = effect_size_d, sig.level = alpha,
                        type = "two.sample", alternative = "two.sided"))
}

# Power curve
sample_sizes <- 2:max(200, ceiling(n_per_group * 1.5))
power_curve <- sapply(sample_sizes, ttest_power, d = effect_size_d, alpha = alpha)

plot(sample_sizes * 2, power_curve,
     type = "l", lwd = 2, col = "blue",
     xlab = "Total Sample Size (N)",
     ylab = "Statistical Power",
     main = "Power Curve: Two-Sample t-test",
     ylim = c(0, 1))
abline(h = 0.8, lty = 2, col = "red")
abline(v = n_per_group * 2, lty = 2, col = "darkgreen")
legend("bottomright",
       legend = c("Power curve", "Target power (0.8)", "Current N"),
       col = c("blue", "red", "darkgreen"), lty = c(1, 2, 2), lwd = c(2, 1, 1))

results_df <- data.frame(N_per_Group = sample_sizes, Total_N = sample_sizes * 2, Power = power_curve)
write.csv(results_df, "ttest_power_curve.csv", row.names = FALSE)
`;
};

const generateCorrelationRCode = (params: any): string => {
  const n = num(params.n, 50);
  const rho = num(params.rho, 0.3);
  const alpha = num(params.alpha, 0.05);

  return `# Correlation Power Analysis
# Generated from PEEP
# Fisher z test of H0: rho = 0, ncp = atanh(|r|) * sqrt(n - 3), two-sided (same as PEEP)

# Parameters
n <- ${n}  # Total sample size (pairs)
rho <- ${rho}  # Expected correlation coefficient
alpha <- ${alpha}

cor_power <- function(n, r, alpha) {
  if (n <= 3) return(0)
  zc <- qnorm(1 - alpha / 2)
  ncp <- atanh(min(abs(r), 0.9999)) * sqrt(n - 3)
  pnorm(ncp - zc) + pnorm(-zc - ncp)
}

power <- cor_power(n, rho, alpha)
cat("Power:", round(power, 4), "with N =", n, "\\n")
cat("Note: PEEP caps displayed power at 0.999.\\n")
cat("pwr::pwr.r.test uses a slightly different (bias-corrected) approximation.\\n")

# Power curve
sample_sizes <- 4:max(200, ceiling(n * 1.5))
power_curve <- sapply(sample_sizes, cor_power, r = rho, alpha = alpha)

plot(sample_sizes, power_curve,
     type = "l", lwd = 2, col = "blue",
     xlab = "Total Sample Size",
     ylab = "Statistical Power",
     main = "Power Curve: Pearson Correlation",
     ylim = c(0, 1))
abline(h = 0.8, lty = 2, col = "red")
abline(v = n, lty = 2, col = "darkgreen")
legend("bottomright",
       legend = c("Power curve", "Target power (0.8)", "Current N"),
       col = c("blue", "red", "darkgreen"), lty = c(1, 2, 2), lwd = c(2, 1, 1))

results_df <- data.frame(Sample_Size = sample_sizes, Power = power_curve)
write.csv(results_df, "correlation_power_curve.csv", row.names = FALSE)
`;
};

const generateChiSquareRCode = (params: any): string => {
  const n = num(params.n, 100);
  const w = num(params.w, 0.3);
  const df = num(params.df, 1);
  const alpha = num(params.alpha, 0.05);

  return `# Chi-Square Test Power Analysis
# Generated from PEEP
# Exact noncentral chi-square with lambda = w^2 * N (same as PEEP)

# Parameters
n <- ${n}  # Total sample size
effect_size_w <- ${w}  # Cohen's w
df <- ${df}  # Degrees of freedom
alpha <- ${alpha}

chisq_power <- function(N, w, df, alpha) {
  pchisq(qchisq(1 - alpha, df), df, ncp = w^2 * N, lower.tail = FALSE)
}

power <- chisq_power(n, effect_size_w, df, alpha)
cat("Power:", round(power, 4), "with N =", n, "and df =", df, "\\n")

# Optional cross-check with the pwr package (same exact method)
if (requireNamespace("pwr", quietly = TRUE)) {
  print(pwr::pwr.chisq.test(w = effect_size_w, N = n, df = df, sig.level = alpha))
}

# Power curve
sample_sizes <- seq(10, max(500, ceiling(n * 1.5)), by = 5)
power_curve <- sapply(sample_sizes, chisq_power, w = effect_size_w, df = df, alpha = alpha)

plot(sample_sizes, power_curve,
     type = "l", lwd = 2, col = "blue",
     xlab = "Total Sample Size (N)",
     ylab = "Statistical Power",
     main = "Power Curve: Chi-Square Test",
     ylim = c(0, 1))
abline(h = 0.8, lty = 2, col = "red")
abline(v = n, lty = 2, col = "darkgreen")
legend("bottomright",
       legend = c("Power curve", "Target power (0.8)", "Current N"),
       col = c("blue", "red", "darkgreen"), lty = c(1, 2, 2), lwd = c(2, 1, 1))

results_df <- data.frame(Sample_Size = sample_sizes, Power = power_curve)
write.csv(results_df, "chisquare_power_curve.csv", row.names = FALSE)
`;
};

const generateOneWayAnovaRCode = (params: any): string => {
  const n = num(params.n, 30);
  const groups = num(params.groups, 3);
  const f = num(params.effectSize, 0.25);
  const alpha = num(params.alpha, 0.05);

  return `# One-Way ANOVA Power Analysis
# Generated from PEEP
# Exact noncentral F: lambda = f^2 * k * n, df1 = k - 1, df2 = k(n - 1), n per group (same as PEEP)

# Parameters
n_per_group <- ${n}
num_groups <- ${groups}
effect_size_f <- ${f}  # Cohen's f
alpha <- ${alpha}

anova_power <- function(n, k, f, alpha) {
  df1 <- k - 1
  df2 <- k * n - k
  if (df2 <= 0) return(0)
  pf(qf(1 - alpha, df1, df2), df1, df2, ncp = f^2 * k * n, lower.tail = FALSE)
}

power <- anova_power(n_per_group, num_groups, effect_size_f, alpha)
cat("Power:", round(power, 4), "with", n_per_group, "per group (total N =",
    n_per_group * num_groups, ")\\n")

# Optional cross-check with the pwr package (same parameterization: k groups, n per group)
if (requireNamespace("pwr", quietly = TRUE)) {
  print(pwr::pwr.anova.test(k = num_groups, n = n_per_group, f = effect_size_f, sig.level = alpha))
}

# Power curve
sample_sizes_per_group <- 2:max(100, ceiling(n_per_group * 3))
power_curve <- sapply(sample_sizes_per_group, anova_power,
                      k = num_groups, f = effect_size_f, alpha = alpha)

plot(sample_sizes_per_group * num_groups, power_curve,
     type = "l", lwd = 2, col = "blue",
     xlab = "Total Sample Size (N)",
     ylab = "Statistical Power",
     main = "Power Curve: One-Way ANOVA",
     ylim = c(0, 1))
abline(h = 0.8, lty = 2, col = "red")
abline(v = n_per_group * num_groups, lty = 2, col = "darkgreen")
legend("bottomright",
       legend = c("Power curve", "Target power (0.8)", "Current N"),
       col = c("blue", "red", "darkgreen"), lty = c(1, 2, 2), lwd = c(2, 1, 1))

results_df <- data.frame(
  N_per_Group = sample_sizes_per_group,
  Total_N = sample_sizes_per_group * num_groups,
  Power = power_curve
)
write.csv(results_df, "oneway_anova_power_curve.csv", row.names = FALSE)
`;
};

const generateTwoWayAnovaRCode = (params: any): string => {
  const nPerCell = num(params.nPerCell, 10);
  const a = num(params.factorALevels, 2);
  const b = num(params.factorBLevels, 2);
  const fA = num(params.effectSizeA, 0.25);
  const fB = num(params.effectSizeB, 0.25);
  const fAB = num(params.effectSizeAB, 0.25);
  const alpha = num(params.alpha, 0.05);

  return `# Two-Way ANOVA Power Analysis
# Generated from PEEP
# Exact noncentral F for each effect (same as PEEP):
#   lambda = f^2 * N, N = a * b * n (n per cell), df_error = a * b * (n - 1)
# (WebPower::wp.kanova(n = N, ndf = ..., f = ..., ng = a * b) uses the same model.)

# Parameters
n_per_cell <- ${nPerCell}
factor_A_levels <- ${a}
factor_B_levels <- ${b}
effect_size_A <- ${fA}  # Cohen's f for main effect A
effect_size_B <- ${fB}  # Cohen's f for main effect B
effect_size_AB <- ${fAB}  # Cohen's f for interaction
alpha <- ${alpha}

twoway_power <- function(n, a, b, f, df1, alpha) {
  N <- a * b * n
  df2 <- a * b * (n - 1)
  if (df2 <= 0) return(0)
  pf(qf(1 - alpha, df1, df2), df1, df2, ncp = f^2 * N, lower.tail = FALSE)
}

df_A <- factor_A_levels - 1
df_B <- factor_B_levels - 1
df_AB <- (factor_A_levels - 1) * (factor_B_levels - 1)

power_A <- twoway_power(n_per_cell, factor_A_levels, factor_B_levels, effect_size_A, df_A, alpha)
power_B <- twoway_power(n_per_cell, factor_A_levels, factor_B_levels, effect_size_B, df_B, alpha)
power_AB <- twoway_power(n_per_cell, factor_A_levels, factor_B_levels, effect_size_AB, df_AB, alpha)

cat("\\n=== Two-Way ANOVA Power Analysis Results ===\\n")
cat("Total N:", n_per_cell * factor_A_levels * factor_B_levels, "\\n")
cat("Main Effect A:", round(power_A, 4), "\\n")
cat("Main Effect B:", round(power_B, 4), "\\n")
cat("Interaction AxB:", round(power_AB, 4), "\\n")

# Power curves
sample_sizes <- 2:max(100, ceiling(n_per_cell * 3))
cells <- factor_A_levels * factor_B_levels
power_curve_A <- sapply(sample_sizes, twoway_power, a = factor_A_levels, b = factor_B_levels,
                        f = effect_size_A, df1 = df_A, alpha = alpha)
power_curve_B <- sapply(sample_sizes, twoway_power, a = factor_A_levels, b = factor_B_levels,
                        f = effect_size_B, df1 = df_B, alpha = alpha)
power_curve_AB <- sapply(sample_sizes, twoway_power, a = factor_A_levels, b = factor_B_levels,
                         f = effect_size_AB, df1 = df_AB, alpha = alpha)

plot(sample_sizes * cells, power_curve_A,
     type = "l", lwd = 2, col = "blue",
     xlab = "Total Sample Size (N)",
     ylab = "Statistical Power",
     main = "Power Curves: Two-Way ANOVA",
     ylim = c(0, 1))
lines(sample_sizes * cells, power_curve_B, lwd = 2, col = "darkgreen")
lines(sample_sizes * cells, power_curve_AB, lwd = 2, col = "red")
abline(h = 0.8, lty = 2, col = "gray")
legend("bottomright",
       legend = c("Main Effect A", "Main Effect B", "Interaction AxB", "Target (0.8)"),
       col = c("blue", "darkgreen", "red", "gray"),
       lty = c(1, 1, 1, 2), lwd = c(2, 2, 2, 1))

results_df <- data.frame(
  N_per_Cell = sample_sizes,
  Total_N = sample_sizes * cells,
  Power_MainA = power_curve_A,
  Power_MainB = power_curve_B,
  Power_Interaction = power_curve_AB
)
write.csv(results_df, "twoway_anova_power_curves.csv", row.names = FALSE)
`;
};

const generateRepeatedMeasuresRCode = (params: any): string => {
  const subjects = num(params.subjects, 30);
  const timepoints = num(params.timepoints, 4);
  const f = num(params.effectSize, 0.25);
  const rho = num(params.correlation, 0.5);
  const alpha = num(params.alpha, 0.05);

  return `# Repeated Measures ANOVA Power Analysis (within-subject effect)
# Generated from PEEP
# Exact noncentral F with compound symmetry and sphericity (epsilon = 1), same as PEEP:
#   lambda = f^2 * N * m / (1 - rho), df1 = m - 1, df2 = (N - 1)(m - 1)
# Higher within-subject correlation increases power for the within-subject effect.
# Apply a Greenhouse-Geisser or Huynh-Feldt correction in the analysis if sphericity fails.

# Parameters
subjects <- ${subjects}
timepoints <- ${timepoints}
effect_size_f <- ${f}  # Cohen's f for the within-subjects effect
correlation <- ${rho}  # Correlation between repeated measurements
alpha <- ${alpha}

rm_power <- function(N, m, f, rho, alpha) {
  rho <- min(max(rho, -0.99), 0.99)
  df1 <- m - 1
  df2 <- (N - 1) * (m - 1)
  if (df1 <= 0 || df2 <= 0) return(0)
  lambda <- f^2 * N * m / (1 - rho)
  pf(qf(1 - alpha, df1, df2), df1, df2, ncp = lambda, lower.tail = FALSE)
}

power <- rm_power(subjects, timepoints, effect_size_f, correlation, alpha)
cat("Power:", round(power, 4), "with", subjects, "subjects x", timepoints, "timepoints\\n")

# Power curve
subject_sizes <- 2:max(200, ceiling(subjects * 1.5))
power_curve <- sapply(subject_sizes, rm_power, m = timepoints, f = effect_size_f,
                      rho = correlation, alpha = alpha)

plot(subject_sizes, power_curve,
     type = "l", lwd = 2, col = "blue",
     xlab = "Number of Subjects",
     ylab = "Statistical Power",
     main = "Power Curve: Repeated Measures ANOVA",
     ylim = c(0, 1))
abline(h = 0.8, lty = 2, col = "red")
abline(v = subjects, lty = 2, col = "darkgreen")
legend("bottomright",
       legend = c("Power curve", "Target power (0.8)", "Current N"),
       col = c("blue", "red", "darkgreen"), lty = c(1, 2, 2), lwd = c(2, 1, 1))

results_df <- data.frame(
  Subjects = subject_sizes,
  Total_Observations = subject_sizes * timepoints,
  Power = power_curve
)
write.csv(results_df, "repeated_measures_power_curve.csv", row.names = FALSE)
`;
};

const generateNestedAnovaRCode = (params: any): string => {
  const sites = num(params.sitesPerTreatment, 6);
  const subplots = num(params.subplotsPerSite, 10);
  const f = num(params.effectSize, 0.25);
  const icc = num(params.icc, 0.1);
  const groups = num(params.groups, 2);
  const alpha = num(params.alpha, 0.05);

  return `# Nested ANOVA Power Analysis (subplots nested in sites nested in treatments)
# Generated from PEEP
# Analytic power (same as PEEP):
#   DE = 1 + (m - 1) * ICC
#   lambda = f^2 * g * c * m / DE
#   df1 = g - 1, df2 = g * (c - 1)
# g = treatments, c = sites per treatment, m = subplots per site, f = Cohen's f

# Parameters
num_treatments <- ${groups}
sites_per_treatment <- ${sites}
subplots_per_site <- ${subplots}
effect_size_f <- ${f}  # Cohen's f
icc <- ${icc}  # Intraclass correlation among subplots within a site
alpha <- ${alpha}

nested_power <- function(g, c, m, f, icc, alpha) {
  de <- 1 + (m - 1) * icc
  df1 <- g - 1
  df2 <- g * (c - 1)
  if (df1 <= 0 || df2 <= 0) return(0)
  lambda <- f^2 * g * c * m / de
  pf(qf(1 - alpha, df1, df2), df1, df2, ncp = lambda, lower.tail = FALSE)
}

design_effect <- 1 + (subplots_per_site - 1) * icc
cat("\\n=== Nested ANOVA Design ===\\n")
cat("Treatments:", num_treatments, "\\n")
cat("Sites per treatment:", sites_per_treatment, "\\n")
cat("Subplots per site:", subplots_per_site, "\\n")
cat("Design effect (ICC =", icc, "):", round(design_effect, 3), "\\n")
cat("Effective n per treatment:",
    round(sites_per_treatment * subplots_per_site / design_effect, 1), "\\n")

analytic_power <- nested_power(num_treatments, sites_per_treatment, subplots_per_site,
                               effect_size_f, icc, alpha)
cat("Analytic power:", round(analytic_power, 4), "\\n")

# Power curve over the number of sites per treatment
site_counts <- 2:100
power_curve <- sapply(site_counts, function(cc)
  nested_power(num_treatments, cc, subplots_per_site, effect_size_f, icc, alpha))
plot(site_counts, power_curve, type = "l", lwd = 2, col = "blue",
     xlab = "Sites per Treatment", ylab = "Power",
     main = "Power Curve: Nested ANOVA", ylim = c(0, 1))
abline(h = 0.8, lty = 2, col = "red")
abline(v = sites_per_treatment, lty = 2, col = "darkgreen")
write.csv(data.frame(Sites_per_Treatment = site_counts, Power = power_curve),
          "nested_anova_power_curve.csv", row.names = FALSE)

# ---- Simulation check with a mixed model ----
# Treatment means are equally spaced and scaled so that their SD equals f
# (total variance 1 = ICC between sites + (1 - ICC) within sites).
if (!requireNamespace("nlme", quietly = TRUE)) install.packages("nlme")
library(nlme)

simulate_nested <- function(g, c, m, f, icc, alpha_level, nsim = 500) {
  raw <- seq_len(g) - mean(seq_len(g))
  mu <- raw * f / sqrt(mean(raw^2))
  n_sites <- g * c
  p_values <- rep(NA_real_, nsim)
  for (i in seq_len(nsim)) {
    site <- factor(rep(seq_len(n_sites), each = m))
    treatment <- factor(rep(seq_len(g), each = c * m))
    site_effect <- rep(rnorm(n_sites, 0, sqrt(icc)), each = m)
    y <- mu[as.integer(treatment)] + site_effect + rnorm(n_sites * m, 0, sqrt(1 - icc))
    dat <- data.frame(y = y, treatment = treatment, site = site)
    fit <- try(lme(y ~ treatment, random = ~ 1 | site, data = dat), silent = TRUE)
    if (!inherits(fit, "try-error")) {
      p_values[i] <- anova(fit)["treatment", "p-value"]
    }
  }
  mean(p_values < alpha_level, na.rm = TRUE)
}

cat("\\nRunning 500 simulations (about a minute)...\\n")
set.seed(123)
simulated_power <- simulate_nested(num_treatments, sites_per_treatment, subplots_per_site,
                                   effect_size_f, icc, alpha)
cat("Simulated power:", round(simulated_power, 3), "\\n")
cat("\\nSee: Donner & Klar (2000) Design and Analysis of Cluster Randomization Trials\\n")
`;
};

// ---------------------------------------------------------------------------
// PERMANOVA
// ---------------------------------------------------------------------------

const generatePERMANOVARCode = (params: any): string => {
  const nPerGroup = num(params.nPerGroup, 20);
  const groups = num(params.groups, 3);
  const r2 = num(params.rSquared, 0.1);
  const alpha = num(params.alpha, 0.05);

  return `# PERMANOVA Power Analysis
# Generated from PEEP
# Analytic approximation (same as PEEP): f^2 = R2 / (1 - R2),
#   lambda = N * R2 / (1 - R2), df1 = k - 1, df2 = N - k, N = k * n
# The simulation below encodes R2 directly: normal data with between-group variance
# R2 / (1 - R2) and within-group variance 1, analysed with Euclidean PERMANOVA.
# With p = 1 (default) this is the setting the F approximation describes. Spreading the
# same effect over several variables (p > 1) raises power; adding pure-noise variables
# lowers it. It runs in about a minute.

if (!requireNamespace("vegan", quietly = TRUE)) install.packages("vegan")
library(vegan)

# Parameters
n_per_group <- ${nPerGroup}
num_groups <- ${groups}
r_squared <- ${r2}  # Expected proportion of variance explained
alpha <- ${alpha}

permanova_power <- function(n, k, r2, alpha) {
  N <- n * k
  df1 <- k - 1
  df2 <- N - k
  if (df2 <= 0) return(0)
  pf(qf(1 - alpha, df1, df2), df1, df2, ncp = N * r2 / (1 - r2), lower.tail = FALSE)
}

analytic_power <- permanova_power(n_per_group, num_groups, r_squared, alpha)
cat("\\n=== PERMANOVA Power Analysis ===\\n")
cat("n per group:", n_per_group, " groups:", num_groups, " R2:", r_squared, "\\n")
cat("Analytic power:", round(analytic_power, 4), "\\n\\n")

simulate_permanova <- function(n, k, r2, alpha, nsim = 200, nperm = 199, p = 1) {
  raw <- seq_len(k) - mean(seq_len(k))
  shift <- raw / sqrt(mean(raw^2)) * sqrt(r2 / (1 - r2))
  grp <- factor(rep(seq_len(k), each = n))
  dat <- data.frame(grp = grp)
  p_values <- numeric(nsim)
  for (i in seq_len(nsim)) {
    X <- matrix(rnorm(length(grp) * p), ncol = p) + shift[as.integer(grp)]
    res <- adonis2(dist(X) ~ grp, data = dat, permutations = nperm)
    p_values[i] <- res[["Pr(>F)"]][1]
  }
  mean(p_values <= alpha)
}

cat("Running 200 simulations (199 permutations each)...\\n")
set.seed(123)
estimated_power <- simulate_permanova(n_per_group, num_groups, r_squared, alpha)
cat("Simulated power:", round(estimated_power, 3), "\\n")

# Sample size recommendations (analytic, with a quick simulation check)
cat("\\n=== Sample Size Recommendations ===\\n")
for (target_n in seq(5, 100, by = 5)) {
  pa <- permanova_power(target_n, num_groups, r_squared, alpha)
  cat("n =", target_n, "per group: analytic power =", round(pa, 3), "\\n")
  if (pa >= 0.8) {
    ps <- simulate_permanova(target_n, num_groups, r_squared, alpha, nsim = 100)
    cat("  simulated power at this n:", round(ps, 2), "\\n")
    break
  }
}

cat("\\n*** IMPORTANT NOTES ***\\n")
cat("1. Power depends on the distance metric and on how the effect is spread across taxa\\n")
cat("2. Estimate realistic R2 values from pilot data\\n")
cat("3. Check homogeneity of dispersions (betadisper)\\n")
cat("\\nReference: Anderson (2001) Austral Ecology 26:32-46\\n")
`;
};

const generateRepeatedPERMANOVARCode = (params: any): string => {
  const subjects = num(params.subjects, 20);
  const timepoints = num(params.timepoints, 3);
  const r2 = num(params.rSquared, 0.1);
  const rho = num(params.correlation, 0.5);
  const alpha = num(params.alpha, 0.05);

  return `# Repeated Measures PERMANOVA Power Analysis
# Generated from PEEP
# Analytic approximation (same as PEEP):
#   lambda = N * R2 / (1 - R2) * m / (1 - rho), df1 = m - 1, df2 = (N - 1)(m - 1)
# Higher within-subject correlation increases power for the time effect.

if (!requireNamespace("vegan", quietly = TRUE)) install.packages("vegan")
library(vegan)
library(permute)  # installed with vegan; provides how()

# Parameters
subjects <- ${subjects}
timepoints <- ${timepoints}
r_squared <- ${r2}  # Expected R2 for the time effect
correlation <- ${rho}  # Within-subject correlation
alpha <- ${alpha}

rm_permanova_power <- function(N, m, r2, rho, alpha) {
  rho <- min(max(rho, -0.99), 0.99)
  df1 <- m - 1
  df2 <- (N - 1) * (m - 1)
  if (df1 <= 0 || df2 <= 0) return(0)
  lambda <- N * r2 / (1 - r2) * m / (1 - rho)
  pf(qf(1 - alpha, df1, df2), df1, df2, ncp = lambda, lower.tail = FALSE)
}

analytic_power <- rm_permanova_power(subjects, timepoints, r_squared, correlation, alpha)
cat("\\n=== Repeated Measures PERMANOVA ===\\n")
cat("Subjects:", subjects, " timepoints:", timepoints, " R2:", r_squared,
    " correlation:", correlation, "\\n")
cat("Analytic power:", round(analytic_power, 4), "\\n\\n")

# Simulation: Euclidean data with subject effects (variance rho), residual variance
# 1 - rho and between-time variance R2 / (1 - R2) on each of p variables.
# p = 1 (default) matches the F approximation; p > 1 with the same effect on every
# variable gives more power.
# Permutations are restricted within subjects and the subject term is fitted first.
simulate_rm_permanova <- function(subj, tp, r2, rho, alpha, nsim = 200, nperm = 199, p = 1) {
  raw <- seq_len(tp) - mean(seq_len(tp))
  shift <- raw / sqrt(mean(raw^2)) * sqrt(r2 / (1 - r2))
  subject <- factor(rep(seq_len(subj), each = tp))
  time <- factor(rep(seq_len(tp), times = subj))
  dat <- data.frame(subject = subject, time = time)
  p_values <- numeric(nsim)
  for (i in seq_len(nsim)) {
    S <- matrix(rnorm(subj * p, 0, sqrt(rho)), nrow = subj)
    X <- matrix(rnorm(subj * tp * p, 0, sqrt(1 - rho)), ncol = p) +
      S[as.integer(subject), , drop = FALSE] + shift[as.integer(time)]
    res <- adonis2(dist(X) ~ subject + time, data = dat, by = "terms",
                   permutations = how(blocks = subject, nperm = nperm))
    p_values[i] <- res["time", "Pr(>F)"]
  }
  mean(p_values <= alpha)
}

cat("Running 200 simulations (199 permutations each)...\\n")
set.seed(123)
estimated_power <- simulate_rm_permanova(subjects, timepoints, r_squared, correlation, alpha)
cat("Simulated power:", round(estimated_power, 3), "\\n\\n")

if (analytic_power >= 0.8) {
  cat("Analytic power meets the 80% target\\n")
} else {
  needed <- NA
  for (N in subjects:5000) {
    if (rm_permanova_power(N, timepoints, r_squared, correlation, alpha) >= 0.8) {
      needed <- N
      break
    }
  }
  if (is.na(needed)) {
    cat("80% power is not reached with up to 5000 subjects\\n")
  } else {
    cat("Subjects needed for 80% power (analytic):", needed, "\\n")
  }
}

cat("\\n*** CRITICAL CONSIDERATIONS ***\\n")
cat("1. Restrict permutations within subjects: permutations = how(blocks = subject)\\n")
cat("2. Account for temporal autocorrelation in your data\\n")
cat("3. Consider missing data and dropout rates\\n")
cat("4. Check homogeneity of dispersions over time\\n")
cat("\\nReference: Anderson (2017) Wiley StatsRef: Permutational Multivariate Analysis of Variance\\n")
`;
};

// ---------------------------------------------------------------------------
// Bayesian assurance (generic, PERMANOVA, differential abundance, LMM)
// ---------------------------------------------------------------------------

const generateBayesianRCode = (params: any): string => {
  if (params.log2FCMean !== undefined) return generateBayesianDESeqRCode(params);
  if (params.nTimepoints !== undefined) return generateBayesianLMMRCode(params);

  const test = pick(params.testType, ['ttest', 'anova', 'correlation', 'permanova'] as const, 'ttest');
  const mean = num(params.effectMean ?? params.effectSizeMean, test === 'permanova' ? 0.1 : 0.5);
  const sd = num(params.effectSD ?? params.effectSizeSD, test === 'permanova' ? 0.05 : 0.2);
  const targetPower = num(params.targetPower, 0.8);
  const targetAssurance = num(params.targetAssurance, 0.8);
  const alpha = num(params.alpha, 0.05);
  const groups = num(params.groups, test === 'permanova' || test === 'anova' ? 3 : 2);
  const title = test === 'permanova' ? 'Bayesian Assurance for PERMANOVA' : 'Bayesian Assurance (Hybrid Bayesian Power) Analysis';
  const label = test === 'permanova' ? 'R2' : test === 'correlation' ? 'r' : test === 'anova' ? 'f' : 'd';
  const unit = test === 'correlation' ? 'in total' : 'per group';

  return `# ${title}
# Generated from PEEP
# Same definitions as PEEP:
#   prior: effect (${label}) ~ Normal(mean, sd) truncated to its valid range
#   assurance(n) = P(power(effect, n) >= target power) = P(effect >= MDE(n))
#   expected power(n) = E[power(effect, n)] over the prior
#   power counts rejections in the direction of the prior mean${test === 'permanova' ? '\n#   PERMANOVA power: lambda = n * k * R2 / (1 - R2), df1 = k - 1, df2 = k(n - 1)' : ''}

${R_BAYES_HELPERS}
# Parameters
test_type <- "${test}"
prior_mean <- ${mean}
prior_sd <- ${sd}
target_power <- ${targetPower}
target_assurance <- ${targetAssurance}
alpha <- ${alpha}
num_groups <- ${groups}

# Success means significance in the direction of the prior mean: a negative prior mean
# for a t-test or correlation is mirrored (the problem is symmetric).
if (test_type %in% c("ttest", "correlation") && prior_mean < 0) {
  cat("Negative prior mean: analysing the mirrored problem (effect in the negative direction)\\n")
  prior_mean <- -prior_mean
}

support <- effect_support(test_type)
n_min <- if (test_type == "correlation") 4 else 2
n_max <- 300

assurance_at <- function(n, sd = prior_sd) {
  trunc_survival(min_detectable_effect(test_type, n, target_power, alpha, num_groups),
                 prior_mean, sd, support)
}

cat("\\n=== Bayesian Assurance Analysis ===\\n")
cat("Prior: ${label} ~ N(", prior_mean, ",", prior_sd, ") truncated to [", support[1], ",", support[2], "]\\n")
cat("Target power:", target_power, " target assurance:", target_assurance, "\\n\\n")

required <- smallest_n(n_min, n_max, function(n) assurance_at(n) >= target_assurance)
if (is.na(required)) {
  cat("Target assurance is not reached by n =", n_max, "(${unit}); assurance there:",
      round(assurance_at(n_max), 3), "\\n")
  required <- n_max
} else {
  cat("Required sample size (${unit}):", required, "\\n")
}
cat("Assurance at that n:", round(assurance_at(required), 3), "\\n")
cat("Expected power at that n:",
    round(expected_power(test_type, required, prior_mean, prior_sd, alpha, num_groups), 3), "\\n")
freq_n <- required_n(test_type, prior_mean, target_power, alpha, num_groups)
cat("Conventional n at the prior mean (${unit}):", freq_n, "\\n")

# Assurance curve with a sensitivity band (prior SD 25% smaller or larger)
sample_sizes <- seq(10, n_max, by = 10)
assurance_curve <- sapply(sample_sizes, assurance_at)
band_lo <- sapply(sample_sizes, function(n) min(assurance_at(n), assurance_at(n, prior_sd * 0.75), assurance_at(n, prior_sd * 1.25)))
band_hi <- sapply(sample_sizes, function(n) max(assurance_at(n), assurance_at(n, prior_sd * 0.75), assurance_at(n, prior_sd * 1.25)))
expected_curve <- sapply(sample_sizes, function(n)
  expected_power(test_type, n, prior_mean, prior_sd, alpha, num_groups))

plot(sample_sizes, assurance_curve, type = "l", lwd = 2, col = "blue",
     xlab = "Sample Size (${unit})", ylab = "Probability",
     main = "Assurance Curve", ylim = c(0, 1))
polygon(c(sample_sizes, rev(sample_sizes)), c(band_lo, rev(band_hi)),
        col = adjustcolor("blue", 0.15), border = NA)
lines(sample_sizes, expected_curve, lwd = 2, lty = 3, col = "purple")
abline(h = target_assurance, lty = 2, col = "red")
abline(v = required, lty = 2, col = "darkgreen")
legend("bottomright",
       legend = c("Assurance", "Expected power", paste("Target =", target_assurance),
                  paste("Required n =", required)),
       col = c("blue", "purple", "red", "darkgreen"), lty = c(1, 3, 2, 2), lwd = c(2, 2, 1, 1))

write.csv(data.frame(Sample_Size = sample_sizes, Assurance = assurance_curve,
                     Expected_Power = expected_curve),
          "bayesian_assurance_curve.csv", row.names = FALSE)

cat("\\n*** KEY CONCEPTS ***\\n")
cat("POWER: probability of a significant result if the effect equals a fixed value\\n")
cat("ASSURANCE: probability, under the prior, that the study has at least the target power\\n")
cat("\\nReference: O'Hagan, Stevens & Campbell (2005) Pharmaceutical Statistics 4:187-201\\n")
`;
};

/** smallest_n on its own, for scripts that do not need the full helper block. */
const R_SMALLEST_N = `# Smallest integer n in [lo, hi] with pred(n) TRUE (pred must be monotone); NA if none
smallest_n <- function(lo, hi, pred) {
  if (!pred(hi)) return(NA)
  if (pred(lo)) return(lo)
  while (hi - lo > 1) {
    mid <- floor((lo + hi) / 2)
    if (pred(mid)) hi <- mid else lo <- mid
  }
  hi
}
`;

const generateBayesianDESeqRCode = (params: any): string => {
  const fcMean = num(params.log2FCMean, 1);
  const fcSD = num(params.log2FCSD, 0.5);
  const dispersion = num(params.dispersion, 0.1);
  const baseMean = num(params.baseMean, 100);
  const targetPower = num(params.targetPower, 0.8);
  const targetAssurance = num(params.targetAssurance, 0.8);
  const alpha = num(params.alpha, 0.05);
  const numTests = num(params.numTests, 1);

  return `# Bayesian Assurance for Differential Abundance (negative binomial Wald test)
# Generated from PEEP
# Power for n samples per group (same formula as PEEP's differential abundance calculator):
#   mu2 = mu1 * 2^log2FC
#   se  = sqrt(((phi + 1/mu1) + (phi + 1/mu2)) / n)   (natural-log scale)
#   ncp = |log2FC| * ln(2) / se, two-sided z test at alpha / number of taxa (Bonferroni)
# Prior: log2FC ~ Normal(mean, sd). Assurance = P(power >= target); expected power = E[power].

${R_SMALLEST_N}
# Parameters
log2fc_mean <- ${fcMean}
log2fc_sd <- ${fcSD}
dispersion <- ${dispersion}
base_mean <- ${baseMean}
target_power <- ${targetPower}
target_assurance <- ${targetAssurance}
alpha <- ${alpha}
num_tests <- ${numTests}
alpha_adj <- alpha / max(1, num_tests)

nb_power <- function(n, log2fc, disp, mu1, alpha_level) {
  mu2 <- mu1 * 2^log2fc
  se <- sqrt(((disp + 1 / mu1) + (disp + 1 / mu2)) / n)
  ncp <- abs(log2fc) * log(2) / se
  zc <- qnorm(1 - alpha_level / 2)
  pnorm(ncp - zc) + pnorm(-zc - ncp)
}

cat("\\n=== Bayesian Differential Abundance Assurance ===\\n")
cat("Prior: log2FC ~ N(", log2fc_mean, ",", log2fc_sd, ")\\n")
cat("Taxa tested:", num_tests, " adjusted alpha:", signif(alpha_adj, 3), "\\n\\n")

set.seed(123)
fc_draws <- rnorm(20000, log2fc_mean, log2fc_sd)

assurance_at <- function(n) mean(nb_power(n, fc_draws, dispersion, base_mean, alpha_adj) >= target_power)
expected_power_at <- function(n) mean(nb_power(n, fc_draws, dispersion, base_mean, alpha_adj))

required <- smallest_n(2, 500, function(n) assurance_at(n) >= target_assurance)
if (is.na(required)) {
  cat("Target assurance is not reached by n = 500 per group\\n")
  required <- 500
} else {
  cat("Required sample size per group:", required, "\\n")
}
cat("Assurance:", round(assurance_at(required), 3),
    " expected power:", round(expected_power_at(required), 3), "\\n")

n_range <- seq(5, 150, by = 5)
assurance_values <- sapply(n_range, assurance_at)
expected_values <- sapply(n_range, expected_power_at)

plot(n_range, assurance_values, type = "l", lwd = 2, col = "blue",
     xlab = "Samples per Group", ylab = "Probability",
     main = "Differential Abundance Assurance Curve", ylim = c(0, 1))
lines(n_range, expected_values, lwd = 2, lty = 3, col = "purple")
abline(h = target_assurance, lty = 2, col = "red")
abline(v = required, lty = 2, col = "darkgreen")

write.csv(data.frame(Sample_Size = n_range, Assurance = assurance_values, Expected_Power = expected_values),
          "deseq_assurance.csv", row.names = FALSE)
`;
};

const generateBayesianLMMRCode = (params: any): string => {
  const esMean = num(params.effectSizeMean ?? params.effectMean, 0.25);
  const esSD = num(params.effectSizeSD ?? params.effectSD, 0.1);
  const m = num(params.nTimepoints, 4);
  const rho = num(params.withinCorr, 0.6);
  const dropout = num(params.dropoutRate, 0.1);
  const slopeVar = num(params.randomSlopeVar, 0);
  const nCov = num(params.nCovariates, 0);
  const targetPower = num(params.targetPower, 0.8);
  const targetAssurance = num(params.targetAssurance, 0.8);
  const alpha = num(params.alpha, 0.05);

  return `# Bayesian Assurance for Longitudinal Microbiome Studies (LMM)
# Generated from PEEP
# Power for the time x treatment interaction with N subjects in total (2 groups),
# same formula as PEEP's longitudinal mixed model calculator:
#   retained = N * (1 - dropout)            (dropout = total loss by the final timepoint)
#   inflation = 1 + slope_var * (m - 1) / m
#   lambda = f^2 * retained * m / ((1 - rho) * inflation)
#   df1 = m - 1, df2 = (retained - 2 - covariates) * (m - 1)
# Prior: f ~ Normal(mean, sd) truncated at 0. Assurance = P(power >= target).

${R_BAYES_HELPERS}
# Parameters
effect_mean <- ${esMean}  # Cohen's f for time x treatment
effect_sd <- ${esSD}
n_timepoints <- ${m}
within_corr <- ${rho}
dropout_rate <- ${dropout}
random_slope_var <- ${slopeVar}
n_covariates <- ${nCov}
target_power <- ${targetPower}
target_assurance <- ${targetAssurance}
alpha <- ${alpha}

lmm_power <- function(n_total, m, f, rho, slope_var, n_cov, dropout, alpha) {
  retained <- n_total * (1 - dropout)
  inflation <- 1 + slope_var * (m - 1) / m
  rho <- min(max(rho, 0), 0.999)
  df1 <- m - 1
  df2 <- (retained - 2 - n_cov) * (m - 1)
  if (df1 <= 0 || df2 <= 0) return(0)
  lambda <- f^2 * retained * m / ((1 - rho) * inflation)
  pf(qf(1 - alpha, df1, df2), df1, df2, ncp = lambda, lower.tail = FALSE)
}

power_fn_at <- function(n) function(f) lmm_power(n, n_timepoints, f, within_corr,
                                                 random_slope_var, n_covariates, dropout_rate, alpha)
assurance_at <- function(n) {
  trunc_survival(mde_for(power_fn_at(n), target_power, 20), effect_mean, effect_sd, c(0, Inf))
}
expected_power_at <- function(n) expected_power_fn(power_fn_at(n), effect_mean, effect_sd, c(0, Inf))

cat("\\n=== Bayesian LMM Assurance Analysis ===\\n")
cat("Prior: f ~ N(", effect_mean, ",", effect_sd, ") truncated at 0\\n")
cat("Timepoints:", n_timepoints, " within-subject correlation:", within_corr,
    " total dropout:", dropout_rate, "\\n\\n")

# Search over even totals (two equal groups)
half <- smallest_n(2, 250, function(h) assurance_at(2 * h) >= target_assurance)
if (is.na(half)) {
  cat("Target assurance is not reached with 500 subjects\\n")
  required <- 500
} else {
  required <- 2 * half
  cat("Required subjects at baseline (total):", required, "\\n")
}
cat("Expected subjects retained:", round(required * (1 - dropout_rate)), "\\n")
cat("Assurance:", round(assurance_at(required), 3),
    " expected power:", round(expected_power_at(required), 3), "\\n")

n_range <- seq(6, 180, by = 6)
assurance_values <- sapply(n_range, assurance_at)

plot(n_range, assurance_values, type = "l", lwd = 2, col = "blue",
     xlab = "Subjects at Baseline (total)", ylab = "Assurance",
     main = "LMM Assurance Curve", ylim = c(0, 1))
abline(h = target_assurance, lty = 2, col = "red")
abline(v = required, lty = 2, col = "darkgreen")

write.csv(data.frame(Sample_Size = n_range, Assurance = assurance_values),
          "lmm_assurance.csv", row.names = FALSE)
`;
};

// ---------------------------------------------------------------------------
// Microbiome count models and longitudinal mixed models
// ---------------------------------------------------------------------------

const R_NB_POWER = `# Two-group negative binomial Wald test (same formula as PEEP), n per group:
#   mu2 = mu1 * 2^log2FC
#   se  = sqrt(((phi + 1/mu1) + (phi + 1/mu2)) / n)   (natural-log scale)
#   ncp = |log2FC| * ln(2) / se
nb_power <- function(n, log2fc, disp, mu1, alpha_level) {
  if (n < 2) return(0)
  mu2 <- mu1 * 2^log2fc
  se <- sqrt(((disp + 1 / mu1) + (disp + 1 / mu2)) / n)
  ncp <- abs(log2fc) * log(2) / se
  zc <- qnorm(1 - alpha_level / 2)
  pnorm(ncp - zc) + pnorm(-zc - ncp)
}
`;

const generateDESeqRCode = (params: any): string => {
  const n = num(params.n, 30);
  const log2FC = num(params.log2FC, 1);
  const dispersion = num(params.dispersion, 0.1);
  const baseMean = num(params.baseMean, 100);
  const alpha = num(params.alpha, 0.05);
  const numTests = num(params.numTests, 1);
  const useFDR = params.useFDR === undefined ? true : Boolean(params.useFDR);

  return `# ====================================================
# Differential Abundance Power Analysis (negative binomial, DESeq2/edgeR style)
# ====================================================
# Generated from PEEP
# The analytic power matches PEEP. A simulation with MASS::glm.nb (Wald test)
# checks it. DESeq2 additionally shrinks dispersions across taxa, which this
# single-taxon simulation does not model.
# ====================================================

if (!requireNamespace("MASS", quietly = TRUE)) install.packages("MASS")
library(MASS)

# Study parameters
n_per_group <- ${n}            # Samples per group
log2_fold_change <- ${log2FC}  # Log2 fold-change
dispersion <- ${dispersion}    # NB dispersion phi: Var = mu + phi * mu^2
base_mean <- ${baseMean}       # Mean count in the control group
alpha <- ${alpha}              # Significance level
num_tests <- ${numTests}       # Number of taxa tested
correct_multiple <- ${rBool(useFDR)}  # Multiple-testing correction (PEEP applies Bonferroni)
alpha_adj <- if (correct_multiple) alpha / max(1, num_tests) else alpha

${R_NB_POWER}
analytic_power <- nb_power(n_per_group, log2_fold_change, dispersion, base_mean, alpha_adj)

cat("=== Differential Abundance Power Analysis ===\\n")
cat("n per group:", n_per_group, " log2FC:", log2_fold_change, " dispersion:", dispersion, "\\n")
cat("Base mean:", base_mean, " taxa tested:", num_tests, " alpha used:", signif(alpha_adj, 3), "\\n")
cat("Analytic power:", round(analytic_power, 4), "\\n\\n")

# ---- Simulation check ----
simulate_nb_power <- function(n, log2fc, disp, mu1, alpha_level, nsim = 500) {
  mu2 <- mu1 * 2^log2fc
  group <- factor(rep(c("control", "treatment"), each = n))
  significant <- 0
  for (i in seq_len(nsim)) {
    counts <- c(rnbinom(n, mu = mu1, size = 1 / disp),
                rnbinom(n, mu = mu2, size = 1 / disp))
    fit <- tryCatch(suppressWarnings(glm.nb(counts ~ group)), error = function(e) NULL)
    if (!is.null(fit)) {
      p <- summary(fit)$coefficients["grouptreatment", "Pr(>|z|)"]
      significant <- significant + (p < alpha_level)
    }
  }
  significant / nsim
}

set.seed(123)
cat("Running 500 simulations...\\n")
simulated_power <- simulate_nb_power(n_per_group, log2_fold_change, dispersion, base_mean, alpha_adj)
cat("Simulated power:", round(simulated_power, 3), "\\n\\n")

# ---- Power curve (analytic) ----
sample_sizes <- 2:max(100, ceiling(n_per_group * 1.5))
power_values <- sapply(sample_sizes, nb_power, log2fc = log2_fold_change, disp = dispersion,
                       mu1 = base_mean, alpha_level = alpha_adj)
power_curve_data <- data.frame(sample_size = sample_sizes, power = power_values)

png("differential_abundance_power_curve.png", width = 800, height = 600)
plot(sample_sizes, power_values, type = "l", lwd = 2, col = "blue",
     xlab = "Samples per Group", ylab = "Statistical Power",
     main = "Power Curve for Differential Abundance Test", ylim = c(0, 1))
abline(h = 0.8, col = "red", lty = 2, lwd = 2)
abline(v = n_per_group, col = "darkgreen", lty = 2, lwd = 2)
legend("bottomright",
       c("Power curve", "Target power (0.8)", paste("Current n =", n_per_group)),
       col = c("blue", "red", "darkgreen"), lty = c(1, 2, 2), lwd = 2)
invisible(dev.off())

results <- data.frame(
  parameter = c("Samples per group", "Log2 fold-change", "Dispersion", "Base mean",
                "Alpha used", "Number of tests", "Analytic power", "Simulated power"),
  value = c(n_per_group, log2_fold_change, dispersion, base_mean, alpha_adj,
            num_tests, round(analytic_power, 4), round(simulated_power, 3))
)
write.csv(results, "differential_abundance_power_results.csv", row.names = FALSE)
write.csv(power_curve_data, "differential_abundance_power_curve.csv", row.names = FALSE)
cat("Results exported to CSV files\\n")
`;
};

const generateZINBRCode = (params: any): string => {
  const n = num(params.n, 30);
  const pi = num(params.zeroInflation, 0.3);
  const meanCount = num(params.meanCount, 50);
  const dispersion = num(params.dispersion, 0.2);
  const log2FC = num(params.log2FC, 1);
  const alpha = num(params.alpha, 0.05);
  const testType = pick(params.testType, ['count', 'zero', 'both'] as const, 'both');

  return `# ====================================================
# Zero-Inflated Negative Binomial (ZINB) Power Analysis
# ====================================================
# Generated from PEEP
# Analytic power (same as PEEP), n per group:
#   count part: NB Wald test with effective n = n * (1 - pi)
#   zero part:  p1 = pi, p2 = pi - delta, delta = min(0.2, pi / 2),
#               se = sqrt((p1(1 - p1) + p2(1 - p2)) / n), ncp = delta / se
#   "both": each part tested at alpha / 2; power = 1 - (1 - P_count)(1 - P_zero)
# ====================================================

if (!requireNamespace("pscl", quietly = TRUE)) install.packages("pscl")
library(pscl)

# Study parameters
n_per_group <- ${n}           # Samples per group
zero_inflation <- ${pi}       # Structural-zero proportion in the control group
mean_count <- ${meanCount}    # Mean of the NB count component (control)
dispersion <- ${dispersion}   # NB dispersion phi: Var = mu + phi * mu^2
log2_fold_change <- ${log2FC} # Count-part effect
alpha <- ${alpha}
test_type <- "${testType}"    # "count", "zero" or "both"

zero_change <- min(0.2, zero_inflation / 2)
component_alpha <- if (test_type == "both") alpha / 2 else alpha

${R_NB_POWER}
zinb_power <- function(n, pi0, mu, disp, log2fc, alpha, test) {
  a <- if (test == "both") alpha / 2 else alpha
  eff_n <- n * (1 - pi0)
  p_count <- if (eff_n >= 2 && mu > 0) nb_power(eff_n, log2fc, disp, mu, a) else 0
  p1 <- pi0
  delta <- min(0.2, pi0 / 2)
  p2 <- p1 - delta
  se0 <- sqrt((p1 * (1 - p1) + p2 * (1 - p2)) / n)
  zc <- qnorm(1 - a / 2)
  p_zero <- if (se0 > 0 && delta > 0) pnorm(delta / se0 - zc) + pnorm(-zc - delta / se0) else 0
  switch(test, count = p_count, zero = p_zero, 1 - (1 - p_count) * (1 - p_zero))
}

analytic_power <- zinb_power(n_per_group, zero_inflation, mean_count, dispersion,
                             log2_fold_change, alpha, test_type)
cat("=== ZINB Power Analysis ===\\n")
cat("n per group:", n_per_group, " zero-inflation:", zero_inflation,
    " (treatment:", zero_inflation - zero_change, ")\\n")
cat("Mean count:", mean_count, " dispersion:", dispersion, " log2FC:", log2_fold_change, "\\n")
cat("Test:", test_type, " alpha per component:", component_alpha, "\\n")
cat("Analytic power:", round(analytic_power, 4), "\\n\\n")

# ---- Simulation check with pscl::zeroinfl ----
simulate_zinb_power <- function(n, pi0, mu, disp, log2fc, alpha_level, test, nsim = 300) {
  p2 <- pi0 - min(0.2, pi0 / 2)
  mu2 <- mu * 2^log2fc
  group <- factor(rep(c("control", "treatment"), each = n))
  significant <- 0
  for (i in seq_len(nsim)) {
    y1 <- ifelse(rbinom(n, 1, pi0) == 1, 0, rnbinom(n, mu = mu, size = 1 / disp))
    y2 <- ifelse(rbinom(n, 1, p2) == 1, 0, rnbinom(n, mu = mu2, size = 1 / disp))
    dat <- data.frame(count = c(y1, y2), group = group)
    fit <- tryCatch(suppressWarnings(zeroinfl(count ~ group | group, data = dat, dist = "negbin")),
                    error = function(e) NULL)
    if (is.null(fit)) next
    co <- summary(fit)$coefficients
    p_count <- co$count["grouptreatment", "Pr(>|z|)"]
    p_zero <- co$zero["grouptreatment", "Pr(>|z|)"]
    hit <- switch(test,
                  count = p_count < alpha_level,
                  zero = p_zero < alpha_level,
                  (p_count < alpha_level / 2) || (p_zero < alpha_level / 2))
    if (isTRUE(hit)) significant <- significant + 1
  }
  significant / nsim
}

set.seed(123)
cat("Running 300 simulations (fits that fail count as non-significant)...\\n")
simulated_power <- simulate_zinb_power(n_per_group, zero_inflation, mean_count, dispersion,
                                       log2_fold_change, alpha, test_type)
cat("Simulated power:", round(simulated_power, 3), "\\n\\n")

# ---- Power curve (analytic) ----
sample_sizes <- 2:max(100, ceiling(n_per_group * 1.5))
power_values <- sapply(sample_sizes, zinb_power, pi0 = zero_inflation, mu = mean_count,
                       disp = dispersion, log2fc = log2_fold_change, alpha = alpha, test = test_type)

png("zinb_power_curve.png", width = 800, height = 600)
plot(sample_sizes, power_values, type = "l", lwd = 2, col = "blue",
     xlab = "Samples per Group", ylab = "Statistical Power",
     main = "ZINB Power Curve", ylim = c(0, 1))
abline(h = 0.8, col = "red", lty = 2)
abline(v = n_per_group, col = "darkgreen", lty = 2)
legend("bottomright",
       c("Power curve", "Target (0.8)", paste("n =", n_per_group)),
       col = c("blue", "red", "darkgreen"), lty = c(1, 2, 2), lwd = 2)
invisible(dev.off())

write.csv(data.frame(sample_size = sample_sizes, power = power_values),
          "zinb_power_curve.csv", row.names = FALSE)
cat("Done\\n")
`;
};

const generateLMMMicrobiomeRCode = (params: any): string => {
  const nSubjects = num(params.nSubjects, 30);
  const m = num(params.nTimepoints, 4);
  const f = num(params.effectSize, 0.25);
  const rho = num(params.withinCorr, 0.6);
  const slopeVar = num(params.randomSlopeVar, 0.3);
  const nCov = num(params.nCovariates, 0);
  const dropout = num(params.dropoutRate, 0.1);
  const alpha = num(params.alpha, 0.05);
  const appPower = typeof params.power === 'number' && Number.isFinite(params.power) ? params.power : null;

  return `# ====================================================
# Longitudinal Mixed Model (LMM) Power Analysis
# ====================================================
# Generated from PEEP
# Analytic approximation (same as PEEP), time x treatment interaction, 2 groups:
#   retained  = N * (1 - dropout)        (dropout = total loss by the final timepoint)
#   inflation = 1 + slope_var * (m - 1) / m
#   lambda    = f^2 * retained * m / ((1 - rho) * inflation)
#   df1 = m - 1, df2 = (retained - 2 - covariates) * (m - 1)
# The simulation fits lme4/lmerTest models to data with compound-symmetric
# correlation, random slopes and monotone dropout.
# ====================================================

if (!requireNamespace("lme4", quietly = TRUE)) install.packages("lme4")
if (!requireNamespace("lmerTest", quietly = TRUE)) install.packages("lmerTest")
library(lmerTest)  # loads lme4 and adds F tests with Satterthwaite df

# Study parameters
n_subjects <- ${nSubjects}             # Total subjects (both groups)
n_timepoints <- ${m}                   # Measurements per subject
effect_size <- ${f}                    # Cohen's f for time x treatment
within_corr <- ${rho}                  # Within-subject correlation
random_slope_var <- ${slopeVar}        # Random slope variance (relative)
n_covariates <- ${nCov}                # Number of subject-level covariates
dropout_rate <- ${dropout}             # Proportion of subjects lost by the final timepoint
alpha <- ${alpha}

lmm_power <- function(n_total, m, f, rho, slope_var, n_cov, dropout, alpha) {
  retained <- n_total * (1 - dropout)
  inflation <- 1 + slope_var * (m - 1) / m
  rho <- min(max(rho, 0), 0.999)
  df1 <- m - 1
  df2 <- (retained - 2 - n_cov) * (m - 1)
  if (df1 <= 0 || df2 <= 0) return(0)
  lambda <- f^2 * retained * m / ((1 - rho) * inflation)
  pf(qf(1 - alpha, df1, df2), df1, df2, ncp = lambda, lower.tail = FALSE)
}

analytic_power <- lmm_power(n_subjects, n_timepoints, effect_size, within_corr,
                            random_slope_var, n_covariates, dropout_rate, alpha)
cat("=== Longitudinal Mixed Model Power Analysis ===\\n")
cat("Subjects:", n_subjects, " timepoints:", n_timepoints, " f:", effect_size,
    " correlation:", within_corr, "\\n")
cat("Analytic power:", round(analytic_power, 4), "\\n")
${appPower !== null ? `cat("PEEP web calculator power: ${(appPower * 100).toFixed(1)}%\\n")\n` : ''}
# ---- Simulation ----
# Interaction effects are +/- c * (t - mean(t)) for the two groups, scaled so that
# their SD equals f (total variance 1: subject variance rho, residual 1 - rho).
simulate_lmm_power <- function(n_subj, n_time, effect_f, corr, slope_var, n_cov,
                               dropout, alpha_level, nsim = 300) {
  n_ctrl <- ceiling(n_subj / 2)
  t_idx <- 0:(n_time - 1)
  tc <- t_idx - mean(t_idx)
  scale_c <- effect_f / sqrt(mean(tc^2))
  subject <- rep(seq_len(n_subj), each = n_time)
  group <- rep(rep(c("control", "treatment"), times = c(n_ctrl, n_subj - n_ctrl)), each = n_time)
  time_num <- rep(t_idx, times = n_subj)
  sign_trt <- ifelse(group == "treatment", 1, -1)
  slope_sd <- sqrt(max(slope_var, 0) * (1 - corr)) / max(1, n_time - 1)
  cov_names <- if (n_cov > 0) paste0("cov", seq_len(n_cov)) else character(0)
  rhs <- paste(c("time_f * group", cov_names), collapse = " + ")
  # Random slopes need at least 3 timepoints to be identifiable
  re <- if (slope_var > 0 && n_time >= 3) "(1 + time_num | subject)" else "(1 | subject)"
  form <- as.formula(paste("y ~", rhs, "+", re))

  significant <- 0
  failed <- 0
  for (s in seq_len(nsim)) {
    y <- rep(rnorm(n_subj, 0, sqrt(corr)), each = n_time) +
      rep(rnorm(n_subj, 0, slope_sd), each = n_time) * tc[time_num + 1] +
      scale_c * sign_trt * tc[time_num + 1] +
      rnorm(n_subj * n_time, 0, sqrt(1 - corr))
    dat <- data.frame(y = y, subject = factor(subject), group = factor(group),
                      time_num = time_num, time_f = factor(time_num))
    for (cv in cov_names) dat[[cv]] <- rep(rnorm(n_subj), each = n_time)

    # Monotone dropout: a dropped subject loses all visits from a random timepoint on
    keep <- rep(TRUE, nrow(dat))
    drops <- which(runif(n_subj) < dropout)
    for (d in drops) {
      start <- 1 + sample.int(n_time - 1, 1)  # timepoint 2..m
      keep[subject == d & time_num >= start - 1] <- FALSE
    }
    dat <- dat[keep, ]

    fit <- tryCatch(suppressMessages(suppressWarnings(lmer(form, data = dat))),
                    error = function(e) NULL)
    tab <- if (is.null(fit)) NULL else tryCatch(anova(fit), error = function(e) NULL)
    if (is.null(tab) || !("time_f:group" %in% rownames(tab))) {
      failed <- failed + 1
      next
    }
    p_value <- tab["time_f:group", "Pr(>F)"]
    if (isTRUE(p_value < alpha_level)) significant <- significant + 1
  }
  if (failed > 0) cat("Model fits that failed (counted as non-significant):", failed, "\\n")
  significant / nsim
}

set.seed(123)
cat("\\nRunning 300 simulations (a few minutes)...\\n")
estimated_power <- simulate_lmm_power(n_subjects, n_timepoints, effect_size, within_corr,
                                      random_slope_var, n_covariates, dropout_rate, alpha)
cat("Simulated power:", round(estimated_power, 3), "\\n")
cat("The analytic value is an approximation; the simulation is closer to a real LMM analysis.\\n\\n")

# ---- Power curve (analytic) ----
subject_counts <- seq(6, max(200, ceiling(n_subjects * 1.5)), by = 2)
power_values <- sapply(subject_counts, lmm_power, m = n_timepoints, f = effect_size,
                       rho = within_corr, slope_var = random_slope_var,
                       n_cov = n_covariates, dropout = dropout_rate, alpha = alpha)

png("lmm_power_curve.png", width = 800, height = 600)
plot(subject_counts, power_values, type = "l", lwd = 2, col = "purple",
     xlab = "Number of Subjects (total)", ylab = "Power",
     main = "LMM Power Curve", ylim = c(0, 1))
abline(h = 0.8, col = "red", lty = 2)
abline(v = n_subjects, col = "darkgreen", lty = 2)
legend("bottomright", c("Analytic power", "Target", paste("N =", n_subjects)),
       col = c("purple", "red", "darkgreen"), lty = c(1, 2, 2), lwd = 2)
invisible(dev.off())

write.csv(data.frame(n_subjects = subject_counts, power = power_values),
          "lmm_power_curve.csv", row.names = FALSE)
cat("Done\\n")
`;
};

// ---------------------------------------------------------------------------
// Bayesian design tools
// ---------------------------------------------------------------------------

const generateSequentialRCode = (params: any): string => {
  const test = pick(params.testType, ['ttest', 'anova', 'correlation'] as const, 'ttest');
  const mean = num(params.effectMean, 0.5);
  const sd = num(params.effectSD, 0.2);
  const maxN = num(params.maxN, 100);
  const looks = num(params.interimLooks, 3);
  const groups = num(params.groups, 3);
  const alpha = num(params.alpha, 0.05);
  const rule = pick(params.stoppingRule, ['futility', 'superiority', 'both'] as const, 'both');
  const futility = num(params.futilityThreshold, 0.1);
  const superiority = num(params.superiorityThreshold, 0.9);
  const unit = test === 'correlation' ? 'in total' : 'per group';

  return `# Bayesian Sequential Design (predictive probability stopping)
# Generated from PEEP
# Same method as PEEP:
#   The test statistic is simulated as a Brownian motion on the information scale
#   (t-test: I = n/2, drift d; correlation: I = n - 3, drift atanh(r);
#    ANOVA: I = n per group, (k-1)-dimensional motion with drift norm f * sqrt(k)).
#   The effect-size prior generates the trials. At each interim look the predictive
#   probability (PP) that the final two-sided level-alpha analysis at max_n is significant
#   is computed under a non-informative analysis prior. t-test and correlation declare
#   success in the positive direction (nominal type I error alpha / 2); ANOVA uses
#   |S|^2 / I > (k - 1) * F_crit (nominal alpha).
#   Stop for success if PP >= superiority threshold, for futility if PP <= futility threshold.
# Stopping-rule settings below use PEEP's defaults unless they were exported with the design.

# Parameters
test_type <- "${test}"
prior_mean <- ${mean}
prior_sd <- ${sd}
max_n <- ${maxN}  # ${unit}
interim_looks <- ${looks}
num_groups <- ${test === 'anova' ? groups : 2}
alpha <- ${alpha}  # two-sided
stopping_rule <- "${rule}"
futility_threshold <- ${futility}
superiority_threshold <- ${superiority}

use_fut <- stopping_rule %in% c("futility", "both")
use_sup <- stopping_rule %in% c("superiority", "both")

info_at <- function(n) {
  if (test_type == "ttest") n / 2 else if (test_type == "correlation") n - 3 else n
}
dim_s <- if (test_type == "anova") num_groups - 1 else 1
n_min <- if (test_type == "correlation") 5 else 3

# Analysis sample sizes
looks <- integer(0)
for (i in seq_len(interim_looks)) {
  n_i <- max(n_min - 1, floor(max_n * i / (interim_looks + 1)))
  if (n_i < max_n && (length(looks) == 0 || n_i > looks[length(looks)])) looks <- c(looks, n_i)
}
looks <- c(looks, max_n)
T_max <- info_at(max_n)

# Success is significance in the direction of the prior mean: a negative prior mean
# for a t-test or correlation is mirrored.
if (test_type != "anova" && prior_mean < 0) {
  cat("Negative prior mean: analysing the mirrored problem (effect in the negative direction)\\n")
  prior_mean <- -prior_mean
}

# Design prior for the drift on the information scale
if (test_type == "ttest") {
  m0 <- prior_mean
  s0 <- prior_sd
} else if (test_type == "correlation") {
  r0 <- min(max(prior_mean, -0.99), 0.99)
  m0 <- atanh(r0)
  s0 <- prior_sd / (1 - r0^2)
} else {
  m0 <- max(0, prior_mean) * sqrt(num_groups)
  s0 <- prior_sd * sqrt(num_groups)
}

# Final critical value on the statistic scale
crit <- if (test_type == "ttest") {
  qt(1 - alpha / 2, 2 * max_n - 2)
} else if (test_type == "correlation") {
  qnorm(1 - alpha / 2)
} else {
  (num_groups - 1) * qf(1 - alpha, num_groups - 1, max_n * num_groups - num_groups)
}

# ANOVA (any k, including k = 2) uses the chi-square scale |S|^2 / I > (k - 1) * F_crit;
# t-test and correlation declare success in the positive direction only.
directional <- test_type != "anova"

# 3-node Gauss-Hermite rule for E[g(Z)], Z ~ N(0, 1)
gh_nodes <- c(-sqrt(3), 0, sqrt(3))
gh_weights <- c(1 / 6, 2 / 3, 1 / 6)

predictive_prob <- function(S, I) {
  R <- T_max - I
  if (R <= 0) return(0)
  if (directional) {
    m <- S[1] / I
    sd_pred <- sqrt(R + R^2 / I)
    return(1 - pnorm((crit * sqrt(T_max) - S[1] - m * R) / sd_pred))
  }
  norm2 <- sum(S^2)
  d_hat <- sqrt(max(0, norm2 - dim_s * I)) / I
  delta <- pmax(0, d_hat + sqrt(1 / I) * gh_nodes)
  ncp <- (sqrt(norm2) + delta * R)^2 / R
  x <- crit * T_max / R
  gap <- sqrt(ncp) - sqrt(x)
  tail <- ifelse(gap > 10, 1, ifelse(gap < -10, 0,
                 pchisq(x, dim_s, ncp = ncp, lower.tail = FALSE)))
  min(1, max(0, sum(gh_weights * tail)))
}

simulate_trials <- function(draw_drift, nsim) {
  fut <- numeric(length(looks))
  sup <- numeric(length(looks))
  total_n <- 0
  successes <- 0
  for (s in seq_len(nsim)) {
    d <- draw_drift()
    S <- numeric(dim_s)
    i_prev <- 0
    for (j in seq_along(looks)) {
      I <- info_at(looks[j])
      dI <- I - i_prev
      i_prev <- I
      S <- S + rnorm(dim_s, 0, sqrt(dI))
      S[1] <- S[1] + d * dI
      if (j == length(looks)) {
        success <- if (directional) S[1] / sqrt(I) > crit else sum(S^2) / I > crit
        if (success) {
          sup[j] <- sup[j] + 1
          successes <- successes + 1
        } else {
          fut[j] <- fut[j] + 1
        }
        total_n <- total_n + looks[j]
        break
      }
      pp <- predictive_prob(S, I)
      if (use_sup && pp >= superiority_threshold) {
        sup[j] <- sup[j] + 1
        successes <- successes + 1
        total_n <- total_n + looks[j]
        break
      }
      if (use_fut && pp <= futility_threshold) {
        fut[j] <- fut[j] + 1
        total_n <- total_n + looks[j]
        break
      }
    }
  }
  list(fut = fut / nsim, sup = sup / nsim, expected_n = total_n / nsim, power = successes / nsim)
}

draw_prior <- function() {
  if (s0 <= 0) return(m0)
  if (test_type != "anova") return(rnorm(1, m0, s0))
  for (t in 1:100) {
    x <- rnorm(1, m0, s0)
    if (x >= 0) return(x)
  }
  0
}

nsim <- if (test_type == "anova") 800 else 2000
cat("Analysis sample sizes (${unit}):", looks, "\\n")
cat("Running", nsim, "simulated trials under the prior and under no effect...\\n")
set.seed(123)
under_prior <- simulate_trials(draw_prior, nsim)
under_null <- simulate_trials(function() 0, nsim)

stopping <- data.frame(look = seq_along(looks), n = looks,
                       stop_futility = under_prior$fut, stop_success = under_prior$sup)
print(stopping)

cat("\\n=== Results ===\\n")
cat("Expected sample size (${unit}):", round(under_prior$expected_n, 1), "\\n")
cat("Saving versus fixed design:", round((1 - under_prior$expected_n / max_n) * 100, 1), "%\\n")
cat("Probability of declaring success under the prior:", round(under_prior$power, 3), "\\n")
# The fixed design's type I error with the same one-directional success rule is alpha / 2
nominal_type1 <- if (directional) alpha / 2 else alpha
cat("Simulated type I error (no effect):", round(under_null$power, 3),
    " nominal:", nominal_type1, if (directional) "(one-directional)" else "", "\\n")

# Optional: classical O'Brien-Fleming boundaries for the same looks (two-sided alpha)
if (requireNamespace("rpact", quietly = TRUE) && length(looks) > 1) {
  design <- rpact::getDesignGroupSequential(
    kMax = length(looks),
    alpha = alpha,
    sided = 2,
    typeOfDesign = "OF",
    informationRates = looks / max_n
  )
  print(design)
}

cat("\\n*** KEY PRINCIPLES ***\\n")
cat("Pre-specify stopping rules before data collection\\n")
cat("Check the type I error: early success stopping can inflate it\\n")
cat("\\nReference: Berry et al. (2010) Bayesian Adaptive Methods for Clinical Trials\\n")
`;
};

const generateReplicationRCode = (params: any): string => {
  const test = pick(params.testType, ['ttest', 'anova', 'correlation'] as const, 'ttest');
  const est = num(params.publishedEffect, 0.5);
  const pubN = num(params.publishedN, 50);
  const pubP = num(params.publishedP, 0.03);
  const repN = num(params.replicationN, 50);
  const groups = num(params.groups, 2);
  const alpha = num(params.alpha, 0.05);
  const bias = pick(params.publicationBias, ['none', 'mild', 'moderate', 'severe'] as const, 'moderate');
  const skepticism = pick(params.priorSkepticism, ['optimistic', 'moderate', 'skeptical'] as const, 'moderate');
  const unit = test === 'correlation' ? 'in total' : 'per group';

  return `# Bayesian Replication Probability Analysis
# Generated from PEEP
# Same method as PEEP:
#   prior: published effect deflated by a Type M (exaggeration) factor for the assumed
#          publication bias, with spread set by the skepticism level
#   likelihood: published estimate with its standard error
#   replication probability = expected power of the replication over the posterior

${R_BAYES_HELPERS}
# Published study
test_type <- "${test}"
published_effect <- ${est}
published_n <- ${pubN}  # ${unit}
published_p <- ${pubP}
num_groups <- ${test === 'anova' ? groups : 2}

# Replication
replication_n <- ${repN}  # ${unit}
alpha <- ${alpha}
publication_bias <- "${bias}"
prior_skepticism <- "${skepticism}"

published_se <- if (test_type == "ttest") {
  sqrt(2 / published_n + published_effect^2 / (4 * published_n))
} else if (test_type == "correlation") {
  (1 - published_effect^2) / sqrt(published_n - 3)
} else {
  published_effect / max(qnorm(1 - published_p / 2), 1e-6)
}

type_m <- c(none = 1.0, mild = 1.2, moderate = 1.5, severe = 2.2)[[publication_bias]]
deflated <- published_effect / type_m
prior <- switch(prior_skepticism,
  optimistic = c(mean = deflated * 1.1, sd = deflated * 0.3),
  moderate = c(mean = deflated, sd = deflated * 0.5),
  skeptical = c(mean = deflated * 0.7, sd = deflated * 0.6))

data_prec <- 1 / published_se^2
prior_prec <- 1 / prior[["sd"]]^2
post_prec <- prior_prec + data_prec
post_mean <- (prior_prec * prior[["mean"]] + data_prec * published_effect) / post_prec
post_sd <- sqrt(1 / post_prec)
shrinkage <- post_mean / published_effect

cat("=== Replication Probability Analysis ===\\n")
cat("Published effect:", published_effect, " SE:", round(published_se, 4), "\\n")
cat("Type M factor (", publication_bias, "):", type_m, "\\n")
cat("Adjusted effect: ", round(post_mean, 3), " (95% CI ", round(post_mean - 1.96 * post_sd, 3),
    " to ", round(post_mean + 1.96 * post_sd, 3), ")\\n", sep = "")
cat("Shrinkage factor:", round(shrinkage, 3), "\\n\\n")

replication_probability <- expected_power(test_type, replication_n, post_mean, post_sd, alpha, num_groups)
power_at_adjusted <- directional_power(test_type, replication_n, post_mean, alpha, num_groups)
cat("Replication probability (n =", replication_n, "${unit}):", round(replication_probability, 3), "\\n")
cat("Power at the adjusted effect:", round(power_at_adjusted, 3), "\\n")

if (post_mean > 0) {
  eff <- if (test_type == "correlation") min(0.99, post_mean) else post_mean
  cat("Recommended n for 80% power at the adjusted effect (${unit}):",
      required_n(test_type, eff, 0.8, alpha, num_groups), "\\n")
} else {
  cat("The adjusted effect is not positive; 80% power cannot be targeted\\n")
}

# Power across plausible true effects, with the posterior density
top <- if (test_type == "correlation") min(0.99, published_effect * 1.5) else published_effect * 1.5
es <- seq(0, top, length.out = 51)
rep_power <- sapply(es, function(x) directional_power(test_type, replication_n, x, alpha, num_groups))
plot(es, rep_power, type = "l", lwd = 2, col = "blue", ylim = c(0, 1),
     xlab = "True effect", ylab = "Replication power",
     main = "Replication Power and Posterior")
dens <- dnorm(es, post_mean, post_sd)
lines(es, dens / max(dens), lty = 2, col = "purple")
legend("bottomright", c("Power", "Posterior (scaled)"), col = c("blue", "purple"), lty = c(1, 2))

cat("\\nReference: Gelman & Carlin (2014) Perspect Psychol Sci 9:641-651\\n")
`;
};

const generateInformationDesignRCode = (params: any): string => {
  const designs: any[] = Array.isArray(params.designs) ? params.designs : [];
  const priorMean = num(params.priorMean, 0.5);
  const priorSD = num(params.priorSD, 0.3);
  const test = pick(params.testType, ['ttest', 'anova'] as const, 'ttest');
  const objective = pick(params.objective, ['maximize-info', 'cost-benefit', 'minimize-uncertainty'] as const, 'cost-benefit');
  const names = designs.map((d) => rStr(d?.name)).join(', ');
  const ns = designs.map((d) => num(d?.nPerGroup, 30)).join(', ');
  const errs = designs.map((d) => num(d?.measurementError, 1)).join(', ');
  const costs = designs.map((d) => num(d?.cost, 100)).join(', ');

  return `# Bayesian Information-Based Design Comparison
# Generated from PEEP
# Same method as PEEP:
#   t-test: Fisher information I = n / (2 sigma^2) (difference of two means, n per group)
#   ANOVA:  I = n / sigma^2 (one group mean or a contrast with a known reference)
#   posterior SD = sqrt(1 / (1 / prior_sd^2 + I))

# Parameters
prior_mean <- ${priorMean}
prior_sd <- ${priorSD}
test_type <- "${test}"
objective <- "${objective}"

designs <- data.frame(
  name = c(${names}),
  n_per_group = c(${ns}),
  measurement_error = c(${errs}),
  cost = c(${costs}),
  stringsAsFactors = FALSE
)

cat("=== Information-Based Design Optimization ===\\n")
cat("Prior effect: N(", prior_mean, ",", prior_sd, ")\\n\\n")

if (nrow(designs) == 0) stop("No designs were exported")

designs$fisher_info <- if (test_type == "ttest") {
  designs$n_per_group / (2 * designs$measurement_error^2)
} else {
  designs$n_per_group / designs$measurement_error^2
}
designs$cost_per_info <- designs$cost / designs$fisher_info
designs$posterior_sd <- sqrt(1 / (1 / prior_sd^2 + designs$fisher_info))
designs$uncertainty_reduction <- (1 - designs$posterior_sd / prior_sd) * 100

ord <- switch(objective,
  "maximize-info" = order(-designs$fisher_info),
  "cost-benefit" = order(designs$cost_per_info),
  order(designs$posterior_sd))
designs <- designs[ord, ]
designs$rank <- seq_len(nrow(designs))

cat("=== Design Comparison (ranked by", objective, ") ===\\n")
print(designs, row.names = FALSE)

optimal <- designs[1, ]
cat("\\nBest design:", optimal$name, "\\n")
cat("Fisher information:", round(optimal$fisher_info, 2), "\\n")
cat("Cost per information:", round(optimal$cost_per_info, 2), "\\n")
cat("Uncertainty reduction:", round(optimal$uncertainty_reduction, 1), "%\\n\\n")

par(mfrow = c(1, 2))
barplot(designs$fisher_info, names.arg = designs$name,
        main = "Fisher Information", ylab = "Information", col = "lightblue")
barplot(designs$cost_per_info, names.arg = designs$name,
        main = "Cost per Information", ylab = "Cost / Info", col = "lightcoral")
par(mfrow = c(1, 1))

cat("\\nReference: Chaloner & Verdinelli (1995) Statist Sci 10:273-304\\n")
`;
};

const generateHierarchicalRCode = (params: any): string => {
  const test = pick(params.testType, ['ttest', 'anova'] as const, 'ttest');
  const mean = num(params.effectMean, 0.5);
  const sd = num(params.effectSD, 0.2);
  const nClusters = num(params.nClusters, 10);
  const nPerCluster = num(params.nPerCluster, 10);
  const icc = num(params.icc, 0.2);
  const iccSD = num(params.iccUncertainty, 0.1);
  const groups = num(params.groups, 2);
  const targetPower = num(params.targetPower, 0.8);
  const targetAssurance = num(params.targetAssurance, 0.8);
  const alpha = num(params.alpha, 0.05);

  return `# Bayesian Hierarchical (Cluster) Design Power
# Generated from PEEP
# Same method as PEEP:
#   design effect DE = 1 + (m - 1) * ICC
#   effective n per group = J * m / DE   (J clusters per group, m per cluster)
#   power: ${test === 'ttest' ? 't-test, ncp = d * sqrt(n_eff / 2), df = 2 n_eff - 2' : 'ANOVA, lambda = f^2 * k * n_eff, df1 = k - 1, df2 = k (n_eff - 1)'}
#   ICC prior: Beta with the given mean and SD; effect prior: Normal
#   assurance = P(power >= target), averaged over the ICC prior

${R_BAYES_HELPERS}
# Parameters
test_type <- "${test}"
effect_mean <- ${mean}
effect_sd <- ${sd}
n_clusters <- ${nClusters}       # per group
n_per_cluster <- ${nPerCluster}
icc_mean <- ${icc}
icc_sd <- ${iccSD}
num_groups <- ${test === 'anova' ? groups : 2}
target_power <- ${targetPower}
target_assurance <- ${targetAssurance}
alpha <- ${alpha}

support <- effect_support(test_type)
design_effect <- function(rho) 1 + (n_per_cluster - 1) * rho

# Beta prior for the ICC (method of moments), 20 equal-probability nodes
if (icc_sd > 0 && icc_mean > 0) {
  icc_var <- min(icc_sd^2, 0.99 * icc_mean * (1 - icc_mean))
  common <- icc_mean * (1 - icc_mean) / icc_var - 1
  a_icc <- icc_mean * common
  b_icc <- (1 - icc_mean) * common
  icc_nodes <- qbeta((seq_len(20) - 0.5) / 20, a_icc, b_icc)
  icc_quantile <- function(p) qbeta(p, a_icc, b_icc)
} else {
  icc_nodes <- icc_mean
  icc_quantile <- function(p) icc_mean
}

assurance_at <- function(nc) {
  mean(sapply(icc_nodes, function(rho) {
    n_eff <- nc * n_per_cluster / design_effect(rho)
    trunc_survival(min_detectable_effect(test_type, n_eff, target_power, alpha, num_groups),
                   effect_mean, effect_sd, support)
  }))
}

de_mean <- design_effect(icc_mean)
cat("=== Hierarchical Design Power ===\\n")
cat("Effect prior: N(", effect_mean, ",", effect_sd, ")\\n")
cat("Clusters per group:", n_clusters, " per cluster:", n_per_cluster, " groups:", num_groups, "\\n")
cat("Design effect:", round(de_mean, 3), " (95% range",
    round(design_effect(icc_quantile(0.025)), 3), "to", round(design_effect(icc_quantile(0.975)), 3), ")\\n")
cat("Effective n per group:", round(n_clusters * n_per_cluster / de_mean, 1), "\\n\\n")

cat("Assurance with", n_clusters, "clusters per group:", round(assurance_at(n_clusters), 3), "\\n")
required <- smallest_n(2, 1000, function(nc) assurance_at(nc) >= target_assurance)
if (is.na(required)) {
  cat("Target assurance is not reached with 1000 clusters per group\\n")
} else {
  cat("Required clusters per group:", required,
      " (total N =", required * n_per_cluster * num_groups, ")\\n")
}
naive_n <- required_n(test_type, effect_mean, target_power, alpha, num_groups)
cat("Conventional n per group ignoring clustering:", naive_n, "\\n\\n")

# Sensitivity: clusters per group needed for the target power at the prior mean
icc_range <- seq(0, 0.5, by = 0.05)
clusters_needed <- sapply(icc_range, function(rho) {
  if (effect_mean <= 0) return(NA)
  smallest_n(2, 1000, function(nc)
    directional_power(test_type, nc * n_per_cluster / design_effect(rho), effect_mean,
                      alpha, num_groups) >= target_power)
})
print(data.frame(ICC = icc_range, design_effect = design_effect(icc_range),
                 clusters_per_group = clusters_needed))

plot(icc_range, clusters_needed, type = "b", lwd = 2, col = "blue",
     xlab = "Intraclass Correlation (ICC)", ylab = "Clusters per Group",
     main = "Sensitivity to ICC")
abline(v = icc_mean, lty = 2, col = "darkgreen")

cat("\\nReference: Raudenbush & Liu (2000) Psychol Methods 5:199-213\\n")
`;
};

const generateAdaptiveAllocationRCode = (params: any): string => {
  const treatments: any[] = Array.isArray(params.treatments) ? params.treatments : [];
  const priors: any[] = Array.isArray(params.priors) ? params.priors : [];
  const maxN = num(params.maxN, 150);
  const alpha = num(params.alpha, 0.05);
  const rule = pick(params.allocationRule, ['equal', 'thompson', 'optimal'] as const, 'thompson');

  return `# Bayesian Adaptive Allocation Simulation
# Generated from PEEP
# Same method as PEEP: outcomes ~ Normal(true mean, 1); true means drawn from the priors;
# conjugate normal updating; the first 20% of the budget is allocated in rotation.
# Power: ANOVA with unequal group sizes at the prior means,
#   lambda = sum n_i (mu_i - weighted mean)^2, df1 = K - 1, df2 = N - K

# Parameters
treatments <- c(${treatments.map(rStr).join(', ')})
prior_means <- c(${priors.map((p) => num(p?.mean, 0)).join(', ')})
prior_sds <- c(${priors.map((p) => num(p?.sd, 1)).join(', ')})
max_n <- ${Math.floor(maxN)}
alpha <- ${alpha}
allocation_rule <- "${rule}"

K <- length(treatments)
stopifnot(K >= 2, length(prior_means) == K, max_n >= 2 * K)

simulate_allocation <- function(nsim = 500) {
  burn_in <- floor(max_n * 0.2)
  counts <- numeric(K)
  for (sim in seq_len(nsim)) {
    true_means <- rnorm(K, prior_means, prior_sds)
    alloc <- numeric(K)
    sums <- numeric(K)
    post_mean <- prior_means
    post_sd <- prior_sds
    for (n in 0:(max_n - 1)) {
      sel <- if (n < burn_in || allocation_rule == "equal") {
        (n %% K) + 1
      } else if (allocation_rule == "thompson") {
        which.max(rnorm(K, post_mean, post_sd))
      } else {
        which.max(post_mean)
      }
      alloc[sel] <- alloc[sel] + 1
      sums[sel] <- sums[sel] + rnorm(1, true_means[sel], 1)
      prior_prec <- 1 / prior_sds[sel]^2
      post_prec <- prior_prec + alloc[sel]
      post_mean[sel] <- (prior_prec * prior_means[sel] + sums[sel]) / post_prec
      post_sd[sel] <- sqrt(1 / post_prec)
    }
    counts <- counts + alloc
  }
  counts / nsim
}

unequal_anova_power <- function(ns, mus, alpha) {
  N <- sum(ns)
  k <- length(ns)
  if (N <= k) return(0)
  grand <- sum(ns * mus) / N
  lambda <- sum(ns * (mus - grand)^2)
  pf(qf(1 - alpha, k - 1, N - k), k - 1, N - k, ncp = lambda, lower.tail = FALSE)
}

cat("=== Adaptive Allocation Design ===\\n")
cat("Treatments:", paste(treatments, collapse = ", "), "\\n")
cat("Sample budget:", max_n, " rule:", allocation_rule, "\\n\\n")

set.seed(123)
mean_alloc <- simulate_allocation()
results <- data.frame(Treatment = treatments, Expected_n = round(mean_alloc),
                      Proportion = round(mean_alloc / max_n, 3), Prior_Mean = prior_means)
print(results, row.names = FALSE)

adaptive_power <- unequal_anova_power(mean_alloc, prior_means, alpha)
equal_power <- unequal_anova_power(rep(max_n / K, K), prior_means, alpha)
cat("\\nANOVA power at the prior means: adaptive", round(adaptive_power, 3),
    " equal", round(equal_power, 3), "\\n")
if (equal_power > 1e-9) {
  cat("Relative change:", round((adaptive_power - equal_power) / equal_power * 100, 1), "%\\n")
}

barplot(mean_alloc, names.arg = treatments, main = "Expected Allocations",
        ylab = "Number of Samples", col = rainbow(K))

cat("\\nReference: Berry et al. (2010) Bayesian Adaptive Methods for Clinical Trials\\n")
`;
};

const generateEquivalenceRCode = (params: any): string => {
  const test = pick(params.testType, ['ttest', 'correlation'] as const, 'ttest');
  const margin = num(params.equivalenceMargin, 0.3);
  const priorMean = num(params.priorMean, 0);
  const priorSD = num(params.priorSD, 0.2);
  const targetProbability = num(params.targetProbability, 0.95);
  const targetAssurance = num(params.targetAssurance, 0.8);
  const alpha = num(params.alpha, 0.05);
  const unit = test === 'ttest' ? 'per group' : 'in total';

  return `# Bayesian Equivalence Testing (ROPE)
# Generated from PEEP
# Same method as PEEP (exact, no simulation):
#   The user's prior generates the true effect theta; the estimate is N(theta, se^2).
#   The decision uses a flat analysis prior, so the posterior is N(estimate, se^2) and
#   equivalence is declared if P(|theta| < M | data) >= target probability.
#   That probability falls as |estimate| grows, so equivalence is declared exactly when
#   |estimate| <= c(n), where c(n) is found by bisection. Marginally
#   estimate ~ N(m0, s0^2 + se^2), so
#   P(declare) = pnorm((c - m0) / sqrt(s0^2 + se^2)) - pnorm((-c - m0) / sqrt(s0^2 + se^2))
#   t-test: se^2 = 2 / n (standardised difference, n per group)
#   correlation: Fisher z scale, se^2 = 1 / (n - 3), margin atanh(margin)
# Required n: smallest n (every n from the minimum to 500 is checked) with
# P(declare) >= target assurance.

${R_SMALLEST_N}
# Parameters
test_type <- "${test}"
equivalence_margin <- ${margin}
prior_mean <- ${priorMean}
prior_sd <- ${priorSD}
target_probability <- ${targetProbability}
target_assurance <- ${targetAssurance}
alpha <- ${alpha}

if (test_type == "ttest") {
  m0 <- prior_mean
  s0 <- prior_sd
  M <- equivalence_margin
  se2 <- function(n) 2 / n
  n_min <- 2
} else {
  r0 <- min(max(prior_mean, -0.99), 0.99)
  m0 <- atanh(r0)
  s0 <- prior_sd / (1 - r0^2)
  M <- atanh(equivalence_margin)
  se2 <- function(n) 1 / (n - 3)
  n_min <- 4
}
n_max <- 500

prob_equivalent_at <- function(n) {
  se <- sqrt(se2(n))
  g <- function(cc) pnorm((M - cc) / se) - pnorm((-M - cc) / se)
  if (g(0) < target_probability) return(0)
  lo <- 0
  hi <- M + 10 * se
  for (i in 1:60) {
    mid <- (lo + hi) / 2
    if (g(mid) >= target_probability) lo <- mid else hi <- mid
  }
  sd_est <- sqrt(s0^2 + se^2)
  min(1, max(0, pnorm((lo - m0) / sd_est) - pnorm((-lo - m0) / sd_est)))
}

cat("=== Bayesian Equivalence Testing ===\\n")
cat("ROPE: [", -equivalence_margin, ",", equivalence_margin, "]\\n")
cat("Prior: N(", prior_mean, ",", prior_sd, ")\\n")
cat("Declare equivalence if P(in ROPE) >=", target_probability,
    "; target assurance", target_assurance, "\\n\\n")

# P(declare) is not guaranteed to be monotone in n, so every n is checked
required <- NA
for (n in n_min:n_max) {
  if (prob_equivalent_at(n) >= target_assurance) {
    required <- n
    break
  }
}
chart_n <- seq(10, n_max, by = 10)
chart_p <- sapply(chart_n, prob_equivalent_at)

if (is.na(required)) {
  cat("Target not reached by n =", n_max, "(${unit}); probability there:",
      round(prob_equivalent_at(n_max), 4), "\\n")
  required <- n_max
} else {
  cat("Required n (${unit}):", required, "\\n")
  cat("P(declare equivalence) at that n:", round(prob_equivalent_at(required), 4), "\\n")
}
cat("Prior probability inside the ROPE:", round(pnorm(M, m0, s0) - pnorm(-M, m0, s0), 3), "\\n\\n")

# Frequentist TOST (two one-sided tests at level alpha), 80% power at the prior mean
tost_power <- function(n) {
  se <- sqrt(se2(n))
  if (test_type == "ttest") {
    df <- 2 * n - 2
    cr <- qt(1 - alpha, df)
    max(0, pt((M - m0) / se - cr, df) + pt((M + m0) / se - cr, df) - 1)
  } else {
    cr <- qnorm(1 - alpha)
    max(0, pnorm((M - m0) / se - cr) + pnorm((M + m0) / se - cr) - 1)
  }
}
tost_n <- Inf
if (abs(m0) < M) {
  hi <- n_min
  while (hi <= 1e6 && tost_power(hi) < 0.8) hi <- hi * 2
  if (hi <= 1e6) tost_n <- smallest_n(n_min, hi, function(n) tost_power(n) >= 0.8)
}
cat("TOST n for 80% power (${unit}):", tost_n, "\\n")

plot(chart_n, chart_p, type = "l", lwd = 2, col = "blue", ylim = c(0, 1),
     xlab = "Sample size (${unit})", ylab = "P(declare equivalence)",
     main = "Equivalence Assurance")
abline(h = target_assurance, lty = 2, col = "red")
abline(v = required, lty = 2, col = "darkgreen")

cat("\\nReference: Kruschke (2018) Adv Meth Pract Psychol Sci 1:270-280\\n")
`;
};

const generateModelComparisonRCode = (params: any): string => {
  const models: any[] = Array.isArray(params.models) ? params.models : [];
  const nPerGroup = num(params.nPerGroup, 20);
  const targetBF = num(params.targetBF ?? params.targetBayesFactor, 10);
  const targetProbability = num(params.targetProbability, 0.8);
  const defaultProb = models.length > 0 ? 1 / models.length : 1;

  return `# Bayesian Model Comparison (Bayes factor design analysis)
# Generated from PEEP
# Same method as PEEP: each model is a Normal prior on the standardised difference d.
# For each simulated study the true model is drawn from the prior model probabilities,
# d from its prior, and the estimate from N(d, 2/n) (n per group, known SD).
# Marginal likelihood under model j: N(estimate; mu_j, s_j^2 + 2/n).
# Required n: smallest n where the true model has BF >= target against every
# competitor with probability >= target probability.

${R_SMALLEST_N}
# Parameters
model_names <- c(${models.map((m) => rStr(m?.name)).join(', ')})
prior_mean <- c(${models.map((m) => num(m?.prior?.mean, 0)).join(', ')})
prior_sd <- c(${models.map((m) => num(m?.prior?.sd, 0.1)).join(', ')})
prior_prob <- c(${models.map((m) => num(m?.priorProbability, defaultProb)).join(', ')})
start_n <- max(2, round(${nPerGroup}))
target_bf <- ${targetBF}
target_probability <- ${targetProbability}

M <- length(model_names)
stopifnot(M >= 2, target_bf > 1)
prior_prob <- prior_prob / sum(prior_prob)
log_prior <- log(prior_prob)

set.seed(123)
nsim <- 2000
true_model <- sample.int(M, nsim, replace = TRUE, prob = prior_prob)
z_theta <- rnorm(nsim)
z_noise <- rnorm(nsim)

evaluate <- function(n) {
  v <- 2 / n
  sd_marg <- sqrt(prior_sd^2 + v)
  theta <- prior_mean[true_model] + prior_sd[true_model] * z_theta
  est <- theta + sqrt(v) * z_noise
  logml <- sapply(seq_len(M), function(j) dnorm(est, prior_mean[j], sd_marg[j], log = TRUE))
  lp <- sweep(logml, 2, log_prior, "+")
  best <- max.col(lp, ties.method = "first")
  lse <- apply(lp, 1, function(r) { mx <- max(r); mx + log(sum(exp(r - mx))) })
  idx <- cbind(seq_len(nsim), true_model)
  post_true <- exp(lp[idx] - lse)
  alt <- logml
  alt[idx] <- -Inf
  log_bf <- logml[idx] - apply(alt, 1, max)
  tm <- factor(true_model, levels = seq_len(M))
  list(
    p_compelling = mean(log_bf >= log(target_bf)),
    p_correct = mean(best == true_model),
    mean_post_true = as.numeric(tapply(post_true, tm, mean)),
    median_bf = exp(as.numeric(tapply(log_bf, tm, median)))
  )
}

max_n <- max(1000, start_n)
step <- max(10, ceiling((max_n - start_n) / 60))
grid <- c(seq(start_n, max_n - 1, by = step), max_n)
grid <- grid[grid <= max_n]
required <- NA
prev <- start_n
chart <- NULL
for (n in grid) {
  r <- evaluate(n)
  chart <- rbind(chart, data.frame(n = n, model = model_names, posterior_prob = r$mean_post_true))
  if (r$p_compelling >= target_probability) {
    required <- if (n == start_n) n else {
      found <- smallest_n(prev + 1, n, function(x) evaluate(x)$p_compelling >= target_probability)
      if (is.na(found)) n else found
    }
    break
  }
  prev <- n
}

cat("=== Bayesian Model Comparison ===\\n")
print(data.frame(model = model_names, prior_mean = prior_mean, prior_sd = prior_sd,
                 prior_prob = round(prior_prob, 3)), row.names = FALSE)
if (is.na(required)) {
  final <- evaluate(max_n)
  cat("\\nTarget not reached by n =", max_n, "per group; P(BF >=", target_bf, ") =",
      round(final$p_compelling, 3), "\\n")
} else {
  final <- evaluate(required)
  cat("\\nRequired n per group:", required, "\\n")
  cat("P(true model has BF >=", target_bf, "against all others):", round(final$p_compelling, 3), "\\n")
}
cat("P(highest posterior model is the true model):", round(final$p_correct, 3), "\\n")
cat("Median BF of each model against its strongest competitor (when true):\\n")
print(data.frame(model = model_names, median_BF = signif(final$median_bf, 4)), row.names = FALSE)

write.csv(chart, "model_comparison_curve.csv", row.names = FALSE)

cat("\\nReference: Schoenbrodt & Wagenmakers (2018) Psychon Bull Rev 25:128-142\\n")
`;
};

const generateCalibrationRCode = (params: any): string => {
  const target = num(params.frequentistPower, 0.8);
  const effect = num(params.effectSize, 0.5);
  const unc = num(params.effectUncertainty, 0.2);
  const nPerGroup = num(params.nPerGroup, 64);
  const test = pick(params.testType, ['ttest', 'anova'] as const, 'ttest');
  const groups = num(params.groups, 2);
  const alpha = num(params.alpha, 0.05);

  return `# Bayesian Calibration: Frequentist Power vs Expected Power (Assurance)
# Generated from PEEP
# Same definitions as PEEP: assurance = E[power(theta, n)] with
# theta ~ Normal(effect size, uncertainty) truncated to its valid range
# (O'Hagan, Stevens & Campbell 2005). Power counts rejections in the
# hypothesised direction.

${R_BAYES_HELPERS}
# Parameters
test_type <- "${test}"
target_power <- ${target}   # the frequentist power target
effect_size <- ${effect}
effect_uncertainty <- ${unc}  # prior SD
n_per_group <- ${nPerGroup}
num_groups <- ${test === 'anova' ? groups : 2}
alpha <- ${alpha}

assurance_at <- function(n, sd = effect_uncertainty) {
  expected_power(test_type, n, effect_size, sd, alpha, num_groups)
}

assurance <- assurance_at(n_per_group)
point_power <- directional_power(test_type, n_per_group, effect_size, alpha, num_groups)
loss <- max(0, (target_power - assurance) / target_power * 100)

cat("=== Bayesian Calibration ===\\n")
cat("Power at the exact effect size:", round(point_power, 3), "\\n")
cat("Expected power (assurance) with SD", effect_uncertainty, ":", round(assurance, 3), "\\n")
cat("Shortfall against the target:", round(loss, 1), "%\\n")

if (assurance >= target_power) {
  cat("n =", n_per_group, "per group meets the target\\n")
} else {
  rec <- smallest_n(n_per_group, 5000, function(n) assurance_at(n) >= target_power)
  if (is.na(rec)) {
    cat("The target cannot be reached at any sample size up to 5000 per group\\n")
  } else {
    cat("Recommended n per group:", rec, "\\n")
  }
}

# Assurance as a function of the prior uncertainty
max_unc <- max(abs(effect_size), 0.05)
unc_grid <- max_unc * (0:20) / 20
calib <- sapply(unc_grid, function(s) assurance_at(n_per_group, s))
plot(unc_grid, calib, type = "l", lwd = 2, col = "blue", ylim = c(0, 1),
     xlab = "Effect size uncertainty (SD)", ylab = "Expected power",
     main = "Calibration Curve")
abline(h = target_power, lty = 2, col = "red")
abline(v = effect_uncertainty, lty = 2, col = "darkgreen")

# Assurance versus sample size
sample_sizes <- seq(10, 200, by = 5)
assurance_values <- sapply(sample_sizes, assurance_at)
write.csv(data.frame(Sample_Size = sample_sizes, Assurance = assurance_values),
          "calibration_curve.csv", row.names = FALSE)
write.csv(data.frame(Uncertainty = unc_grid, Assurance = calib),
          "calibration_by_uncertainty.csv", row.names = FALSE)

cat("\\nReference: O'Hagan, Stevens & Campbell (2005) Pharmaceutical Statistics 4:187-201\\n")
`;
};

// ---------------------------------------------------------------------------
// Browser helpers
// ---------------------------------------------------------------------------

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};

export const downloadRFile = (code: string, filename: string) => {
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.R') ? filename : `${filename}.R`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
