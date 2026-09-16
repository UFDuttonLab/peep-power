import jStat from 'jstat';
import { noncentralFPower } from './powerCalculations';

/** Upper bound used by the sample-size searches below. */
export const MAX_SEARCH_N = 500;

/** Two-sided power of a Wald z test with noncentrality `ncp`. */
const twoSidedZPower = (ncp: number, alpha: number): number => {
  if (!Number.isFinite(ncp)) return 0;
  const zCrit = jStat.normal.inv(1 - alpha / 2, 0, 1);
  const a = Math.abs(ncp);
  return jStat.normal.cdf(a - zCrit, 0, 1) + jStat.normal.cdf(-zCrit - a, 0, 1);
};

/**
 * Standard error of the natural-log fold change estimated by an NB GLM
 * (DESeq2/edgeR Wald test) with `n` samples in EACH of two groups:
 * Var(ln FC) = [(phi + 1/mu1) + (phi + 1/mu2)] / n  (Hart et al. 2013; Li et al. 2013).
 */
const nbLogFCSE = (n: number, log2FC: number, dispersion: number, baseMean: number): number => {
  const mu1 = baseMean;
  const mu2 = baseMean * Math.pow(2, log2FC);
  return Math.sqrt(((dispersion + 1 / mu1) + (dispersion + 1 / mu2)) / n);
};

/**
 * Calculate power for negative binomial differential abundance tests (DESeq2/edgeR).
 * `n` is the number of samples per group; log2FC is converted to the natural-log
 * scale (x ln 2) to match the standard error.
 */
export const calculateNegBinomialPower = (
  n: number,
  log2FC: number,
  dispersion: number,
  baseMean: number,
  alpha: number,
  numTests: number = 1
): number => {
  if (!(n >= 2) || !(baseMean > 0) || !(dispersion >= 0)) return 0;
  const se = nbLogFCSE(n, log2FC, dispersion, baseMean);
  // Bonferroni adjustment for multiple testing
  const adjustedAlpha = alpha / Math.max(1, numTests);
  const ncp = (Math.abs(log2FC) * Math.LN2) / se;
  const power = twoSidedZPower(ncp, adjustedAlpha);
  return Math.max(0, Math.min(0.999, power));
};

/**
 * Calculate power for zero-inflated negative binomial models.
 * `n` is per group; `zeroInflation` is the structural-zero proportion (pi) and
 * `meanCount` is the mean of the NB count component.
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
  if (!(n >= 2)) return 0;
  // For the joint test, split alpha across the two components (Bonferroni)
  const componentAlpha = testType === 'both' ? alpha / 2 : alpha;

  // Count component: NB Wald test on the samples that are not structural zeros
  const effectiveN = n * (1 - zeroInflation);
  let countPower = 0;
  if (effectiveN >= 2 && meanCount > 0) {
    const countSE = nbLogFCSE(effectiveN, log2FC, dispersion, meanCount);
    countPower = twoSidedZPower((Math.abs(log2FC) * Math.LN2) / countSE, componentAlpha);
  }

  // Zero component: two-sample test of the structural-zero proportion
  const p1 = zeroInflation;
  const zeroChange = Math.min(0.2, zeroInflation / 2);
  const p2 = p1 - zeroChange;
  const zeroSE = Math.sqrt((p1 * (1 - p1) + p2 * (1 - p2)) / n);
  const zeroPower = zeroSE > 0 && zeroChange > 0
    ? twoSidedZPower(zeroChange / zeroSE, componentAlpha)
    : 0;

  const clamp = (p: number) => Math.max(0, Math.min(0.999, p));
  if (testType === 'count') return clamp(countPower);
  if (testType === 'zero') return clamp(zeroPower);
  return clamp(1 - (1 - countPower) * (1 - zeroPower));
};

/**
 * Calculate design effect for between-subject effects in clustered/longitudinal data
 */
export const calculateDesignEffect = (
  nTimepoints: number,
  withinCorr: number
): number => {
  return 1 + (nTimepoints - 1) * withinCorr;
};

/**
 * Power for the time x treatment interaction (2 groups) in a longitudinal LMM
 * with compound symmetry. The interaction is a within-subject effect, so
 * lambda = f^2 * N * m / (1 - rho)  (G*Power "within-between interaction").
 *
 * @param nSubjects total subjects across both groups
 * @param dropoutRate total proportion of subjects lost by the final timepoint
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
  if (!(nTimepoints >= 2)) return 0;
  // Completers only (conservative)
  const retainedSubjects = nSubjects * (1 - dropoutRate);

  // Heuristic: random slopes add unexplained within-subject variance
  const slopeInflationFactor = 1 + (randomSlopeVar * (nTimepoints - 1)) / nTimepoints;
  const rho = Math.min(Math.max(withinCorr, 0), 0.999);

  const lambda =
    (effectSize * effectSize * retainedSubjects * nTimepoints) /
    ((1 - rho) * slopeInflationFactor);

  const df1 = nTimepoints - 1; // (groups - 1)(m - 1) with 2 groups
  const df2 = (retainedSubjects - 2 - nCovariates) * (nTimepoints - 1);
  if (!(df2 > 0)) return 0;

  const fCrit = jStat.centralF.inv(1 - alpha, df1, df2);
  const power = noncentralFPower(lambda, df1, df2, fCrit);
  return Math.max(0, Math.min(0.999, power));
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
 * Smallest per-group n with power >= targetPower, or Infinity if the target is
 * not reached by MAX_SEARCH_N.
 */
export const calculateRequiredSampleSizeNB = (
  targetPower: number,
  log2FC: number,
  dispersion: number,
  baseMean: number,
  alpha: number,
  numTests: number = 1
): number => {
  for (let n = 2; n <= MAX_SEARCH_N; n++) {
    if (calculateNegBinomialPower(n, log2FC, dispersion, baseMean, alpha, numTests) >= targetPower) {
      return n;
    }
  }
  return Infinity;
};

/**
 * Smallest even total number of subjects with power >= targetPower, or Infinity
 * if the target is not reached by MAX_SEARCH_N.
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
  for (let n = 4; n <= MAX_SEARCH_N; n += 2) {
    const power = calculateLMMPower(n, nTimepoints, effectSize, withinCorr, randomSlopeVar, nCovariates, dropoutRate, alpha);
    if (power >= targetPower) return n;
  }
  return Infinity;
};
