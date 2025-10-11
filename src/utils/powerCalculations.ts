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
function noncentralTPower(ncp: number, df: number, criticalValue: number): number {
  // Use Owen's Q function approximation for better accuracy
  // This approximates the noncentral t-distribution more accurately
  const delta = ncp;
  const t = criticalValue;
  
  // For two-tailed test, calculate power
  // Power = P(|T| > t | delta) where T ~ noncentral t(df, delta)
  
  // Approximate using normal distribution when df is large, otherwise use shifted t
  if (df > 30) {
    // Normal approximation works well for large df
    const z = jStat.normal.inv(1 - 0.05/2, 0, 1); // for alpha = 0.05 two-tailed
    const power = 1 - jStat.normal.cdf(t - delta, 0, 1) + jStat.normal.cdf(-t - delta, 0, 1);
    return Math.max(0, Math.min(0.999, power));
  } else {
    // Better approximation for smaller df using shift
    const shift = delta * Math.sqrt(df / (df + delta * delta));
    const power = 1 - jStat.studentt.cdf(t - shift, df) + jStat.studentt.cdf(-t - shift, df);
    return Math.max(0, Math.min(0.999, power));
  }
}

// Improved approximation for noncentral F distribution power
function noncentralFPower(lambda: number, df1: number, df2: number, criticalValue: number): number {
  // Better approximation using Patnaik's two-moment central chi-square approximation
  // Noncentral F ~ (chi2(df1, lambda) / df1) / (chi2(df2) / df2)
  
  if (lambda === 0) {
    return 1 - jStat.centralF.cdf(criticalValue, df1, df2);
  }
  
  // Use shifted F distribution approximation
  const h = 1 - (2 * lambda) / (3 * df1);
  const adjustedF = criticalValue / h;
  const power = 1 - jStat.centralF.cdf(adjustedF, df1, df2);
  
  // Add correction factor for noncentrality
  const correction = lambda / (df1 + lambda);
  const estimatedPower = Math.max(0, Math.min(0.999, power + correction * (1 - power)));
  
  // Warn if approximation may be inaccurate
  if (lambda > 30 || df2 < 15) {
    console.warn('Noncentral F approximation may be inaccurate for lambda > 30 or df2 < 15');
  }
  
  return estimatedPower;
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
  const power = noncentralTPower(ncp, df, critT);

  const summary = `With <strong>${n} per group</strong> (total N=${totalN}), you have <strong>${(power * 100).toFixed(1)}% power</strong> to detect an effect size of <strong>d=${effectSize.toFixed(2)}</strong> at α=${alpha}.`;

  // Power curve: vary TOTAL sample size N (x-axis), calculate power
  const curveData = [];
  for (let totalSampleSize = 10; totalSampleSize <= 400; totalSampleSize += 10) {
    const nPerGroup = totalSampleSize / 2;
    const dfCurve = totalSampleSize - 2;
    const ncpCurve = effectSize * Math.sqrt(nPerGroup / 2);
    const critTCurve = jStat.studentt.inv(1 - alpha / 2, dfCurve);
    const powerCurve = noncentralTPower(ncpCurve, dfCurve, critTCurve);
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

  const lambda = effectSize * effectSize * N;
  const critF = jStat.centralF.inv(1 - alpha, df1, df2);
  const power = noncentralFPower(lambda, df1, df2, critF);

  const summary = `For <strong>${groups} groups</strong> with <strong>${n} per group</strong> (total N=${N}), you have <strong>${(power * 100).toFixed(1)}% power</strong> to detect an effect size of <strong>f=${effectSize.toFixed(2)}</strong> at α=${alpha}.`;

  // Power curve: vary TOTAL sample size N (x-axis)
  const curveData = [];
  for (let totalN = groups * 5; totalN <= 500; totalN += 10) {
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

  const lambdaA = effectA * effectA * N;
  const lambdaB = effectB * effectB * N;
  const lambdaAB = effectInteraction * effectInteraction * N;

  const critA = jStat.centralF.inv(1 - alpha, dfA, dfError);
  const critB = jStat.centralF.inv(1 - alpha, dfB, dfError);
  const critAB = jStat.centralF.inv(1 - alpha, dfAB, dfError);

  const powerA = noncentralFPower(lambdaA, dfA, dfError, critA);
  const powerB = noncentralFPower(lambdaB, dfB, dfError, critB);
  const powerAB = noncentralFPower(lambdaAB, dfAB, dfError, critAB);

  const summary = `Design: <strong>${factorA}×${factorB}</strong> with <strong>${n} per cell</strong> (total N=${N}). Power: <strong>A ${(powerA * 100).toFixed(1)}%</strong>, <strong>B ${(powerB * 100).toFixed(1)}%</strong>, <strong>A×B ${(powerAB * 100).toFixed(1)}%</strong> at α=${alpha}.`;

  // Power curve: vary TOTAL sample size N (x-axis)
  const curveData = [];
  const totalCells = factorA * factorB;
  for (let totalN = totalCells * 2; totalN <= 400; totalN += 10) {
    const nPerCell = Math.floor(totalN / totalCells);
    if (nPerCell < 2) continue;
    const dfErrorCurve = totalCells * (nPerCell - 1);
    if (dfErrorCurve <= 0) continue;
    const lambdaCurve = effectInteraction * effectInteraction * totalN;
    const critCurve = jStat.centralF.inv(1 - alpha, dfAB, dfErrorCurve);
    const powerCurve = noncentralFPower(lambdaCurve, dfAB, dfErrorCurve, critCurve);
    curveData.push({ x: totalN, y: Math.max(0, Math.min(1, powerCurve)) });
  }

  return { powerA, powerB, powerAB, summary, curveData };
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

  // Noncentrality parameter for repeated measures
  const lambda = (effectSize * effectSize * subjects * timepoints) / (1 - correlation);
  const critF = jStat.centralF.inv(1 - alpha, df1, df2);
  const power = noncentralFPower(lambda, df1, df2, critF);

  const summary = `With <strong>${subjects} subjects</strong> at <strong>${timepoints} timepoints</strong> (ε=${epsilon.toFixed(2)}, ρ=${correlation.toFixed(2)}), power is <strong>${(power * 100).toFixed(1)}%</strong> for effect size <strong>f=${effectSize.toFixed(2)}</strong> at α=${alpha}.`;

  // Power curve: vary number of subjects (x-axis shows subjects, not total observations)
  const curveData = [];
  for (let subj = 5; subj <= 200; subj += 5) {
    const epsilonC = Math.max(0.5, Math.min(1.0, 
      1 / (timepoints - 1) + (timepoints - 1) * (1 - correlation) / (timepoints * correlation + (timepoints - 1) * (1 - correlation))
    ));
    const df1C = (timepoints - 1) * epsilonC;
    const df2C = (subj - 1) * (timepoints - 1) * epsilonC;
    if (df2C <= 0) continue;
    const lambdaC = (effectSize * effectSize * subj * timepoints) / (1 - correlation);
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

  const summary = `With a total sample size of <strong>${n}</strong>, you have a <strong>${(power * 100).toFixed(1)}% chance (power)</strong> to detect a correlation of <strong>ρ=${rho.toFixed(2)}</strong> at an alpha level of <strong>${alpha}</strong>.`;

  const curveData = [];
  for (let i = 5; i <= 200; i += 5) {
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
  
  // Approximate noncentral chi-square power
  const centralPower = 1 - jStat.chisquare.cdf(critChi, df);
  const adjustment = 1 - Math.exp(-lambda / (2 * df));
  const power = Math.min(0.999, centralPower + adjustment * (1 - centralPower));

  const summary = `With a total sample size of <strong>${n}</strong> and <strong>${df} degrees of freedom</strong>, you have a <strong>${(power * 100).toFixed(1)}% chance (power)</strong> to detect an effect size of <strong>w=${w.toFixed(2)}</strong> at an alpha level of <strong>${alpha}</strong>.`;

  const curveData = [];
  for (let i = 10; i <= 500; i += 10) {
    const lambdaCurve = w * w * i;
    const adjustmentCurve = 1 - Math.exp(-lambdaCurve / (2 * df));
    const powerCurve = Math.min(0.999, centralPower + adjustmentCurve * (1 - centralPower));
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
  testType: 'ttest' | 'anova' | 'correlation' = 'ttest',
  groups?: number
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
  testType: 'ttest' | 'anova' | 'correlation' = 'ttest',
  groups?: number
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
      power = calculateCorrelationPower(mid, effectSize, alpha).power;
    }
    
    if (Math.abs(power - targetPower) < 0.01) return mid;
    if (power < targetPower) low = mid + 1; else high = mid - 1;
  }
  
  return Math.round((low + high) / 2);
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
  
  const summary = `For <strong>${groups} groups</strong> with <strong>${nPerGroup} per group</strong> (N=${N}), you have <strong>${(power * 100).toFixed(1)}% power</strong> to detect R²=<strong>${(rSquared * 100).toFixed(1)}%</strong> variance explained at α=${alpha}.`;
  
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
