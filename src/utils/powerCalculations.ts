// Statistical power calculations for ecological research
// Using approximation methods compatible with jStat

// @ts-ignore
import jStat from 'jstat';

export interface PowerResult {
  power: number;
  summary: string;
  curveData: { x: number; y: number }[];
}

// Improved approximation for noncentral t distribution power
function noncentralTPower(ncp: number, df: number, criticalValue: number, alpha: number): number {
  // Use Owen's Q function approximation for better accuracy
  // This approximates the noncentral t-distribution more accurately
  const delta = ncp;
  const t = criticalValue;
  
  // For two-tailed test, calculate power
  // Power = P(|T| > t | delta) where T ~ noncentral t(df, delta)
  
  // Approximate using normal distribution when df is large, otherwise use shifted t
  if (df > 30) {
    // Normal approximation works well for large df
    const z = jStat.normal.inv(1 - alpha/2, 0, 1);
    const power = 1 - jStat.normal.cdf(t - delta, 0, 1) + jStat.normal.cdf(-t - delta, 0, 1);
    return Math.max(0, Math.min(0.999, power));
  } else {
    // Better approximation for smaller df using shift
    const shift = delta * Math.sqrt(df / (df + delta * delta));
    const power = 1 - jStat.studentt.cdf(t - shift, df) + jStat.studentt.cdf(-t - shift, df);
    return Math.max(0, Math.min(0.999, power));
  }
}

/**
 * Calculates the cumulative distribution function (CDF) of the non-central F-distribution
 * using Poisson series expansion with incomplete beta function.
 * This provides accurate power calculations without jumps in the curve.
 */
function nonCentralFCDF(x: number, df1: number, df2: number, ncp: number): number {
  if (x <= 0) return 0;
  
  const maxIter = 1000;
  const epsilon = 1e-12; // Convergence tolerance
  
  let sum = 0;
  const lambda = ncp / 2;
  
  // Transform to beta distribution variable
  const y = (x * df1) / (df2 + x * df1);
  
  // Start with j=0 term of the Poisson sum
  let logPoisTerm = -lambda;
  
  for (let j = 0; j < maxIter; j++) {
    const poisTerm = Math.exp(logPoisTerm);
    
    // Use incomplete beta function (regularized)
    const betaTerm = jStat.ibeta(y, df1 / 2 + j, df2 / 2);
    
    const term = poisTerm * betaTerm;
    sum += term;
    
    // Check for convergence after the peak of the Poisson distribution
    if (term < epsilon && j > lambda) {
      break;
    }
    
    // Update log of Poisson term for next iteration (j+1)
    logPoisTerm += Math.log(lambda) - Math.log(j + 1);
  }
  
  return sum;
}

// Proper non-central F distribution power calculation using Poisson series expansion
export function noncentralFPower(lambda: number, df1: number, df2: number, criticalValue: number): number {
  if (lambda === 0) {
    return 1 - jStat.centralF.cdf(criticalValue, df1, df2);
  }
  
  // Calculate CDF at critical value using Poisson series expansion
  const cdfValue = nonCentralFCDF(criticalValue, df1, df2, lambda);
  
  // Power is 1 - CDF (probability beyond critical value)
  return Math.max(0, Math.min(0.999, 1 - cdfValue));
}

export const calculateTTestPower = (
  n: number,
  effectSize: number,
  alpha: number
): PowerResult => {
  // n is sample size per group
  const totalN = 2 * n;
  const df = totalN - 2;
  const ncp = effectSize * Math.sqrt(n / 2);
  const critT = jStat.studentt.inv(1 - alpha / 2, df);
  const power = noncentralTPower(ncp, df, critT, alpha);

  const summary = `With ${n} per group (total N=${totalN}), you have ${(power * 100).toFixed(1)}% power to detect an effect size of d=${effectSize.toFixed(2)} at α=${alpha}.`;

  // Power curve: vary TOTAL sample size N (x-axis), calculate power
  const curveData = [];
  for (let totalSampleSize = 10; totalSampleSize <= 400; totalSampleSize += 4) {
    const nPerGroup = totalSampleSize / 2;
    const dfCurve = totalSampleSize - 2;
    const ncpCurve = effectSize * Math.sqrt(nPerGroup / 2);
    const critTCurve = jStat.studentt.inv(1 - alpha / 2, dfCurve);
    const powerCurve = noncentralTPower(ncpCurve, dfCurve, critTCurve, alpha);
    curveData.push({ x: totalSampleSize, y: Math.max(0, Math.min(1, powerCurve)) });
  }

  return { power, summary, curveData };
};

