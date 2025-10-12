// Bayesian power analysis utilities for ecological research
// Accounts for uncertainty in effect size estimates

// @ts-ignore
import jStat from 'jstat';
import {
  calculateTTestPower,
  calculateOneWayAnovaPower,
  calculateCorrelationPower,
  calculatePERMANOVAPower
} from './powerCalculations';

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
  assuranceCurve: Array<{n: number, assurance: number}>;
  priorDistribution: Array<{effectSize: number, density: number}>;
  summary: string;
}

// Generate normal random variable using Box-Muller transform
const normalRandom = (mean: number, sd: number): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + sd * z0;
};

/**
 * Calculate Bayesian assurance for sample size determination
 * 
 * Assurance is the probability of achieving target power given uncertainty
 * about the true effect size. Unlike traditional power analysis which assumes
 * you know the exact effect size, Bayesian assurance accounts for uncertainty.
 * 
 * Method: Monte Carlo integration
 * 1. Sample effect sizes from prior distribution (Normal(mean, SD))
 * 2. For each sampled effect, calculate power at sample size n
 * 3. Assurance = Pr(Power > targetPower) = integral over prior
 * 4. Find minimum n where assurance ≥ targetAssurance
 */
export const calculateBayesianAssurance = (
  params: BayesianAssuranceInput
): BayesianAssuranceResult => {
  const nSamples = 5000; // Monte Carlo samples for integration
  const assuranceCurve: Array<{n: number, assurance: number}> = [];
  let requiredN = 10;
  let foundRequiredN = false;
  
  // Generate prior distribution for visualization
  const priorDistribution = [];
  for (let es = 0; es <= 2.0; es += 0.05) {
    const density = jStat.normal.pdf(es, params.effectSizeMean, params.effectSizeSD);
    priorDistribution.push({ effectSize: es, density });
  }
  
  // Monte Carlo integration: calculate assurance for different sample sizes
  for (let n = 10; n <= 300; n += 5) {
    let countSuccess = 0;
    
    for (let i = 0; i < nSamples; i++) {
      // Sample effect size from prior (truncated at 0 for positive effects only)
      let sampledEffect = normalRandom(params.effectSizeMean, params.effectSizeSD);
      // Truncate at 0 (resample if negative, max 10 attempts)
      let attempts = 0;
      while (sampledEffect < 0 && attempts < 10) {
        sampledEffect = normalRandom(params.effectSizeMean, params.effectSizeSD);
        attempts++;
      }
      if (sampledEffect < 0) sampledEffect = 0.01; // Fallback to small positive value
      
      // Calculate power for this effect size at sample size n
      let power = 0;
      try {
        if (params.testType === 'ttest') {
          power = calculateTTestPower(n, sampledEffect, params.alpha).power;
        } else if (params.testType === 'anova' && params.groups) {
          power = calculateOneWayAnovaPower(n, params.groups, sampledEffect, params.alpha).power;
        } else if (params.testType === 'correlation') {
          // For correlation, effect size is the correlation coefficient (r)
          // Ensure it stays within valid range [-1, 1]
          const sampledR = Math.min(0.99, Math.max(-0.99, sampledEffect));
          power = calculateCorrelationPower(n, sampledR, params.alpha).power;
        } else if (params.testType === 'permanova' && params.groups) {
          // For PERMANOVA, effect size is R² (variance explained)
          // Ensure it stays within valid range [0, 0.95]
          const sampledR2 = Math.min(0.95, Math.max(0.001, sampledEffect));
          power = calculatePERMANOVAPower(n, params.groups, sampledR2, params.alpha).power;
        }
      } catch (e) {
        // Handle edge cases
        power = 0;
      }
      
      // Count if power exceeds target
      if (power >= params.targetPower) countSuccess++;
    }
    
    const assurance = countSuccess / nSamples;
    assuranceCurve.push({ n, assurance });
    
    // Find minimum n where assurance >= target (first crossing)
    if (assurance >= params.targetAssurance && !foundRequiredN) {
      requiredN = n;
      foundRequiredN = true;
    }
  }
  
  // If never reached target assurance, return max
  if (!foundRequiredN) {
    requiredN = 300;
  }
  
  // Estimate frequentist n for comparison (assumes exact effect size)
  let frequentistN = 10;
  let freqPower = 0;
  try {
    if (params.testType === 'ttest') {
      // Binary search for required n
      for (let n = 10; n <= 300; n += 5) {
        const power = calculateTTestPower(n, params.effectSizeMean, params.alpha).power;
        if (power >= params.targetPower) {
          frequentistN = n;
          freqPower = power;
          break;
        }
      }
    } else if (params.testType === 'anova' && params.groups) {
      for (let n = 10; n <= 300; n += 5) {
        const power = calculateOneWayAnovaPower(n, params.groups, params.effectSizeMean, params.alpha).power;
        if (power >= params.targetPower) {
          frequentistN = n;
          freqPower = power;
          break;
        }
      }
    } else if (params.testType === 'correlation') {
      for (let n = 10; n <= 300; n += 5) {
        const power = calculateCorrelationPower(n, params.effectSizeMean, params.alpha).power;
        if (power >= params.targetPower) {
          frequentistN = n;
          freqPower = power;
          break;
        }
      }
    } else if (params.testType === 'permanova' && params.groups) {
      // For PERMANOVA, traditional power analysis
      for (let n = 10; n <= 300; n += 5) {
        const power = calculatePERMANOVAPower(n, params.groups, params.effectSizeMean, params.alpha).power;
        if (power >= params.targetPower) {
          frequentistN = n;
          freqPower = power;
          break;
        }
      }
    }
  } catch (e) {
    frequentistN = Math.ceil(requiredN * 0.7);
  }
  
  let summary = '';
  if (params.testType === 'permanova') {
    summary = `With uncertainty in effect size (R²: mean=${params.effectSizeMean.toFixed(3)}, SD=${params.effectSizeSD.toFixed(3)}), you need <strong>${requiredN}</strong> per group to have ${(params.targetAssurance*100).toFixed(0)}% assurance of achieving ${(params.targetPower*100).toFixed(0)}% power. Traditional PERMANOVA power analysis (ignoring uncertainty) suggests ${frequentistN} per group. <strong>Accounting for uncertainty increases required sample size by ${Math.round((requiredN - frequentistN) / frequentistN * 100)}%</strong>, which is especially important in microbiome studies with high variability.`;
  } else {
    summary = `With uncertainty in effect size (mean=${params.effectSizeMean.toFixed(2)}, SD=${params.effectSizeSD.toFixed(2)}), you need <strong>${requiredN}</strong> ${params.testType === 'correlation' ? 'total' : 'per group'} to have ${(params.targetAssurance*100).toFixed(0)}% assurance of achieving ${(params.targetPower*100).toFixed(0)}% power. Traditional power analysis (ignoring uncertainty) suggests ${frequentistN} ${params.testType === 'correlation' ? 'total' : 'per group'}. <strong>Accounting for uncertainty increases required sample size by ${Math.round((requiredN - frequentistN) / frequentistN * 100)}%</strong>.`;
  }
  
  return { requiredN, assuranceCurve, priorDistribution, summary };
};

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

