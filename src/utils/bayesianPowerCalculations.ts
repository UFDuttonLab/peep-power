// Bayesian power analysis utilities for ecological research.
// Accounts for uncertainty in effect size estimates.
//
// Conventions used throughout this file
//  * Sample-size units: n per group for t-test, ANOVA and PERMANOVA; total n for correlation.
//  * Effect units: Cohen's d (t-test), Cohen's f (ANOVA), r (correlation), R² (PERMANOVA).
//  * "Probability of adequate power" (the assurance definition documented in formulaDefinitions,
//    P(power >= target | prior)) is computed exactly from the minimum detectable effect, no Monte Carlo.
//  * "Expected power" (O'Hagan & Stevens 2001 assurance, E[power | prior]) is computed by quadrature.
//  * Power counts only rejections in the hypothesised (positive) direction, so prior mass on
//    negative effects counts as failure for t-tests and correlations. Cohen's f and R² priors are
//    truncated to their valid ranges.
//  * Every simulation uses a PRNG seeded from the inputs, so identical inputs give identical results.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore jstat typings are incomplete
import jStat from 'jstat';
import {
  nonCentralTCDF,
  nonCentralChiSquareCDF,
  noncentralFPower,
  calculateRequiredSampleSize,
} from './powerCalculations';
import { calculateNegBinomialPower, calculateLMMPower, MAX_SEARCH_N } from './microbiomePowerCalculations';

// ============= SHARED HELPERS =============

/** Deterministic 32-bit PRNG (mulberry32). Returns values in [0, 1). */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** FNV-1a hash of the JSON form of the inputs, used as a PRNG seed. */
export const seedFromInputs = (inputs: unknown): number => {
  const s = JSON.stringify(inputs) ?? '';
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

interface Rng {
  uniform: () => number;
  normal: (mean?: number, sd?: number) => number;
}

const createRng = (inputs: unknown, stream: string): Rng => {
  const u = mulberry32(seedFromInputs([stream, inputs]));
  let spare: number | null = null;
  const standard = (): number => {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    const u1 = 1 - u(); // in (0, 1], so log(u1) is finite
    const u2 = u();
    const r = Math.sqrt(-2 * Math.log(u1));
    spare = r * Math.sin(2 * Math.PI * u2);
    return r * Math.cos(2 * Math.PI * u2);
  };
  return { uniform: u, normal: (mean = 0, sd = 1) => mean + sd * standard() };
};

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const clamp01 = (x: number): number => (Number.isFinite(x) ? clamp(x, 0, 1) : 0);

const critCache = new Map<string, number>();
const cachedCrit = (key: string, f: () => number): number => {
  let v = critCache.get(key);
  if (v === undefined) {
    if (critCache.size > 5000) critCache.clear();
    v = f();
    critCache.set(key, v);
  }
  return v;
};
const tCrit = (df: number, alpha: number) => cachedCrit(`t|${df}|${alpha}`, () => jStat.studentt.inv(1 - alpha / 2, df));
const fCrit = (df1: number, df2: number, alpha: number) =>
  cachedCrit(`f|${df1}|${df2}|${alpha}`, () => jStat.centralF.inv(1 - alpha, df1, df2));
const zCrit = (alpha: number) => cachedCrit(`z|${alpha}`, () => jStat.normal.inv(1 - alpha / 2, 0, 1));

// Probabilists' Gauss-Hermite rule (5 nodes) for E[g(Z)], Z ~ N(0, 1)
const GH_NODES = [-2.856970013872806, -1.355626179974266, 0, 1.355626179974266, 2.856970013872806];
const GH_WEIGHTS = [0.011257411327720691, 0.2220759220056126, 0.5333333333333333, 0.2220759220056126, 0.011257411327720691];

type EffectTest = 'ttest' | 'anova' | 'correlation' | 'permanova';

/**
 * Power of the two-sided level-alpha test, counting only rejections in the hypothesised
 * (positive) direction. Units as described at the top of this file.
 */
export const directionalPower = (
  test: EffectTest,
  n: number,
  effect: number,
  alpha: number,
  groups = 2
): number => {
  if (!Number.isFinite(n) || Number.isNaN(effect)) return 0;
  switch (test) {
    case 'ttest': {
      if (n < 2) return 0;
      const df = 2 * n - 2;
      return clamp01(1 - nonCentralTCDF(tCrit(df, alpha), df, effect * Math.sqrt(n / 2)));
    }
    case 'correlation': {
      if (n <= 3) return 0;
      const r = clamp(effect, -0.9999, 0.9999);
      return clamp01(1 - jStat.normal.cdf(zCrit(alpha) - Math.atanh(r) * Math.sqrt(n - 3), 0, 1));
    }
    case 'anova': {
      const k = groups;
      if (k < 2 || n < 2) return 0;
      const f = Math.max(0, effect);
      return noncentralFPower(f * f * n * k, k - 1, n * k - k, fCrit(k - 1, n * k - k, alpha));
    }
    case 'permanova': {
      const k = groups;
      if (k < 2 || n < 2) return 0;
      const r2 = clamp(effect, 0, 0.999);
      return noncentralFPower((n * k * r2) / (1 - r2), k - 1, n * k - k, fCrit(k - 1, n * k - k, alpha));
    }
    default:
      return 0;
  }
};

interface Support {
  lower: number;
  upper: number;
}

const supportFor = (test: EffectTest): Support => {
  if (test === 'anova') return { lower: 0, upper: Infinity };
  if (test === 'permanova') return { lower: 0, upper: 1 };
  if (test === 'correlation') return { lower: -1, upper: 1 };
  return { lower: -Infinity, upper: Infinity };
};

const normCdf = (x: number, mean: number, sd: number): number => {
  if (x === Infinity) return 1;
  if (x === -Infinity) return 0;
  return jStat.normal.cdf(x, mean, sd);
};

/** P(X >= m) for X ~ Normal(mean, sd) truncated to the support. sd = 0 gives a point mass. */
const truncNormalSurvival = (m: number, mean: number, sd: number, s: Support): number => {
  if (!(sd > 0)) return clamp(mean, s.lower, s.upper) >= m ? 1 : 0;
  const z = normCdf(s.upper, mean, sd) - normCdf(s.lower, mean, sd);
  if (!(z > 1e-300)) return clamp(mean, s.lower, s.upper) >= m ? 1 : 0;
  const lo = Math.max(m, s.lower);
  if (lo >= s.upper) return 0;
  return clamp01((normCdf(s.upper, mean, sd) - normCdf(lo, mean, sd)) / z);
};

interface Node {
  x: number;
  w: number;
}

/** Midpoint-rule quadrature nodes (ascending x) for Normal(mean, sd) truncated to the support. */
const priorNodes = (mean: number, sd: number, s: Support, k = 41): Node[] => {
  const point = [{ x: clamp(mean, s.lower, s.upper), w: 1 }];
  if (!(sd > 0)) return point;
  const zLo = Math.max(-6, (s.lower - mean) / sd);
  const zHi = Math.min(6, (s.upper - mean) / sd);
  if (!(zHi > zLo)) return point;
  const h = (zHi - zLo) / k;
  const nodes: Node[] = [];
  let total = 0;
  for (let i = 0; i < k; i++) {
    const z = zLo + (i + 0.5) * h;
    const w = jStat.normal.pdf(z, 0, 1);
    total += w;
    nodes.push({ x: mean + sd * z, w });
  }
  return nodes.map((nd) => ({ x: nd.x, w: nd.w / total }));
};

/** E[power] over ascending nodes; power is increasing in the effect, so evaluation stops once it saturates. */
const expectedPowerOver = (powerFn: (x: number) => number, nodes: Node[], monotone = true): number => {
  let sum = 0;
  let last = 0;
  let saturated = false;
  for (const nd of nodes) {
    const p = saturated ? last : powerFn(nd.x);
    if (monotone && p >= 0.9989) saturated = true;
    last = p;
    sum += nd.w * p;
  }
  return clamp01(sum);
};

/** Smallest effect with power >= target (Infinity if unreachable within the support). */
const minDetectableEffect = (powerFn: (x: number) => number, target: number, test: EffectTest): number => {
  const lo0 = 0;
  const hi0 = test === 'correlation' ? 0.9999 : test === 'permanova' ? 0.999 : 20;
  if (powerFn(hi0) < target) return Infinity;
  if (powerFn(lo0) >= target) return lo0;
  let lo = lo0;
  let hi = hi0;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (powerFn(mid) >= target) hi = mid;
    else lo = mid;
  }
  return hi;
};

/** Smallest integer n in [lo, hi] with pred(n) true, assuming pred is monotone. null if pred(hi) is false. */
const smallestN = (lo: number, hi: number, pred: (n: number) => boolean): number | null => {
  if (!pred(hi)) return null;
  if (pred(lo)) return lo;
  let a = lo;
  let b = hi;
  while (b - a > 1) {
    const mid = Math.floor((a + b) / 2);
    if (pred(mid)) b = mid;
    else a = mid;
  }
  return b;
};

const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;

const validateCommon = (alpha: number) => {
  if (!(alpha > 0 && alpha < 1)) throw new Error('Alpha must be between 0 and 1');
};

// ============= BAYESIAN ASSURANCE =============

export interface BayesianAssuranceInput {
  effectSizeMean: number;      // Prior mean for effect size
  effectSizeSD: number;         // Prior uncertainty (SD)
  targetPower: number;          // e.g., 0.80
  targetAssurance: number;      // e.g., 0.80 (80% probability of achieving target power)
  testType: 'ttest' | 'anova' | 'correlation' | 'permanova';
  groups?: number;              // For ANOVA or PERMANOVA
  alpha: number;
}

export interface BayesianAssuranceResult {
  requiredN: number;
  /** false when the target assurance is not reached by the largest n searched (requiredN is then that cap) */
  reached: boolean;
  maxSearchN: number;
  /** Expected power E[power | prior] at requiredN */
  expectedPowerAtN: number;
  /** Conventional n at the prior mean (Infinity if unreachable, NaN if not computable) */
  frequentistN: number;
  assuranceCurve: Array<{ n: number; assurance: number; expectedPower: number }>;
  /** Sensitivity band: assurance when the prior SD is 25% smaller or larger */
  confidenceRegions: {
    lower: Array<{ x: number; y: number }>;
    upper: Array<{ x: number; y: number }>;
  };
  priorDistribution: Array<{ effectSize: number; density: number }>;
  summary: string;
}

/**
 * Bayesian assurance for sample size determination.
 *
 * Assurance here is the probability, under the prior for the effect size, that the study has at least
 * the target power: P(power(theta, n) >= target). Power increases with theta, so this equals
 * P(theta >= MDE(n)), where MDE(n) is the minimum detectable effect. It is computed exactly.
 * The expected power E[power(theta, n)] is reported as well.
 */