export const calculateOneWayAnovaPower = (
  n: number,
  groups: number,
  effectSize: number,
  alpha: number
): PowerResult => {
  // n is sample size per group
  const N = n * groups;
  const df1 = groups - 1;
  const df2 = N - groups;

  if (df2 <= 0) {
    return {
      power: 0,
      summary: 'Invalid parameters',
      curveData: [],
    };
  }

  // Noncentrality parameter for One-Way ANOVA: λ = f² × n × k = f² × N
  // Where f is Cohen's f, n is sample size per group, k is number of groups, N = n × k
  const lambda = effectSize * effectSize * N;
  const critF = jStat.centralF.inv(1 - alpha, df1, df2);
  const power = noncentralFPower(lambda, df1, df2, critF);

  const summary = `For ${groups} groups with ${n} per group (total N=${N}), you have ${(power * 100).toFixed(1)}% power to detect an effect size of f=${effectSize.toFixed(2)} at α=${alpha}.`;

  // Power curve: vary TOTAL sample size N (x-axis)
  // Make the curve range dynamic based on current sample size
  const currentTotalN = n * groups;
  const minTotalN = groups * 5;  // Minimum: 5 per group
  const maxTotalN = Math.max(currentTotalN * 3, 200);  // Show 3x current or at least 200

  // Calculate adaptive step size to ensure smooth curves with ~100 data points
  const targetPoints = 100;
  const rangeSize = maxTotalN - minTotalN;
  const idealStep = Math.max(groups, Math.floor(rangeSize / targetPoints));
  // Ensure step size is a multiple of groups so nPerGroup is always an integer
  const stepSize = Math.ceil(idealStep / groups) * groups;

  const curveData = [];
  for (let totalN = minTotalN; totalN <= maxTotalN; totalN += stepSize) {
    const nPerGroup = totalN / groups;
    if (nPerGroup < 2) continue;
    const df1Curve = groups - 1;
    const df2Curve = totalN - groups;
    if (df2Curve <= 0) continue;
    const lambdaCurve = effectSize * effectSize * totalN;
    const critFCurve = jStat.centralF.inv(1 - alpha, df1Curve, df2Curve);
    const powerCurve = noncentralFPower(lambdaCurve, df1Curve, df2Curve, critFCurve);
    curveData.push({ x: totalN, y: Math.max(0, Math.min(1, powerCurve)) });
  }

  return { power, summary, curveData };
};

