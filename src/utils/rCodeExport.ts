/**
 * Utility functions to generate R code for power analyses
 * Generates accurate R scripts that match the JavaScript calculations
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

export const generateRCode = (params: RCodeParams): string => {
  const { testType, parameters } = params;
  
  switch (testType) {
    case 'ttest':
      return generateTTestRCode(parameters);
    case 'correlation':
      return generateCorrelationRCode(parameters);
    case 'chisquare':
      return generateChiSquareRCode(parameters);
    case 'oneway-anova':
      return generateOneWayAnovaRCode(parameters);
    case 'twoway-anova':
      return generateTwoWayAnovaRCode(parameters);
    case 'repeated-measures':
      return generateRepeatedMeasuresRCode(parameters);
    case 'nested-anova':
      return generateNestedAnovaRCode(parameters);
    case 'permanova':
      return generatePERMANOVARCode(parameters);
    case 'repeated-permanova':
      return generateRepeatedPERMANOVARCode(parameters);
    case 'bayesian':
      return generateBayesianRCode(parameters);
    case 'deseq':
      return generateDESeqRCode(parameters);
    case 'zinb':
      return generateZINBRCode(parameters);
    case 'lmm-microbiome':
      return generateLMMMicrobiomeRCode(parameters);
    case 'bayesian-sequential':
      return generateSequentialRCode(parameters);
    case 'bayesian-replication':
      return generateReplicationRCode(parameters);
    case 'bayesian-information':
      return generateInformationDesignRCode(parameters);
    case 'bayesian-hierarchical':
      return generateHierarchicalRCode(parameters);
    case 'bayesian-adaptive':
      return generateAdaptiveAllocationRCode(parameters);
    case 'bayesian-equivalence':
      return generateEquivalenceRCode(parameters);
    case 'bayesian-model-comparison':
      return generateModelComparisonRCode(parameters);
    case 'bayesian-calibration':
      return generateCalibrationRCode(parameters);
    case 'bayesian-microbiome-deseq':
      return generateBayesianRCode(parameters);
    case 'bayesian-microbiome-lmm':
      return generateBayesianRCode(parameters);
    default:
      return '# Unknown test type';
  }
};

const generateTTestRCode = (params: any): string => {
  const { n, effectSize, alpha } = params;
  
  return `# Two-Sample t-test Power Analysis
# Generated from Ecological Power Analysis Tool

# Install required package (if not already installed)
# install.packages("pwr")

library(pwr)

# Parameters
n_per_group <- ${n}
effect_size_d <- ${effectSize}  # Cohen's d
alpha <- ${alpha}
alternative <- "two.sided"

# Power calculation
power_result <- pwr.t.test(
  n = n_per_group,
  d = effect_size_d,
  sig.level = alpha,
  type = "two.sample",
  alternative = alternative
)

print(power_result)

# Calculate power curve
sample_sizes <- seq(5, 200, by = 1)
power_curve <- sapply(sample_sizes, function(n) {
  pwr.t.test(n = n, d = effect_size_d, sig.level = alpha, 
             type = "two.sample", alternative = alternative)$power
})

# Plot power curve
plot(sample_sizes * 2, power_curve, 
     type = "l", lwd = 2, col = "blue",
     xlab = "Total Sample Size (N)", 
     ylab = "Statistical Power",
     main = "Power Curve: Two-Sample t-test",
     ylim = c(0, 1))
abline(h = 0.8, lty = 2, col = "red")
abline(v = n_per_group * 2, lty = 2, col = "green")
legend("bottomright", 
       legend = c("Power curve", "Target power (0.8)", "Current N"),
       col = c("blue", "red", "green"), lty = c(1, 2, 2), lwd = c(2, 1, 1))

# Export results
results_df <- data.frame(
  Total_N = sample_sizes * 2,
  Power = power_curve
)
write.csv(results_df, "ttest_power_curve.csv", row.names = FALSE)
`;
};

const generateCorrelationRCode = (params: any): string => {
  const { n, rho, alpha } = params;
  
  return `# Correlation Power Analysis
# Generated from Ecological Power Analysis Tool

library(pwr)

# Parameters
n <- ${n}  # Total sample size
rho <- ${rho}  # Expected correlation coefficient
alpha <- ${alpha}
alternative <- "two.sided"

# Power calculation
power_result <- pwr.r.test(
  n = n,
  r = rho,
  sig.level = alpha,
  alternative = alternative
)

print(power_result)

# Calculate power curve
sample_sizes <- seq(5, 200, by = 1)
power_curve <- sapply(sample_sizes, function(n) {
  pwr.r.test(n = n, r = rho, sig.level = alpha, 
             alternative = alternative)$power
})

# Plot power curve
plot(sample_sizes, power_curve, 
     type = "l", lwd = 2, col = "blue",
     xlab = "Total Sample Size", 
     ylab = "Statistical Power",
     main = "Power Curve: Pearson Correlation",
     ylim = c(0, 1))
abline(h = 0.8, lty = 2, col = "red")
abline(v = n, lty = 2, col = "green")
legend("bottomright", 
       legend = c("Power curve", "Target power (0.8)", "Current N"),
       col = c("blue", "red", "green"), lty = c(1, 2, 2), lwd = c(2, 1, 1))

# Export results
results_df <- data.frame(
  Sample_Size = sample_sizes,
  Power = power_curve
)
write.csv(results_df, "correlation_power_curve.csv", row.names = FALSE)
`;
};

const generateChiSquareRCode = (params: any): string => {
  const { n, w, df, alpha } = params;
  
  return `# Chi-Square Test Power Analysis
# Generated from Ecological Power Analysis Tool

library(pwr)

# Parameters
n <- ${n}  # Total sample size
effect_size_w <- ${w}  # Cohen's w
df <- ${df}  # Degrees of freedom
alpha <- ${alpha}

# Power calculation
power_result <- pwr.chisq.test(
  w = effect_size_w,
  N = n,
  df = df,
  sig.level = alpha
)

print(power_result)

# Calculate power curve
sample_sizes <- seq(10, 500, by = 5)
power_curve <- sapply(sample_sizes, function(N) {
  pwr.chisq.test(w = effect_size_w, N = N, df = df, 
                 sig.level = alpha)$power
})

# Plot power curve
plot(sample_sizes, power_curve, 
     type = "l", lwd = 2, col = "blue",
     xlab = "Total Sample Size (N)", 
     ylab = "Statistical Power",
     main = "Power Curve: Chi-Square Test",
     ylim = c(0, 1))
abline(h = 0.8, lty = 2, col = "red")
abline(v = n, lty = 2, col = "green")
legend("bottomright", 
       legend = c("Power curve", "Target power (0.8)", "Current N"),
       col = c("blue", "red", "green"), lty = c(1, 2, 2), lwd = c(2, 1, 1))

# Export results
results_df <- data.frame(
  Sample_Size = sample_sizes,
  Power = power_curve
)
write.csv(results_df, "chisquare_power_curve.csv", row.names = FALSE)
`;
};

const generateOneWayAnovaRCode = (params: any): string => {
  const { n, groups, effectSize, alpha } = params;
  
  return `# One-Way ANOVA Power Analysis
# Generated from Ecological Power Analysis Tool

library(pwr)

# Parameters
n_per_group <- ${n}
num_groups <- ${groups}
effect_size_f <- ${effectSize}  # Cohen's f
alpha <- ${alpha}

# Power calculation
power_result <- pwr.anova.test(
  k = num_groups,
  n = n_per_group,
  f = effect_size_f,
  sig.level = alpha
)

print(power_result)

# Calculate power curve
sample_sizes_per_group <- seq(5, 100, by = 1)
power_curve <- sapply(sample_sizes_per_group, function(n) {
  pwr.anova.test(k = num_groups, n = n, f = effect_size_f, 
                 sig.level = alpha)$power
})

# Plot power curve
plot(sample_sizes_per_group * num_groups, power_curve, 
     type = "l", lwd = 2, col = "blue",
     xlab = "Total Sample Size (N)", 
     ylab = "Statistical Power",
     main = "Power Curve: One-Way ANOVA",
     ylim = c(0, 1))
abline(h = 0.8, lty = 2, col = "red")
abline(v = n_per_group * num_groups, lty = 2, col = "green")
legend("bottomright", 
       legend = c("Power curve", "Target power (0.8)", "Current N"),
       col = c("blue", "red", "green"), lty = c(1, 2, 2), lwd = c(2, 1, 1))

# Export results
results_df <- data.frame(
  N_per_Group = sample_sizes_per_group,
  Total_N = sample_sizes_per_group * num_groups,
  Power = power_curve
)
write.csv(results_df, "oneway_anova_power_curve.csv", row.names = FALSE)
`;
};

const generateTwoWayAnovaRCode = (params: any): string => {
  const { nPerCell, factorALevels, factorBLevels, effectSizeA, effectSizeB, effectSizeAB, alpha } = params;
  
  return `# Two-Way ANOVA Power Analysis
# Generated from Ecological Power Analysis Tool

# Install required package (if not already installed)
# install.packages("WebPower")

library(WebPower)

# Parameters
n_per_cell <- ${nPerCell}
factor_A_levels <- ${factorALevels}
factor_B_levels <- ${factorBLevels}
effect_size_A <- ${effectSizeA}  # Cohen's f for main effect A
effect_size_B <- ${effectSizeB}  # Cohen's f for main effect B
effect_size_AB <- ${effectSizeAB}  # Cohen's f for interaction
alpha <- ${alpha}

# Power calculation for Main Effect A
power_A <- wp.kanova(
  n = n_per_cell,
  f = effect_size_A,
  k = factor_A_levels * factor_B_levels,
  ndf = factor_A_levels - 1,
  alpha = alpha
)

# Power calculation for Main Effect B
power_B <- wp.kanova(
  n = n_per_cell,
  f = effect_size_B,
  k = factor_A_levels * factor_B_levels,
  ndf = factor_B_levels - 1,
  alpha = alpha
)

# Power calculation for Interaction A×B
power_AB <- wp.kanova(
  n = n_per_cell,
  f = effect_size_AB,
  k = factor_A_levels * factor_B_levels,
  ndf = (factor_A_levels - 1) * (factor_B_levels - 1),
  alpha = alpha
)

cat("\\n=== Two-Way ANOVA Power Analysis Results ===\\n")
cat("\\nMain Effect A:", power_A$power, "\\n")
cat("Main Effect B:", power_B$power, "\\n")
cat("Interaction A×B:", power_AB$power, "\\n")

# Calculate power curves
sample_sizes <- seq(5, 100, by = 2)

power_curve_A <- sapply(sample_sizes, function(n) {
  wp.kanova(n = n, f = effect_size_A, 
            k = factor_A_levels * factor_B_levels,
            ndf = factor_A_levels - 1, alpha = alpha)$power
})

power_curve_B <- sapply(sample_sizes, function(n) {
  wp.kanova(n = n, f = effect_size_B, 
            k = factor_A_levels * factor_B_levels,
            ndf = factor_B_levels - 1, alpha = alpha)$power
})

power_curve_AB <- sapply(sample_sizes, function(n) {
  wp.kanova(n = n, f = effect_size_AB, 
            k = factor_A_levels * factor_B_levels,
            ndf = (factor_A_levels - 1) * (factor_B_levels - 1), 
            alpha = alpha)$power
})

# Plot power curves
plot(sample_sizes * factor_A_levels * factor_B_levels, power_curve_A, 
     type = "l", lwd = 2, col = "blue",
     xlab = "Total Sample Size (N)", 
     ylab = "Statistical Power",
     main = "Power Curves: Two-Way ANOVA",
     ylim = c(0, 1))
lines(sample_sizes * factor_A_levels * factor_B_levels, power_curve_B, 
      lwd = 2, col = "green")
lines(sample_sizes * factor_A_levels * factor_B_levels, power_curve_AB, 
      lwd = 2, col = "red")
abline(h = 0.8, lty = 2, col = "gray")
legend("bottomright", 
       legend = c("Main Effect A", "Main Effect B", "Interaction A×B", "Target (0.8)"),
       col = c("blue", "green", "red", "gray"), 
       lty = c(1, 1, 1, 2), lwd = c(2, 2, 2, 1))

# Export results
results_df <- data.frame(
  N_per_Cell = sample_sizes,
  Total_N = sample_sizes * factor_A_levels * factor_B_levels,
  Power_MainA = power_curve_A,
  Power_MainB = power_curve_B,
  Power_Interaction = power_curve_AB
)
write.csv(results_df, "twoway_anova_power_curves.csv", row.names = FALSE)
`;
};

const generateRepeatedMeasuresRCode = (params: any): string => {
  const { subjects, timepoints, effectSize, correlation, alpha } = params;
  
  return `# Repeated Measures ANOVA Power Analysis
# Generated from Ecological Power Analysis Tool

# Install required package (if not already installed)
# install.packages("WebPower")

library(WebPower)

# Parameters
subjects <- ${subjects}
timepoints <- ${timepoints}
effect_size_f <- ${effectSize}  # Cohen's f for within-subjects effect
correlation <- ${correlation}  # Expected correlation between timepoints
alpha <- ${alpha}

# Power calculation using sphericity assumption
# Design effect adjustment for correlation
epsilon <- 1  # Assuming sphericity
ndf <- timepoints - 1  # Numerator degrees of freedom
ddf <- (subjects - 1) * ndf  # Denominator degrees of freedom

# Adjust effective sample size for correlation
# Higher correlation increases power
effective_n <- subjects * (1 + (timepoints - 1) * correlation) / timepoints

# Power calculation using F-test approximation
power_result <- wp.rmanova(
  n = subjects,
  ng = 1,  # One group
  nm = timepoints,  # Number of measurements
  f = effect_size_f,
  nscor = correlation,
  alpha = alpha,
  type = 0  # Within-subjects design
)

print(power_result)

# Calculate power curve
subject_sizes <- seq(5, 100, by = 1)
power_curve <- sapply(subject_sizes, function(n) {
  wp.rmanova(n = n, ng = 1, nm = timepoints, f = effect_size_f, 
             nscor = correlation, alpha = alpha, type = 0)$power
})

# Plot power curve
plot(subject_sizes, power_curve, 
     type = "l", lwd = 2, col = "blue",
     xlab = "Number of Subjects", 
     ylab = "Statistical Power",
     main = "Power Curve: Repeated Measures ANOVA",
     ylim = c(0, 1))
abline(h = 0.8, lty = 2, col = "red")
abline(v = subjects, lty = 2, col = "green")
legend("bottomright", 
       legend = c("Power curve", "Target power (0.8)", "Current N"),
       col = c("blue", "red", "green"), lty = c(1, 2, 2), lwd = c(2, 1, 1))

# Export results
results_df <- data.frame(
  Subjects = subject_sizes,
  Total_Observations = subject_sizes * timepoints,
  Power = power_curve
)
write.csv(results_df, "repeated_measures_power_curve.csv", row.names = FALSE)
`;
};

const generateNestedAnovaRCode = (params: any): string => {
  const { sitesPerTreatment, subplotsPerSite, effectSize, alpha } = params;
  
  return `# Nested ANOVA Power Analysis
# Generated from Ecological Power Analysis Tool

# Note: Exact power for nested designs requires simulation
# This provides an approximation using effective sample size

# Parameters
sites_per_treatment <- ${sitesPerTreatment}
subplots_per_site <- ${subplotsPerSite}
effect_size_f <- ${effectSize}  # Cohen's f
alpha <- ${alpha}
num_treatments <- 2  # Assuming 2 treatments

# Calculate Intraclass Correlation Coefficient (ICC) - assumed
# In practice, estimate from pilot data
icc <- 0.2  # Moderate clustering

# Calculate design effect (Deff)
design_effect <- 1 + (subplots_per_site - 1) * icc

# Effective sample size per treatment
effective_n <- (sites_per_treatment * subplots_per_site) / design_effect

cat("\\n=== Nested ANOVA Design ===\\n")
cat("Sites per treatment:", sites_per_treatment, "\\n")
cat("Subplots per site:", subplots_per_site, "\\n")
cat("Total per treatment:", sites_per_treatment * subplots_per_site, "\\n")
cat("Design effect (assumed ICC=0.2):", design_effect, "\\n")
cat("Effective sample size:", round(effective_n, 1), "\\n\\n")

# Approximate power using effective N
library(pwr)

power_result <- pwr.t.test(
  n = effective_n,
  d = effect_size_f * sqrt(2),  # Convert f to d approximation
  sig.level = alpha,
  type = "two.sample"
)

cat("Approximate power:", round(power_result$power, 3), "\\n")

# Note on interpretation
cat("\\n*** IMPORTANT NOTE ***\\n")
cat("This is an APPROXIMATION. For accurate nested ANOVA power:\\n")
cat("1. Use simulations with your specific ICC\\n")
cat("2. Use the 'nlme' or 'lme4' package for mixed models\\n")
cat("3. Consider the lmmpower or longpower packages\\n")
cat("\\nSee: Anderson & Ter Braak (2003) Ecology 84:511-515\\n")

# Simulation-based power (more accurate)
cat("\\n=== Simulation-Based Power Estimate ===\\n")
cat("Running 1000 simulations...\\n")

# Simulation function
simulate_nested <- function(sites_per_tx, subplots_per_site, effect_d, icc, nsim = 1000) {
  library(nlme)
  
  p_values <- numeric(nsim)
  
  for (i in 1:nsim) {
    # Generate data
    site_id <- rep(1:(sites_per_tx * 2), each = subplots_per_site)
    treatment <- rep(rep(c("Control", "Treatment"), each = sites_per_tx), each = subplots_per_site)
    
    # Random effects
    site_effect <- rep(rnorm(sites_per_tx * 2, 0, sqrt(icc)), each = subplots_per_site)
    residual <- rnorm(length(site_id), 0, sqrt(1 - icc))
    
    # Response variable
    treatment_effect <- ifelse(treatment == "Treatment", effect_d, 0)
    y <- treatment_effect + site_effect + residual
    
    # Fit nested model
    df <- data.frame(y = y, treatment = factor(treatment), site = factor(site_id))
    model <- try(lme(y ~ treatment, random = ~1|site, data = df), silent = TRUE)
    
    if (!inherits(model, "try-error")) {
      p_values[i] <- anova(model)$"p-value"[2]
    } else {
      p_values[i] <- NA
    }
  }
  
  power <- mean(p_values < ${alpha}, na.rm = TRUE)
  return(power)
}

simulated_power <- simulate_nested(${sitesPerTreatment}, ${subplotsPerSite}, 
                                    effect_size_f * sqrt(2), icc)
cat("Simulated power:", round(simulated_power, 3), "\\n")
`;
};

const generatePERMANOVARCode = (params: any): string => {
  const { nPerGroup, groups, rSquared, alpha } = params;
  
  return `# PERMANOVA Power Analysis
# Generated from Ecological Power Analysis Tool

# Install required packages (if not already installed)
# install.packages("vegan")
# install.packages("RVAideMemoire")

library(vegan)
library(RVAideMemoire)

# Parameters
n_per_group <- ${nPerGroup}
num_groups <- ${groups}
r_squared <- ${rSquared}  # Expected proportion of variance explained
alpha <- ${alpha}
distance_method <- "bray"  # Bray-Curtis dissimilarity

# Note: Exact PERMANOVA power requires simulation with your specific data structure
# This script provides a simulation-based approach

cat("\\n=== PERMANOVA Power Analysis ===\\n")
cat("Sample size per group:", n_per_group, "\\n")
cat("Number of groups:", num_groups, "\\n")
cat("Expected R²:", r_squared, "\\n")
cat("Alpha level:", alpha, "\\n\\n")

# Simulation-based power calculation
simulate_permanova <- function(n_per_group, num_groups, r2, alpha, nsim = 999) {
  p_values <- numeric(nsim)
  
  for (i in 1:nsim) {
    # Simulate community data
    # Create distance matrix with specified R²
    total_n <- n_per_group * num_groups
    groups_vec <- factor(rep(1:num_groups, each = n_per_group))
    
    # Simulate dissimilarity matrix
    # Between-group distances larger than within-group
    within_group_dist <- sqrt(1 - r2)
    between_group_dist <- sqrt(1 + r2)
    
    # Generate random community data (placeholder)
    # In practice, use realistic community simulation
    species_data <- matrix(rpois(total_n * 50, lambda = 10), 
                           nrow = total_n, ncol = 50)
    
    # Add group effect
    for (g in 1:num_groups) {
      group_idx <- which(groups_vec == g)
      species_data[group_idx, (g*5):((g*5)+4)] <- 
        species_data[group_idx, (g*5):((g*5)+4)] * (1 + sqrt(r2) * 2)
    }
    
    # Calculate distance matrix
    dist_matrix <- vegdist(species_data, method = distance_method)
    
    # Run PERMANOVA
    perm_result <- adonis2(dist_matrix ~ groups_vec, permutations = 999)
    p_values[i] <- perm_result[["Pr(>F)"]][1]
  }
  
  power <- mean(p_values < alpha, na.rm = TRUE)
  return(power)
}

cat("Running", 999, "simulations...\\n")
cat("This may take a minute...\\n\\n")

set.seed(123)
estimated_power <- simulate_permanova(n_per_group, num_groups, r_squared, alpha)

cat("\\n=== Results ===\\n")
cat("Estimated Power:", round(estimated_power, 3), "\\n\\n")

# Interpretation
if (estimated_power >= 0.8) {
  cat("✓ Excellent power to detect the specified effect\\n")
} else if (estimated_power >= 0.6) {
  cat("○ Moderate power - consider increasing sample size\\n")
} else {
  cat("✗ Low power - strongly recommend increasing sample size\\n")
}

# Sample size recommendations
cat("\\n=== Sample Size Recommendations ===\\n")
for (target_n in seq(10, 100, by = 10)) {
  power <- simulate_permanova(target_n, num_groups, r_squared, alpha, nsim = 200)
  cat("n =", target_n, "per group: Power ≈", round(power, 2), "\\n")
  if (power >= 0.8) break
}

cat("\\n*** IMPORTANT NOTES ***\\n")
cat("1. Power depends heavily on your distance metric and data dispersion\\n")
cat("2. Conduct a pilot study to estimate realistic R² values\\n")
cat("3. Check for homogeneity of dispersions (betadisper)\\n")
cat("4. Consider beta diversity components (turnover vs nestedness)\\n")
cat("\\nReference: Anderson & Walsh (2013) Ecol Monogr 83:557-574\\n")
`;
};

const generateRepeatedPERMANOVARCode = (params: any): string => {
  const { subjects, timepoints, rSquared, correlation, alpha } = params;
  
  return `# Repeated Measures PERMANOVA Power Analysis
# Generated from Ecological Power Analysis Tool

library(vegan)

# Parameters
subjects <- ${subjects}
timepoints <- ${timepoints}
r_squared <- ${rSquared}  # Expected R² for time effect
correlation <- ${correlation}  # Within-subject correlation
alpha <- ${alpha}

cat("\\n=== Repeated Measures PERMANOVA ===\\n")
cat("Number of subjects:", subjects, "\\n")
cat("Number of timepoints:", timepoints, "\\n")
cat("Expected R²:", r_squared, "\\n")
cat("Within-subject correlation:", correlation, "\\n\\n")

# Design effect for repeated measures
design_effect <- 1 + (timepoints - 1) * correlation
effective_n <- (subjects * timepoints) / design_effect

cat("Design effect:", round(design_effect, 2), "\\n")
cat("Effective sample size:", round(effective_n, 1), "\\n\\n")

# Simulation-based power
simulate_rm_permanova <- function(subj, tp, r2, rho, alpha, nsim = 500) {
  library(MASS)  # For mvrnorm
  
  p_values <- numeric(nsim)
  
  for (i in 1:nsim) {
    # Create subject and time factors
    subject_id <- factor(rep(1:subj, each = tp))
    time <- factor(rep(1:tp, times = subj))
    
    # Simulate community data with correlation structure
    # Generate correlated random effects for subjects
    Sigma <- matrix(rho, nrow = tp, ncol = tp)
    diag(Sigma) <- 1
    
    species_mat <- matrix(0, nrow = subj * tp, ncol = 50)
    
    for (s in 1:subj) {
      # Generate correlated observations for this subject
      subject_effects <- mvrnorm(1, mu = rep(0, tp), Sigma = Sigma)
      idx <- ((s-1)*tp + 1):(s*tp)
      
      # Base community
      species_mat[idx, ] <- matrix(rpois(tp * 50, lambda = 10), 
                                   nrow = tp, ncol = 50)
      
      # Add time effect with specified R²
      for (t in 1:tp) {
        time_effect <- sqrt(r2) * (t - 1) / (tp - 1)
        species_mat[idx[t], ] <- species_mat[idx[t], ] * (1 + time_effect) + 
                                 subject_effects[t]
      }
    }
    
    # Calculate distance matrix
    dist_mat <- vegdist(species_mat, method = "bray")
    
    # PERMANOVA accounting for repeated measures structure
    # Use adonis2 with strata argument for within-subject permutations
    perm_result <- adonis2(dist_mat ~ time, strata = subject_id, 
                           permutations = 999)
    
    p_values[i] <- perm_result[["Pr(>F)"]][1]
  }
  
  power <- mean(p_values < alpha, na.rm = TRUE)
  return(power)
}

cat("Running simulations...\\n\\n")
set.seed(123)
estimated_power <- simulate_rm_permanova(subjects, timepoints, r_squared, 
                                         correlation, alpha)

cat("=== Results ===\\n")
cat("Estimated Power:", round(estimated_power, 3), "\\n\\n")

# Power interpretation
if (estimated_power >= 0.8) {
  cat("✓ Excellent power\\n")
} else {
  required_subjects <- ceiling(subjects / (estimated_power / 0.8))
  cat("Recommended subjects for 80% power: ~", required_subjects, "\\n")
}

cat("\\n*** CRITICAL CONSIDERATIONS ***\\n")
cat("1. Use 'strata' argument in adonis2() for within-subject permutations\\n")
cat("2. Account for temporal autocorrelation in your data\\n")
cat("3. Consider missing data and dropout rates\\n")
cat("4. Check assumptions: homogeneity of dispersions over time\\n")
cat("\\nReference: Anderson et al. (2008) Ecol Lett 11:683-693\\n")
`;
};

const generateBayesianRCode = (params: any): string => {
  const { effectMean, effectSD, targetPower, targetAssurance, testType, groups, alpha, log2FCMean, log2FCSD, dispersion, baseMean, numTests, effectSizeMean, nTimepoints, withinCorr, dropoutRate } = params;
  
  // Handle PERMANOVA specifically
  if (testType === 'permanova') {
    return `# Bayesian Assurance for PERMANOVA
# Generated from Ecological Power Analysis Tool

# Install required packages
# install.packages(c("vegan", "pwr"))

library(vegan)
library(pwr)

# Parameters
r_squared_mean <- ${effectMean}  # Expected R² (variance explained)
r_squared_sd <- ${effectSD}  # Uncertainty in R²
target_power <- ${targetPower}
target_assurance <- ${targetAssurance}
alpha <- ${alpha}
num_groups <- ${groups}

cat("\\n=== Bayesian PERMANOVA Assurance Analysis ===\\n")
cat("Prior: R² ~ N(", r_squared_mean, ",", r_squared_sd, ")\\n")
cat("Target power:", target_power, "\\n")
cat("Target assurance:", target_assurance, "\\n\\n")

set.seed(123)

# Calculate assurance for PERMANOVA
calculate_permanova_assurance <- function(n, r_sq_mean, r_sq_sd, target_pwr, alpha, k) {
  nsim <- 5000
  r_sq_samples <- pmax(0.001, rnorm(nsim, mean = r_sq_mean, sd = r_sq_sd))
  
  powers <- numeric(nsim)
  for (i in 1:nsim) {
    # Convert R² to f² for power calculation
    f_sq <- r_sq_samples[i] / (1 - r_sq_samples[i])
    
    # PERMANOVA power approximation
    df_treatment <- k - 1
    df_error <- k * (n - 1)
    ncp <- n * k * f_sq
    f_crit <- qf(1 - alpha, df_treatment, df_error)
    powers[i] <- 1 - pf(f_crit, df_treatment, df_error, ncp = ncp)
  }
  
  assurance <- mean(powers >= target_pwr)
  return(list(assurance = assurance, powers = powers))
}

# Find required sample size
n_range <- seq(5, 200, by = 3)
assurance_values <- numeric(length(n_range))

for (i in seq_along(n_range)) {
  result <- calculate_permanova_assurance(n_range[i], r_squared_mean, r_squared_sd,
                                         target_power, alpha, num_groups)
  assurance_values[i] <- result$assurance
  cat(".")
}

required_n <- n_range[which(assurance_values >= target_assurance)[1]]
cat("\\n\\nRequired sample size per group:", required_n, "\\n")

# Plot assurance curve
plot(n_range, assurance_values, type = "l", lwd = 2, col = "blue",
     xlab = "Samples per Group", ylab = "Assurance",
     main = "PERMANOVA Assurance Curve", ylim = c(0, 1))
abline(h = target_assurance, lty = 2, col = "red")
abline(v = required_n, lty = 2, col = "green")

# Export results
write.csv(data.frame(Sample_Size = n_range, Assurance = assurance_values),
          "permanova_assurance.csv", row.names = FALSE)

cat("\\nResults exported to: permanova_assurance.csv\\n")
`;
  }
  
  // Handle differential abundance (DESeq2-style) for Bayesian
  if (log2FCMean !== undefined && dispersion !== undefined) {
    return `# Bayesian Assurance for Differential Abundance (DESeq2/edgeR)
# Generated from Ecological Power Analysis Tool

# Install required packages
# install.packages("DESeq2")  # From Bioconductor

library(DESeq2)

# Parameters
log2fc_mean <- ${log2FCMean}
log2fc_sd <- ${log2FCSD}
dispersion <- ${dispersion}
base_mean <- ${baseMean}
target_power <- ${targetPower}
target_assurance <- ${targetAssurance}
alpha <- ${alpha}
num_tests <- ${numTests}
alpha_adj <- alpha / num_tests  # Bonferroni correction

cat("\\n=== Bayesian DESeq2 Assurance Analysis ===\\n")
cat("Prior: log2FC ~ N(", log2fc_mean, ",", log2fc_sd, ")\\n")
cat("Number of taxa:", num_tests, "\\n")
cat("Adjusted alpha:", alpha_adj, "\\n\\n")

set.seed(123)

# Calculate assurance
calculate_deseq_assurance <- function(n, fc_mean, fc_sd, disp, mu, alpha_level, target_pwr) {
  nsim <- 1000
  fc_samples <- pmax(0.1, rnorm(nsim, mean = fc_mean, sd = fc_sd))
  
  powers <- numeric(nsim)
  for (i in 1:nsim) {
    # Wald test SE for negative binomial
    se <- sqrt((disp / (n * mu)) + (disp / (n * mu)))
    z_stat <- abs(fc_samples[i]) / se
    z_crit <- qnorm(1 - alpha_level/2)
    powers[i] <- pnorm(z_stat - z_crit) + pnorm(-z_stat - z_crit)
  }
  
  assurance <- mean(powers >= target_pwr)
  return(list(assurance = assurance, powers = powers))
}

# Find required sample size
n_range <- seq(5, 150, by = 5)
assurance_values <- numeric(length(n_range))

for (i in seq_along(n_range)) {
  result <- calculate_deseq_assurance(n_range[i], log2fc_mean, log2fc_sd,
                                     dispersion, base_mean, alpha_adj, target_power)
  assurance_values[i] <- result$assurance
  cat(".")
}

required_n <- n_range[which(assurance_values >= target_assurance)[1]]
cat("\\n\\nRequired sample size per group:", required_n, "\\n")

# Plot
plot(n_range, assurance_values, type = "l", lwd = 2, col = "blue",
     xlab = "Samples per Group", ylab = "Assurance",
     main = "DESeq2 Assurance Curve", ylim = c(0, 1))
abline(h = target_assurance, lty = 2, col = "red")
abline(v = required_n, lty = 2, col = "green")

write.csv(data.frame(Sample_Size = n_range, Assurance = assurance_values),
          "deseq_assurance.csv", row.names = FALSE)
`;
  }
  
  // Handle longitudinal microbiome (LMM)
  if (nTimepoints !== undefined && withinCorr !== undefined) {
    return `# Bayesian Assurance for Longitudinal Microbiome (LMM)
# Generated from Ecological Power Analysis Tool

# Install required packages
# install.packages(c("lme4", "lmerTest"))

library(lme4)
library(lmerTest)

# Parameters
effect_mean <- ${effectSizeMean}  # Time × treatment effect
effect_sd <- ${effectSD}
n_timepoints <- ${nTimepoints}
within_corr <- ${withinCorr}
dropout_rate <- ${dropoutRate}
target_power <- ${targetPower}
target_assurance <- ${targetAssurance}
alpha <- ${alpha}

cat("\\n=== Bayesian LMM Assurance Analysis ===\\n")
cat("Prior: Effect size ~ N(", effect_mean, ",", effect_sd, ")\\n")
cat("Timepoints:", n_timepoints, "\\n")
cat("Within-subject correlation:", within_corr, "\\n\\n")

set.seed(123)

# Calculate assurance
calculate_lmm_assurance <- function(n, es_mean, es_sd, tp, corr, dropout, alpha_level, target_pwr) {
  nsim <- 1000
  es_samples <- pmax(0.05, rnorm(nsim, mean = es_mean, sd = es_sd))
  
  powers <- numeric(nsim)
  for (i in 1:nsim) {
    # Account for dropout and correlation
    effective_n <- n * (1 - dropout)^(tp - 1)
    design_effect <- 1 + (tp - 1) * corr
    adjusted_n <- effective_n / design_effect
    
    # Power for interaction
    ncp <- es_samples[i] * sqrt(adjusted_n * tp / 2)
    powers[i] <- 1 - pnorm(qnorm(1 - alpha_level/2) - ncp)
  }
  
  assurance <- mean(powers >= target_pwr)
  return(list(assurance = assurance, powers = powers))
}

# Find required sample size
n_range <- seq(3, 90, by = 3)
assurance_values <- numeric(length(n_range))

for (i in seq_along(n_range)) {
  result <- calculate_lmm_assurance(n_range[i], effect_mean, effect_sd,
                                   n_timepoints, within_corr, dropout_rate,
                                   alpha, target_power)
  assurance_values[i] <- result$assurance
  cat(".")
}

required_n <- n_range[which(assurance_values >= target_assurance)[1]]
cat("\\n\\nRequired starting subjects:", required_n, "\\n")
cat("Expected final N:", round(required_n * (1 - dropout_rate)^(n_timepoints - 1)), "\\n")

# Plot
plot(n_range, assurance_values, type = "l", lwd = 2, col = "blue",
     xlab = "Starting Subjects", ylab = "Assurance",
     main = "LMM Assurance Curve", ylim = c(0, 1))
abline(h = target_assurance, lty = 2, col = "red")
abline(v = required_n, lty = 2, col = "green")

write.csv(data.frame(Sample_Size = n_range, Assurance = assurance_values),
          "lmm_assurance.csv", row.names = FALSE)
`;
  }
  
  // Default Bayesian for other cases
  return `# Bayesian Assurance (Hybrid-Bayesian Power) Analysis
# Generated from Ecological Power Analysis Tool

# Install required packages
# install.packages("pwr")

library(pwr)

# Parameters
effect_mean <- ${effectMean}  # Prior mean for effect size
effect_sd <- ${effectSD}  # Prior SD for effect size (uncertainty)
target_power <- ${targetPower}  # Desired frequentist power
target_assurance <- ${targetAssurance}  # Desired assurance (probability of achieving power)
alpha <- ${alpha}
test_type <- "${testType}"
num_groups <- ${groups}

cat("\\n=== Bayesian Assurance Analysis ===\\n")
cat("Prior: Effect size ~ N(", effect_mean, ",", effect_sd, ")\\n")
cat("Target power:", target_power, "\\n")
cat("Target assurance:", target_assurance, "\\n\\n")

set.seed(123)  # For reproducible results

# Monte Carlo integration to calculate assurance
calculate_assurance <- function(n, prior_mean, prior_sd, target_pwr, alpha, type, groups) {
  nsim <- 10000
  effect_samples <- rnorm(nsim, mean = prior_mean, sd = prior_sd)
  
  # Calculate power for each sampled effect size
  powers <- numeric(nsim)
  
  for (i in 1:nsim) {
    if (type == "ttest") {
      powers[i] <- pwr.t.test(n = n, d = abs(effect_samples[i]), 
                              sig.level = alpha, type = "two.sample")$power
    } else if (type == "anova") {
      powers[i] <- pwr.anova.test(k = groups, n = n, f = abs(effect_samples[i]), 
                                  sig.level = alpha)$power
    }
  }
  
  assurance <- mean(powers >= target_pwr)
  return(list(assurance = assurance, mean_power = mean(powers), powers = powers))
}

# Search for required sample size
find_required_n <- function(target_assurance, prior_mean, prior_sd, target_pwr, 
                           alpha, type, groups) {
  n_low <- 5
  n_high <- 500
  
  while (n_high - n_low > 1) {
    n_mid <- round((n_low + n_high) / 2)
    result <- calculate_assurance(n_mid, prior_mean, prior_sd, target_pwr, 
                                  alpha, type, groups)
    
    if (result$assurance < target_assurance) {
      n_low <- n_mid
    } else {
      n_high <- n_mid
    }
  }
  
  return(n_high)
}

cat("Searching for required sample size...\\n")
required_n <- find_required_n(target_assurance, effect_mean, effect_sd, 
                              target_power, alpha, test_type, num_groups)

cat("\\n=== Results ===\\n")
cat("Required sample size per group:", required_n, "\\n")

# Verify the result
final_result <- calculate_assurance(required_n, effect_mean, effect_sd, 
                                    target_power, alpha, test_type, num_groups)

cat("Achieved assurance:", round(final_result$assurance, 3), "\\n")
cat("Average power:", round(final_result$mean_power, 3), "\\n\\n")

# Visualize the distribution of power
hist(final_result$powers, breaks = 50, 
     main = "Distribution of Power across Prior",
     xlab = "Power", col = "lightblue", border = "white")
abline(v = target_power, col = "red", lwd = 2, lty = 2)
abline(v = mean(final_result$powers), col = "blue", lwd = 2)
legend("topleft", 
       legend = c(paste("Target power =", target_power), 
                  paste("Mean power =", round(mean(final_result$powers), 2))),
       col = c("red", "blue"), lty = c(2, 1), lwd = 2)

# Calculate assurance curve
cat("\\nCalculating assurance curve...\\n")
sample_sizes <- seq(10, min(200, required_n * 2), by = 5)
assurance_curve <- numeric(length(sample_sizes))

for (i in seq_along(sample_sizes)) {
  result <- calculate_assurance(sample_sizes[i], effect_mean, effect_sd, 
                                target_power, alpha, test_type, num_groups)
  assurance_curve[i] <- result$assurance
  cat(".")
}

cat("\\n\\n")

# Plot assurance curve
plot(sample_sizes, assurance_curve, 
     type = "l", lwd = 2, col = "blue",
     xlab = "Sample Size per Group", 
     ylab = "Assurance",
     main = "Assurance Curve",
     ylim = c(0, 1))
abline(h = target_assurance, lty = 2, col = "red")
abline(v = required_n, lty = 2, col = "green")
legend("bottomright", 
       legend = c("Assurance curve", paste("Target =", target_assurance), 
                  paste("Required n =", required_n)),
       col = c("blue", "red", "green"), 
       lty = c(1, 2, 2), lwd = c(2, 1, 1))

# Export results
results_df <- data.frame(
  Sample_Size = sample_sizes,
  Assurance = assurance_curve
)
write.csv(results_df, "bayesian_assurance_curve.csv", row.names = FALSE)

cat("\\n*** KEY CONCEPTS ***\\n")
cat("• POWER: Probability of detecting an effect IF the effect size is exactly d\\n")
cat("• ASSURANCE: Probability of achieving target power GIVEN uncertainty in d\\n")
cat("• Assurance accounts for realistic uncertainty in effect size estimates\\n")
cat("\\nReference: O'Hagan et al. (2005) J R Stat Soc A 168:569-583\\n")
`;
};

const generateDESeqRCode = (params: any): string => {
  const {
    n = 30,
    log2FC = 1,
    dispersion = 0.1,
    baseMean = 100,
    alpha = 0.05,
    numTests = 1,
    useFDR = true
  } = params;

  const code = `# ====================================================
# Differential Abundance Power Analysis (DESeq2/Negative Binomial)
# ====================================================
# This script calculates statistical power for detecting differentially
# abundant taxa using a negative binomial model (DESeq2 approach).
#
# Generated by PowerFlow - Microbiome Power Calculator
# ====================================================

# Install required packages (run once)
if (!require("MASS")) install.packages("MASS")

library(MASS)

# ====================================================
# Study Parameters
# ====================================================
n_per_group <- ${n}          # Sample size per group
log2_fold_change <- ${log2FC}  # Log2 fold-change
dispersion <- ${dispersion}    # Dispersion parameter (0.01=low, 0.1=medium, 0.5=high)
base_mean <- ${baseMean}       # Average count in control group
alpha <- ${alpha}              # Significance level
num_tests <- ${numTests}       # Number of taxa tested
use_fdr <- ${useFDR ? 'TRUE' : 'FALSE'}  # Use FDR correction

cat("=== Differential Abundance Power Analysis ===\\n")
cat("Sample size per group:", n_per_group, "\\n")
cat("Log2 fold-change:", log2_fold_change, "\\n")
cat("Dispersion:", dispersion, "\\n")
cat("Base mean count:", base_mean, "\\n")
cat("Significance level:", alpha, "\\n")
cat("Number of tests:", num_tests, "\\n")
cat("FDR correction:", use_fdr, "\\n\\n")

# ====================================================
# Power Calculation via Simulation
# ====================================================
set.seed(123)  # For reproducible results

simulate_deseq_power <- function(n_per_grp, log2fc, disp, base_mean, alpha_level, num_taxa, fdr) {
  n_simulations <- 1000
  significant_count <- 0
  
  for (i in 1:n_simulations) {
    # True mean counts for each group
    mu_control <- base_mean
    mu_treatment <- base_mean * 2^log2fc
    
    # Generate negative binomial counts
    # Convert dispersion to size parameter: size = mean^2 / (var - mean)
    # For NB: var = mu + mu^2 * dispersion
    size_control <- mu_control / disp
    size_treatment <- mu_treatment / disp
    
    counts_control <- rnbinom(n_per_grp, mu = mu_control, size = size_control)
    counts_treatment <- rnbinom(n_per_grp, mu = mu_treatment, size = size_treatment)
    
    # Perform negative binomial test (approximation of DESeq2)
    # Using a Wald test on log scale
    log_counts_control <- log(counts_control + 0.5)
    log_counts_treatment <- log(counts_treatment + 0.5)
    
    # T-test on log counts (approximates DESeq2 Wald test)
    test_result <- t.test(log_counts_treatment, log_counts_control)
    p_value <- test_result$p.value
    
    # Apply multiple testing correction if needed
    if (fdr && num_taxa > 1) {
      # Approximate FDR: adjust alpha threshold
      adjusted_alpha <- alpha_level / num_taxa * 2  # Simplified Benjamini-Hochberg
      significant_count <- significant_count + (p_value < adjusted_alpha)
    } else {
      significant_count <- significant_count + (p_value < alpha_level)
    }
  }
  
  power <- significant_count / n_simulations
  return(power)
}

# Run power calculation
estimated_power <- simulate_deseq_power(n_per_group, log2_fold_change, dispersion, 
                                        base_mean, alpha, num_tests, use_fdr)

cat("\\n=== Power Analysis Results ===\\n")
cat("Estimated Statistical Power:", round(estimated_power, 3), "\\n")
cat("Interpretation:", ifelse(estimated_power >= 0.8, "Excellent", 
                              ifelse(estimated_power >= 0.6, "Moderate", "Low")), "\\n\\n")

# ====================================================
# Generate Power Curve
# ====================================================
cat("Generating power curve...\\n")

sample_sizes <- seq(5, 100, by = 5)
power_values <- numeric(length(sample_sizes))

for (i in seq_along(sample_sizes)) {
  power_values[i] <- simulate_deseq_power(sample_sizes[i], log2_fold_change, 
                                           dispersion, base_mean, alpha, num_tests, use_fdr)
  if (i %% 5 == 0) cat("Progress:", i, "/", length(sample_sizes), "\\n")
}

# Create power curve data
power_curve_data <- data.frame(
  sample_size = sample_sizes,
  power = power_values
)

# Plot power curve
png("differential_abundance_power_curve.png", width = 800, height = 600)
plot(power_curve_data$sample_size, power_curve_data$power,
     type = "l", lwd = 2, col = "blue",
     xlab = "Sample Size per Group",
     ylab = "Statistical Power",
     main = "Power Curve for Differential Abundance Test",
     ylim = c(0, 1))
abline(h = 0.8, col = "red", lty = 2, lwd = 2)
abline(v = n_per_group, col = "green", lty = 2, lwd = 2)
legend("bottomright", 
       c("Power Curve", "Target Power (0.8)", paste("Current N =", n_per_group)),
       col = c("blue", "red", "green"), lty = c(1, 2, 2), lwd = 2)
dev.off()

cat("\\nPower curve saved as 'differential_abundance_power_curve.png'\\n")

# ====================================================
# Export Results
# ====================================================
results <- data.frame(
  parameter = c("Sample size per group", "Log2 fold-change", "Dispersion", 
                "Base mean", "Alpha", "Number of tests", "FDR correction", "Power"),
  value = c(n_per_group, log2_fold_change, dispersion, base_mean, alpha, 
            num_tests, use_fdr, round(estimated_power, 3))
)

write.csv(results, "differential_abundance_power_results.csv", row.names = FALSE)
write.csv(power_curve_data, "differential_abundance_power_curve.csv", row.names = FALSE)

cat("\\nResults exported to CSV files\\n")
cat("Done!\\n")
`;

  return code;
};

const generateZINBRCode = (params: any): string => {
  const {
    n = 30,
    zeroInflation = 0.3,
    meanCount = 50,
    dispersion = 0.2,
    log2FC = 1,
    alpha = 0.05,
    testType = 'both'
  } = params;

  const code = `# ====================================================
# Zero-Inflated Negative Binomial (ZINB) Power Analysis
# ====================================================
# This script calculates power for detecting differences in taxa
# with excess zeros using zero-inflated models.
#
# Generated by PowerFlow - Zero-Inflated Calculator
# ====================================================

# Install required packages (run once)
if (!require("pscl")) install.packages("pscl")
if (!require("MASS")) install.packages("MASS")

library(pscl)
library(MASS)

# ====================================================
# Study Parameters
# ====================================================
n_per_group <- ${n}           # Sample size per group
zero_inflation <- ${zeroInflation}  # Proportion of structural zeros
mean_count <- ${meanCount}    # Mean count in non-zero portion
dispersion <- ${dispersion}   # Dispersion parameter
log2_fold_change <- ${log2FC} # Effect size (log2 fold-change)
alpha <- ${alpha}             # Significance level
test_type <- "${testType}"    # 'count', 'zero', or 'both'

cat("=== Zero-Inflated Negative Binomial Power Analysis ===\\n")
cat("Sample size per group:", n_per_group, "\\n")
cat("Zero-inflation:", zero_inflation, "\\n")
cat("Mean count:", mean_count, "\\n")
cat("Dispersion:", dispersion, "\\n")
cat("Log2 fold-change:", log2_fold_change, "\\n")
cat("Test type:", test_type, "\\n")
cat("Alpha:", alpha, "\\n\\n")

# ====================================================
# Power Calculation via Simulation
# ====================================================
set.seed(123)  # For reproducible results

simulate_zinb_power <- function(n, pi_zero, mu, disp, log2fc, alpha_level, test) {
  n_simulations <- 500
  sig_count <- 0
  sig_zero <- 0
  sig_both <- 0
  
  for (i in 1:n_simulations) {
    # Generate ZINB data for control group
    is_zero_control <- rbinom(n, 1, pi_zero)
    size_param <- mu / disp
    count_control <- ifelse(is_zero_control == 1, 0, 
                            rnbinom(n, mu = mu, size = size_param))
    
    # Generate ZINB data for treatment group (with effect)
    mu_treatment <- mu * 2^log2fc
    is_zero_treatment <- rbinom(n, 1, pi_zero * 0.7)  # Reduce zeros in treatment
    size_param_treatment <- mu_treatment / disp
    count_treatment <- ifelse(is_zero_treatment == 1, 0,
                              rnbinom(n, mu = mu_treatment, size = size_param_treatment))
    
    # Create data frame
    data <- data.frame(
      count = c(count_control, count_treatment),
      group = factor(rep(c("control", "treatment"), each = n))
    )
    
    # Fit ZINB model
    tryCatch({
      zinb_model <- zeroinfl(count ~ group | group, data = data, dist = "negbin")
      
      # Extract p-values
      summary_zinb <- summary(zinb_model)
      p_count <- summary_zinb$coefficients$count["grouptreatment", "Pr(>|z|)"]
      p_zero <- summary_zinb$coefficients$zero["grouptreatment", "Pr(>|z|)"]
      
      # Count significant results
      if (test == "count") {
        sig_count <- sig_count + (p_count < alpha_level)
      } else if (test == "zero") {
        sig_zero <- sig_zero + (p_zero < alpha_level)
      } else {  # both
        sig_both <- sig_both + (p_count < alpha_level | p_zero < alpha_level)
      }
    }, error = function(e) {
      # Model convergence failure - count as non-significant
    })
  }
  
  if (test == "count") {
    return(sig_count / n_simulations)
  } else if (test == "zero") {
    return(sig_zero / n_simulations)
  } else {
    return(sig_both / n_simulations)
  }
}

# Run power calculation
estimated_power <- simulate_zinb_power(n_per_group, zero_inflation, mean_count,
                                       dispersion, log2_fold_change, alpha, test_type)

cat("\\n=== Power Analysis Results ===\\n")
cat("Estimated Statistical Power:", round(estimated_power, 3), "\\n")
cat("Interpretation:", ifelse(estimated_power >= 0.8, "Excellent",
                              ifelse(estimated_power >= 0.6, "Moderate", "Low")), "\\n\\n")

# ====================================================
# Generate Power Curve
# ====================================================
cat("Generating power curve...\\n")

sample_sizes <- seq(10, 100, by = 10)
power_values <- numeric(length(sample_sizes))

for (i in seq_along(sample_sizes)) {
  power_values[i] <- simulate_zinb_power(sample_sizes[i], zero_inflation, mean_count,
                                          dispersion, log2_fold_change, alpha, test_type)
  cat("Progress:", i, "/", length(sample_sizes), "\\n")
}

# Plot power curve
png("zinb_power_curve.png", width = 800, height = 600)
plot(sample_sizes, power_values, type = "l", lwd = 2, col = "blue",
     xlab = "Sample Size per Group", ylab = "Statistical Power",
     main = "ZINB Power Curve",
     ylim = c(0, 1))
abline(h = 0.8, col = "red", lty = 2)
abline(v = n_per_group, col = "green", lty = 2)
legend("bottomright",
       c("Power Curve", "Target (0.8)", paste("N =", n_per_group)),
       col = c("blue", "red", "green"), lty = c(1, 2, 2), lwd = 2)
dev.off()

cat("\\nPower curve saved\\n")

# Export results
power_curve_data <- data.frame(sample_size = sample_sizes, power = power_values)
write.csv(power_curve_data, "zinb_power_curve.csv", row.names = FALSE)
cat("Done!\\n")
`;

  return code;
};

const generateLMMMicrobiomeRCode = (params: any): string => {
  const {
    nSubjects = 30,
    nTimepoints = 4,
    effectSize = 0.25,
    withinCorr = 0.6,
    randomSlopeVar = 0.3,
    nCovariates = 0,
    dropoutRate = 0.1,
    alpha = 0.05
  } = params;

  const code = `# ====================================================
# Longitudinal Mixed Model (LMM) Power Analysis
# ====================================================
# This script calculates power for longitudinal microbiome studies
# with random effects, covariates, and missing data.
#
# Generated by PowerFlow - LMM Microbiome Calculator
# ====================================================

# Install required packages (run once)
if (!require("lme4")) install.packages("lme4")
if (!require("lmerTest")) install.packages("lmerTest")

library(lme4)
library(lmerTest)

# ====================================================
# Study Parameters
# ====================================================
n_subjects <- ${nSubjects}           # Number of subjects
n_timepoints <- ${nTimepoints}       # Measurements per subject
effect_size <- ${effectSize}         # Cohen's f for time × treatment
within_corr <- ${withinCorr}         # Within-subject correlation
random_slope_var <- ${randomSlopeVar}  # Random slope variance
n_covariates <- ${nCovariates}       # Number of covariates
dropout_rate <- ${dropoutRate}       # Dropout rate per timepoint
alpha <- ${alpha}                    # Significance level

cat("=== Longitudinal Mixed Model Power Analysis ===\\n")
cat("Number of subjects:", n_subjects, "\\n")
cat("Timepoints:", n_timepoints, "\\n")
cat("Effect size:", effect_size, "\\n")
cat("Within correlation:", within_corr, "\\n")
cat("Alpha:", alpha, "\\n\\n")

# ====================================================
# Power Calculation via Simulation
# ====================================================
set.seed(123)  # For reproducible results

simulate_lmm_power <- function(n_subj, n_time, effect_f, corr, slope_var, dropout, alpha_level) {
  n_simulations <- 500
  significant_count <- 0
  
  for (sim in 1:n_simulations) {
    # Create subject IDs and groups
    n_per_group <- n_subj / 2
    subject_ids <- rep(1:n_subj, each = n_time)
    group <- rep(rep(c("control", "treatment"), each = n_per_group), each = n_time)
    time <- rep(0:(n_time - 1), times = n_subj)
    
    # Random effects
    random_intercepts <- rep(rnorm(n_subj, 0, 1), each = n_time)
    random_slopes <- rep(rnorm(n_subj, 0, sqrt(slope_var)), each = n_time)
    
    # Fixed effects
    is_treatment <- as.numeric(group == "treatment")
    outcome <- random_intercepts + 
               0.2 * time + 
               random_slopes * time +
               0.1 * is_treatment +
               effect_f * time * is_treatment
    
    # Add AR(1) residuals
    residual_sd <- sqrt(1 - corr)
    residuals <- numeric(length(subject_ids))
    for (subj in 1:n_subj) {
      subj_indices <- which(subject_ids == subj)
      residuals[subj_indices[1]] <- rnorm(1, 0, residual_sd)
      for (t in 2:length(subj_indices)) {
        residuals[subj_indices[t]] <- corr * residuals[subj_indices[t-1]] + 
                                      rnorm(1, 0, residual_sd)
      }
    }
    
    outcome <- outcome + residuals
    
    # Simulate dropout
    keep_indices <- rep(TRUE, length(outcome))
    for (subj in 1:n_subj) {
      subj_indices <- which(subject_ids == subj)
      for (t in 2:length(subj_indices)) {
        if (runif(1) < dropout) {
          keep_indices[subj_indices[t:length(subj_indices)]] <- FALSE
          break
        }
      }
    }
    
    # Create data
    data <- data.frame(
      subject = factor(subject_ids[keep_indices]),
      time = time[keep_indices],
      group = factor(group[keep_indices]),
      outcome = outcome[keep_indices]
    )
    
    if (nrow(data) < n_subj * 2) next
    
    # Fit mixed model
    tryCatch({
      if (slope_var > 0) {
        model <- lmer(outcome ~ time * group + (1 + time | subject), data = data)
      } else {
        model <- lmer(outcome ~ time * group + (1 | subject), data = data)
      }
      
      model_summary <- summary(model)
      p_value <- model_summary$coefficients["time:grouptreatment", "Pr(>|t|)"]
      significant_count <- significant_count + (p_value < alpha_level)
    }, error = function(e) {})
  }
  
  return(significant_count / n_simulations)
}

# Run power calculation
estimated_power <- simulate_lmm_power(n_subjects, n_timepoints, effect_size,
                                      within_corr, random_slope_var, dropout_rate, alpha)

cat("\\n=== Simulation Results ===\\n")
cat("Estimated Power:", round(estimated_power, 3), "\\n")
cat("Interpretation:", ifelse(estimated_power >= 0.8, "Excellent",
                              ifelse(estimated_power >= 0.6, "Moderate", "Low")), "\\n")
cat("\\nNote: Web calculator approximation was ${(params.power * 100).toFixed(1)}%\\n")
cat("The simulation-based estimate is more accurate for complex designs.\\n\\n")

# ====================================================
# Generate Power Curve
# ====================================================
cat("Generating power curve...\\n")

subject_counts <- seq(20, 120, by = 10)
power_values <- numeric(length(subject_counts))

for (i in seq_along(subject_counts)) {
  power_values[i] <- simulate_lmm_power(subject_counts[i], n_timepoints, effect_size,
                                         within_corr, random_slope_var, dropout_rate, alpha)
  cat("Progress:", i, "/", length(subject_counts), "\\n")
}

# Plot
png("lmm_power_curve.png", width = 800, height = 600)
plot(subject_counts, power_values, type = "l", lwd = 2, col = "purple",
     xlab = "Number of Subjects", ylab = "Power",
     main = "LMM Power Curve", ylim = c(0, 1))
abline(h = 0.8, col = "red", lty = 2)
abline(v = n_subjects, col = "green", lty = 2)
legend("bottomright", c("Power", "Target", paste("N =", n_subjects)),
       col = c("purple", "red", "green"), lty = c(1, 2, 2), lwd = 2)
dev.off()

cat("\\nPower curve saved\\n")

# Export
power_curve_data <- data.frame(n_subjects = subject_counts, power = power_values)
write.csv(power_curve_data, "lmm_power_curve.csv", row.names = FALSE)
cat("Done!\\n")
`;

  return code;
};

const generateSequentialRCode = (params: any): string => {
  const { effectMean, effectSD, maxN, interimLooks, testType, groups, alpha } = params;
  
  return `# Bayesian Sequential Design Power Analysis
# Generated from Ecological Power Analysis Tool

# Install required packages
# install.packages("rpact")

library(rpact)

# Parameters
effect_mean <- ${effectMean}
effect_sd <- ${effectSD}
max_n <- ${maxN}
interim_looks <- ${interimLooks}
alpha <- ${alpha}
test_type <- "${testType}"
${testType === 'anova' ? `num_groups <- ${groups}` : ''}

cat("=== Bayesian Sequential Design ===\\n")
cat("Effect prior: N(", effect_mean, ",", effect_sd, ")\\n")
cat("Maximum N per group:", max_n, "\\n")
cat("Interim looks:", interim_looks, "\\n\\n")

# Create group sequential design with O'Brien-Fleming boundaries
design <- getDesignGroupSequential(
  kMax = interim_looks,
  alpha = alpha,
  beta = 0.2,  # Target 80% power
  typeOfDesign = "OF"  # O'Brien-Fleming
)

cat("O'Brien-Fleming Stopping Boundaries:\\n")
print(design)

# Simulate sequential trial
simulate_sequential <- function(n_max, looks, effect, sd_effect, alpha_spend, nsim = 2000) {
  stop_early_count <- 0
  expected_n <- numeric(nsim)
  
  for (i in 1:nsim) {
    true_effect <- rnorm(1, mean = effect, sd = sd_effect)
    
    for (look in 1:looks) {
      current_n <- round(n_max * look / looks)
      
      # Generate data
      ${testType === 'ttest' ? `
      control <- rnorm(current_n, 0, 1)
      treatment <- rnorm(current_n, true_effect, 1)
      t_stat <- t.test(treatment, control)$statistic
      ` : testType === 'anova' ? `
      # Simulate ANOVA data
      group_data <- list()
      for (g in 1:${groups}) {
        group_data[[g]] <- rnorm(current_n, true_effect * (g-1)/(${groups}-1), 1)
      }
      aov_result <- aov(value ~ group, data = stack(group_data))
      f_stat <- summary(aov_result)[[1]]$"F value"[1]
      ` : `
      # Correlation
      x <- rnorm(current_n * 2, 0, 1)
      y <- true_effect * x + sqrt(1 - true_effect^2) * rnorm(current_n * 2)
      cor_test <- cor.test(x, y)
      t_stat <- cor_test$statistic
      `}
      
      # Check stopping boundary (simplified)
      z_score <- abs(t_stat) / sqrt(current_n)
      boundary <- qnorm(1 - alpha / (2 * (looks - look + 1)))
      
      if (z_score > boundary) {
        stop_early_count <- stop_early_count + 1
        expected_n[i] <- current_n
        break
      }
      
      if (look == looks) {
        expected_n[i] <- current_n
      }
    }
  }
  
  return(list(
    prob_early_stop = stop_early_count / nsim,
    expected_n = mean(expected_n)
  ))
}

cat("\\nRunning simulations...\\n")
set.seed(123)
results <- simulate_sequential(max_n, interim_looks, effect_mean, effect_sd, alpha)

cat("\\n=== Results ===\\n")
cat("Probability of early stopping:", round(results$prob_early_stop, 3), "\\n")
cat("Expected sample size:", round(results$expected_n, 0), "\\n")
cat("Sample size savings:", round((1 - results$expected_n/max_n) * 100, 1), "%\\n\\n")

cat("\\n*** KEY PRINCIPLES ***\\n")
cat("• Pre-specify stopping rules before data collection\\n")
cat("• Use alpha spending functions to control Type I error\\n")
cat("• Document all interim analyses in your protocol\\n")
cat("\\nReference: Jennison & Turnbull (1999) 'Group Sequential Methods'\\n")
`;
};

const generateReplicationRCode = (params: any): string => {
  const { publishedEffect, publishedN, publishedP, replicationN, publicationBias, alpha } = params;
  
  return `# Bayesian Replication Probability Analysis
# Generated from Ecological Power Analysis Tool

# Install required packages
# install.packages("pwr")

library(pwr)

# Published study parameters
published_effect <- ${publishedEffect}
published_n <- ${publishedN}
published_p <- ${publishedP}

# Replication parameters
replication_n <- ${replicationN}
alpha <- ${alpha}
publication_bias <- "${publicationBias}"

cat("=== Replication Probability Analysis ===\\n")
cat("Published effect:", published_effect, "\\n")
cat("Published N:", published_n, "\\n")
cat("Published p-value:", published_p, "\\n\\n")

# Apply shrinkage based on publication bias (Gelman & Carlin Type M error)
shrinkage_factors <- list(
  none = 1.0,
  mild = 0.85,
  moderate = 0.65,
  severe = 0.4
)

shrinkage <- shrinkage_factors[[publication_bias]]
adjusted_effect <- published_effect * shrinkage

cat("Publication bias adjustment:", publication_bias, "\\n")
cat("Shrinkage factor:", shrinkage, "\\n")
cat("Adjusted effect size:", round(adjusted_effect, 3), "\\n\\n")

# Calculate replication probability
replication_power <- pwr.t.test(
  n = replication_n,
  d = adjusted_effect,
  sig.level = alpha,
  type = "two.sample"
)$power

cat("=== Replication Analysis ===\\n")
cat("Replication probability:", round(replication_power, 3), "\\n")
cat("Interpretation:", 
    ifelse(replication_power >= 0.8, "High chance of replication",
    ifelse(replication_power >= 0.5, "Moderate chance",
    "Low chance - consider larger N")), "\\n\\n")

# Calculate recommended N for 80% power
recommended_n <- ceiling(pwr.t.test(
  d = adjusted_effect,
  sig.level = alpha,
  power = 0.80,
  type = "two.sample"
)$n)

cat("Recommended N for 80% power:", recommended_n, "\\n\\n")

# Type M and S errors
calculate_type_m <- function(true_d, study_n, alpha_level) {
  # Simulate winner's curse inflation
  nsim <- 5000
  detected_effects <- numeric()
  
  for (i in 1:nsim) {
    obs_effect <- rnorm(1, true_d, sqrt(2/study_n))
    power_sim <- pwr.t.test(n = study_n, d = obs_effect, sig.level = alpha_level)$power
    
    if (runif(1) < power_sim) {
      detected_effects <- c(detected_effects, obs_effect)
    }
  }
  
  type_m <- mean(abs(detected_effects)) / abs(true_d)
  type_s <- mean(sign(detected_effects) != sign(true_d))
  
  return(list(type_m = type_m, type_s = type_s))
}

errors <- calculate_type_m(adjusted_effect, published_n, alpha)
cat("Type M error (exaggeration ratio):", round(errors$type_m, 2), "\\n")
cat("Type S error (sign error rate):", round(errors$type_s, 3), "\\n\\n")

cat("*** INTERPRETATION ***\\n")
cat("Type M shows published effect is likely", round(errors$type_m, 2), 
    "times larger than true effect\\n")
cat("\\nReference: Gelman & Carlin (2014) Perspect Psychol Sci 9:641-651\\n")
`;
};

const generateInformationDesignRCode = (params: any): string => {
  const { designs, priorMean, priorSD, testType } = params;
  
  return `# Bayesian Information-Based Design Comparison
# Generated from Ecological Power Analysis Tool

# Parameters
prior_mean <- ${priorMean}
prior_sd <- ${priorSD}
test_type <- "${testType}"

cat("=== Information-Based Design Optimization ===\\n")
cat("Prior effect: N(", prior_mean, ",", prior_sd, ")\\n\\n")

# Design options
designs <- data.frame(
  name = c(${designs.map((d: any) => `"${d.name}"`).join(', ')}),
  n_per_group = c(${designs.map((d: any) => d.nPerGroup).join(', ')}),
  measurement_error = c(${designs.map((d: any) => d.measurementError).join(', ')}),
  cost = c(${designs.map((d: any) => d.cost).join(', ')})
)

# Calculate Fisher Information for each design
${testType === 'ttest' ? `
# For t-test: Information = n / (2 * sigma^2)
calculate_fisher_info <- function(n, sigma) {
  return(n / (2 * sigma^2))
}
` : `
# For ANOVA: Information depends on design matrix
calculate_fisher_info <- function(n, sigma) {
  # Simplified: info scales with n / sigma^2
  return(n / sigma^2)
}
`}

designs$fisher_info <- calculate_fisher_info(designs$n_per_group, designs$measurement_error)
designs$cost_per_info <- designs$cost / designs$fisher_info

# Calculate posterior precision (inverse of posterior variance)
prior_precision <- 1 / (prior_sd^2)
designs$posterior_precision <- prior_precision + designs$fisher_info
designs$posterior_sd <- sqrt(1 / designs$posterior_precision)
designs$uncertainty_reduction <- (1 - designs$posterior_sd / prior_sd) * 100

cat("=== Design Comparison ===\\n")
print(designs)

# Rank designs by cost-per-information
designs$rank <- rank(designs$cost_per_info)

cat("\\n=== Optimal Design ===\\n")
optimal <- designs[which.min(designs$cost_per_info), ]
cat("Best design:", as.character(optimal$name), "\\n")
cat("Fisher Information:", round(optimal$fisher_info, 2), "\\n")
cat("Cost per Information:", round(optimal$cost_per_info, 2), "\\n")
cat("Uncertainty Reduction:", round(optimal$uncertainty_reduction, 1), "%\\n\\n")

# Visualize
par(mfrow = c(1, 2))
barplot(designs$fisher_info, names.arg = designs$name, 
        main = "Fisher Information", ylab = "Information",
        col = "lightblue")

barplot(designs$cost_per_info, names.arg = designs$name,
        main = "Cost per Information", ylab = "Cost/Info",
        col = "lightcoral")

cat("\\nReference: Chaloner & Verdinelli (1995) Statist Sci 10:273-304\\n")
`;
};

const generateHierarchicalRCode = (params: any): string => {
  const { effectMean, effectSD, nClusters, nPerCluster, icc, iccUncertainty, testType, alpha } = params;
  
  return `# Bayesian Hierarchical Power Analysis
# Generated from Ecological Power Analysis Tool

# Install required packages
# install.packages("lme4")

library(lme4)

# Parameters
effect_mean <- ${effectMean}
effect_sd <- ${effectSD}
n_clusters <- ${nClusters}
n_per_cluster <- ${nPerCluster}
icc_mean <- ${icc}
icc_sd <- ${iccUncertainty}
alpha <- ${alpha}
test_type <- "${testType}"

cat("=== Hierarchical Design Power ===\\n")
cat("Effect prior: N(", effect_mean, ",", effect_sd, ")\\n")
cat("Clusters:", n_clusters, " | Per cluster:", n_per_cluster, "\\n")
cat("ICC ~ Beta(shape from mean/sd)\\n\\n")

# Design Effect: 1 + (m-1)*ICC
calculate_design_effect <- function(m, rho) {
  return(1 + (m - 1) * rho)
}

# Effective sample size
deff <- calculate_design_effect(n_per_cluster, icc_mean)
effective_n <- (n_clusters * n_per_cluster) / deff

cat("Design Effect:", round(deff, 2), "\\n")
cat("Effective N:", round(effective_n, 1), "\\n")
cat("Inflation factor vs naive:", round(deff, 2), "x\\n\\n")

# Monte Carlo power accounting for ICC uncertainty
simulate_hierarchical_power <- function(effect_m, effect_s, n_clust, n_per, 
                                       icc_m, icc_s, alpha_level, nsim = 2000) {
  # Sample from Beta distribution for ICC
  # Convert mean/sd to alpha/beta parameters
  icc_var <- icc_s^2
  alpha_beta <- icc_m * (icc_m * (1 - icc_m) / icc_var - 1)
  beta_beta <- (1 - icc_m) * (icc_m * (1 - icc_m) / icc_var - 1)
  
  power_estimates <- numeric(nsim)
  
  for (i in 1:nsim) {
    # Sample true effect and ICC
    true_effect <- rnorm(1, effect_m, effect_s)
    true_icc <- rbeta(1, alpha_beta, beta_beta)
    
    # Calculate effective N
    deff_sim <- calculate_design_effect(n_per, true_icc)
    eff_n <- (n_clust * n_per) / deff_sim
    
    # Approximate power using effective N
    ${testType === 'ttest' ? `
    # T-test power
    ncp <- abs(true_effect) * sqrt(eff_n / 2)
    power_estimates[i] <- pt(qt(1 - alpha_level/2, df = 2*eff_n - 2), 
                             df = 2*eff_n - 2, ncp = ncp, lower.tail = FALSE) * 2
    ` : `
    # ANOVA power (simplified)
    df1 <- 2  # Between groups
    df2 <- round(eff_n) - 2
    lambda <- eff_n * true_effect^2
    power_estimates[i] <- pf(qf(1 - alpha_level, df1, df2), df1, df2, 
                            ncp = lambda, lower.tail = FALSE)
    `}
  }
  
  return(power_estimates)
}

cat("Running simulations...\\n")
set.seed(123)
powers <- simulate_hierarchical_power(effect_mean, effect_sd, n_clusters, 
                                     n_per_cluster, icc_mean, icc_sd, alpha)

cat("\\n=== Power Results ===\\n")
cat("Mean power:", round(mean(powers), 3), "\\n")
cat("95% CI: [", round(quantile(powers, 0.025), 3), ", ", 
    round(quantile(powers, 0.975), 3), "]\\n\\n")

# Sensitivity to ICC
icc_range <- seq(0.01, 0.5, by = 0.05)
power_by_icc <- numeric(length(icc_range))

for (i in seq_along(icc_range)) {
  deff_temp <- calculate_design_effect(n_per_cluster, icc_range[i])
  eff_n_temp <- (n_clusters * n_per_cluster) / deff_temp
  
  ${testType === 'ttest' ? `
  ncp <- abs(effect_mean) * sqrt(eff_n_temp / 2)
  power_by_icc[i] <- pt(qt(1 - alpha/2, df = 2*eff_n_temp - 2),
                        df = 2*eff_n_temp - 2, ncp = ncp, lower.tail = FALSE) * 2
  ` : `
  lambda <- eff_n_temp * effect_mean^2
  power_by_icc[i] <- pf(qf(1 - alpha, 2, eff_n_temp - 2), 2, eff_n_temp - 2,
                       ncp = lambda, lower.tail = FALSE)
  `}
}

plot(icc_range, power_by_icc, type = "l", lwd = 2, col = "blue",
     xlab = "Intraclass Correlation (ICC)",
     ylab = "Power",
     main = "Sensitivity to ICC")
abline(h = 0.8, lty = 2, col = "red")
abline(v = icc_mean, lty = 2, col = "green")

cat("\\nReference: Raudenbush & Liu (2000) Psychol Methods 5:199-213\\n")
`;
};

const generateAdaptiveAllocationRCode = (params: any): string => {
  const { treatments, priors, maxN, allocationRule } = params;
  
  return `# Bayesian Adaptive Allocation Simulation
# Generated from Ecological Power Analysis Tool

# Parameters
treatments <- c(${treatments.map((t: string) => `"${t}"`).join(', ')})
prior_means <- c(${priors.map((p: any) => p.mean).join(', ')})
prior_sds <- c(${priors.map((p: any) => p.sd).join(', ')})
max_n <- ${maxN}
allocation_rule <- "${allocationRule}"

cat("=== Adaptive Allocation Design ===\\n")
cat("Treatments:", paste(treatments, collapse = ", "), "\\n")
cat("Total sample budget:", max_n, "\\n")
cat("Allocation rule:", allocation_rule, "\\n\\n")

# Thompson Sampling allocation
thompson_sampling <- function(treatment_means, treatment_sds, n_samples, nsim = 1000) {
  n_treatments <- length(treatment_means)
  allocations <- rep(0, n_treatments)
  
  for (i in 1:n_samples) {
    # Sample from posterior for each treatment
    samples <- rnorm(n_treatments, treatment_means, treatment_sds)
    
    # Allocate to best sampled treatment
    best <- which.max(samples)
    allocations[best] <- allocations[best] + 1
    
    # Update posteriors (simplified Bayesian updating)
    # In practice, use actual data
    treatment_sds[best] <- treatment_sds[best] * 0.99
  }
  
  return(allocations)
}

# Run allocation simulation
set.seed(123)
if (allocation_rule == "thompson") {
  final_allocations <- thompson_sampling(prior_means, prior_sds, max_n)
} else if (allocation_rule == "optimal") {
  # Allocate all to best prior mean
  final_allocations <- rep(0, length(prior_means))
  final_allocations[which.max(prior_means)] <- max_n
} else {
  # Equal allocation
  final_allocations <- rep(max_n / length(prior_means), length(prior_means))
}

results <- data.frame(
  Treatment = treatments,
  Allocation = round(final_allocations),
  Proportion = round(final_allocations / sum(final_allocations), 3),
  Prior_Mean = prior_means
)

cat("=== Allocation Results ===\\n")
print(results)

cat("\\n=== Power Gain ===\\n")
# Compare to equal allocation
equal_power <- mean(prior_means) * sqrt(max_n / length(prior_means))
adaptive_power <- sum(prior_means * final_allocations / sum(final_allocations)) * 
                  sqrt(max(final_allocations))
power_gain <- ((adaptive_power - equal_power) / equal_power) * 100

cat("Power gain vs equal allocation:", round(power_gain, 1), "%\\n\\n")

# Visualize
barplot(final_allocations, names.arg = treatments,
        main = "Adaptive Allocations",
        ylab = "Number of Samples",
        col = rainbow(length(treatments)))

cat("\\nReference: Berry et al. (2010) 'Bayesian Adaptive Methods for Clinical Trials'\\n")
`;
};

const generateEquivalenceRCode = (params: any): string => {
  const { equivalenceMargin, priorMean, priorSD, targetProbability, alpha } = params;
  
  return `# Bayesian Equivalence Testing
# Generated from Ecological Power Analysis Tool

# Install required packages
# install.packages("BEST")

# Parameters
equivalence_margin <- ${equivalenceMargin}  # ROPE boundaries
prior_mean <- ${priorMean}
prior_sd <- ${priorSD}
target_probability <- ${targetProbability}
alpha <- ${alpha}

cat("=== Bayesian Equivalence Testing ===\\n")
cat("ROPE (Region of Practical Equivalence): [", -equivalence_margin, ", ", 
    equivalence_margin, "]\\n")
cat("Prior: Effect ~ N(", prior_mean, ",", prior_sd, ")\\n")
cat("Target Pr(effect in ROPE) >=", target_probability, "\\n\\n")

# Calculate required N via simulation
calculate_rope_probability <- function(n, prior_m, prior_s, rope_margin) {
  # Sample true effect
  true_effects <- rnorm(5000, prior_m, prior_s)
  
  # For each true effect, simulate study and calculate posterior
  rope_probs <- numeric(length(true_effects))
  
  for (i in seq_along(true_effects)) {
    # Simulate data
    obs_effect <- rnorm(1, true_effects[i], sqrt(2/n))
    obs_se <- sqrt(2/n)
    
    # Posterior combining prior and likelihood
    post_precision <- 1/prior_s^2 + 1/obs_se^2
    post_mean <- (prior_m/prior_s^2 + obs_effect/obs_se^2) / post_precision
    post_sd <- sqrt(1/post_precision)
    
    # Probability effect is in ROPE
    rope_probs[i] <- pnorm(rope_margin, post_mean, post_sd) - 
                     pnorm(-rope_margin, post_mean, post_sd)
  }
  
  # Assurance: Pr(Pr(in ROPE) >= target)
  assurance <- mean(rope_probs >= target_probability)
  return(list(assurance = assurance, mean_rope_prob = mean(rope_probs)))
}

# Search for required N
find_equivalence_n <- function(target_prob, prior_m, prior_s, rope_m) {
  n_low <- 10
  n_high <- 500
  
  while (n_high - n_low > 2) {
    n_mid <- round((n_low + n_high) / 2)
    result <- calculate_rope_probability(n_mid, prior_m, prior_s, rope_m)
    
    cat("Testing N =", n_mid, ": Assurance =", round(result$assurance, 3), "\\n")
    
    if (result$assurance < 0.80) {  # Target 80% assurance
      n_low <- n_mid
    } else {
      n_high <- n_mid
    }
  }
  
  return(n_high)
}

cat("Searching for required sample size...\\n\\n")
set.seed(123)
required_n <- find_equivalence_n(target_probability, prior_mean, prior_sd, equivalence_margin)

cat("\\n=== Results ===\\n")
cat("Required N per group:", required_n, "\\n\\n")

# Verify
final_result <- calculate_rope_probability(required_n, prior_mean, prior_sd, equivalence_margin)
cat("Achieved assurance:", round(final_result$assurance, 3), "\\n")
cat("Expected Pr(in ROPE):", round(final_result$mean_rope_prob, 3), "\\n\\n")

# Compare to TOST
# TOST requires testing H0: |effect| >= margin
tost_n <- ceiling((qnorm(1 - alpha) + qnorm(0.80))^2 * 2 / equivalence_margin^2)
cat("TOST would require N ≈", tost_n, "\\n")
cat("Difference:", required_n - tost_n, "\\n\\n")

cat("*** INTERPRETATION ***\\n")
cat("• ROPE = Region where effects are 'practically equivalent'\\n")
cat("• Bayesian gives direct probability statements\\n")
cat("• TOST uses p-values (harder to interpret)\\n")
cat("\\nReference: Kruschke (2018) Adv Meth Pract Psychol Sci 1:270-280\\n")
`;
};

const generateModelComparisonRCode = (params: any): string => {
  const { models, nPerGroup, targetBayesFactor, alpha } = params;
  
  return `# Bayesian Model Comparison Power Analysis
# Generated from Ecological Power Analysis Tool

# Install required packages
# install.packages("BayesFactor")

library(BayesFactor)

# Parameters
n_per_group <- ${nPerGroup}
target_bf <- ${targetBayesFactor}
alpha <- ${alpha}

# Models to compare
models <- list(
  ${models.map((m: any, i: number) => 
    `model_${i+1} = list(name = "${m.name}", prior_mean = ${m.prior.mean}, prior_sd = ${m.prior.sd})`
  ).join(',\n  ')}
)

cat("=== Bayesian Model Comparison ===\\n")
cat("Sample size:", n_per_group, "per group\\n")
cat("Target Bayes Factor:", target_bf, "\\n")
cat("Models:", length(models), "\\n\\n")

# Simulate model comparison
simulate_model_selection <- function(n, model_list, nsim = 1000) {
  n_models <- length(model_list)
  selection_counts <- rep(0, n_models)
  bf_values <- matrix(0, nsim, n_models)
  
  for (sim in 1:nsim) {
    # Generate data from one true model (e.g., model 2)
    true_model_idx <- 2
    true_effect <- rnorm(1, model_list[[true_model_idx]]$prior_mean,
                        model_list[[true_model_idx]]$prior_sd)
    
    # Simulate data
    group1 <- rnorm(n, 0, 1)
    group2 <- rnorm(n, true_effect, 1)
    
    # Calculate BF for each model using BIC approximation
    # BF ≈ exp(-0.5 * delta_BIC)
    for (m in 1:n_models) {
      # Simplified: BF based on how well data matches model prior
      obs_effect <- mean(group2) - mean(group1)
      obs_se <- sqrt(2 / n)
      
      # Log marginal likelihood approximation
      log_ml <- dnorm(obs_effect, 
                     model_list[[m]]$prior_mean,
                     sqrt(model_list[[m]]$prior_sd^2 + obs_se^2),
                     log = TRUE)
      bf_values[sim, m] <- exp(log_ml)
    }
    
    # Select model with highest BF
    best_model <- which.max(bf_values[sim, ])
    selection_counts[best_model] <- selection_counts[best_model] + 1
  }
  
  selection_probs <- selection_counts / nsim
  return(list(
    selection_probs = selection_probs,
    mean_bf = colMeans(bf_values)
  ))
}

cat("Running simulations...\\n")
set.seed(123)
results <- simulate_model_selection(n_per_group, models)

cat("\\n=== Model Selection Probabilities ===\\n")
for (i in seq_along(models)) {
  cat(models[[i]]$name, ":", round(results$selection_probs[i], 3), "\\n")
}

cat("\\n=== Mean Bayes Factors ===\\n")
for (i in seq_along(models)) {
  cat(models[[i]]$name, ":", round(results$mean_bf[i], 2), "\\n")
}

# Find N for target BF
find_n_for_bf <- function(target_bf_threshold, model_list) {
  for (n_test in seq(20, 300, by = 10)) {
    res <- simulate_model_selection(n_test, model_list, nsim = 500)
    max_bf <- max(res$mean_bf)
    
    cat("N =", n_test, ": Max BF =", round(max_bf, 2), "\\n")
    
    if (max_bf >= target_bf_threshold) {
      return(n_test)
    }
  }
  return(300)
}

cat("\\nSearching for N to achieve BF >", target_bf, "...\\n")
recommended_n <- find_n_for_bf(target_bf, models)
cat("\\nRecommended N:", recommended_n, "per group\\n\\n")

cat("*** BAYES FACTORS INTERPRETATION ***\\n")
cat("BF > 10: Strong evidence\\n")
cat("BF 3-10: Moderate evidence\\n")
cat("BF 1-3: Weak evidence\\n")
cat("\\nReference: Kass & Raftery (1995) J Am Stat Assoc 90:773-795\\n")
`;
};

const generateCalibrationRCode = (params: any): string => {
  const { frequentistPower, effectSize, effectUncertainty, nPerGroup, alpha } = params;
  
  return `# Bayesian Calibration: Frequentist → Bayesian Assurance
# Generated from Ecological Power Analysis Tool

# Install required packages
# install.packages("pwr")

library(pwr)

# Parameters
frequentist_power <- ${frequentistPower}
effect_size <- ${effectSize}
effect_uncertainty <- ${effectUncertainty}  # SD of prior
n_per_group <- ${nPerGroup}
alpha <- ${alpha}

cat("=== Bayesian Calibration ===\\n")
cat("Frequentist power (assuming d =", effect_size, "):", frequentist_power, "\\n")
cat("Effect size uncertainty (SD):", effect_uncertainty, "\\n")
cat("Sample size:", n_per_group, "per group\\n\\n")

# Calculate Bayesian Assurance via Monte Carlo
set.seed(123)
n_simulations <- 10000

# Sample effect sizes from prior
true_effects <- rnorm(n_simulations, mean = effect_size, sd = effect_uncertainty)

# Calculate power for each sampled effect
powers <- sapply(true_effects, function(d) {
  pwr.t.test(n = n_per_group, d = abs(d), sig.level = alpha,
            type = "two.sample")$power
})

# Bayesian Assurance = Pr(Power >= target)
bayesian_assurance <- mean(powers >= frequentist_power)
mean_power <- mean(powers)

cat("=== Results ===\\n")
cat("Bayesian Assurance:", round(bayesian_assurance, 3), "\\n")
cat("Mean power:", round(mean_power, 3), "\\n")
cat("Assurance loss:", round((frequentist_power - bayesian_assurance) * 100, 1), "%\\n\\n")

# Visualize power distribution
hist(powers, breaks = 50, col = "lightblue", border = "white",
     main = "Distribution of Power Across Prior",
     xlab = "Power",
     xlim = c(0, 1))
abline(v = frequentist_power, col = "red", lwd = 2, lty = 2)
abline(v = mean_power, col = "blue", lwd = 2)
legend("topleft",
       legend = c(paste("Frequentist power =", frequentist_power),
                 paste("Mean Bayesian power =", round(mean_power, 2)),
                 paste("Assurance =", round(bayesian_assurance, 2))),
       col = c("red", "blue", "black"),
       lty = c(2, 1, 0), lwd = 2)

# Calculate assurance curve
cat("Calculating assurance curve...\\n")
sample_sizes <- seq(10, 200, by = 5)
assurance_values <- numeric(length(sample_sizes))

for (i in seq_along(sample_sizes)) {
  n_test <- sample_sizes[i]
  powers_temp <- sapply(true_effects, function(d) {
    pwr.t.test(n = n_test, d = abs(d), sig.level = alpha,
              type = "two.sample")$power
  })
  assurance_values[i] <- mean(powers_temp >= frequentist_power)
}

plot(sample_sizes, assurance_values, type = "l", lwd = 2, col = "blue",
     xlab = "Sample Size Per Group",
     ylab = "Bayesian Assurance",
     main = "Assurance vs Sample Size")
abline(h = frequentist_power, lty = 2, col = "red")
abline(v = n_per_group, lty = 2, col = "green")
legend("bottomright",
       legend = c("Assurance curve", 
                 paste("Target =", frequentist_power),
                 paste("Current N =", n_per_group)),
       col = c("blue", "red", "green"),
       lty = c(1, 2, 2), lwd = c(2, 1, 1))

# Export
results_df <- data.frame(
  Sample_Size = sample_sizes,
  Assurance = assurance_values
)
write.csv(results_df, "calibration_curve.csv", row.names = FALSE)

cat("\\n*** KEY INSIGHT ***\\n")
cat("Effect size uncertainty REDUCES assurance below frequentist power.\\n")
cat("The", round((frequentist_power - bayesian_assurance) * 100, 1), 
    "% loss reflects realistic uncertainty.\\n")
cat("\\nReference: O'Hagan et al. (2005) J R Stat Soc A 168:569-583\\n")
`;
};

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