export const calculateBayesianAssurance = (
  params: BayesianAssuranceInput
): BayesianAssuranceResult => {
  const { effectSizeMean: mean, effectSizeSD: sd, targetPower, targetAssurance, testType: test, alpha } = params;
  validateCommon(alpha);
  if (!(sd >= 0)) throw new Error('Prior SD cannot be negative');
  if (!(targetPower > alpha && targetPower < 1)) throw new Error('Target power must be between alpha and 1');
  if (!(targetAssurance > 0 && targetAssurance < 1)) throw new Error('Target assurance must be between 0 and 1');
  const groups = params.groups ?? 2;
  if ((test === 'anova' || test === 'permanova') && !(groups >= 2)) throw new Error('At least 2 groups are required');

  const support = supportFor(test);
  const nMin = test === 'correlation' ? 4 : 2;
  const nMax = 300;
  const powerFn = (n: number) => (x: number) => directionalPower(test, n, x, alpha, groups);

  const mdeCache = new Map<number, number>();
  const mdeAt = (n: number): number => {
    let v = mdeCache.get(n);
    if (v === undefined) {
      v = minDetectableEffect(powerFn(n), targetPower, test);
      mdeCache.set(n, v);
    }
    return v;
  };
  const assuranceAt = (n: number, priorSd = sd) => truncNormalSurvival(mdeAt(n), mean, priorSd, support);

  const nodes = priorNodes(mean, sd, support, 41);
  const assuranceCurve: BayesianAssuranceResult['assuranceCurve'] = [];
  const lower: Array<{ x: number; y: number }> = [];
  const upper: Array<{ x: number; y: number }> = [];
  for (let n = 10; n <= nMax; n += 10) {
    const a = assuranceAt(n);
    assuranceCurve.push({ n, assurance: a, expectedPower: expectedPowerOver(powerFn(n), nodes) });
    const aLo = assuranceAt(n, sd * 0.75);
    const aHi = assuranceAt(n, sd * 1.25);
    lower.push({ x: n, y: Math.min(a, aLo, aHi) });
    upper.push({ x: n, y: Math.max(a, aLo, aHi) });
  }

  const found = smallestN(nMin, nMax, (n) => assuranceAt(n) >= targetAssurance);
  const reached = found !== null;
  const requiredN = found ?? nMax;
  const expectedPowerAtN = expectedPowerOver(powerFn(requiredN), nodes);

  // Prior density for display (truncated to the valid range of the effect size)
  const priorDistribution: Array<{ effectSize: number; density: number }> = [];
  if (sd > 0) {
    const lo = Math.max(support.lower, mean - 4 * sd);
    const hi = Math.min(support.upper, mean + 4 * sd);
    const z = normCdf(support.upper, mean, sd) - normCdf(support.lower, mean, sd);
    if (hi > lo && z > 0) {
      for (let i = 0; i <= 80; i++) {
        const x = lo + ((hi - lo) * i) / 80;
        priorDistribution.push({ effectSize: x, density: jStat.normal.pdf(x, mean, sd) / z });
      }
    }
  } else {
    priorDistribution.push({ effectSize: mean, density: 1 });
  }

  let frequentistN = NaN;
  try {
    frequentistN = calculateRequiredSampleSize(mean, targetPower, alpha, test, groups);
  } catch {
    frequentistN = NaN;
  }

  const unit = test === 'correlation' ? 'in total' : 'per group';
  const label = test === 'permanova' ? 'R²' : test === 'correlation' ? 'r' : test === 'anova' ? 'f' : 'd';
  const digits = test === 'permanova' ? 3 : 2;
  const priorText = `${label}: mean=${mean.toFixed(digits)}, SD=${sd.toFixed(digits)}`;
  let summary: string;
  if (reached) {
    summary = `With uncertainty in effect size (${priorText}), you need ${requiredN} ${unit} for a ${pct(targetAssurance)} probability that power is at least ${pct(targetPower)}. Expected power at this sample size, averaged over the prior, is ${pct(expectedPowerAtN)}.`;
  } else {
    summary = `Target not reached: even with ${nMax} ${unit}, the probability that power reaches ${pct(targetPower)} is only ${pct(assuranceAt(nMax))} (target ${pct(targetAssurance)}) under the prior (${priorText}). The prior puts too much weight on small or null effects; consider a more informative prior, a lower target, or a larger study.`;
  }
  if (Number.isFinite(frequentistN)) {
    summary += ` A conventional power analysis at the prior mean suggests ${frequentistN} ${unit}`;
    summary += reached
      ? `; allowing for uncertainty changes the requirement by ${Math.round(((requiredN - frequentistN) / frequentistN) * 100)}%.`
      : '.';
  } else {
    summary += ` A conventional power analysis at the prior mean cannot reach ${pct(targetPower)} power (the prior mean effect is zero, negative or outside the valid range).`;
  }
  if (test === 'permanova') {
    summary += ' Accounting for uncertainty is especially important in microbiome studies with high variability.';
  }

  return {
    requiredN,
    reached,
    maxSearchN: nMax,
    expectedPowerAtN,
    frequentistN,
    assuranceCurve,
    confidenceRegions: { lower, upper },
    priorDistribution,
    summary,
  };
};

// ============= PRIOR ELICITATION =============

/**
 * Prior elicitation: Convert user beliefs into prior distributions
 */
export interface PriorElicitationInput {
  method: 'quantile' | 'literature' | 'bounds';

  // For quantile method
  lowerQuantile?: { value: number; percentile: number };
  upperQuantile?: { value: number; percentile: number };

  // For literature method
  publishedEffects?: number[];

  // For bounds method
  optimisticEffect?: number;
  pessimisticEffect?: number;
  mostLikely?: number;
}

export interface PriorElicitationResult {
  distribution: 'normal' | 'beta' | 't';
  parameters: { mean: number; sd: number } | { alpha: number; beta: number };
  densityCurve: Array<{x: number; y: number}>;
  summaryStats: { median: number; mode: number; ci95: [number, number] };
}

const gridCurve = (lo: number, hi: number, f: (x: number) => number, points = 100) => {
  const curve: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= points; i++) {
    const x = lo + ((hi - lo) * i) / points;
    curve.push({ x, y: f(x) });
  }
  return curve;
};

const normalPriorResult = (mean: number, sd: number): PriorElicitationResult => {
  const hi = mean + 4 * sd;
  // Effect sizes are usually positive: start the plot at zero unless the prior lies mostly below it
  const lo = Math.max(0, mean - 4 * sd) < hi ? Math.max(0, mean - 4 * sd) : mean - 4 * sd;
  return {
    distribution: 'normal',
    parameters: { mean, sd },
    densityCurve: gridCurve(lo, hi, (x) => jStat.normal.pdf(x, mean, sd)),
    summaryStats: { median: mean, mode: mean, ci95: [mean - 1.96 * sd, mean + 1.96 * sd] },
  };
};

/**
 * Elicit a prior distribution from user beliefs. Throws an Error with a user-readable message on invalid input.
 *
 * Quantile method: "I'm 90% sure the effect is between X and Y", fit a Normal to the two quantiles.
 * Literature method: mean and SD of published effects (at least two, with some spread).
 * Bounds method: PERT distribution (Beta on [pessimistic, optimistic]); its mean and SD are
 * returned as Normal parameters for use by the calculators.
 */
export const elicitPrior = (input: PriorElicitationInput): PriorElicitationResult => {
  if (input.method === 'quantile') {
    const lq = input.lowerQuantile;
    const uq = input.upperQuantile;
    if (!lq || !uq) throw new Error('Both quantiles are required');
    if (!(lq.percentile > 0 && lq.percentile < 100 && uq.percentile > 0 && uq.percentile < 100)) {
      throw new Error('Percentiles must be strictly between 0 and 100');
    }
    if (!(uq.percentile > lq.percentile)) throw new Error('The upper percentile must be larger than the lower percentile');
    if (!(uq.value > lq.value)) throw new Error('The upper value must be larger than the lower value');
    // Q_p1 = mu + z_p1 * sigma and Q_p2 = mu + z_p2 * sigma
    const zLow = jStat.normal.inv(lq.percentile / 100, 0, 1);
    const zHigh = jStat.normal.inv(uq.percentile / 100, 0, 1);
    const sigma = (uq.value - lq.value) / (zHigh - zLow);
    const mu = lq.value - zLow * sigma;
    return normalPriorResult(mu, sigma);
  }

  if (input.method === 'literature') {
    const effects = (input.publishedEffects ?? []).filter((x) => Number.isFinite(x));
    if (effects.length < 2) throw new Error('Enter at least two published effect sizes');
    const n = effects.length;
    const mean = effects.reduce((a, b) => a + b, 0) / n;
    const variance = effects.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (n - 1);
    const sd = Math.sqrt(variance);
    if (!(sd > 0)) throw new Error('The published effects are identical, so their spread cannot be estimated');
    return normalPriorResult(mean, sd);
  }

  if (input.method === 'bounds') {
    const min = input.pessimisticEffect;
    const max = input.optimisticEffect;
    const mode = input.mostLikely;
    if (min == null || max == null || mode == null || ![min, max, mode].every(Number.isFinite)) {
      throw new Error('Pessimistic, most likely and optimistic values are required');
    }
    if (!(max > min)) throw new Error('The optimistic value must be larger than the pessimistic value');
    if (!(mode >= min && mode <= max)) throw new Error('The most likely value must lie between the pessimistic and optimistic values');
    const range = max - min;
    const a = 1 + (4 * (mode - min)) / range;
    const b = 1 + (4 * (max - mode)) / range;
    const mean = (min + 4 * mode + max) / 6;
    const sd = range * Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1)));
    return {
      distribution: 'normal',
      parameters: { mean, sd },
      densityCurve: gridCurve(min, max, (x) => jStat.beta.pdf((x - min) / range, a, b) / range),
      summaryStats: {
        median: min + range * jStat.beta.inv(0.5, a, b),
        mode,
        ci95: [min + range * jStat.beta.inv(0.025, a, b), min + range * jStat.beta.inv(0.975, a, b)],
      },
    };
  }

  throw new Error('Unknown elicitation method');
};

// ============= 1. BAYESIAN SEQUENTIAL DESIGN =============

export interface BayesianSequentialInput {
  effectSizePrior: { mean: number; sd: number };
  targetPower: number;
  alpha: number;
  testType: 'ttest' | 'anova' | 'correlation';
  groups?: number;
  maxN: number;
  /** Number of interim analyses before the final analysis at maxN */
  interimLooks: number;
  stoppingRule: 'futility' | 'superiority' | 'both';
  /** Stop for futility when the predictive probability of final success is at or below this value */
  futilityThreshold: number;
  /** Stop and declare success when the predictive probability of final success is at or above this value */
  superiorityThreshold: number;
}