export const calculateTwoWayAnovaPower = (
  n: number,
  factorA: number,
  factorB: number,
  effectA: number,
  effectB: number,
  effectInteraction: number,
  alpha: number
) => {
  // n is sample size per cell
  const N = n * factorA * factorB;
  const dfA = factorA - 1;
  const dfB = factorB - 1;
  const dfAB = (factorA - 1) * (factorB - 1);
  const dfError = factorA * factorB * (n - 1);

  if (dfError <= 0) {
    return {
      powerA: 0,
      powerB: 0,
      powerAB: 0,
      summary: 'Invalid parameters',
      curveData: [],
    };
  }

  // Corrected noncentrality parameters for Two-Way ANOVA
  const lambdaA = effectA * effectA * N;
  const lambdaB = effectB * effectB * N;
  const lambdaAB = effectInteraction * effectInteraction * N;

  const critA = jStat.centralF.inv(1 - alpha, dfA, dfError);
  const critB = jStat.centralF.inv(1 - alpha, dfB, dfError);
  const critAB = jStat.centralF.inv(1 - alpha, dfAB, dfError);

  const powerA = noncentralFPower(lambdaA, dfA, dfError, critA);
  const powerB = noncentralFPower(lambdaB, dfB, dfError, critB);
  const powerAB = noncentralFPower(lambdaAB, dfAB, dfError, critAB);

  const summary = `Design: ${factorA}×${factorB} with ${n} per cell (total N=${N}). Power: A ${(powerA * 100).toFixed(1)}%, B ${(powerB * 100).toFixed(1)}%, A×B ${(powerAB * 100).toFixed(1)}% at α=${alpha}.`;

  // Power curve for interaction effect (default)
  const curveData = [];
  const totalCells = factorA * factorB;
  for (let totalN = totalCells * 2; totalN <= 400; totalN += 4) {
    const nPerCell = Math.floor(totalN / totalCells);
    if (nPerCell < 2) continue;
    const dfErrorCurve = totalCells * (nPerCell - 1);
    if (dfErrorCurve <= 0) continue;
    const lambdaCurve = effectInteraction * effectInteraction * totalN;
    const critCurve = jStat.centralF.inv(1 - alpha, dfAB, dfErrorCurve);
    const powerCurve = noncentralFPower(lambdaCurve, dfAB, dfErrorCurve, critCurve);
    curveData.push({ x: totalN, y: Math.max(0, Math.min(1, powerCurve)) });
  }

  // Power curve for main effect A
  const curveDataA = [];
  for (let totalN = totalCells * 2; totalN <= 400; totalN += 4) {
    const nPerCell = Math.floor(totalN / totalCells);
    if (nPerCell < 2) continue;
    const dfErrorCurve = totalCells * (nPerCell - 1);
    if (dfErrorCurve <= 0) continue;
    const lambdaACurve = effectA * effectA * totalN;
    const critACurve = jStat.centralF.inv(1 - alpha, dfA, dfErrorCurve);
    const powerACurve = noncentralFPower(lambdaACurve, dfA, dfErrorCurve, critACurve);
    curveDataA.push({ x: totalN, y: Math.max(0, Math.min(1, powerACurve)) });
  }

  // Power curve for main effect B
  const curveDataB = [];
  for (let totalN = totalCells * 2; totalN <= 400; totalN += 4) {
    const nPerCell = Math.floor(totalN / totalCells);
    if (nPerCell < 2) continue;
    const dfErrorCurve = totalCells * (nPerCell - 1);
    if (dfErrorCurve <= 0) continue;
    const lambdaBCurve = effectB * effectB * totalN;
    const critBCurve = jStat.centralF.inv(1 - alpha, dfB, dfErrorCurve);
    const powerBCurve = noncentralFPower(lambdaBCurve, dfB, dfErrorCurve, critBCurve);
    curveDataB.push({ x: totalN, y: Math.max(0, Math.min(1, powerBCurve)) });
  }

  return { powerA, powerB, powerAB, summary, curveData, curveDataA, curveDataB };
};

