// Statistical power calculations for ecological research.
// Exact noncentral t, F and chi-square distributions (Poisson-mixture series),
// cross-checked against scipy.stats (nct, ncf, ncx2) and the R pwr package.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore jstat typings are incomplete
import jStat from 'jstat';

export interface PowerResult {
  power: number;
  summary: string;
  curveData: { x: number; y: number }[];
}

const clampPower = (p: number): number => (Number.isFinite(p) ? Math.max(0, Math.min(0.999, p)) : 0);

/**
 * Sum_j Pois(j; mu) * f(j), starting at the Poisson mode and walking outwards so that
 * large noncentralities do not underflow. f(j) must lie in [0, 1].
 */
function poissonMixture(mu: number, f: (j: number) => number): number {
  if (mu <= 0) return f(0);
  const mode = Math.floor(mu);
  const logPmf = (j: number) => -mu + j * Math.log(mu) - jStat.gammaln(j + 1);
  const eps = 1e-14;
  let sum = 0;
  // upward from the mode
  let lp = logPmf(mode);
  for (let j = mode; j < mode + 100000; j++) {
    const w = Math.exp(lp);
    sum += w * f(j);
    if (j > mu && w < eps) break;
    lp += Math.log(mu) - Math.log(j + 1);
  }
  // downward from the mode
  lp = logPmf(mode);
  for (let j = mode - 1; j >= 0; j--) {
    lp += Math.log(j + 1) - Math.log(mu);
    const w = Math.exp(lp);
    sum += w * f(j);
    if (w < eps) break;
  }
  return Math.min(1, Math.max(0, sum));
}

/** CDF of the noncentral F distribution (ncp = lambda). */
export function nonCentralFCDF(x: number, df1: number, df2: number, ncp: number): number {
  if (!(x > 0)) return 0;
  if (!Number.isFinite(x)) return 1;
  const y = (x * df1) / (df2 + x * df1);
  if (ncp <= 0) return jStat.ibeta(y, df1 / 2, df2 / 2);
  return poissonMixture(ncp / 2, (j) => jStat.ibeta(y, df1 / 2 + j, df2 / 2));
}

/** CDF of the noncentral chi-square distribution. */
export function nonCentralChiSquareCDF(x: number, df: number, ncp: number): number {
  if (!(x > 0)) return 0;
  if (ncp <= 0) return jStat.chisquare.cdf(x, df);
  return poissonMixture(ncp / 2, (j) => jStat.chisquare.cdf(x, df + 2 * j));
}

/** CDF of the noncentral t distribution (Lenth 1989, AS 243). */
export function nonCentralTCDF(t: number, df: number, delta: number): number {
  if (!Number.isFinite(t)) return t > 0 ? 1 : 0;
  if (delta === 0) return jStat.studentt.cdf(t, df);
  // Far tails: series underflows; the normal limit is accurate there.
  if (Math.abs(delta) > 37 && df > 3) {
    const z = (t * (1 - 1 / (4 * df)) - delta) / Math.sqrt(1 + (t * t) / (2 * df));
    return jStat.normal.cdf(z, 0, 1);
  }
  let tt = t;
  let del = delta;
  let negdel = false;
  if (t < 0) {
    negdel = true;
    tt = -t;
    del = -delta;
  }
  const x = (tt * tt) / (tt * tt + df);
  let tnc = 0;
  if (x > 0) {
    const lambda = del * del;
    let p = 0.5 * Math.exp(-0.5 * lambda);
    let q = Math.sqrt(2 / Math.PI) * p * del;
    let s = 0.5 - p;
    let a = 0.5;
    const b = 0.5 * df;
    const rxb = Math.pow(1 - x, b);
    const albeta = 0.5 * Math.log(Math.PI) + jStat.gammaln(b) - jStat.gammaln(0.5 + b);
    let xodd = jStat.ibeta(x, a, b);
    let godd = 2 * rxb * Math.exp(a * Math.log(x) - albeta);
    let xeven = 1 - rxb;
    let geven = b * x * rxb;
    tnc = p * xodd + q * xeven;
    for (let en = 1; en <= 2000; en++) {
      a += 1;
      xodd -= godd;
      xeven -= geven;
      godd *= (x * (a + b - 1)) / a;
      geven *= (x * (a + b - 0.5)) / (a + 0.5);
      p *= lambda / (2 * en);
      q *= lambda / (2 * en + 1);
      s -= p;
      tnc += p * xodd + q * xeven;
      if (2 * s * (xodd - godd) <= 1e-12 && en > lambda / 2) break;
    }
  }
  tnc += jStat.normal.cdf(-del, 0, 1);
  tnc = Math.min(1, Math.max(0, tnc));
  return negdel ? 1 - tnc : tnc;
}