export interface BayesianSequentialResult {
  expectedN: number;
  maxN: number;
  interimSampleSizes: number[];
  stoppingProbabilities: Array<{
    look: number;
    n: number;
    stopFutility: number;
    stopSuperiority: number;
    continue: number;
  }>;
  savings: {
    percentReduction: number;
    comparedToFixed: number;
  };
  operatingCharacteristics: {
    powerUnderPrior: number;
    averageN: number;
    typeIError: number;
  };
  chart: Array<{ n: number; stopProb: number; continueProb: number }>;
  summary: string;
}

/**
 * Group-sequential design with Bayesian predictive-probability stopping (Lee & Liu 2008 style).
 *
 * The test statistic is simulated as a Brownian motion on the information scale
 * (t-test: I = n/2 with drift d; correlation: I = n - 3 with drift atanh(r);
 * ANOVA: I = n per group, a (k-1)-dimensional motion with drift norm f*sqrt(k)).
 * The effect-size prior is the design prior: it generates the simulated trials. At each interim look the
 * predictive probability (PP) that the final analysis at maxN is significant is computed under a
 * non-informative analysis prior, so the stopping decisions depend on the data only (a strong design
 * prior would otherwise make trials stop for success even when there is no effect). The trial stops for success if PP >= superiorityThreshold
 * and for futility if PP <= futilityThreshold. Power under the prior and the type I error (drift = 0)
 * are estimated by simulation with a seeded PRNG.
 */
export const calculateBayesianSequential = (
  params: BayesianSequentialInput
): BayesianSequentialResult => {
  const { maxN, interimLooks, stoppingRule, futilityThreshold, superiorityThreshold, alpha, testType: test } = params;
  validateCommon(alpha);
  if (!(maxN > 0) || !(interimLooks >= 1) || interimLooks > maxN / 2) {
    throw new Error('Invalid parameters: maxN must be positive and interimLooks reasonable');
  }
  if (!(futilityThreshold >= 0 && futilityThreshold <= 1 && superiorityThreshold >= 0 && superiorityThreshold <= 1)) {
    throw new Error('Thresholds must be between 0 and 1');
  }
  if (stoppingRule === 'both' && !(futilityThreshold < superiorityThreshold)) {
    throw new Error('The futility threshold must be below the superiority threshold');
  }
  if (!(params.effectSizePrior.sd >= 0)) throw new Error('Prior SD cannot be negative');
  const k = params.groups ?? 2;
  if (test === 'anova' && !(k >= 2)) throw new Error('At least 2 groups are required');

  const nMin = test === 'correlation' ? 5 : 3;
  if (maxN < nMin) throw new Error(`maxN must be at least ${nMin}`);
  const looks: number[] = [];
  for (let i = 1; i <= interimLooks; i++) {
    const n = Math.max(nMin - 1, Math.floor((maxN * i) / (interimLooks + 1)));
    if (n < maxN && (looks.length === 0 || n > looks[looks.length - 1])) looks.push(n);
  }
  looks.push(maxN);
  const lastLook = looks.length - 1;

  const info = (n: number) => (test === 'ttest' ? n / 2 : test === 'correlation' ? n - 3 : n);
  const dim = test === 'anova' ? k - 1 : 1;
  const T = info(maxN);

  // Design prior for the drift on the information scale
  const { mean, sd } = params.effectSizePrior;
  let m0: number;
  let s0: number;
  if (test === 'ttest') {
    m0 = mean;
    s0 = sd;
  } else if (test === 'correlation') {
    const r = clamp(mean, -0.99, 0.99);
    m0 = Math.atanh(r);
    s0 = sd / (1 - r * r);
  } else {
    m0 = Math.max(0, mean) * Math.sqrt(k);
    s0 = sd * Math.sqrt(k);
  }

  // Final critical value on the statistic scale
  let crit: number;
  if (test === 'ttest') crit = tCrit(2 * maxN - 2, alpha);
  else if (test === 'correlation') crit = zCrit(alpha);
  else crit = (k - 1) * fCrit(k - 1, maxN * k - k, alpha); // chi-square scale, |S|^2 / I > crit

  const predictiveProb = (S: number[], I: number): number => {
    const R = T - I;
    if (R <= 0) return 0;
    if (dim === 1) {
      const v = 1 / I;
      const m = S[0] / I;
      const sdPred = Math.sqrt(R + R * R * v);
      return 1 - jStat.normal.cdf((crit * Math.sqrt(T) - S[0] - m * R) / sdPred, 0, 1);
    }
    // ANOVA: the drift norm has an approximately Normal posterior (estimate with variance 1/I);
    // the predictive probability integrates the conditional power over it with Gauss-Hermite
    // quadrature, keeping the observed direction of the group differences.
    const norm2 = S.reduce((a, x) => a + x * x, 0);
    const norm = Math.sqrt(norm2);
    const dHat = Math.sqrt(Math.max(0, norm2 - dim * I)) / I;
    const m = dHat;
    const sdPost = Math.sqrt(1 / I);
    let pp = 0;
    for (let q = 0; q < GH_NODES.length; q++) {
      const delta = Math.max(0, m + sdPost * GH_NODES[q]);
      const ncp = (norm + delta * R) ** 2 / R;
      pp += GH_WEIGHTS[q] * (1 - nonCentralChiSquareCDF((crit * T) / R, dim, ncp));
    }
    return clamp01(pp);
  };

  const useFut = stoppingRule === 'futility' || stoppingRule === 'both';
  const useSup = stoppingRule === 'superiority' || stoppingRule === 'both';

  const simulate = (drawDrift: () => number, rng: Rng, nSims: number) => {
    const fut = looks.map(() => 0);
    const sup = looks.map(() => 0);
    let totalN = 0;
    let successes = 0;
    const S = new Array<number>(dim).fill(0);
    for (let sim = 0; sim < nSims; sim++) {
      const d = drawDrift();
      S.fill(0);
      let iPrev = 0;
      for (let j = 0; j < looks.length; j++) {
        const I = info(looks[j]);
        const dI = I - iPrev;
        iPrev = I;
        const sdI = Math.sqrt(dI);
        S[0] += d * dI + rng.normal(0, sdI);
        for (let c = 1; c < dim; c++) S[c] += rng.normal(0, sdI);
        if (j === lastLook) {
          const success =
            dim === 1 ? S[0] / Math.sqrt(I) > crit : S.reduce((a, x) => a + x * x, 0) / I > crit;
          if (success) {
            sup[j]++;
            successes++;
          } else {
            fut[j]++;
          }
          totalN += looks[j];
          break;
        }
        const pp = predictiveProb(S, I);
        if (useSup && pp >= superiorityThreshold) {
          sup[j]++;
          successes++;
          totalN += looks[j];
          break;
        }
        if (useFut && pp <= futilityThreshold) {
          fut[j]++;
          totalN += looks[j];
          break;
        }
      }
    }
    return { fut, sup, expectedN: totalN / nSims, power: successes / nSims };
  };

  const nSims = test === 'anova' ? 1000 : 2000;
  const rngPrior = createRng(params, 'sequential-prior');
  const drawPrior = (): number => {
    if (!(s0 > 0)) return m0;
    if (test !== 'anova') return rngPrior.normal(m0, s0);
    // Cohen's f prior truncated at zero (rejection sampling, then fallback to the boundary)
    for (let t = 0; t < 100; t++) {
      const x = rngPrior.normal(m0, s0);
      if (x >= 0) return x;
    }
    return 0;
  };
  const underPrior = simulate(drawPrior, rngPrior, nSims);
  const underNull = simulate(() => 0, createRng(params, 'sequential-null'), nSims);

  let cumulative = 0;
  const stoppingProbs = looks.map((n, j) => {
    const stopFutility = underPrior.fut[j] / nSims;
    const stopSuperiority = underPrior.sup[j] / nSims;
    cumulative += stopFutility + stopSuperiority;
    return {
      look: j + 1,
      n,
      stopFutility,
      stopSuperiority,
      continue: j === lastLook ? 0 : Math.max(0, 1 - cumulative),
    };
  });

  const chart = stoppingProbs.map((sp) => ({
    n: sp.n,
    stopProb: sp.stopFutility + sp.stopSuperiority,
    continueProb: sp.continue,
  }));

  const expectedN = underPrior.expectedN;
  const percentReduction = ((maxN - expectedN) / maxN) * 100;
  const unit = test === 'correlation' ? 'in total' : 'per group';

  const summary = `Sequential design with ${looks.length - 1} interim ${looks.length - 1 === 1 ? 'analysis' : 'analyses'} plus a final analysis at n=${maxN}: expected sample size ${Math.round(expectedN)} ${unit}, a saving of about ${Math.round(percentReduction)}% versus the fixed design. Probability of declaring success under the prior: ${pct(underPrior.power, 1)}. Simulated type I error (no true effect): ${pct(underNull.power, 1)} (nominal ${pct(alpha, 1)}${underNull.power > alpha * 1.2 ? '; early success stopping inflates it, so raise the superiority threshold' : ''}).`;

  return {
    expectedN: Math.round(expectedN),
    maxN,
    interimSampleSizes: looks,
    stoppingProbabilities: stoppingProbs,
    savings: {
      percentReduction,
      comparedToFixed: maxN,
    },
    operatingCharacteristics: {
      powerUnderPrior: underPrior.power,
      averageN: expectedN,
      typeIError: underNull.power,
    },
    chart,
    summary,
  };
};

// ============= 2. BAYESIAN REPLICATION CRISIS =============

export interface ReplicationCrisisInput {
  publishedEffect: number;
  /** Per group for t-test and ANOVA, total for correlation */
  publishedN: number;
  publishedP: number;
  testType: 'ttest' | 'anova' | 'correlation';
  groups?: number;
  alpha: number;
  /** Per group for t-test and ANOVA, total for correlation */
  replicationN: number;
  publicationBias: 'none' | 'mild' | 'moderate' | 'severe';
  priorSkepticism: 'optimistic' | 'moderate' | 'skeptical';
}

export interface ReplicationCrisisResult {
  replicationProbability: number;
  shrinkageFactor: number;
  adjustedEffectSize: { mean: number; sd: number; ci95: [number, number] };
  powerForReplication: number;
  recommendations: {
    /** Infinity if 80% power cannot be reached at the adjusted effect */
    minNForAdequatePower: number;
    shouldReplicate: boolean;
    reasoning: string;
  };
  chart: Array<{
    trueEffect: number;
    replicationProb: number;
    posteriorDensity: number;
  }>;
  summary: string;
}

/**
 * Replication planning with a bias-adjusted prior.
 *
 * Prior: centred on the published effect deflated by a Type M (exaggeration) factor for the chosen
 * publication-bias level, with spread set by the skepticism level.
 * Likelihood: the published estimate with its standard error (from the sample size for t-tests and
 * correlations, from the p-value for ANOVA). The posterior is Normal (conjugate update).
 * Replication probability = expected power of the replication under the posterior.
 */