/**
 * Elicit prior distribution from user beliefs
 * 
 * Quantile method: "I'm 90% sure the effect is between X and Y"
 * Fit Normal distribution to match specified quantiles
 */
export const elicitPrior = (input: PriorElicitationInput): PriorElicitationResult => {
  if (input.method === 'quantile' && input.lowerQuantile && input.upperQuantile) {
    // Solve for μ and σ given two quantiles
    // Q_p1 = μ + z_p1 * σ  and  Q_p2 = μ + z_p2 * σ
    const z_low = jStat.normal.inv(input.lowerQuantile.percentile / 100, 0, 1);
    const z_high = jStat.normal.inv(input.upperQuantile.percentile / 100, 0, 1);
    
    const sigma = (input.upperQuantile.value - input.lowerQuantile.value) / (z_high - z_low);
    const mu = input.lowerQuantile.value - z_low * sigma;
    
    // Generate density curve
    const densityCurve = [];
    for (let x = Math.max(0, mu - 4*sigma); x <= mu + 4*sigma; x += (8*sigma) / 100) {
      const y = jStat.normal.pdf(x, mu, sigma);
      densityCurve.push({ x, y });
    }
    
    return {
      distribution: 'normal',
      parameters: { mean: mu, sd: sigma },
      densityCurve,
      summaryStats: {
        median: mu,
        mode: mu,
        ci95: [mu - 1.96*sigma, mu + 1.96*sigma]
      }
    };
  } else if (input.method === 'literature' && input.publishedEffects && input.publishedEffects.length > 0) {
    // Meta-analytic prior: use mean and variance of published effects
    const n = input.publishedEffects.length;
    const mean = input.publishedEffects.reduce((a, b) => a + b, 0) / n;
    const variance = input.publishedEffects.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
    const sd = Math.sqrt(variance);
    
    // Generate density curve
    const densityCurve = [];
    for (let x = Math.max(0, mean - 4*sd); x <= mean + 4*sd; x += (8*sd) / 100) {
      const y = jStat.normal.pdf(x, mean, sd);
      densityCurve.push({ x, y });
    }
    
    return {
      distribution: 'normal',
      parameters: { mean, sd },
      densityCurve,
      summaryStats: {
        median: mean,
        mode: mean,
        ci95: [mean - 1.96*sd, mean + 1.96*sd]
      }
    };
  } else if (input.method === 'bounds' && input.optimisticEffect && input.pessimisticEffect && input.mostLikely) {
    // PERT distribution approximation using Beta
    // Use (optimistic + 4*mostLikely + pessimistic) / 6 as mean
    const min = input.pessimisticEffect;
    const max = input.optimisticEffect;
    const mode = input.mostLikely;
    
    const mean = (min + 4*mode + max) / 6;
    const variance = Math.pow((max - min) / 6, 2);
    const sd = Math.sqrt(variance);
    
    // Generate density curve (approximate as Normal)
    const densityCurve = [];
    for (let x = min; x <= max; x += (max - min) / 100) {
      const y = jStat.normal.pdf(x, mean, sd);
      densityCurve.push({ x, y });
    }
    
    return {
      distribution: 'normal',
      parameters: { mean, sd },
      densityCurve,
      summaryStats: {
        median: mean,
        mode: mode,
        ci95: [mean - 1.96*sd, mean + 1.96*sd]
      }
    };
  }
  
  // Default fallback
  return {
    distribution: 'normal',
    parameters: { mean: 0.5, sd: 0.2 },
    densityCurve: [],
    summaryStats: { median: 0.5, mode: 0.5, ci95: [0.1, 0.9] }
  };
};