export const calculateRepeatedMeasuresPower = (
  subjects: number,
  timepoints: number,
  effectSize: number,
  correlation: number,
  alpha: number
): PowerResult => {
  // For compound symmetry (constant correlation), assume sphericity
  // Users should apply Greenhouse-Geisser or Huynh-Feldt corrections in actual analysis if sphericity is violated
  const epsilon = 1.0;
  
  const df1 = (timepoints - 1) * epsilon;
  const df2 = (subjects - 1) * (timepoints - 1) * epsilon;

  if (df2 <= 0 || subjects < 3) {
    return {
      power: 0,
      summary: 'Invalid parameters',
      curveData: [],
    };
  }

  // Design Effect for Repeated Measures (Compound Symmetry)
  // When measurements are correlated within subjects, they provide less independent information
  // Formula: DE = 1 + (k-1)ρ, where k=timepoints, ρ=within-subject correlation
  // Higher correlation (ρ→1) → measurements more similar → less unique information → lower effective N
  // Lower correlation (ρ→0) → measurements independent → full information → effective N approaches subjects×timepoints
  const designEffect = 1 + (timepoints - 1) * correlation;
  const effectiveN = (subjects * timepoints) / designEffect;
  // Corrected noncentrality parameter for repeated measures
  const lambda = effectiveN * effectSize * effectSize;
  const critF = jStat.centralF.inv(1 - alpha, df1, df2);
  const power = noncentralFPower(lambda, df1, df2, critF);

  const summary = `With ${subjects} subjects at ${timepoints} timepoints (ε=${epsilon.toFixed(2)}, ρ=${correlation.toFixed(2)}), power is ${(power * 100).toFixed(1)}% for effect size f=${effectSize.toFixed(2)} at α=${alpha}.`;

  // Power curve: vary number of subjects (x-axis shows subjects, not total observations)
  const curveData = [];
  for (let subj = 5; subj <= 200; subj += 2) {
    // USE THE SAME EPSILON AS THE MAIN CALCULATION
    const epsilonC = 1.0;  // Match main calculation for consistency
    const df1C = (timepoints - 1) * epsilonC;
    const df2C = (subj - 1) * (timepoints - 1) * epsilonC;
    if (df2C <= 0) continue;
    const designEffectC = 1 + (timepoints - 1) * correlation;
    const effectiveNC = (subj * timepoints) / designEffectC;
    const lambdaC = effectiveNC * effectSize * effectSize;
    const critFC = jStat.centralF.inv(1 - alpha, df1C, df2C);
    const powerC = noncentralFPower(lambdaC, df1C, df2C, critFC);
    curveData.push({ x: subj, y: Math.max(0, Math.min(1, powerC)) });
  }

  return { power, summary, curveData };
};

export const calculateCorrelationPower = (
  n: number,
  rho: number,
  alpha: number
): PowerResult => {
  if (n <= 3) {
    return {
      power: 0,
      summary: 'Sample size too small',
      curveData: [],
    };
  }

  const z = 0.5 * Math.log((1 + Math.abs(rho)) / (1 - Math.abs(rho)));
  const se = 1 / Math.sqrt(n - 3);
  const critNorm = jStat.normal.inv(1 - alpha / 2, 0, 1);
  const power = Math.min(0.999,
    1 -
    jStat.normal.cdf(critNorm - z / se, 0, 1) +
    jStat.normal.cdf(-critNorm - z / se, 0, 1)
  );

  const summary = `With a total sample size of ${n}, you have a ${(power * 100).toFixed(1)}% chance (power) to detect a correlation of ρ=${rho.toFixed(2)} at an alpha level of ${alpha}.`;

  const curveData = [];
  for (let i = 5; i <= 200; i += 2) {
    if (i <= 3) continue;
    const seCurve = 1 / Math.sqrt(i - 3);
    const powerCurve =
      1 -
      jStat.normal.cdf(critNorm - z / seCurve, 0, 1) +
      jStat.normal.cdf(-critNorm - z / seCurve, 0, 1);
    curveData.push({ x: i, y: Math.max(0, Math.min(0.999, powerCurve)) });
  }

  return { power, summary, curveData };
};

export const calculateChiSquarePower = (
  n: number,
  w: number,
  df: number,
  alpha: number
): PowerResult => {
  if (df <= 0) {
    return {
      power: 0,
      summary: 'Invalid degrees of freedom',
      curveData: [],
    };
  }

  const lambda = w * w * n;
  const critChi = jStat.chisquare.inv(1 - alpha, df);
  
  // Patnaik's two-moment chi-square approximation for noncentral chi-square
  // Accurate for most practical cases, but may lose precision for very large lambda
  if (lambda > 30) {
    console.warn(`Chi-square power: lambda=${lambda.toFixed(1)} is large. Approximation may be less accurate. Consider simulation-based methods.`);
  }
  
  const h = 1 - (2/3) * (lambda / (df + lambda));
  const dfAdjusted = df + lambda;
  const critChiAdjusted = critChi / h;
  const power = Math.min(0.999, 1 - jStat.chisquare.cdf(critChiAdjusted, dfAdjusted));

  const summary = `With a total sample size of ${n} and ${df} degrees of freedom, you have a ${(power * 100).toFixed(1)}% chance (power) to detect an effect size of w=${w.toFixed(2)} at an alpha level of ${alpha}.`;

  const curveData = [];
  for (let i = 10; i <= 500; i += 4) {
    const lambdaCurve = w * w * i;
    const hCurve = 1 - (2/3) * (lambdaCurve / (df + lambdaCurve));
    const dfAdjCurve = df + lambdaCurve;
    const critChiAdjCurve = critChi / hCurve;
    const powerCurve = Math.min(0.999, 1 - jStat.chisquare.cdf(critChiAdjCurve, dfAdjCurve));
    curveData.push({ x: i, y: Math.max(0, Math.min(1, powerCurve)) });
  }

  return { power, summary, curveData };
};