export const calculateReplicationProbability = (
  params: ReplicationCrisisInput
): ReplicationCrisisResult => {
  const { publishedEffect: est, publishedN, publishedP, testType: test, alpha, replicationN } = params;
  validateCommon(alpha);
  if (est <= 0 || publishedN <= 0 || replicationN <= 0) {
    throw new Error('Invalid parameters: effect size and sample sizes must be positive');
  }
  if (!(publishedP > 0 && publishedP < 1)) throw new Error('The published p-value must be between 0 and 1');
  if (test === 'correlation' && !(est < 1)) throw new Error('A correlation must be below 1');
  if (test === 'correlation' && publishedN <= 3) throw new Error('A correlation needs a sample size above 3');
  const k = params.groups ?? 2;
  if (test === 'anova' && !(k >= 2)) throw new Error('At least 2 groups are required');

  // Standard error of the published estimate
  let publishedSE: number;
  if (test === 'ttest') {
    publishedSE = Math.sqrt(2 / publishedN + (est * est) / (4 * publishedN));
  } else if (test === 'correlation') {
    publishedSE = (1 - est * est) / Math.sqrt(publishedN - 3);
  } else {
    const z = jStat.normal.inv(1 - publishedP / 2, 0, 1);
    publishedSE = est / Math.max(z, 1e-6);
  }

  // Type M (exaggeration) factor for the assumed publication bias
  const typeMFactor = {
    none: 1.0,
    mild: 1.2,      // 20% inflation
    moderate: 1.5,  // 50% inflation (typical in many fields)
    severe: 2.2,    // 120% inflation (extreme publication bias)
  }[params.publicationBias];

  const deflated = est / typeMFactor;
  const skepticismPrior = {
    optimistic: { mean: deflated * 1.1, sd: deflated * 0.3 },
    moderate: { mean: deflated, sd: deflated * 0.5 },
    skeptical: { mean: deflated * 0.7, sd: deflated * 0.6 },
  }[params.priorSkepticism];

  const dataPrecision = 1 / (publishedSE * publishedSE);
  const priorPrecision = 1 / (skepticismPrior.sd * skepticismPrior.sd);
  const posteriorPrecision = priorPrecision + dataPrecision;
  const posteriorMean = (priorPrecision * skepticismPrior.mean + dataPrecision * est) / posteriorPrecision;
  const posteriorSD = Math.sqrt(1 / posteriorPrecision);
  const shrinkageFactor = posteriorMean / est;

  const effTest: EffectTest = test;
  const support = supportFor(effTest);
  const powerFn = (x: number) => directionalPower(effTest, replicationN, x, alpha, k);
  const nodes = priorNodes(posteriorMean, posteriorSD, support, 61);
  const replicationProbability = expectedPowerOver(powerFn, nodes);

  const chart: ReplicationCrisisResult['chart'] = [];
  const top = test === 'correlation' ? Math.min(0.99, est * 1.5) : est * 1.5;
  for (let i = 0; i <= 50; i++) {
    const es = (top * i) / 50;
    chart.push({
      trueEffect: es,
      replicationProb: powerFn(es),
      posteriorDensity: jStat.normal.pdf(es, posteriorMean, posteriorSD),
    });
  }

  const powerForReplication = powerFn(posteriorMean);

  let minNForAdequatePower = Infinity;
  if (posteriorMean > 0) {
    const effect = test === 'correlation' ? Math.min(0.99, posteriorMean) : posteriorMean;
    const req = calculateRequiredSampleSize(effect, 0.8, alpha, test, k);
    minNForAdequatePower = Number.isFinite(req) ? req : Infinity;
  }

  const minMeaningful = test === 'correlation' ? 0.1 : test === 'anova' ? 0.1 : 0.2;
  const shouldReplicate = replicationProbability > 0.5 && posteriorMean > minMeaningful;
  const reasoning = shouldReplicate
    ? `With ${pct(replicationProbability)} replication probability and adjusted effect size of ${posteriorMean.toFixed(2)}, replication is worthwhile.`
    : `Low replication probability (${pct(replicationProbability)}) or a small adjusted effect (${posteriorMean.toFixed(2)}) suggests high risk of failure. Consider a larger replication or a pilot study first.`;

  const change = Math.abs(1 - shrinkageFactor) * 100;
  const direction = shrinkageFactor <= 1 ? 'smaller' : 'larger';
  const unit = test === 'correlation' ? 'in total' : 'per group';
  const nText = Number.isFinite(minNForAdequatePower)
    ? `${minNForAdequatePower} ${unit}`
    : 'not reachable at the adjusted effect';
  const summary = `After adjusting for ${params.publicationBias} publication bias, the estimated effect is ${posteriorMean.toFixed(2)} (95% CI: ${(posteriorMean - 1.96 * posteriorSD).toFixed(2)} to ${(posteriorMean + 1.96 * posteriorSD).toFixed(2)}), ${change.toFixed(0)}% ${direction} than the published ${est.toFixed(2)}. Replication probability with N=${replicationN} ${unit}: ${pct(replicationProbability)}. Recommended N for 80% power at the adjusted effect: ${nText}.`;

  return {
    replicationProbability,
    shrinkageFactor,
    adjustedEffectSize: {
      mean: posteriorMean,
      sd: posteriorSD,
      ci95: [posteriorMean - 1.96 * posteriorSD, posteriorMean + 1.96 * posteriorSD],
    },
    powerForReplication,
    recommendations: {
      minNForAdequatePower,
      shouldReplicate,
      reasoning,
    },
    chart,
    summary,
  };
};

// ============= 3. BAYESIAN INFORMATION-BASED DESIGN =============

export interface InformationBasedDesignInput {
  priorUncertainty: { mean: number; sd: number };
  designs: Array<{
    name: string;
    nPerGroup: number;
    measurementError: number;
    cost: number;
  }>;
  testType: 'ttest' | 'anova';
  groups?: number;
  objective: 'maximize-info' | 'cost-benefit' | 'minimize-uncertainty';
}

export interface InformationBasedDesignResult {
  rankedDesigns: Array<{
    name: string;
    expectedInfo: number;
    posteriorSD: number;
    uncertaintyReduction: number;
    costPerInfo: number;
    rank: number;
    recommendation: string;
  }>;
  optimalDesign: string;
  chart: Array<{
    design: string;
    info: number;
    cost: number;
    /** Information per unit cost */
    efficiency: number;
  }>;
  summary: string;
}

export const calculateInformationBasedDesign = (
  params: InformationBasedDesignInput
): InformationBasedDesignResult => {
  if (params.designs.length === 0) {
    throw new Error('At least one design must be provided');
  }
  if (!(params.priorUncertainty.sd > 0)) throw new Error('Prior SD must be positive');
  for (const d of params.designs) {
    if (!(d.nPerGroup > 0) || !(d.measurementError > 0) || !(d.cost > 0)) {
      throw new Error(`Design "${d.name}" needs a positive sample size, measurement error and cost`);
    }
  }

  const priorVar = params.priorUncertainty.sd * params.priorUncertainty.sd;

  const designAnalyses = params.designs.map((design) => {
    const measurementVar = design.measurementError * design.measurementError;

    let fisherInfo: number;
    if (params.testType === 'ttest') {
      // Difference of two means, n per group: Var = 2 sigma^2 / n, so I = n / (2 sigma^2)
      fisherInfo = design.nPerGroup / (2 * measurementVar);
    } else {
      // One group mean (or contrast with a known reference): I = n / sigma^2
      fisherInfo = design.nPerGroup / measurementVar;
    }

    const posteriorVar = 1 / (1 / priorVar + fisherInfo);
    const posteriorSD = Math.sqrt(posteriorVar);
    const uncertaintyReduction = ((params.priorUncertainty.sd - posteriorSD) / params.priorUncertainty.sd) * 100;
    const expectedInfo = fisherInfo;
    const costPerInfo = design.cost / expectedInfo;

    let recommendation: string;
    if (uncertaintyReduction > 70) recommendation = 'Excellent, dramatically reduces uncertainty';
    else if (uncertaintyReduction > 50) recommendation = 'Good, substantial information gain';
    else if (uncertaintyReduction > 30) recommendation = 'Moderate, reasonable information gain';
    else recommendation = 'Limited, minimal information gain';

    return {
      name: design.name,
      expectedInfo,
      posteriorSD,
      uncertaintyReduction,
      costPerInfo,
      rank: 0,
      recommendation,
      cost: design.cost,
    };
  });

  const sorted = [...designAnalyses];
  if (params.objective === 'maximize-info') sorted.sort((a, b) => b.expectedInfo - a.expectedInfo);
  else if (params.objective === 'cost-benefit') sorted.sort((a, b) => a.costPerInfo - b.costPerInfo);
  else sorted.sort((a, b) => a.posteriorSD - b.posteriorSD);

  const rankedDesigns = sorted.map((d, i) => ({
    name: d.name,
    expectedInfo: d.expectedInfo,
    posteriorSD: d.posteriorSD,
    uncertaintyReduction: d.uncertaintyReduction,
    costPerInfo: d.costPerInfo,
    rank: i + 1,
    recommendation: d.recommendation,
  }));

  const optimalDesign = rankedDesigns[0].name;

  const chart = sorted.map((d) => ({
    design: d.name,
    info: d.expectedInfo,
    cost: d.cost,
    efficiency: d.expectedInfo / d.cost,
  }));

  const best = rankedDesigns[0];
  const summary = `Optimal design: ${optimalDesign} (${params.objective}). This design reduces uncertainty by ${best.uncertaintyReduction.toFixed(0)}% (from SD=${params.priorUncertainty.sd.toFixed(2)} to SD=${best.posteriorSD.toFixed(2)}). Expected Fisher information: ${best.expectedInfo.toFixed(1)}.`;

  return { rankedDesigns, optimalDesign, chart, summary };
};

// ============= 4. BAYESIAN HIERARCHICAL POWER =============

export interface HierarchicalPowerInput {
  effectSizePrior: { mean: number; sd: number };
  /** Clusters per group (treatment arm) */
  nClusters: number;
  nPerCluster: number;
  icc: number;
  iccUncertainty: number;
  testType: 'ttest' | 'anova';
  groups?: number;
  targetPower: number;
  alpha: number;
  /** Required probability that power reaches targetPower (default 0.8) */
  targetAssurance?: number;
}

export interface HierarchicalPowerResult {
  /** Clusters per group */
  requiredClusters: number;
  /** false if the target assurance is not reached by maxClusters (requiredClusters is then the cap) */
  reached: boolean;
  maxClusters: number;
  requiredPerCluster: number;
  /** Total observations across all groups */
  totalN: number;
  /** Probability that power reaches the target with the entered number of clusters */
  assurance: number;
  /** Effective sample size per group with the entered design (at the mean ICC) */
  effectiveN: number;
  designEffect: { mean: number; ci95: [number, number] };
  comparison: {
    /** Required n per group ignoring clustering (conventional, at the prior mean) */
    naiveN: number;
    /** Factor by which clustering inflates the required number of observations (design effect) */
    inflationFactor: number;
  };
  sensitivityToICC: Array<{
    icc: number;
    /** Clusters per group needed at the prior mean effect (NaN if not reachable) */
    requiredClusters: number;
    designEffect: number;
  }>;
  summary: string;
}

