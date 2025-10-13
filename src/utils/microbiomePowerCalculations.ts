import jStat from 'jstat';

/**
 * Calculate power for negative binomial differential abundance tests (DESeq2/edgeR)
 */
export const calculateNegBinomialPower = (
  n: number,
  log2FC: number,
  dispersion: number,
  baseMean: number,
  alpha: number,
  numTests: number = 1
): number => {
  // Standard error of log fold-change
  const se = Math.sqrt(dispersion / n + 1 / baseMean);
  
  // Adjust alpha for multiple testing (Bonferroni)
  const adjustedAlpha = alpha / numTests;
  
  // Z critical value
  const zCrit = jStat.normal.inv(1 - adjustedAlpha / 2, 0, 1);
  
  // Non-centrality parameter
  const ncp = Math.abs(log2FC) / se;
  
  // Power calculation
  const power = 1 - jStat.normal.cdf(zCrit - ncp, 0, 1) + 
                jStat.normal.cdf(-zCrit - ncp, 0, 1);
  
  return Math.max(0, Math.min(0.999, power));
};

/**
 * Calculate power for zero-inflated negative binomial models
 */
export const calculateZINBPower = (
  n: number,
  zeroInflation: number,
  meanCount: number,
  dispersion: number,
  log2FC: number,
  alpha: number,
  testType: 'count' | 'zero' | 'both' = 'both'
): number => {
  // Effective sample size (accounts for zeros)
  const effectiveN = n * (1 - zeroInflation);
  
  // For count component (similar to DESeq2)
  const countSE = Math.sqrt(dispersion / effectiveN + 1 / meanCount);
  const countNCP = Math.abs(log2FC) / countSE;
  const zCrit = jStat.normal.inv(1 - alpha / 2, 0, 1);
  const countPower = 1 - jStat.normal.cdf(zCrit - countNCP, 0, 1) + 
                     jStat.normal.cdf(-zCrit - countNCP, 0, 1);
  
  // For zero-inflation component
  const zeroSE = Math.sqrt(zeroInflation * (1 - zeroInflation) / n);
  const zeroChange = Math.min(0.2, zeroInflation / 2); // 20% change in zero proportion
  const zeroNCP = zeroChange / zeroSE;
  const zeroPower = 1 - jStat.normal.cdf(zCrit - zeroNCP, 0, 1) + 
                    jStat.normal.cdf(-zCrit - zeroNCP, 0, 1);
  
  // Combined power (depends on test type)
  if (testType === 'count') return Math.max(0, Math.min(0.999, countPower));
  if (testType === 'zero') return Math.max(0, Math.min(0.999, zeroPower));
  // For both: use likelihood ratio test approximation
  return Math.max(0, Math.min(0.999, 1 - (1 - countPower) * (1 - zeroPower)));
};

/**
 * Calculate design effect for longitudinal studies
 */
export const calculateDesignEffect = (
  nTimepoints: number,
  withinCorr: number
): number => {
  return 1 + (nTimepoints - 1) * withinCorr;
};

/**
 * Calculate power for linear mixed models in longitudinal designs
 */
export const calculateLMMPower = (
  nSubjects: number,
  nTimepoints: number,
  effectSize: number, // Cohen's f
  withinCorr: number,
  randomSlopeVar: number,
  nCovariates: number,
  dropoutRate: number,
  alpha: number
): number => {
  // Design effect accounts for within-subject correlation
  const designEffect = calculateDesignEffect(nTimepoints, withinCorr);
  
  // Random slopes increase the effective variance of the time effect
  // This reduces the effective design, similar to increasing correlation
  const slopeInflationFactor = 1 + (randomSlopeVar * (nTimepoints - 1) / nTimepoints);
  const adjustedDesignEffect = designEffect * slopeInflationFactor;
  
  // Adjust for dropout (assume exponential dropout)
  const retainedSubjects = nSubjects * Math.pow(1 - dropoutRate, nTimepoints - 1);
  
  // Effective sample size accounting for correlation and random slopes
  const adjustedEffectiveN = (retainedSubjects * nTimepoints) / adjustedDesignEffect;
  
  // Degrees of freedom for time × treatment interaction in LMM
  const df1 = nTimepoints - 1; // Time effect
  const df2 = Math.max(5, retainedSubjects - nCovariates - 2); // Subject-level df
  
  // Non-centrality parameter for 2-group comparison over time
  const nPerGroup = retainedSubjects / 2;
  const lambda = (effectSize * effectSize * nPerGroup * nTimepoints) / adjustedDesignEffect;
  
  // F critical value
  const fCrit = jStat.centralF.inv(1 - alpha, df1, df2);
  
  // Power using noncentral F distribution approximation
  // NOTE: This is an approximation using normal approximation to noncentral F
  // For precise power in complex LMM designs, use simulation-based methods
  // (e.g., simr package in R, as provided in the R code export)
  // 
  // Approximation accuracy decreases with:
  // - Large random slope variance (>0.5)
  // - High dropout rates (>20%)
  // - Small sample sizes (<20 subjects)
  // - Complex covariance structures beyond compound symmetry
  const noncentralMean = df1 + lambda;
  const noncentralVar = 2 * df1 + 4 * lambda;
  const threshold = fCrit * df1;
  
  const z = (threshold - noncentralMean) / Math.sqrt(noncentralVar);
  const power = 1 - jStat.normal.cdf(z, 0, 1);
  
  return Math.max(0, Math.min(0.9999, power));
};

/**
 * Adjust alpha for multiple testing using Benjamini-Hochberg FDR
 */
export const adjustAlphaForFDR = (alpha: number, numTests: number, rank: number = 1): number => {
  return alpha * (rank / numTests);
};

/**
 * Adjust alpha for multiple testing using Bonferroni correction
 */
export const adjustAlphaForBonferroni = (alpha: number, numTests: number): number => {
  return alpha / numTests;
};

/**
 * Convert Cohen's d to log2 fold-change (approximation)
 */
export const cohensDToLog2FC = (d: number): number => {
  return d * Math.log2(Math.E);
};

/**
 * Convert log2 fold-change to Cohen's d (approximation)
 */
export const log2FCToCohensD = (log2FC: number): number => {
  return log2FC / Math.log2(Math.E);
};

/**
 * Calculate required sample size for target power in negative binomial test
 */
export const calculateRequiredSampleSizeNB = (
  targetPower: number,
  log2FC: number,
  dispersion: number,
  baseMean: number,
  alpha: number,
  numTests: number = 1
): number => {
  let n = 5;
  let power = 0;
  
  while (power < targetPower && n < 500) {
    power = calculateNegBinomialPower(n, log2FC, dispersion, baseMean, alpha, numTests);
    if (power < targetPower) {
      n += 1;
    }
  }
  
  return n;
};

/**
 * Calculate required sample size for target power in LMM
 */
export const calculateRequiredSampleSizeLMM = (
  targetPower: number,
  nTimepoints: number,
  effectSize: number,
  withinCorr: number,
  randomSlopeVar: number,
  nCovariates: number,
  dropoutRate: number,
  alpha: number
): number => {
  let n = 10;
  let power = 0;
  
  while (power < targetPower && n < 500) {
    power = calculateLMMPower(n, nTimepoints, effectSize, withinCorr, randomSlopeVar, nCovariates, dropoutRate, alpha);
    if (power < targetPower) {
      n += 2;
    }
  }
  
  return n;
};