/** Two-sided power of a t test with noncentrality ncp. */
export function tTestPowerExact(ncp: number, df: number, alpha: number): number {
  if (!(df > 0)) return 0;
  const crit = jStat.studentt.inv(1 - alpha / 2, df);
  return 1 - nonCentralTCDF(crit, df, ncp) + nonCentralTCDF(-crit, df, ncp);
}

/** Upper-tail power of an F test (critical value supplied). */
export function noncentralFPower(lambda: number, df1: number, df2: number, criticalValue: number): number {
  if (!(df1 > 0) || !(df2 > 0) || !Number.isFinite(criticalValue)) return 0;
  if (Number.isNaN(lambda)) return 0;
  if (!Number.isFinite(lambda)) return clampPower(1);
  return clampPower(1 - nonCentralFCDF(criticalValue, df1, df2, Math.max(0, lambda)));
}

const fTestPower = (lambda: number, df1: number, df2: number, alpha: number): number => {
  if (!(df1 > 0) || !(df2 > 0)) return 0;
  return noncentralFPower(lambda, df1, df2, jStat.centralF.inv(1 - alpha, df1, df2));
};

export const calculateTTestPower = (
  n: number,
  effectSize: number,
  alpha: number
): PowerResult => {
  // n is sample size per group
  const totalN = 2 * n;
  const df = totalN - 2;
  const ncp = effectSize * Math.sqrt(n / 2);
  const power = clampPower(tTestPowerExact(ncp, df, alpha));

  const summary = `With ${n} per group (total N=${totalN}), you have ${(power * 100).toFixed(1)}% power to detect an effect size of d=${effectSize.toFixed(2)} at α=${alpha}.`;

  // Power curve: x = TOTAL sample size N
  const curveData: { x: number; y: number }[] = [];
  const maxTotal = Math.max(400, Math.ceil((totalN * 1.5) / 2) * 2);
  const step = Math.max(2, Math.ceil(maxTotal / 200 / 2) * 2);
  for (let totalSampleSize = 4; totalSampleSize <= maxTotal; totalSampleSize += step) {
    const nPerGroup = totalSampleSize / 2;
    const ncpCurve = effectSize * Math.sqrt(nPerGroup / 2);
    curveData.push({ x: totalSampleSize, y: clampPower(tTestPowerExact(ncpCurve, totalSampleSize - 2, alpha)) });
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

  if (df1 <= 0 || df2 <= 0) {
    return { power: 0, summary: 'Invalid parameters', curveData: [] };
  }

  // λ = f² × N (Cohen 1988; G*Power)
  const lambda = effectSize * effectSize * N;
  const power = fTestPower(lambda, df1, df2, alpha);

  const summary = `For ${groups} groups with ${n} per group (total N=${N}), you have ${(power * 100).toFixed(1)}% power to detect an effect size of f=${effectSize.toFixed(2)} at α=${alpha}.`;

  // Power curve: x = TOTAL sample size N (multiples of the number of groups)
  const minTotalN = groups * 2;
  const maxTotalN = Math.max(N * 3, 200);
  const stepSize = Math.max(1, Math.ceil((maxTotalN - minTotalN) / 100 / groups)) * groups;

  const curveData: { x: number; y: number }[] = [];
  for (let totalN = minTotalN; totalN <= maxTotalN; totalN += stepSize) {
    const df2Curve = totalN - groups;
    if (df2Curve <= 0) continue;
    curveData.push({ x: totalN, y: fTestPower(effectSize * effectSize * totalN, df1, df2Curve, alpha) });
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
  const totalCells = factorA * factorB;
  const N = n * totalCells;
  const dfA = factorA - 1;
  const dfB = factorB - 1;
  const dfAB = (factorA - 1) * (factorB - 1);
  const dfError = totalCells * (n - 1);

  if (dfError <= 0 || dfA <= 0 || dfB <= 0) {
    return {
      powerA: 0,
      powerB: 0,
      powerAB: 0,
      summary: 'Invalid parameters',
      curveData: [],
      curveDataA: [],
      curveDataB: [],
    };
  }

  // λ = f² × N for each effect (G*Power "ANOVA: fixed effects, special, main effects and interactions")
  const powerA = fTestPower(effectA * effectA * N, dfA, dfError, alpha);
  const powerB = fTestPower(effectB * effectB * N, dfB, dfError, alpha);
  const powerAB = fTestPower(effectInteraction * effectInteraction * N, dfAB, dfError, alpha);

  const summary = `Design: ${factorA}×${factorB} with ${n} per cell (total N=${N}). Power: A ${(powerA * 100).toFixed(1)}%, B ${(powerB * 100).toFixed(1)}%, A×B ${(powerAB * 100).toFixed(1)}% at α=${alpha}.`;

  // Curves: x = TOTAL N, in whole multiples of the number of cells
  const maxTotal = Math.max(400, Math.ceil((N * 1.5) / totalCells) * totalCells);
  const cellStep = Math.max(1, Math.ceil(maxTotal / totalCells / 150));
  const curveData: { x: number; y: number }[] = [];
  const curveDataA: { x: number; y: number }[] = [];
  const curveDataB: { x: number; y: number }[] = [];
  for (let nPerCell = 2; nPerCell * totalCells <= maxTotal; nPerCell += cellStep) {
    const totalN = nPerCell * totalCells;
    const dfErrorCurve = totalCells * (nPerCell - 1);
    curveData.push({ x: totalN, y: fTestPower(effectInteraction * effectInteraction * totalN, dfAB, dfErrorCurve, alpha) });
    curveDataA.push({ x: totalN, y: fTestPower(effectA * effectA * totalN, dfA, dfErrorCurve, alpha) });
    curveDataB.push({ x: totalN, y: fTestPower(effectB * effectB * totalN, dfB, dfErrorCurve, alpha) });
  }

  return { powerA, powerB, powerAB, summary, curveData, curveDataA, curveDataB };
};

/**
 * Within-subject (time) effect in a one-group repeated-measures ANOVA, compound symmetry.
 * G*Power "ANOVA: repeated measures, within factors":
 *   λ = f² · N · m / (1 − ρ) · ε,  df1 = (m − 1)ε,  df2 = (N − 1)(m − 1)ε
 * Higher within-subject correlation increases power for within-subject effects.
 */
const rmLambdaFactor = (timepoints: number, correlation: number) =>
  timepoints / (1 - Math.min(Math.max(correlation, -0.99), 0.99));

export const calculateRepeatedMeasuresPower = (
  subjects: number,
  timepoints: number,
  effectSize: number,
  correlation: number,
  alpha: number
): PowerResult => {
  // Sphericity assumed (ε = 1); apply Greenhouse-Geisser/Huynh-Feldt in the actual analysis if violated.
  const epsilon = 1.0;
  const df1 = (timepoints - 1) * epsilon;
  const df2 = (subjects - 1) * (timepoints - 1) * epsilon;

  if (df1 <= 0 || df2 <= 0 || subjects < 2) {
    return { power: 0, summary: 'Invalid parameters', curveData: [] };
  }

  const lambda = effectSize * effectSize * subjects * rmLambdaFactor(timepoints, correlation) * epsilon;
  const power = fTestPower(lambda, df1, df2, alpha);

  const summary = `With ${subjects} subjects at ${timepoints} timepoints (ε=${epsilon.toFixed(2)}, ρ=${correlation.toFixed(2)}), power is ${(power * 100).toFixed(1)}% for effect size f=${effectSize.toFixed(2)} at α=${alpha}.`;

  // Power curve: x = number of subjects
  const curveData: { x: number; y: number }[] = [];
  const maxSubj = Math.max(200, Math.ceil(subjects * 1.5));
  const step = Math.max(1, Math.ceil(maxSubj / 150));
  for (let subj = 2; subj <= maxSubj; subj += step) {
    const df2C = (subj - 1) * (timepoints - 1) * epsilon;
    const lambdaC = effectSize * effectSize * subj * rmLambdaFactor(timepoints, correlation) * epsilon;
    curveData.push({ x: subj, y: fTestPower(lambdaC, df1, df2C, alpha) });
  }

  return { power, summary, curveData };
};

// Two-sided test of H0: ρ = 0 via Fisher's z transformation.
const correlationPowerAt = (n: number, rho: number, alpha: number): number => {
  if (n <= 3) return 0;
  const r = Math.min(Math.abs(rho), 0.9999);
  const z = Math.atanh(r);
  const ncp = z * Math.sqrt(n - 3);
  const zCrit = jStat.normal.inv(1 - alpha / 2, 0, 1);
  return 1 - jStat.normal.cdf(zCrit - ncp, 0, 1) + jStat.normal.cdf(-zCrit - ncp, 0, 1);
};

export const calculateCorrelationPower = (
  n: number,
  rho: number,
  alpha: number
): PowerResult => {
  if (n <= 3) {
    return { power: 0, summary: 'Sample size too small', curveData: [] };
  }

  const power = clampPower(correlationPowerAt(n, rho, alpha));

  const summary = `With a total sample size of ${n}, you have a ${(power * 100).toFixed(1)}% chance (power) to detect a correlation of ρ=${rho.toFixed(2)} at an alpha level of ${alpha}.`;

  const curveData: { x: number; y: number }[] = [];
  const maxN = Math.max(200, Math.ceil(n * 1.5));
  const step = Math.max(1, Math.ceil(maxN / 150));
  for (let i = 4; i <= maxN; i += step) {
    curveData.push({ x: i, y: clampPower(correlationPowerAt(i, rho, alpha)) });
  }

  return { power, summary, curveData };
};

const chiSquarePowerAt = (n: number, w: number, df: number, alpha: number): number => {
  const critChi = jStat.chisquare.inv(1 - alpha, df);
  return 1 - nonCentralChiSquareCDF(critChi, df, w * w * n);
};

export const calculateChiSquarePower = (
  n: number,
  w: number,
  df: number,
  alpha: number
): PowerResult => {
  if (df <= 0) {
    return { power: 0, summary: 'Invalid degrees of freedom', curveData: [] };
  }

  // Exact noncentral chi-square with λ = w² × N (Cohen 1988)
  const power = clampPower(chiSquarePowerAt(n, w, df, alpha));

  const summary = `With a total sample size of ${n} and ${df} degrees of freedom, you have a ${(power * 100).toFixed(1)}% chance (power) to detect an effect size of w=${w.toFixed(2)} at an alpha level of ${alpha}.`;

  const curveData: { x: number; y: number }[] = [];
  const maxN = Math.max(500, Math.ceil(n * 1.5));
  const step = Math.max(2, Math.ceil(maxN / 150));
  for (let i = 10; i <= maxN; i += step) {
    curveData.push({ x: i, y: clampPower(chiSquarePowerAt(i, w, df, alpha)) });
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

export type PlanningTestType =
  | 'ttest'
  | 'anova'
  | 'correlation'
  | 'chisquare'
  | 'twoway-anova'
  | 'repeated-measures'
  | 'nested-anova'
  | 'permanova'
  | 'repeated-permanova';

export interface PlanningParams {
  /** chi-square degrees of freedom (overrides groups − 1) */
  df?: number;
  factorALevels?: number;
  factorBLevels?: number;
  /** which two-way effect to plan for (default: interaction) */
  twoWayEffect?: 'A' | 'B' | 'AB';
  timepoints?: number;
  correlation?: number;
}

/** Test types supported by calculateMinimumDetectableEffect / calculateRequiredSampleSize. */
export const PLANNING_SUPPORTED: PlanningTestType[] = [
  'ttest', 'anova', 'correlation', 'chisquare', 'twoway-anova', 'repeated-measures', 'permanova', 'repeated-permanova',
];

/**
 * Unrounded power for a planning search. Sample-size units:
 *  ttest, anova, permanova: n per group · twoway-anova: n per cell ·
 *  repeated-measures, repeated-permanova: subjects · correlation, chisquare: total N.
 * Effect units: d (ttest), f (anova, twoway, repeated-measures), r (correlation), w (chisquare), R² (permanova variants).
 * Returns NaN for unsupported combinations.
 */
export function planningPower(
  testType: PlanningTestType,
  n: number,
  effect: number,
  alpha: number,
  groups?: number,
  p: PlanningParams = {}
): number {
  switch (testType) {
    case 'ttest':
      return tTestPowerExact(effect * Math.sqrt(n / 2), 2 * n - 2, alpha);
    case 'anova': {
      const k = groups ?? 0;
      if (k < 2) return NaN;
      return fTestPower(effect * effect * n * k, k - 1, n * k - k, alpha);
    }
    case 'correlation':
      return correlationPowerAt(n, effect, alpha);
    case 'chisquare': {
      const df = p.df ?? (groups !== undefined ? groups - 1 : NaN);
      if (!(df >= 1)) return NaN;
      return chiSquarePowerAt(n, effect, df, alpha);
    }
    case 'twoway-anova': {
      const a = p.factorALevels ?? 2;
      const b = p.factorBLevels ?? 2;
      if (a < 2 || b < 2) return NaN;
      const df1 = p.twoWayEffect === 'A' ? a - 1 : p.twoWayEffect === 'B' ? b - 1 : (a - 1) * (b - 1);
      return fTestPower(effect * effect * n * a * b, df1, a * b * (n - 1), alpha);
    }
    case 'repeated-measures': {
      const m = p.timepoints ?? 0;
      if (m < 2) return NaN;
      const lambda = effect * effect * n * rmLambdaFactor(m, p.correlation ?? 0.5);
      return fTestPower(lambda, m - 1, (n - 1) * (m - 1), alpha);
    }
    case 'permanova': {
      const k = groups ?? 0;
      if (k < 2 || !(effect > 0 && effect < 1)) return NaN;
      return fTestPower((n * k * effect) / (1 - effect), k - 1, n * k - k, alpha);
    }
    case 'repeated-permanova': {
      const m = p.timepoints ?? 0;
      if (m < 2 || !(effect > 0 && effect < 1)) return NaN;
      const lambda = ((n * effect) / (1 - effect)) * rmLambdaFactor(m, p.correlation ?? 0.5);
      return fTestPower(lambda, m - 1, (n - 1) * (m - 1), alpha);
    }
    default:
      return NaN;
  }
}

const minN = (testType: PlanningTestType): number =>
  testType === 'correlation' ? 4 : testType === 'chisquare' ? 2 : 2;

/**
 * Smallest effect size with power ≥ targetPower at sample size n.
 * Returns NaN if the test type is unsupported and Infinity if no effect in range reaches the target.
 */
export function calculateMinimumDetectableEffect(
  n: number,
  targetPower: number = 0.8,
  alpha: number = 0.05,
  testType: PlanningTestType = 'ttest',
  groups?: number,
  additionalParams?: PlanningParams
): number {
  const power = (e: number) => planningPower(testType, n, e, alpha, groups, additionalParams);
  if (Number.isNaN(power(0.1))) return NaN;
  const bounded = testType === 'correlation' || testType === 'permanova' || testType === 'repeated-permanova';
  let low = 0;
  const cap = bounded ? 0.999 : 10;
  // grow the upper bound from below so huge noncentralities are never evaluated
  let high = Math.min(cap, 0.25);
  while (!(power(high) >= targetPower)) {
    if (high >= cap) return Infinity;
    low = high;
    high = Math.min(cap, high * 2);
  }
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (power(mid) >= targetPower) high = mid; else low = mid;
  }
  return high;
}

/**
 * Smallest sample size (units as in planningPower) with power ≥ targetPower.
 * Returns NaN if the test type is unsupported and Infinity if the target is not reached by n = 100 000.
 */
export function calculateRequiredSampleSize(
  effectSize: number,
  targetPower: number = 0.8,
  alpha: number = 0.05,
  testType: PlanningTestType = 'ttest',
  groups?: number,
  additionalParams?: PlanningParams
): number {
  const power = (n: number) => planningPower(testType, n, effectSize, alpha, groups, additionalParams);
  let low = minN(testType);
  if (Number.isNaN(power(low + 10))) return NaN;
  if (power(low) >= targetPower) return low;
  let high = low;
  do {
    if (high >= 100000) return Infinity;
    high = Math.min(high * 2, 100000);
  } while (!(power(high) >= targetPower));
  // invariant: power(low) < target <= power(high)
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (power(mid) >= targetPower) high = mid; else low = mid;
  }
  return high;
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

  if (df1 <= 0 || df2 <= 0 || rSquared >= 1 || rSquared <= 0 || N < groups * 2) {
    return { power: 0, summary: 'Invalid parameters', curveData: [] };
  }

  // F-test approximation with Cohen's f² = R²/(1 − R²), λ = f² × N
  const lambda = N * (rSquared / (1 - rSquared));
  const power = fTestPower(lambda, df1, df2, alpha);

  const summary = `For ${groups} groups with ${nPerGroup} per group (N=${N}), you have ${(power * 100).toFixed(1)}% power to detect R²=${(rSquared * 100).toFixed(1)}% variance explained at α=${alpha}.`;

  // Power curve: x = total N, in whole multiples of groups
  const curveData: { x: number; y: number }[] = [];
  const maxTotal = Math.max(400, Math.ceil((N * 1.5) / groups) * groups);
  const perGroupStep = Math.max(1, Math.ceil(maxTotal / groups / 150));
  for (let nPG = 2; nPG * groups <= maxTotal; nPG += perGroupStep) {
    const totalN = nPG * groups;
    const lambdaC = totalN * (rSquared / (1 - rSquared));
    curveData.push({ x: totalN, y: fTestPower(lambdaC, df1, totalN - groups, alpha) });
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
  const df1 = timepoints - 1;
  const df2 = (subjects - 1) * (timepoints - 1);

  if (df2 <= 0 || rSquared >= 1 || rSquared <= 0 || subjects < 3 || timepoints < 2) {
    return { power: 0, summary: 'Invalid parameters', curveData: [] };
  }

  // Within-subject (time) effect: f² = R²/(1 − R²), λ = f² · N · m / (1 − ρ)
  // (same F approximation as the repeated-measures ANOVA; higher ρ increases power)
  const lambda = ((subjects * rSquared) / (1 - rSquared)) * rmLambdaFactor(timepoints, correlation);
  const power = fTestPower(lambda, df1, df2, alpha);

  const summary = `With ${subjects} subjects measured at ${timepoints} timepoints (r=${correlation.toFixed(2)}), you have ${(power * 100).toFixed(1)}% power to detect R²=${(rSquared * 100).toFixed(1)}% at α=${alpha}.`;

  // Power curve: x = number of subjects
  const curveData: { x: number; y: number }[] = [];
  const maxSubj = Math.max(100, Math.ceil(subjects * 1.5));
  const step = Math.max(1, Math.ceil(maxSubj / 150));
  for (let subj = 3; subj <= maxSubj; subj += step) {
    const lambdaC = ((subj * rSquared) / (1 - rSquared)) * rmLambdaFactor(timepoints, correlation);
    curveData.push({ x: subj, y: fTestPower(lambdaC, df1, (subj - 1) * (timepoints - 1), alpha) });
  }

  return { power, summary, curveData };
};