/** Quadrature nodes for a Beta prior on the ICC matched to mean and SD (method of moments). */
const iccPrior = (mu: number, sd: number, k = 20) => {
  if (!(sd > 0) || mu <= 0) {
    return { nodes: [{ x: mu, w: 1 }], quantile: () => mu };
  }
  const maxVar = 0.99 * mu * (1 - mu);
  const variance = Math.min(sd * sd, maxVar);
  const c = (mu * (1 - mu)) / variance - 1;
  const a = mu * c;
  const b = (1 - mu) * c;
  const quantile = (p: number) => clamp01(jStat.beta.inv(p, a, b));
  const nodes = Array.from({ length: k }, (_, i) => ({ x: quantile((i + 0.5) / k), w: 1 / k }));
  return { nodes, quantile };
};

/**
 * Cluster-randomised design with uncertainty in both the effect size and the ICC.
 * Effective n per group = clusters * nPerCluster / (1 + (nPerCluster - 1) * ICC).
 * Assurance = P(power >= target) averaged over the Beta ICC prior (exact in the effect-size dimension).
 */
export const calculateHierarchicalPower = (
  params: HierarchicalPowerInput
): HierarchicalPowerResult => {
  const { icc, iccUncertainty, nClusters, nPerCluster, targetPower, alpha } = params;
  validateCommon(alpha);
  if (icc < 0 || icc >= 1) {
    throw new Error('ICC must be between 0 and 1');
  }
  if (nClusters <= 0 || nPerCluster <= 0) {
    throw new Error('Number of clusters and observations per cluster must be positive');
  }
  if (!(iccUncertainty >= 0)) throw new Error('ICC uncertainty cannot be negative');
  if (!(targetPower > alpha && targetPower < 1)) throw new Error('Target power must be between alpha and 1');
  const targetAssurance = params.targetAssurance ?? 0.8;
  const test: EffectTest = params.testType;
  const k = test === 'anova' ? params.groups ?? 0 : 2;
  if (!(k >= 2)) throw new Error('At least 2 groups are required');

  const { mean, sd } = params.effectSizePrior;
  const support = supportFor(test);
  const m = nPerCluster;
  const deOf = (rho: number) => 1 + (m - 1) * rho;
  const designEffectMean = deOf(icc);
  const effectiveN = (nClusters * m) / designEffectMean;
  const prior = iccPrior(icc, iccUncertainty);
  const maxClusters = 1000;

  const powerFn = (n: number) => (x: number) => directionalPower(test, n, x, alpha, k);
  const assuranceAt = (nc: number): number =>
    prior.nodes.reduce((acc, nd) => {
      const effN = (nc * m) / deOf(nd.x);
      const mde = minDetectableEffect(powerFn(effN), targetPower, test);
      return acc + nd.w * truncNormalSurvival(mde, mean, sd, support);
    }, 0);

  const assurance = assuranceAt(nClusters);
  const found = smallestN(2, maxClusters, (nc) => assuranceAt(nc) >= targetAssurance);
  const reached = found !== null;
  const requiredClusters = found ?? maxClusters;

  let naiveN = NaN;
  try {
    naiveN = calculateRequiredSampleSize(mean, targetPower, alpha, test, k);
  } catch {
    naiveN = NaN;
  }

  const sensitivityToICC: HierarchicalPowerResult['sensitivityToICC'] = [];
  for (let i = 0; i <= 10; i++) {
    const rho = Math.round(i * 5) / 100;
    const de = deOf(rho);
    const nc = mean > 0
      ? smallestN(2, maxClusters, (c) => directionalPower(test, (c * m) / de, mean, alpha, k) >= targetPower)
      : null;
    sensitivityToICC.push({ icc: rho, requiredClusters: nc ?? NaN, designEffect: Math.round(de * 1e6) / 1e6 });
  }

  const deLower = deOf(prior.quantile(0.025));
  const deUpper = deOf(prior.quantile(0.975));
  const inflationFactor = designEffectMean;
  const totalN = requiredClusters * m * k;

  const head = reached
    ? `For a hierarchical design with ICC=${icc.toFixed(2)} (SD ${iccUncertainty.toFixed(2)}), you need ${requiredClusters} clusters per group with ${m} per cluster (total N=${totalN} across ${k} groups) for a ${pct(targetAssurance)} probability that power is at least ${pct(targetPower)}.`
    : `Target not reached: even ${maxClusters} clusters per group with ${m} per cluster do not give a ${pct(targetAssurance)} probability that power reaches ${pct(targetPower)}; the effect-size prior puts too much weight on small effects.`;
  const summary = `${head} With the entered ${nClusters} clusters per group this probability is ${pct(assurance)}. Design effect: ${designEffectMean.toFixed(2)} (95% range: ${deLower.toFixed(2)} to ${deUpper.toFixed(2)}), so clustering multiplies the number of observations needed by ${inflationFactor.toFixed(2)}. Effective N per group with the entered design: ${Math.round(effectiveN)}.`;

  return {
    requiredClusters,
    reached,
    maxClusters,
    requiredPerCluster: m,
    totalN,
    assurance,
    effectiveN: Math.round(effectiveN),
    designEffect: { mean: designEffectMean, ci95: [deLower, deUpper] },
    comparison: {
      naiveN,
      inflationFactor,
    },
    sensitivityToICC,
    summary,
  };
};

// ============= 5. BAYESIAN ADAPTIVE ALLOCATION =============

export interface AdaptiveAllocationInput {
  treatments: string[];
  /** Prior for each treatment's mean outcome, in units of the outcome SD */
  priors: Array<{ mean: number; sd: number }>;
  maxN: number;
  targetPower: number;
  alpha: number;
  allocationRule: 'equal' | 'thompson' | 'optimal';
  testType: 'anova';
}

export interface AdaptiveAllocationResult {
  expectedAllocations: Array<{ treatment: string; n: number; proportion: number }>;
  /** ANOVA power at the prior means with the expected adaptive allocation */
  expectedPower: number;
  comparisonToEqual: {
    /** Relative change in power versus equal allocation, in percent */
    powerGain: number;
    ethicalBenefit: string;
  };
  allocationCurve: Array<{
    stage: number;
    allocations: { [treatment: string]: number };
  }>;
  summary: string;
}

/** ANOVA power with unequal group sizes: lambda = sum n_i (mu_i - weighted mean)^2 / sigma^2 with sigma = 1. */
const unequalAnovaPower = (ns: number[], mus: number[], alpha: number): number => {
  const N = ns.reduce((a, b) => a + b, 0);
  const k = ns.length;
  if (!(N > k)) return 0;
  const grand = ns.reduce((a, n, i) => a + n * mus[i], 0) / N;
  const lambda = ns.reduce((a, n, i) => a + n * (mus[i] - grand) ** 2, 0);
  return noncentralFPower(lambda, k - 1, N - k, fCrit(k - 1, N - k, alpha));
};

export const calculateAdaptiveAllocation = (
  params: AdaptiveAllocationInput
): AdaptiveAllocationResult => {
  const K = params.treatments.length;
  validateCommon(params.alpha);
  if (K < 2) {
    throw new Error('At least 2 treatments required for adaptive allocation');
  }
  if (params.priors.length !== K) {
    throw new Error('Number of priors must match number of treatments');
  }
  if (!(params.maxN >= 2 * K)) throw new Error('The sample budget must allow at least 2 per treatment');
  if (!params.priors.every((p) => p.sd > 0)) throw new Error('Prior SDs must be positive');
  const keys = params.treatments.map((name, i) => (params.treatments.indexOf(name) === i ? name : `${name} (${i + 1})`));

  const nSims = 500;
  const maxN = Math.floor(params.maxN);
  const burnIn = Math.floor(maxN * 0.2);
  const stageEnds = Array.from({ length: 10 }, (_, s) => Math.floor((maxN * (s + 1)) / 10));
  const stageTotals = stageEnds.map(() => new Array<number>(K).fill(0));
  const allocationCounts = new Array<number>(K).fill(0);
  const rng = createRng(params, 'adaptive');

  for (let sim = 0; sim < nSims; sim++) {
    const trueEffects = params.priors.map((p) => rng.normal(p.mean, p.sd));
    const simAllocations = new Array<number>(K).fill(0);
    const posteriorMeans = params.priors.map((p) => p.mean);
    const posteriorSDs = params.priors.map((p) => p.sd);
    const sums = new Array<number>(K).fill(0);

    let stageIdx = 0;
    for (let n = 0; n < maxN; n++) {
      let selected = 0;
      if (n < burnIn || params.allocationRule === 'equal') {
        selected = n % K;
      } else if (params.allocationRule === 'thompson') {
        let best = -Infinity;
        for (let i = 0; i < K; i++) {
          const draw = rng.normal(posteriorMeans[i], posteriorSDs[i]);
          if (draw > best) {
            best = draw;
            selected = i;
          }
        }
      } else {
        selected = posteriorMeans.indexOf(Math.max(...posteriorMeans));
      }

      simAllocations[selected]++;
      sums[selected] += rng.normal(trueEffects[selected], 1.0);

      // Conjugate normal update with known outcome SD = 1
      const priorPrecision = 1 / params.priors[selected].sd ** 2;
      const count = simAllocations[selected];
      const postPrecision = priorPrecision + count;
      posteriorMeans[selected] = (priorPrecision * params.priors[selected].mean + sums[selected]) / postPrecision;
      posteriorSDs[selected] = Math.sqrt(1 / postPrecision);

      while (stageIdx < stageEnds.length && n + 1 === stageEnds[stageIdx]) {
        for (let i = 0; i < K; i++) stageTotals[stageIdx][i] += simAllocations[i];
        stageIdx++;
      }
    }
    for (let i = 0; i < K; i++) allocationCounts[i] += simAllocations[i];
  }

  const meanCounts = allocationCounts.map((c) => c / nSims);
  const expectedAllocations = params.treatments.map((name, i) => ({
    treatment: name,
    n: Math.round(meanCounts[i]),
    proportion: meanCounts[i] / maxN,
  }));

  const allocationCurve = stageEnds.map((_, s) => {
    const allocations: { [treatment: string]: number } = {};
    keys.forEach((key, i) => {
      allocations[key] = Math.round(stageTotals[s][i] / nSims);
    });
    return { stage: s + 1, allocations };
  });

  const mus = params.priors.map((p) => p.mean);
  const nPerGroup = maxN / K;
  const adaptivePower = unequalAnovaPower(meanCounts, mus, params.alpha);
  const equalPower = unequalAnovaPower(new Array<number>(K).fill(nPerGroup), mus, params.alpha);
  const powerGain = equalPower > 1e-9 ? ((adaptivePower - equalPower) / equalPower) * 100 : 0;

  const bestTreatment = expectedAllocations.reduce((best, curr) => (curr.n > best.n ? curr : best));
  const worstTreatment = expectedAllocations.reduce((worst, curr) => (curr.n < worst.n ? curr : worst));

  const ethicalBenefit = `${bestTreatment.treatment} receives ${bestTreatment.n} samples (most promising), while ${worstTreatment.treatment} receives only ${worstTreatment.n} (least promising). This limits exposure to inferior treatments.`;

  const summary = `Adaptive ${params.allocationRule} allocation assigns more samples to promising treatments. Best treatment receives ${bestTreatment.n} samples vs. ${Math.round(nPerGroup)} under equal allocation. ANOVA power at the prior means: ${pct(adaptivePower)} with this allocation vs. ${pct(equalPower)} with equal allocation (${powerGain > 0 ? '+' : ''}${powerGain.toFixed(0)}% relative). Unequal allocation usually costs some power for the overall test in exchange for more samples on the best treatment.`;

  return {
    expectedAllocations,
    expectedPower: adaptivePower,
    comparisonToEqual: {
      powerGain,
      ethicalBenefit,
    },
    allocationCurve,
    summary,
  };
};

