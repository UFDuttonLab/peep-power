/**
 * Utility functions to generate R code for power analyses
 * Generates accurate R scripts that match the JavaScript calculations
 */

export interface RCodeParams {
  testType: 'ttest' | 'correlation' | 'chisquare' | 'oneway-anova' | 'twoway-anova' | 
            'repeated-measures' | 'nested-anova' | 'permanova' | 'repeated-permanova' | 'bayesian' | 
            'deseq' | 'zinb' | 'lmm-microbiome';
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
  const { effectMean, effectSD, targetPower, targetAssurance, testType, groups, alpha } = params;
  
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

cat("\\n=== Results ===\\n")
cat("Power:", round(estimated_power, 3), "\\n")
cat("Interpretation:", ifelse(estimated_power >= 0.8, "Excellent",
                              ifelse(estimated_power >= 0.6, "Moderate", "Low")), "\\n\\n")

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
