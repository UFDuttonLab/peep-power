// Statistical power calculations for ecological research
// Using approximation methods compatible with jStat

// @ts-ignore
import jStat from 'jstat';

export interface PowerResult {
  power: number;
  summary: string;
  curveData: { x: number; y: number }[];
}

// Approximation for noncentral t distribution power
function noncentralTPower(ncp: number, df: number, criticalValue: number): number {
  // Approximate using shifted central t-distribution
  const shiftedCrit = criticalValue - ncp / Math.sqrt(df + 1);
  return 1 - jStat.studentt.cdf(shiftedCrit, df) + jStat.studentt.cdf(-shiftedCrit - 2 * ncp / Math.sqrt(df + 1), df);
}

// Approximation for noncentral F distribution power
function noncentralFPower(lambda: number, df1: number, df2: number, criticalValue: number): number {
  // Use approximation: power increases with lambda
  const centralPower = 1 - jStat.centralF.cdf(criticalValue, df1, df2);
  const adjustment = 1 - Math.exp(-lambda / (2 * (df1 + df2)));
  return Math.min(0.999, centralPower + adjustment * (1 - centralPower));
}

export const calculateTTestPower = (
  n: number,
  effectSize: number,
  alpha: number
): PowerResult => {
  const df = 2 * n - 2;
  const ncp = effectSize * Math.sqrt(n / 2);
  const critT = jStat.studentt.inv(1 - alpha / 2, df);
  const power = noncentralTPower(ncp, df, critT);

  const summary = `With a sample size of <strong>${n} per group</strong>, you have a <strong>${(power * 100).toFixed(1)}% chance (power)</strong> to detect an effect size of <strong>d=${effectSize.toFixed(2)}</strong> at an alpha level of <strong>${alpha}</strong>.`;

  const curveData = [];
  for (let i = 5; i <= 200; i += 5) {
    const dfCurve = 2 * i - 2;
    const ncpCurve = effectSize * Math.sqrt(i / 2);
    const critTCurve = jStat.studentt.inv(1 - alpha / 2, dfCurve);
    const powerCurve = noncentralTPower(ncpCurve, dfCurve, critTCurve);
    curveData.push({ x: i, y: Math.max(0, Math.min(1, powerCurve)) });
  }

  return { power, summary, curveData };
};

export const calculateOneWayAnovaPower = (
  n: number,
  groups: number,
  effectSize: number,
  alpha: number
): PowerResult => {
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

  const summary = `For <strong>${groups} groups</strong> with <strong>${n} samples each</strong> (N=${N}), you have a <strong>${(power * 100).toFixed(1)}% chance (power)</strong> to detect an effect size of <strong>f=${effectSize.toFixed(2)}</strong> at an alpha level of <strong>${alpha}</strong>.`;

  const curveData = [];
  for (let i = 5; i <= 200; i += 5) {
    const NCurve = i * groups;
    const df1Curve = groups - 1;
    const df2Curve = NCurve - groups;
    if (df2Curve <= 0) continue;
    const lambdaCurve = effectSize * effectSize * NCurve;
    const critFCurve = jStat.centralF.inv(1 - alpha, df1Curve, df2Curve);
    const powerCurve = noncentralFPower(lambdaCurve, df1Curve, df2Curve, critFCurve);
    curveData.push({ x: i, y: Math.max(0, Math.min(1, powerCurve)) });
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

  const summary = `Design: <strong>${factorA}×${factorB}</strong> with <strong>${n} per cell</strong> (Total N=${N}). Power: <strong>A ${(powerA * 100).toFixed(1)}%</strong>, <strong>B ${(powerB * 100).toFixed(1)}%</strong>, <strong>A×B ${(powerAB * 100).toFixed(1)}%</strong> at α=${alpha}.`;

  const curveData = [];
  for (let i = 5; i <= 100; i += 5) {
    const NCurve = i * factorA * factorB;
    const dfErrorCurve = factorA * factorB * (i - 1);
    if (dfErrorCurve <= 0) continue;
    const lambdaCurve = effectInteraction * effectInteraction * NCurve;
    const critCurve = jStat.centralF.inv(1 - alpha, dfAB, dfErrorCurve);
    const powerCurve = noncentralFPower(lambdaCurve, dfAB, dfErrorCurve, critCurve);
    curveData.push({ x: i, y: Math.max(0, Math.min(1, powerCurve)) });
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
  const epsilon = Math.max(0.1, (1 - correlation) / (1 + (timepoints - 1) * correlation));
  const df1 = (timepoints - 1) * epsilon;
  const df2 = (subjects - 1) * (timepoints - 1) * epsilon;

  if (df2 <= 0) {
    return {
      power: 0,
      summary: 'Invalid parameters',
      curveData: [],
    };
  }

  const NEffective = subjects * timepoints;
  const lambda = effectSize * effectSize * NEffective * (1 + correlation);
  const critF = jStat.centralF.inv(1 - alpha, df1, df2);
  const power = noncentralFPower(lambda, df1, df2, critF);

  const summary = `With <strong>${subjects} subjects</strong> measured at <strong>${timepoints} time points</strong> (ε=${epsilon.toFixed(2)}), estimated power is <strong>${(power * 100).toFixed(1)}%</strong> for effect size <strong>f=${effectSize.toFixed(2)}</strong> at α=${alpha}.`;

  const curveData = [];
  for (let i = 5; i <= 100; i += 5) {
    const epsilonC = Math.max(0.1, (1 - correlation) / (1 + (timepoints - 1) * correlation));
    const df1C = (timepoints - 1) * epsilonC;
    const df2C = (i - 1) * (timepoints - 1) * epsilonC;
    if (df2C <= 0) continue;
    const lambdaC = effectSize * effectSize * i * timepoints * (1 + correlation);
    const critFC = jStat.centralF.inv(1 - alpha, df1C, df2C);
    const powerC = noncentralFPower(lambdaC, df1C, df2C, critFC);
    curveData.push({ x: i, y: Math.max(0, Math.min(1, powerC)) });
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