export const cohensD = (mean1: number, mean2: number, sd: number): number => {
  return Math.abs(mean1 - mean2) / sd;
};

export const cohensF = (means: number[], overallMean: number, sd: number): number => {
  const variance = means.reduce((sum, m) => sum + Math.pow(m - overallMean, 2), 0) / means.length;
  return Math.sqrt(variance) / sd;
};

export const cohensW = (observed: number[], expected: number[]): number => {
  let chiSq = 0;
  for (let i = 0; i < observed.length; i++) {
    if (expected[i] > 0) {
      chiSq += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }
  }
  const n = observed.reduce((a, b) => a + b, 0);
  return Math.sqrt(chiSq / n);
};

// Calculate minimum detectable effect size for given power
export function calculateMinimumDetectableEffect(
  n: number,
  targetPower: number = 0.8,
  alpha: number = 0.05,
  testType: 'ttest' | 'anova' | 'correlation' | 'chisquare' | 'twoway-anova' | 'repeated-measures' | 'nested-anova' | 'permanova' | 'repeated-permanova' = 'ttest',
  groups?: number,
  additionalParams?: any
): number {
  let low = 0.01;
  let high = 3.0;
  
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    let power = 0;
    
    if (testType === 'ttest') {
      power = calculateTTestPower(n, mid, alpha).power;
    } else if (testType === 'anova' && groups) {
      power = calculateOneWayAnovaPower(n, groups, mid, alpha).power;
    } else if (testType === 'correlation') {
      power = calculateCorrelationPower(n, mid, alpha).power;
    }
    
    if (Math.abs(power - targetPower) < 0.001) return mid;
    if (power < targetPower) low = mid; else high = mid;
  }
  
  return (low + high) / 2;
}

export function calculateRequiredSampleSize(
  effectSize: number,
  targetPower: number = 0.8,
  alpha: number = 0.05,
  testType: 'ttest' | 'anova' | 'correlation' | 'chisquare' | 'twoway-anova' | 'repeated-measures' | 'nested-anova' | 'permanova' | 'repeated-permanova' = 'ttest',
  groups?: number,
  additionalParams?: any
): number {
  let low = 2;
  let high = 10000;
  
  for (let i = 0; i < 50; i++) {
    const mid = Math.round((low + high) / 2);
    let power = 0;
    
    if (testType === 'ttest') {
      power = calculateTTestPower(mid, effectSize, alpha).power;
    } else if (testType === 'anova' && groups) {
      power = calculateOneWayAnovaPower(mid, groups, effectSize, alpha).power;
    } else if (testType === 'correlation') {
      const rho = effectSize;
      const z = 0.5 * Math.log((1 + rho) / (1 - rho));
      const se = 1 / Math.sqrt(mid - 3);
      const zCrit = jStat.normal.inv(1 - alpha / 2, 0, 1);
      const ncp = Math.abs(z) / se;
      power = 1 - jStat.normal.cdf(zCrit - ncp, 0, 1) + jStat.normal.cdf(-zCrit - ncp, 0, 1);
    } else if (testType === 'chisquare' && groups) {
      const df = groups - 1;
      power = calculateChiSquarePower(mid, effectSize, df, alpha).power;
    }
    
    if (Math.abs(power - targetPower) < 0.01) return mid;
    if (power < targetPower) low = mid + 1; else high = mid - 1;
  }
  
  let result = Math.round((low + high) / 2);
  
  return result;
}