// ============= 6. BAYESIAN EQUIVALENCE TESTING =============

export interface EquivalenceTestingInput {
  equivalenceMargin: number;
  priorEffect: { mean: number; sd: number };
  /** Posterior probability of lying inside the ROPE required to declare equivalence */
  targetProbability: number;
  testType: 'ttest' | 'correlation';
  alpha: number;
  /** Required probability that the study declares equivalence (default 0.8) */
  targetAssurance?: number;
}

export interface EquivalenceTestingResult {
  /** n per group (t-test) or total n (correlation) */
  requiredN: number;
  /** false if targetAssurance is not reached by maxSearchN (requiredN is then the cap) */
  reached: boolean;
  maxSearchN: number;
  /** Probability (before the study) of declaring equivalence at requiredN */
  posteriorProbEquivalent: number;
  ropeAnalysis: {
    probInROPE: number;
    probBelowROPE: number;
    probAboveROPE: number;
  };
  comparisonToTOST: {
    /** n for 80% TOST power at the prior mean (Infinity if the prior mean lies outside the margin) */
    tostN: number;
    difference: number;
  };
  chart: Array<{
    n: number;
    probEquivalent: number;
  }>;
  summary: string;
}

/**
 * Sample size for Bayesian equivalence (ROPE) decisions.
 * For each simulated study: theta ~ prior, estimate ~ N(theta, se^2(n)), conjugate normal posterior,
 * declare equivalence if P(|theta| < margin | data) >= targetProbability.
 * t-test: se^2 = 2/n (standardised difference, n per group). Correlation: Fisher z scale, se^2 = 1/(n-3).
 */
export const calculateEquivalenceN = (
  params: EquivalenceTestingInput
): EquivalenceTestingResult => {
  const { equivalenceMargin: margin, targetProbability, testType: test, alpha } = params;
  validateCommon(alpha);
  if (margin <= 0) {
    throw new Error('Equivalence margin must be positive');
  }
  if (targetProbability <= 0 || targetProbability >= 1) {
    throw new Error('Target probability must be between 0 and 1');
  }
  const targetAssurance = params.targetAssurance ?? 0.8;
  if (!(targetAssurance > 0 && targetAssurance < 1)) throw new Error('Target assurance must be between 0 and 1');
  if (!(params.priorEffect.sd > 0)) throw new Error('Prior SD must be positive');
  if (test === 'correlation' && !(margin < 1)) throw new Error('A correlation margin must be below 1');

  let m0: number;
  let s0: number;
  let M: number;
  if (test === 'ttest') {
    m0 = params.priorEffect.mean;
    s0 = params.priorEffect.sd;
    M = margin;
  } else {
    const r = clamp(params.priorEffect.mean, -0.99, 0.99);
    m0 = Math.atanh(r);
    s0 = params.priorEffect.sd / (1 - r * r);
    M = Math.atanh(margin);
  }
  const se2 = (n: number) => (test === 'ttest' ? 2 / n : 1 / (n - 3));
  const nMin = test === 'ttest' ? 2 : 4;
  const nMax = 500;

  const nSims = 2000;
  const rng = createRng(params, 'equivalence');
  const z1 = Array.from({ length: nSims }, () => rng.normal());
  const z2 = Array.from({ length: nSims }, () => rng.normal());
  const priorPrec = 1 / (s0 * s0);

  const probEquivalentAt = (n: number): number => {
    const v = se2(n);
    const postPrec = priorPrec + 1 / v;
    const postSD = Math.sqrt(1 / postPrec);
    let count = 0;
    for (let i = 0; i < nSims; i++) {
      const theta = m0 + s0 * z1[i];
      const est = theta + Math.sqrt(v) * z2[i];
      const postMean = (priorPrec * m0 + est / v) / postPrec;
      const pIn = jStat.normal.cdf(M, postMean, postSD) - jStat.normal.cdf(-M, postMean, postSD);
      if (pIn >= targetProbability) count++;
    }
    return count / nSims;
  };

  const chart: Array<{ n: number; probEquivalent: number }> = [];
  let requiredN = nMax;
  let reached = false;
  let prevN = nMin - 1;
  for (let n = 10; n <= nMax; n += 10) {
    const p = probEquivalentAt(n);
    chart.push({ n, probEquivalent: p });
    if (!reached && p >= targetAssurance) {
      reached = true;
      requiredN = n;
      for (let m = prevN + 1; m < n; m++) {
        if (m >= nMin && probEquivalentAt(m) >= targetAssurance) {
          requiredN = m;
          break;
        }
      }
    }
    prevN = n;
  }
  const posteriorProbEquivalent = probEquivalentAt(requiredN);

  // Prior mass inside, below and above the ROPE (exact)
  const probBelowROPE = jStat.normal.cdf(-M, m0, s0);
  const probAboveROPE = 1 - jStat.normal.cdf(M, m0, s0);
  const ropeAnalysis = {
    probInROPE: 1 - probBelowROPE - probAboveROPE,
    probBelowROPE,
    probAboveROPE,
  };

  // Frequentist TOST (two one-sided tests at level alpha), 80% power at the prior mean
  const tostPower = (n: number): number => {
    const se = Math.sqrt(se2(n));
    if (test === 'ttest') {
      const df = 2 * n - 2;
      const c = jStat.studentt.inv(1 - alpha, df);
      return Math.max(0, jStat.studentt.cdf((M - m0) / se - c, df) + jStat.studentt.cdf((M + m0) / se - c, df) - 1);
    }
    const c = jStat.normal.inv(1 - alpha, 0, 1);
    return Math.max(0, jStat.normal.cdf((M - m0) / se - c, 0, 1) + jStat.normal.cdf((M + m0) / se - c, 0, 1) - 1);
  };
  let tostN = Infinity;
  if (Math.abs(m0) < M) {
    let hi = nMin;
    while (hi <= 1e6 && tostPower(hi) < 0.8) hi *= 2;
    if (hi <= 1e6) tostN = smallestN(nMin, hi, (n) => tostPower(n) >= 0.8) ?? Infinity;
  }

  const unit = test === 'ttest' ? 'per group' : 'in total';
  let summary = reached
    ? `To have a ${pct(targetAssurance)} chance of showing equivalence within ±${margin} (posterior probability at least ${pct(targetProbability)} inside the ROPE), you need N=${requiredN} ${unit}.`
    : `Target not reached: even with N=${nMax} ${unit}, the chance of showing equivalence within ±${margin} is only ${pct(posteriorProbEquivalent)} (target ${pct(targetAssurance)}).`;
  summary += ` Your prior puts ${pct(ropeAnalysis.probInROPE)} probability on the effect being practically equivalent`;
  summary += ropeAnalysis.probInROPE < targetAssurance ? ', which caps the achievable chance of success.' : '.';
  if (Number.isFinite(tostN)) {
    if (reached) {
      const diff = Math.round(((tostN - requiredN) / tostN) * 100);
      summary += diff === 0
        ? ` A frequentist TOST with 80% power needs the same sample size (N=${tostN}).`
        : ` The Bayesian design needs ${Math.abs(diff)}% ${diff > 0 ? 'fewer' : 'more'} samples than a frequentist TOST with 80% power (N=${tostN}).`;
    } else {
      summary += ` A frequentist TOST with 80% power at the prior mean needs N=${tostN}.`;
    }
  } else {
    summary += ' A frequentist TOST cannot reach 80% power because the prior mean lies outside the margin.';
  }

  return {
    requiredN,
    reached,
    maxSearchN: nMax,
    posteriorProbEquivalent,
    ropeAnalysis,
    comparisonToTOST: {
      tostN,
      difference: tostN - requiredN,
    },
    chart,
    summary,
  };
};

// ============= 7. BAYESIAN MODEL COMPARISON =============

export interface ModelComparisonInput {
  models: Array<{
    name: string;
    prior: { mean: number; sd: number };
    priorProbability: number;
    /** Not used: the marginal likelihood already penalises vague models (kept for compatibility) */
    complexity?: number;
  }>;
  /** Smallest n per group to consider */
  nPerGroup: number;
  testType: 'ttest' | 'anova';
  groups?: number;
  alpha: number;
  targetBayesFactor: number;
  /** Required probability of compelling evidence for the true model (default 0.8) */
  targetProbability?: number;
}

export interface ModelComparisonResult {
  requiredN: number;
  /** false if the target is not reached by maxSearchN (requiredN is then the cap) */
  reached: boolean;
  maxSearchN: number;
  /** Probability that the true model gets BF >= target against every alternative, at requiredN */
  probabilityCompellingEvidence: number;
  /** Median Bayes factor of each model against its strongest competitor when that model is true */
  expectedBayesFactors: Array<{ model: string; BF: number }>;
  /** Probability that the model with the highest posterior probability is the true one */
  probabilityCorrectSelection: number;
  /** Average posterior probability of each model when it is the true model */
  comparisonChart: Array<{
    n: number;
    model: string;
    posteriorProb: number;
  }>;
  summary: string;
}

/**
 * Bayes factor design analysis (Schönbrodt & Wagenmakers 2018 style) for competing effect-size models.
 * Each model is a Normal prior on the standardised difference d. For each simulated study the true
 * model is drawn from the prior model probabilities, d from its prior, and the estimate from
 * N(d, 2/n) (n per group, known SD). The marginal likelihood under model j is
 * N(estimate; mu_j, s_j^2 + 2/n); all calculations are in log space.
 * requiredN is the smallest n where the true model has BF >= target against every competitor with
 * probability >= targetProbability.
 */
export const calculateModelComparisonN = (
  params: ModelComparisonInput
): ModelComparisonResult => {
  const models = params.models;
  const M = models.length;
  if (M < 2) {
    throw new Error('At least 2 models required for comparison');
  }
  const totalPriorProb = models.reduce((sum, m) => sum + m.priorProbability, 0);
  if (Math.abs(totalPriorProb - 1.0) > 0.01) {
    throw new Error('Model prior probabilities must sum to 1.0');
  }
  if (!models.every((m) => m.priorProbability >= 0 && m.prior.sd >= 0)) {
    throw new Error('Prior probabilities and SDs cannot be negative');
  }
  if (!(params.targetBayesFactor > 1)) throw new Error('Target Bayes factor must be greater than 1');
  const targetProbability = params.targetProbability ?? 0.8;
  const logTarget = Math.log(params.targetBayesFactor);

  const nSims = 1000;
  const rng = createRng(params, 'model-comparison');
  const cumulative: number[] = [];
  models.reduce((acc, m, i) => (cumulative[i] = acc + m.priorProbability / totalPriorProb), 0);
  const trueModel: number[] = [];
  const zTheta: number[] = [];
  const zNoise: number[] = [];
  for (let i = 0; i < nSims; i++) {
    const u = rng.uniform();
    let j = cumulative.findIndex((c) => u < c);
    if (j < 0) j = M - 1;
    trueModel.push(j);
    zTheta.push(rng.normal());
    zNoise.push(rng.normal());
  }
  const logPrior = models.map((m) => Math.log(m.priorProbability / totalPriorProb));
  const LOG_2PI = Math.log(2 * Math.PI);

  const evaluate = (n: number) => {
    const v = 2 / n;
    const sdMarg = models.map((m) => Math.sqrt(m.prior.sd * m.prior.sd + v));
    const compelling = new Array<number>(M).fill(0);
    const postTrue = new Array<number>(M).fill(0);
    const counts = new Array<number>(M).fill(0);
    const logBFs: number[][] = models.map(() => []);
    let correct = 0;
    let compellingAll = 0;
    const logml = new Array<number>(M);
    for (let i = 0; i < nSims; i++) {
      const t = trueModel[i];
      const theta = models[t].prior.mean + models[t].prior.sd * zTheta[i];
      const est = theta + Math.sqrt(v) * zNoise[i];
      let maxLp = -Infinity;
      let best = 0;
      let bestAlt = -Infinity;
      for (let j = 0; j < M; j++) {
        const z = (est - models[j].prior.mean) / sdMarg[j];
        logml[j] = -0.5 * (LOG_2PI + z * z) - Math.log(sdMarg[j]);
        const lp = logml[j] + logPrior[j];
        if (lp > maxLp) {
          maxLp = lp;
          best = j;
        }
        if (j !== t && logml[j] > bestAlt) bestAlt = logml[j];
      }
      let lse = 0;
      for (let j = 0; j < M; j++) lse += Math.exp(logml[j] + logPrior[j] - maxLp);
      const logNorm = maxLp + Math.log(lse);
      postTrue[t] += Math.exp(logml[t] + logPrior[t] - logNorm);
      counts[t]++;
      const logBF = logml[t] - bestAlt;
      logBFs[t].push(logBF);
      if (logBF >= logTarget) {
        compelling[t]++;
        compellingAll++;
      }
      if (best === t) correct++;
    }
    const median = (xs: number[]) => {
      if (xs.length === 0) return NaN;
      const s = [...xs].sort((a, b) => a - b);
      const h = Math.floor(s.length / 2);
      return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
    };
    return {
      pCompelling: compellingAll / nSims,
      pCorrect: correct / nSims,
      meanPostTrue: postTrue.map((p, j) => (counts[j] > 0 ? p / counts[j] : NaN)),
      medianBF: logBFs.map((xs) => Math.exp(median(xs))),
    };
  };

  const start = Math.max(2, Math.round(params.nPerGroup));
  const maxSearchN = Math.max(1000, start);
  const step = Math.max(10, Math.ceil((maxSearchN - start) / 60));
  const comparisonChart: ModelComparisonResult['comparisonChart'] = [];
  let requiredN = maxSearchN;
  let reached = false;
  let prev = start;
  const grid: number[] = [];
  for (let n = start; n < maxSearchN; n += step) grid.push(n);
  grid.push(maxSearchN);
  for (const n of grid) {
    const r = evaluate(n);
    models.forEach((m, j) => comparisonChart.push({ n, model: m.name, posteriorProb: r.meanPostTrue[j] }));
    if (r.pCompelling >= targetProbability) {
      reached = true;
      requiredN = n === start ? n : smallestN(prev + 1, n, (x) => evaluate(x).pCompelling >= targetProbability) ?? n;
      break;
    }
    prev = n;
  }

  const final = evaluate(requiredN);
  const expectedBayesFactors = models.map((m, j) => ({ model: m.name, BF: final.medianBF[j] }));
  let limitNote = '';
  if (!reached) {
    limitNote = ` Some models' priors overlap so much that more data cannot separate them; consider fewer or more distinct models.`;
  }
  const head = reached
    ? `To have a ${pct(targetProbability)} probability that the true model obtains a Bayes factor of at least ${params.targetBayesFactor} against every competitor, you need N=${requiredN} per group.`
    : `Target not reached: even at N=${maxSearchN} per group, the probability of a Bayes factor of at least ${params.targetBayesFactor} for the true model is only ${pct(final.pCompelling)} (target ${pct(targetProbability)}).`;
  const summary = `${head} At this sample size the model with the highest posterior probability is the true model ${pct(final.pCorrect)} of the time.${limitNote} Marginal likelihoods automatically penalise vague (more flexible) models.`;

  return {
    requiredN,
    reached,
    maxSearchN,
    probabilityCompellingEvidence: final.pCompelling,
    expectedBayesFactors,
    probabilityCorrectSelection: final.pCorrect,
    comparisonChart,
    summary,
  };
};

// ============= 8. BAYESIAN CALIBRATION TOOL =============

export interface CalibrationInput {
  frequentistPower: number;
  effectSize: number;
  effectUncertainty: number;
  nPerGroup: number;
  testType: 'ttest' | 'anova';
  groups?: number;
  alpha: number;
}

export interface CalibrationResult {
  /** Expected power E[power] over the effect-size prior at nPerGroup */
  bayesianAssurance: number;
  /** Conventional power at the point effect size and nPerGroup */
  pointPower: number;
  assuranceLoss: number;
  /** Smallest n per group with expected power >= frequentistPower (NaN if not reachable) */
  recommendedN: number;
  calibrationCurve: Array<{
    uncertainty: number;
    assurance: number;
  }>;
  summary: string;
}

/**
 * Translate frequentist power into Bayesian assurance, defined here as expected power
 * (O'Hagan, Stevens & Campbell 2005): E[power(theta, n)] with theta ~ Normal(effectSize, effectUncertainty).
 * It equals the frequentist power when the uncertainty is zero and changes continuously with it.
 */
export const calibrateFrequentistToBayesian = (
  params: CalibrationInput
): CalibrationResult => {
  const { frequentistPower: target, effectSize, effectUncertainty, nPerGroup, alpha } = params;
  validateCommon(alpha);
  if (target <= 0 || target >= 1) {
    throw new Error('Frequentist power must be between 0 and 1');
  }
  if (nPerGroup < 2) {
    throw new Error('Sample size must be at least 2 per group');
  }
  if (effectUncertainty < 0) {
    throw new Error('Effect uncertainty cannot be negative');
  }
  const test: EffectTest = params.testType;
  const k = test === 'anova' ? params.groups ?? 0 : 2;
  if (!(k >= 2)) throw new Error('At least 2 groups are required');
  const support = supportFor(test);
  const powerFn = (n: number) => (x: number) => directionalPower(test, n, x, alpha, k);
  const assuranceAt = (n: number, sd = effectUncertainty) =>
    expectedPowerOver(powerFn(n), priorNodes(effectSize, sd, support, 61));

  const bayesianAssurance = assuranceAt(nPerGroup);
  const pointPower = powerFn(nPerGroup)(effectSize);
  const assuranceLoss = Math.max(0, ((target - bayesianAssurance) / target) * 100);

  let recommendedN = nPerGroup;
  let summary: string;
  if (bayesianAssurance >= target) {
    summary = `Your sample size of N=${nPerGroup} per group gives an expected power (assurance) of ${pct(bayesianAssurance)} after accounting for effect size uncertainty (SD=${effectUncertainty.toFixed(2)}), which meets the ${pct(target)} target. Power at the exact effect size is ${pct(pointPower)}.`;
  } else {
    const found = smallestN(nPerGroup, 5000, (n) => assuranceAt(n) >= target);
    recommendedN = found ?? NaN;
    const advice = found !== null
      ? `To reach ${pct(target)} assurance, increase N from ${nPerGroup} to ${found} per group.`
      : `An assurance of ${pct(target)} cannot be reached at any sample size, because the prior gives too much probability to effects near zero or in the opposite direction; reduce the uncertainty or lower the target.`;
    summary = `Power at the exact effect size (${effectSize.toFixed(2)}) is ${pct(pointPower)}, but expected power averaged over the uncertainty (SD=${effectUncertainty.toFixed(2)}) is ${pct(bayesianAssurance)}, a ${assuranceLoss.toFixed(0)}% shortfall against the ${pct(target)} target. ${advice}`;
  }

  const calibrationCurve: CalibrationResult['calibrationCurve'] = [];
  const maxUnc = Math.max(Math.abs(effectSize), 0.05);
  for (let i = 0; i <= 20; i++) {
    const unc = (maxUnc * i) / 20;
    calibrationCurve.push({ uncertainty: unc, assurance: assuranceAt(nPerGroup, unc) });
  }

  return {
    bayesianAssurance,
    pointPower,
    assuranceLoss,
    recommendedN,
    calibrationCurve,
    summary,
  };
};

// ============= 9. MICROBIOME ASSURANCE (NB differential abundance, longitudinal LMM) =============

export interface MicrobiomeAssuranceResult {
  requiredN: number;
  /** false if targetAssurance is not reached by maxSearchN (requiredN is then the cap) */
  reached: boolean;
  maxSearchN: number;
  /** Expected power E[power | prior] at requiredN */
  expectedPowerAtN: number;
  /** Conventional n at the prior mean (Infinity if unreachable within maxSearchN) */
  frequentistN: number;
  assuranceCurve: Array<{ n: number; assurance: number; expectedPower: number }>;
  /** Sensitivity band: assurance when the prior SD is 25% smaller or larger */
  confidenceRegions: {
    lower: Array<{ x: number; y: number }>;
    upper: Array<{ x: number; y: number }>;
  };
  summary: string;
}

/**
 * P(power(x) >= target) for x ~ Normal(mean, sd) truncated to the support, for power functions that
 * need not be monotone: the region where power reaches the target is located on a grid, its edges are
 * refined by bisection, and the Normal mass of each interval is summed exactly.
 */