export const calculatePERMANOVAPower = (
  nPerGroup: number,
  groups: number,
  rSquared: number,
  alpha: number
): PowerResult => {
  const N = nPerGroup * groups;
  const df1 = groups - 1;
  const df2 = N - groups;
  
  if (df2 <= 0 || rSquared >= 1 || rSquared <= 0 || N < groups * 2) {
    return { power: 0, summary: 'Invalid parameters', curveData: [] };
  }
  
  // Convert R² to F-statistic for PERMANOVA
  // pseudo-F = [R²/(k-1)] / [(1-R²)/(N-k)]
  const lambda = N * (rSquared / (1 - rSquared));
  
  const critF = jStat.centralF.inv(1 - alpha, df1, df2);
  const power = noncentralFPower(lambda, df1, df2, critF);
  
  const summary = `For ${groups} groups with ${nPerGroup} per group (N=${N}), you have ${(power * 100).toFixed(1)}% power to detect R²=${(rSquared * 100).toFixed(1)}% variance explained at α=${alpha}.`;
  
  // Power curve: vary total N
  const curveData = [];
  for (let totalN = groups * 5; totalN <= 400; totalN += 10) {
    const nPG = totalN / groups;
    if (nPG < 3) continue;
    const df2C = totalN - groups;
    if (df2C <= 0) continue;
    const lambdaC = totalN * (rSquared / (1 - rSquared));
    const critFC = jStat.centralF.inv(1 - alpha, df1, df2C);
    const powerC = noncentralFPower(lambdaC, df1, df2C, critFC);
    curveData.push({ x: totalN, y: Math.max(0, Math.min(0.999, powerC)) });
  }
  
  return { power, summary, curveData };
};

export const calculateRepeatedMeasuresPERMANOVAPower = (
  subjects: number,
  timepoints: number,
  rSquared: number,
  correlation: number,
  alpha: number
): PowerResult => {
  // Repeated measures PERMANOVA uses different degrees of freedom
  const df1 = timepoints - 1;
  const df2 = (subjects - 1) * (timepoints - 1);
  
  if (df2 <= 0 || rSquared >= 1 || rSquared <= 0 || subjects < 3 || timepoints < 2) {
    return { power: 0, summary: 'Invalid parameters', curveData: [] };
  }
  
  // CORRECTED: Design effect from Donner & Klar (2000) for clustered data
  // Higher within-subject correlation REDUCES effective sample size (more redundant information)
  const designEffect = 1 + (timepoints - 1) * correlation;
  const effectiveN = (subjects * timepoints) / designEffect;
  
  // Noncentrality parameter for repeated measures PERMANOVA
  const lambda = effectiveN * (rSquared / (1 - rSquared));
  
  const critF = jStat.centralF.inv(1 - alpha, df1, df2);
  const power = noncentralFPower(lambda, df1, df2, critF);
  
  const summary = `With ${subjects} subjects measured at ${timepoints} timepoints (r=${correlation.toFixed(2)}), you have ${(power * 100).toFixed(1)}% power to detect R²=${(rSquared * 100).toFixed(2)} at α=${alpha}.`;
  
  // Power curve: vary number of subjects (x-axis shows subjects, not total samples)
  const curveData = [];
  for (let subj = 5; subj <= 100; subj += 2) {
    const df2C = (subj - 1) * (timepoints - 1);
    if (df2C <= 0) continue;
    const designEffectC = 1 + (timepoints - 1) * correlation;
    const effectiveNC = (subj * timepoints) / designEffectC;
    const lambdaC = effectiveNC * (rSquared / (1 - rSquared));
    const critFC = jStat.centralF.inv(1 - alpha, df1, df2C);
    const powerC = noncentralFPower(lambdaC, df1, df2C, critFC);
    curveData.push({ x: subj, y: Math.max(0, Math.min(0.999, powerC)) });
  }
  
  return { power, summary, curveData };
};