const probPowerAtLeast = (
  powerFn: (x: number) => number,
  target: number,
  mean: number,
  sd: number,
  s: Support,
  gridSize = 200
): number => {
  if (!(sd > 0)) return powerFn(clamp(mean, s.lower, s.upper)) >= target ? 1 : 0;
  const lo = Math.max(s.lower, mean - 8 * sd);
  const hi = Math.min(s.upper, mean + 8 * sd);
  const z = normCdf(s.upper, mean, sd) - normCdf(s.lower, mean, sd);
  if (!(hi > lo) || !(z > 1e-300)) return powerFn(clamp(mean, s.lower, s.upper)) >= target ? 1 : 0;
  const ok = (x: number) => powerFn(x) >= target;
  const edge = (a: number, b: number, okA: boolean) => {
    for (let i = 0; i < 40; i++) {
      const m = (a + b) / 2;
      if (ok(m) === okA) a = m;
      else b = m;
    }
    return (a + b) / 2;
  };
  // Mass beyond the 8 SD window is attributed to the nearest grid end
  let mass = 0;
  let prevX = lo;
  let prevOk = ok(lo);
  let start = prevOk ? s.lower : NaN;
  for (let i = 1; i <= gridSize; i++) {
    const x = lo + ((hi - lo) * i) / gridSize;
    const curOk = ok(x);
    if (curOk !== prevOk) {
      const e = edge(prevX, x, prevOk);
      if (curOk) start = e;
      else mass += normCdf(e, mean, sd) - normCdf(start, mean, sd);
    }
    prevX = x;
    prevOk = curOk;
  }
  if (prevOk) mass += normCdf(s.upper, mean, sd) - normCdf(start, mean, sd);
  return clamp01(mass / z);
};

interface AssuranceEngineInput {
  powerAt: (n: number, effect: number) => number;
  mean: number;
  sd: number;
  support: Support;
  targetPower: number;
  targetAssurance: number;
  nMin: number;
  nMax: number;
  curveStep: number;
  /** true if power is increasing in the effect on the support (enables the exact MDE shortcut) */
  monotone: boolean;
  mdeUpper: number;
}

const assuranceEngine = (p: AssuranceEngineInput) => {
  const nodes = priorNodes(p.mean, p.sd, p.support, 41);
  const probAt = (n: number, sd = p.sd): number => {
    const f = (x: number) => p.powerAt(n, x);
    if (p.monotone) {
      let mde: number;
      if (f(p.mdeUpper) < p.targetPower) mde = Infinity;
      else if (f(Math.max(0, p.support.lower)) >= p.targetPower) mde = Math.max(0, p.support.lower);
      else {
        let a = Math.max(0, p.support.lower);
        let b = p.mdeUpper;
        for (let i = 0; i < 40; i++) {
          const m = (a + b) / 2;
          if (f(m) >= p.targetPower) b = m;
          else a = m;
        }
        mde = b;
      }
      return truncNormalSurvival(mde, p.mean, sd, p.support);
    }
    return probPowerAtLeast(f, p.targetPower, p.mean, sd, p.support);
  };
  const expectedAt = (n: number) => expectedPowerOver((x) => p.powerAt(n, x), nodes, p.monotone);

  const found = smallestN(p.nMin, p.nMax, (n) => probAt(n) >= p.targetAssurance);
  const reached = found !== null;
  const requiredN = found ?? p.nMax;
  const curveMax = Math.min(p.nMax, Math.max(30 * p.curveStep, Math.ceil((requiredN * 1.5) / p.curveStep) * p.curveStep));
  const step = Math.max(p.curveStep, Math.ceil(curveMax / 40 / p.curveStep) * p.curveStep);
  const assuranceCurve: MicrobiomeAssuranceResult['assuranceCurve'] = [];
  const lower: Array<{ x: number; y: number }> = [];
  const upper: Array<{ x: number; y: number }> = [];
  for (let n = step; n <= curveMax; n += step) {
    if (n < p.nMin) continue;
    const a = probAt(n);
    const aLo = probAt(n, p.sd * 0.75);
    const aHi = probAt(n, p.sd * 1.25);
    assuranceCurve.push({ n, assurance: a, expectedPower: expectedAt(n) });
    lower.push({ x: n, y: Math.min(a, aLo, aHi) });
    upper.push({ x: n, y: Math.max(a, aLo, aHi) });
  }
  const freq = smallestN(p.nMin, p.nMax, (n) => p.powerAt(n, p.mean) >= p.targetPower);
  return {
    requiredN,
    reached,
    maxSearchN: p.nMax,
    expectedPowerAtN: expectedAt(requiredN),
    frequentistN: freq ?? Infinity,
    assuranceCurve,
    confidenceRegions: { lower, upper },
    probAt,
  };
};

export interface DifferentialAbundanceAssuranceInput {
  log2FCMean: number;
  log2FCSD: number;
  dispersion: number;
  baseMean: number;
  targetPower: number;
  targetAssurance: number;
  alpha: number;
  numTests: number;
}

/**
 * Assurance for NB (DESeq2/edgeR) differential abundance with a Normal prior on log2 fold change.
 * Power per taxon comes from calculateNegBinomialPower (Bonferroni over numTests); only changes in the
 * direction of the prior mean count as success. n is per group.
 */
export const calculateDifferentialAbundanceAssurance = (
  params: DifferentialAbundanceAssuranceInput
): MicrobiomeAssuranceResult => {
  const { log2FCMean: mean, log2FCSD: sd, dispersion, baseMean, targetPower, targetAssurance, alpha } = params;
  validateCommon(alpha);
  if (!(sd >= 0)) throw new Error('Prior SD cannot be negative');
  if (!(dispersion >= 0) || !(baseMean > 0)) throw new Error('Dispersion must be non-negative and the base mean positive');
  if (!(targetPower > 0 && targetPower < 1) || !(targetAssurance > 0 && targetAssurance < 1)) {
    throw new Error('Targets must be between 0 and 1');
  }
  const numTests = Math.max(1, Math.round(params.numTests));
  const sign = mean >= 0 ? 1 : -1;
  const powerAt = (n: number, x: number) =>
    x * sign > 0 ? calculateNegBinomialPower(n, x, dispersion, baseMean, alpha, numTests) : 0;
  const r = assuranceEngine({
    powerAt,
    mean,
    sd,
    support: { lower: -Infinity, upper: Infinity },
    targetPower,
    targetAssurance,
    nMin: 2,
    nMax: MAX_SEARCH_N,
    curveStep: 5,
    monotone: false,
    mdeUpper: 0,
  });
  const head = r.reached
    ? `To have a ${pct(targetAssurance)} probability of at least ${pct(targetPower)} power (log2 fold change ${mean.toFixed(1)} ± ${sd.toFixed(1)}, dispersion ${dispersion}, base mean ${baseMean}, Bonferroni over ${numTests} taxa), you need ${r.requiredN} samples per group. Expected power at this size is ${pct(r.expectedPowerAtN)}.`
    : `Target not reached: even with ${r.maxSearchN} samples per group, the probability of at least ${pct(targetPower)} power is only ${pct(r.probAt(r.maxSearchN))} (target ${pct(targetAssurance)}).`;
  const freq = Number.isFinite(r.frequentistN)
    ? ` A conventional calculation at the prior mean (${Math.pow(2, mean).toFixed(1)}-fold change) gives ${r.frequentistN} per group.`
    : ' A conventional calculation at the prior mean cannot reach the target power.';
  return { ...stripProb(r), summary: head + freq };
};

export interface LongitudinalAssuranceInput {
  effectSizeMean: number; // Cohen's f for the time x treatment interaction
  effectSizeSD: number;
  nTimepoints: number;
  withinCorr: number;
  /** Dropout per timepoint interval; total dropout by the final timepoint is 1 - (1 - d)^(m - 1) */
  dropoutRate: number;
  targetPower: number;
  targetAssurance: number;
  alpha: number;
  randomSlopeVar?: number;
  nCovariates?: number;
}

/**
 * Assurance for a two-group longitudinal LMM (time x treatment) with a Normal prior on Cohen's f
 * truncated at zero. Power comes from calculateLMMPower (completers only, exact noncentral F).
 * n is the total number of subjects enrolled.
 */
export const calculateLongitudinalAssurance = (
  params: LongitudinalAssuranceInput
): MicrobiomeAssuranceResult & { totalDropout: number; expectedCompleters: number } => {
  const { effectSizeMean: mean, effectSizeSD: sd, nTimepoints: m, withinCorr, dropoutRate, targetPower, targetAssurance, alpha } = params;
  validateCommon(alpha);
  if (!(sd >= 0)) throw new Error('Prior SD cannot be negative');
  if (!(m >= 2)) throw new Error('At least 2 timepoints are required');
  if (!(dropoutRate >= 0 && dropoutRate < 1)) throw new Error('Dropout rate must be between 0 and 1');
  if (!(targetPower > 0 && targetPower < 1) || !(targetAssurance > 0 && targetAssurance < 1)) {
    throw new Error('Targets must be between 0 and 1');
  }
  const totalDropout = 1 - Math.pow(1 - dropoutRate, m - 1);
  const powerAt = (n: number, f: number) =>
    calculateLMMPower(n, m, Math.max(0, f), withinCorr, params.randomSlopeVar ?? 0, params.nCovariates ?? 0, totalDropout, alpha);
  const r = assuranceEngine({
    powerAt,
    mean,
    sd,
    support: { lower: 0, upper: Infinity },
    targetPower,
    targetAssurance,
    nMin: 4,
    nMax: MAX_SEARCH_N,
    curveStep: 2,
    monotone: true,
    mdeUpper: 5,
  });
  const completers = Math.round(r.requiredN * (1 - totalDropout));
  const head = r.reached
    ? `To have a ${pct(targetAssurance)} probability of at least ${pct(targetPower)} power for the time x treatment effect (f = ${mean.toFixed(2)} ± ${sd.toFixed(2)}), enrol ${r.requiredN} subjects in total. With ${pct(dropoutRate)} dropout per interval over ${m} timepoints (${pct(totalDropout)} in total), expect about ${completers} completers. Expected power at this size is ${pct(r.expectedPowerAtN)}.`
    : `Target not reached: even with ${r.maxSearchN} subjects, the probability of at least ${pct(targetPower)} power is only ${pct(r.probAt(r.maxSearchN))} (target ${pct(targetAssurance)}).`;
  const freq = Number.isFinite(r.frequentistN)
    ? ` A conventional calculation at the prior mean gives ${r.frequentistN} subjects.`
    : ' A conventional calculation at the prior mean cannot reach the target power.';
  return { ...stripProb(r), summary: head + freq, totalDropout, expectedCompleters: completers };
};

const stripProb = <T extends { probAt: unknown }>(r: T): Omit<T, 'probAt'> => {
  const { probAt: _unused, ...rest } = r;
  return rest;
};
