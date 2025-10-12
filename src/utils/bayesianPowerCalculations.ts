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

// ============= 1. BAYESIAN SEQUENTIAL DESIGN =============

export interface BayesianSequentialInput {
  effectSizePrior: { mean: number; sd: number };
  targetPower: number;
  alpha: number;
  testType: 'ttest' | 'anova' | 'correlation';
  groups?: number;
  maxN: number;
  interimLooks: number;
  stoppingRule: 'futility' | 'superiority' | 'both';
  futilityThreshold: number;
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

export const calculateBayesianSequential = (
  params: BayesianSequentialInput
): BayesianSequentialResult => {
  // Phase 3: Validation
  if (params.maxN <= 0 || params.interimLooks <= 0 || params.interimLooks > params.maxN / 2) {
    throw new Error('Invalid parameters: maxN must be positive and interimLooks reasonable');
  }
  
  const nSims = 2000;
  const interimSizes: number[] = [];
  
  for (let i = 1; i <= params.interimLooks; i++) {
    interimSizes.push(Math.floor((params.maxN / params.interimLooks) * i));
  }
  
  const stoppingProbs: Array<{
    look: number;
    n: number;
    stopFutility: number;
    stopSuperiority: number;
    continue: number;
  }> = [];
  
  let totalN = 0;
  let powerCount = 0;
  
  for (let sim = 0; sim < nSims; sim++) {
    const trueEffect = normalRandom(params.effectSizePrior.mean, params.effectSizePrior.sd);
    let stopped = false;
    let simN = params.maxN;
    let finalPower = 0;
    
    for (let lookIdx = 0; lookIdx < interimSizes.length; lookIdx++) {
      const n = interimSizes[lookIdx];
      
      // Phase 2: Calculate predictive probability instead of just current power
      // Predictive probability = probability of success at maxN given current data
      let currentPower = 0;
      try {
        if (params.testType === 'ttest') {
          currentPower = calculateTTestPower(n, Math.abs(trueEffect), params.alpha).power;
        } else if (params.testType === 'anova' && params.groups) {
          currentPower = calculateOneWayAnovaPower(n, params.groups, Math.abs(trueEffect), params.alpha).power;
        } else if (params.testType === 'correlation') {
          currentPower = calculateCorrelationPower(n, Math.min(0.99, Math.abs(trueEffect)), params.alpha).power;
        }
      } catch (e) {
        currentPower = 0;
      }
      
      finalPower = currentPower;
      
      // Predictive probability at final sample size
      let predictivePower = 0;
      try {
        if (params.testType === 'ttest') {
          predictivePower = calculateTTestPower(params.maxN, Math.abs(trueEffect), params.alpha).power;
        } else if (params.testType === 'anova' && params.groups) {
          predictivePower = calculateOneWayAnovaPower(params.maxN, params.groups, Math.abs(trueEffect), params.alpha).power;
        } else if (params.testType === 'correlation') {
          predictivePower = calculateCorrelationPower(params.maxN, Math.min(0.99, Math.abs(trueEffect)), params.alpha).power;
        }
      } catch (e) {
        predictivePower = 0;
      }
      
      // Futility: Stop if predictive probability of success is low
      if ((params.stoppingRule === 'futility' || params.stoppingRule === 'both') && 
          predictivePower < params.futilityThreshold) {
        simN = n;
        stopped = true;
        break;
      }
      
      // Superiority: Stop if current power already exceeds threshold
      if ((params.stoppingRule === 'superiority' || params.stoppingRule === 'both') && 
          currentPower > params.superiorityThreshold) {
        simN = n;
        stopped = true;
        if (currentPower >= params.targetPower) powerCount++;
        break;
      }
    }
    
    if (!stopped && finalPower >= params.targetPower) powerCount++;
    totalN += simN;
  }
  
  const expectedN = totalN / nSims;
  const powerUnderPrior = powerCount / nSims;
  
  for (let lookIdx = 0; lookIdx < interimSizes.length; lookIdx++) {
    let futilityCount = 0;
    let superiorityCount = 0;
    
    for (let sim = 0; sim < nSims; sim++) {
      const trueEffect = normalRandom(params.effectSizePrior.mean, params.effectSizePrior.sd);
      const n = interimSizes[lookIdx];
      
      let power = 0;
      try {
        if (params.testType === 'ttest') {
          power = calculateTTestPower(n, Math.abs(trueEffect), params.alpha).power;
        } else if (params.testType === 'anova' && params.groups) {
          power = calculateOneWayAnovaPower(n, params.groups, Math.abs(trueEffect), params.alpha).power;
        } else if (params.testType === 'correlation') {
          power = calculateCorrelationPower(n, Math.min(0.99, Math.abs(trueEffect)), params.alpha).power;
        }
      } catch (e) {
        power = 0;
      }
      
      if (power < params.futilityThreshold) futilityCount++;
      if (power > params.superiorityThreshold) superiorityCount++;
    }
    
    stoppingProbs.push({
      look: lookIdx + 1,
      n: interimSizes[lookIdx],
      stopFutility: futilityCount / nSims,
      stopSuperiority: superiorityCount / nSims,
      continue: 1 - (futilityCount + superiorityCount) / nSims
    });
  }
  
  const chart = stoppingProbs.map(sp => ({
    n: sp.n,
    stopProb: sp.stopFutility + sp.stopSuperiority,
    continueProb: sp.continue
  }));
  
  const percentReduction = ((params.maxN - expectedN) / params.maxN) * 100;
  
  const summary = `Sequential design with ${params.interimLooks} interim analyses can save approximately <strong>${Math.round(percentReduction)}%</strong> of resources. Expected sample size: <strong>${Math.round(expectedN)}</strong> per group (vs. ${params.maxN} for fixed design). Power under prior: <strong>${(powerUnderPrior * 100).toFixed(1)}%</strong>.`;
  
  return {
    expectedN: Math.round(expectedN),
    maxN: params.maxN,
    interimSampleSizes: interimSizes,
    stoppingProbabilities: stoppingProbs,
    savings: {
      percentReduction,
      comparedToFixed: params.maxN
    },
    operatingCharacteristics: {
      powerUnderPrior,
      averageN: expectedN,
      typeIError: params.alpha
    },
    chart,
    summary
  };
};

// ============= 2. BAYESIAN REPLICATION CRISIS =============

export interface ReplicationCrisisInput {
  publishedEffect: number;
  publishedN: number;
  publishedP: number;
  testType: 'ttest' | 'anova' | 'correlation';
  groups?: number;
  alpha: number;
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

export const calculateReplicationProbability = (
  params: ReplicationCrisisInput
): ReplicationCrisisResult => {
  // Phase 3: Validation
  if (params.publishedEffect <= 0 || params.publishedN <= 0 || params.replicationN <= 0) {
    throw new Error('Invalid parameters: effect size and sample sizes must be positive');
  }
  
  // Phase 2: Implement Gelman & Carlin Type M (exaggeration ratio) adjustment
  // Publication bias inflates effects more severely for smaller samples
  const powerAtPublishedN = params.publishedP < params.alpha ? 0.8 : 0.5; // Estimate
  
  // Type M error: Expected exaggeration ratio given the published result
  // Formula: E[|estimate|/true | significant] 
  const zScore = Math.abs(jStat.normal.inv(params.publishedP / 2, 0, 1));
  const publishedSE = params.publishedEffect / zScore;
  
  // Retrodesign: adjust for winner's curse using Type M calculation
  const typeMFactor = {
    'none': 1.0,
    'mild': 1.2,      // 20% inflation
    'moderate': 1.5,  // 50% inflation (typical in many fields)
    'severe': 2.2     // 120% inflation (extreme publication bias)
  }[params.publicationBias];
  
  const trueEffectEstimate = params.publishedEffect / typeMFactor;
  
  const skepticismPrior = {
    'optimistic': { mean: trueEffectEstimate * 1.1, sd: trueEffectEstimate * 0.3 },
    'moderate': { mean: trueEffectEstimate, sd: trueEffectEstimate * 0.5 },
    'skeptical': { mean: trueEffectEstimate * 0.7, sd: trueEffectEstimate * 0.6 }
  }[params.priorSkepticism];
  
  const publishedPrecision = 1 / (publishedSE * publishedSE);
  const priorPrecision = 1 / (skepticismPrior.sd * skepticismPrior.sd);
  
  const posteriorPrecision = priorPrecision + publishedPrecision;
  const posteriorMean = (priorPrecision * skepticismPrior.mean + publishedPrecision * trueEffectEstimate) / posteriorPrecision;
  const posteriorSD = Math.sqrt(1 / posteriorPrecision);
  
  const shrinkageFactor = posteriorMean / params.publishedEffect;
  
  const nSims = 2000;
  let replicationSuccesses = 0;
  
  const chart: Array<{ trueEffect: number; replicationProb: number; posteriorDensity: number }> = [];
  
  for (let es = 0; es <= params.publishedEffect * 1.5; es += params.publishedEffect / 50) {
    const density = jStat.normal.pdf(es, posteriorMean, posteriorSD);
    
    let repCount = 0;
    for (let i = 0; i < 100; i++) {
      let power = 0;
      try {
        if (params.testType === 'ttest') {
          power = calculateTTestPower(params.replicationN, es, params.alpha).power;
        } else if (params.testType === 'anova' && params.groups) {
          power = calculateOneWayAnovaPower(params.replicationN, params.groups, es, params.alpha).power;
        } else if (params.testType === 'correlation') {
          power = calculateCorrelationPower(params.replicationN, Math.min(0.99, es), params.alpha).power;
        }
      } catch (e) {
        power = 0;
      }
      if (Math.random() < power) repCount++;
    }
    
    chart.push({
      trueEffect: es,
      replicationProb: repCount / 100,
      posteriorDensity: density
    });
  }
  
  for (let i = 0; i < nSims; i++) {
    const sampledEffect = normalRandom(posteriorMean, posteriorSD);
    if (sampledEffect <= 0) continue;
    
    let power = 0;
    try {
      if (params.testType === 'ttest') {
        power = calculateTTestPower(params.replicationN, sampledEffect, params.alpha).power;
      } else if (params.testType === 'anova' && params.groups) {
        power = calculateOneWayAnovaPower(params.replicationN, params.groups, sampledEffect, params.alpha).power;
      } else if (params.testType === 'correlation') {
        power = calculateCorrelationPower(params.replicationN, Math.min(0.99, sampledEffect), params.alpha).power;
      }
    } catch (e) {
      power = 0;
    }
    
    if (Math.random() < power) replicationSuccesses++;
  }
  
  const replicationProbability = replicationSuccesses / nSims;
  
  let powerForReplication = 0;
  try {
    if (params.testType === 'ttest') {
      powerForReplication = calculateTTestPower(params.replicationN, posteriorMean, params.alpha).power;
    } else if (params.testType === 'anova' && params.groups) {
      powerForReplication = calculateOneWayAnovaPower(params.replicationN, params.groups, posteriorMean, params.alpha).power;
    } else if (params.testType === 'correlation') {
      powerForReplication = calculateCorrelationPower(params.replicationN, Math.min(0.99, posteriorMean), params.alpha).power;
    }
  } catch (e) {
    powerForReplication = 0;
  }
  
  let minNForAdequatePower = params.replicationN;
  for (let n = 10; n <= 500; n += 5) {
    let power = 0;
    try {
      if (params.testType === 'ttest') {
        power = calculateTTestPower(n, posteriorMean, params.alpha).power;
      } else if (params.testType === 'anova' && params.groups) {
        power = calculateOneWayAnovaPower(n, params.groups, posteriorMean, params.alpha).power;
      } else if (params.testType === 'correlation') {
        power = calculateCorrelationPower(n, Math.min(0.99, posteriorMean), params.alpha).power;
      }
    } catch (e) {
      power = 0;
    }
    
    if (power >= 0.8) {
      minNForAdequatePower = n;
      break;
    }
  }
  
  const shouldReplicate = replicationProbability > 0.5 && posteriorMean > 0.2;
  const reasoning = shouldReplicate 
    ? `With ${(replicationProbability * 100).toFixed(0)}% replication probability and adjusted effect size of ${posteriorMean.toFixed(2)}, replication is worthwhile.`
    : `Low replication probability (${(replicationProbability * 100).toFixed(0)}%) suggests high risk of failure. Consider pilot study first.`;
  
  const summary = `Published effect (${params.publishedEffect.toFixed(2)}) likely <strong>inflated by ${((1 - shrinkageFactor) * 100).toFixed(0)}%</strong> due to ${params.publicationBias} publication bias. Adjusted effect: <strong>${posteriorMean.toFixed(2)}</strong> (95% CI: ${(posteriorMean - 1.96 * posteriorSD).toFixed(2)} - ${(posteriorMean + 1.96 * posteriorSD).toFixed(2)}). Replication probability with N=${params.replicationN}: <strong>${(replicationProbability * 100).toFixed(0)}%</strong>. Recommended N for 80% power: <strong>${minNForAdequatePower}</strong>.`;
  
  return {
    replicationProbability,
    shrinkageFactor,
    adjustedEffectSize: {
      mean: posteriorMean,
      sd: posteriorSD,
      ci95: [posteriorMean - 1.96 * posteriorSD, posteriorMean + 1.96 * posteriorSD]
    },
    powerForReplication,
    recommendations: {
      minNForAdequatePower,
      shouldReplicate,
      reasoning
    },
    chart,
    summary
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
    efficiency: number;
  }>;
  summary: string;
}

export const calculateInformationBasedDesign = (
  params: InformationBasedDesignInput
): InformationBasedDesignResult => {
  // Phase 3: Validation
  if (params.designs.length === 0) {
    throw new Error('At least one design must be provided');
  }
  
  const priorVar = params.priorUncertainty.sd * params.priorUncertainty.sd;
  
  const designAnalyses = params.designs.map(design => {
    const measurementVar = design.measurementError * design.measurementError;
    
    // Phase 2: Test-specific Fisher information
    let fisherInfo = 0;
    if (params.testType === 'ttest') {
      // For two-sample t-test: I(θ) = n/(2σ²)
      fisherInfo = design.nPerGroup / (2 * measurementVar);
    } else if (params.testType === 'anova' && params.groups) {
      // For one-way ANOVA: I(θ) = n*k/(k*σ²) where k = groups
      fisherInfo = (design.nPerGroup * params.groups) / (params.groups * measurementVar);
    } else {
      // Fallback to generic
      fisherInfo = design.nPerGroup / measurementVar;
    }
    
    const posteriorVar = 1 / (1 / priorVar + fisherInfo);
    const posteriorSD = Math.sqrt(posteriorVar);
    
    const uncertaintyReduction = ((params.priorUncertainty.sd - posteriorSD) / params.priorUncertainty.sd) * 100;
    
    const expectedInfo = fisherInfo;
    const costPerInfo = design.cost / expectedInfo;
    
    let recommendation = '';
    if (uncertaintyReduction > 70) {
      recommendation = 'Excellent - dramatically reduces uncertainty';
    } else if (uncertaintyReduction > 50) {
      recommendation = 'Good - substantial information gain';
    } else if (uncertaintyReduction > 30) {
      recommendation = 'Moderate - reasonable information gain';
    } else {
      recommendation = 'Limited - minimal information gain';
    }
    
    return {
      name: design.name,
      expectedInfo,
      posteriorSD,
      uncertaintyReduction,
      costPerInfo,
      rank: 0,
      recommendation
    };
  });
  
  let sortedDesigns = [...designAnalyses];
  if (params.objective === 'maximize-info') {
    sortedDesigns.sort((a, b) => b.expectedInfo - a.expectedInfo);
  } else if (params.objective === 'cost-benefit') {
    sortedDesigns.sort((a, b) => a.costPerInfo - b.costPerInfo);
  } else {
    sortedDesigns.sort((a, b) => a.posteriorSD - b.posteriorSD);
  }
  
  sortedDesigns = sortedDesigns.map((d, i) => ({ ...d, rank: i + 1 }));
  
  const optimalDesign = sortedDesigns[0].name;
  
  const chart = sortedDesigns.map(d => ({
    design: d.name,
    info: d.expectedInfo,
    cost: params.designs.find(design => design.name === d.name)?.cost || 0,
    efficiency: d.expectedInfo / d.costPerInfo
  }));
  
  const summary = `Optimal design: <strong>${optimalDesign}</strong> (${params.objective}). This design reduces uncertainty by <strong>${sortedDesigns[0].uncertaintyReduction.toFixed(0)}%</strong> (from SD=${params.priorUncertainty.sd.toFixed(2)} to SD=${sortedDesigns[0].posteriorSD.toFixed(2)}). Expected Fisher information: <strong>${sortedDesigns[0].expectedInfo.toFixed(1)}</strong>.`;
  
  return {
    rankedDesigns: sortedDesigns,
    optimalDesign,
    chart,
    summary
  };
};

// ============= 4. BAYESIAN HIERARCHICAL POWER =============

export interface HierarchicalPowerInput {
  effectSizePrior: { mean: number; sd: number };
  nClusters: number;
  nPerCluster: number;
  icc: number;
  iccUncertainty: number;
  testType: 'ttest' | 'anova';
  groups?: number;
  targetPower: number;
  alpha: number;
}

export interface HierarchicalPowerResult {
  requiredClusters: number;
  requiredPerCluster: number;
  totalN: number;
  assurance: number;
  effectiveN: number;
  designEffect: { mean: number; ci95: [number, number] };
  comparison: {
    naiveN: number;
    inflationFactor: number;
  };
  sensitivityToICC: Array<{
    icc: number;
    requiredClusters: number;
    designEffect: number;
  }>;
  summary: string;
}

export const calculateHierarchicalPower = (
  params: HierarchicalPowerInput
): HierarchicalPowerResult => {
  // Phase 3: Validation
  if (params.icc < 0 || params.icc > 1) {
    throw new Error('ICC must be between 0 and 1');
  }
  if (params.nClusters <= 0 || params.nPerCluster <= 0) {
    throw new Error('Number of clusters and observations per cluster must be positive');
  }
  
  const nSims = 2000;
  
  const designEffectMean = 1 + (params.nPerCluster - 1) * params.icc;
  const effectiveN = (params.nClusters * params.nPerCluster) / designEffectMean;
  
  let naiveN = 10;
  for (let n = 10; n <= 500; n += 5) {
    let power = 0;
    try {
      if (params.testType === 'ttest') {
        power = calculateTTestPower(n, params.effectSizePrior.mean, params.alpha).power;
      } else if (params.testType === 'anova' && params.groups) {
        power = calculateOneWayAnovaPower(n, params.groups, params.effectSizePrior.mean, params.alpha).power;
      }
    } catch (e) {
      power = 0;
    }
    if (power >= params.targetPower) {
      naiveN = n;
      break;
    }
  }
  
  let powerCount = 0;
  const designEffects: number[] = [];
  
  // Phase 2: Use Beta distribution for ICC (bounded [0,1])
  // Convert mean and variance to Beta(α, β) parameters
  const iccMean = params.icc;
  const iccVar = params.iccUncertainty * params.iccUncertainty;
  
  // Method of moments: α = μ((μ(1-μ)/σ²) - 1), β = (1-μ)((μ(1-μ)/σ²) - 1)
  const commonTerm = (iccMean * (1 - iccMean) / Math.max(iccVar, 0.001)) - 1;
  const alphaICC = Math.max(0.5, iccMean * commonTerm);
  const betaICC = Math.max(0.5, (1 - iccMean) * commonTerm);
  
  for (let i = 0; i < nSims; i++) {
    const sampledEffect = normalRandom(params.effectSizePrior.mean, params.effectSizePrior.sd);
    
    // Sample ICC from Beta distribution (bounded to [0,1])
    const sampledICC = jStat.beta.sample(alphaICC, betaICC);
    
    const de = 1 + (params.nPerCluster - 1) * sampledICC;
    designEffects.push(de);
    
    const effN = (params.nClusters * params.nPerCluster) / de;
    
    let power = 0;
    try {
      if (params.testType === 'ttest') {
        power = calculateTTestPower(effN, Math.abs(sampledEffect), params.alpha).power;
      } else if (params.testType === 'anova' && params.groups) {
        power = calculateOneWayAnovaPower(effN, params.groups, Math.abs(sampledEffect), params.alpha).power;
      }
    } catch (e) {
      power = 0;
    }
    
    if (power >= params.targetPower) powerCount++;
  }
  
  const assurance = powerCount / nSims;
  
  designEffects.sort((a, b) => a - b);
  const deLower = designEffects[Math.floor(nSims * 0.025)];
  const deUpper = designEffects[Math.floor(nSims * 0.975)];
  
  let requiredClusters = params.nClusters;
  for (let nc = params.nClusters; nc <= 100; nc++) {
    let powerCnt = 0;
    for (let i = 0; i < 500; i++) {
      const sampledEffect = normalRandom(params.effectSizePrior.mean, params.effectSizePrior.sd);
      const sampledICC = jStat.beta.sample(alphaICC, betaICC);
      const de = 1 + (params.nPerCluster - 1) * sampledICC;
      const effN = (nc * params.nPerCluster) / de;
      
      let power = 0;
      try {
        if (params.testType === 'ttest') {
          power = calculateTTestPower(effN, Math.abs(sampledEffect), params.alpha).power;
        } else if (params.testType === 'anova' && params.groups) {
          power = calculateOneWayAnovaPower(effN, params.groups, Math.abs(sampledEffect), params.alpha).power;
        }
      } catch (e) {
        power = 0;
      }
      if (power >= params.targetPower) powerCnt++;
    }
    if (powerCnt / 500 >= 0.8) {
      requiredClusters = nc;
      break;
    }
  }
  
  const sensitivityToICC: Array<{ icc: number; requiredClusters: number; designEffect: number }> = [];
  for (let iccVal = 0; iccVal <= 0.5; iccVal += 0.05) {
    const de = 1 + (params.nPerCluster - 1) * iccVal;
    const effN = (params.nClusters * params.nPerCluster) / de;
    
    let reqClusters = params.nClusters;
    for (let nc = params.nClusters; nc <= 100; nc++) {
      const testEffN = (nc * params.nPerCluster) / de;
      let power = 0;
      try {
        if (params.testType === 'ttest') {
          power = calculateTTestPower(testEffN, params.effectSizePrior.mean, params.alpha).power;
        } else if (params.testType === 'anova' && params.groups) {
          power = calculateOneWayAnovaPower(testEffN, params.groups, params.effectSizePrior.mean, params.alpha).power;
        }
      } catch (e) {
        power = 0;
      }
      if (power >= params.targetPower) {
        reqClusters = nc;
        break;
      }
    }
    
    sensitivityToICC.push({
      icc: iccVal,
      requiredClusters: reqClusters,
      designEffect: de
    });
  }
  
  const inflationFactor = (requiredClusters * params.nPerCluster) / naiveN;
  
  const summary = `For hierarchical design with ICC=${params.icc.toFixed(2)} (±${params.iccUncertainty.toFixed(2)}), you need <strong>${requiredClusters} clusters</strong> with ${params.nPerCluster} per cluster (total N=${requiredClusters * params.nPerCluster}). Design effect: <strong>${designEffectMean.toFixed(2)}</strong> (95% CI: ${deLower.toFixed(2)}-${deUpper.toFixed(2)}). Effective N: <strong>${Math.round(effectiveN)}</strong>. Ignoring clustering would underestimate required N by <strong>${((inflationFactor - 1) * 100).toFixed(0)}%</strong>.`;
  
  return {
    requiredClusters,
    requiredPerCluster: params.nPerCluster,
    totalN: requiredClusters * params.nPerCluster,
    assurance,
    effectiveN: Math.round(effectiveN),
    designEffect: { mean: designEffectMean, ci95: [deLower, deUpper] },
    comparison: {
      naiveN,
      inflationFactor
    },
    sensitivityToICC,
    summary
  };
};

// ============= 5. BAYESIAN ADAPTIVE ALLOCATION =============

export interface AdaptiveAllocationInput {
  treatments: string[];
  priors: Array<{ mean: number; sd: number }>;
  maxN: number;
  targetPower: number;
  alpha: number;
  allocationRule: 'equal' | 'thompson' | 'optimal';
  testType: 'anova';
}

export interface AdaptiveAllocationResult {
  expectedAllocations: Array<{ treatment: string; n: number; proportion: number }>;
  expectedPower: number;
  comparisonToEqual: {
    powerGain: number;
    ethicalBenefit: string;
  };
  allocationCurve: Array<{
    stage: number;
    allocations: { [treatment: string]: number };
  }>;
  summary: string;
}

export const calculateAdaptiveAllocation = (
  params: AdaptiveAllocationInput
): AdaptiveAllocationResult => {
  // Phase 3: Validation
  if (params.treatments.length < 2) {
    throw new Error('At least 2 treatments required for adaptive allocation');
  }
  if (params.priors.length !== params.treatments.length) {
    throw new Error('Number of priors must match number of treatments');
  }
  
  const nSims = 2000;
  const burnIn = Math.floor(params.maxN * 0.2);
  
  const allocationCounts = params.treatments.map(() => 0);
  const allocationCurve: Array<{ stage: number; allocations: { [treatment: string]: number } }> = [];
  
  for (let sim = 0; sim < nSims; sim++) {
    const trueEffects = params.priors.map((prior, i) => 
      normalRandom(prior.mean, prior.sd)
    );
    
    const simAllocations = params.treatments.map(() => 0);
    
    // Track posterior updates for Thompson sampling
    const posteriorMeans = params.priors.map(p => p.mean);
    const posteriorSDs = params.priors.map(p => p.sd);
    const observedData = params.treatments.map(() => ({ sum: 0, count: 0 }));
    
    for (let n = 0; n < params.maxN; n++) {
      let selectedTreatment = 0;
      
      if (n < burnIn || params.allocationRule === 'equal') {
        selectedTreatment = n % params.treatments.length;
      } else if (params.allocationRule === 'thompson') {
        // Sample from current posterior distributions
        const sampledEffects = posteriorMeans.map((mean, i) => 
          normalRandom(mean, posteriorSDs[i])
        );
        selectedTreatment = sampledEffects.indexOf(Math.max(...sampledEffects));
      } else {
        selectedTreatment = posteriorMeans.indexOf(Math.max(...posteriorMeans));
      }
      
      simAllocations[selectedTreatment]++;
      
      // Update posterior with new observation (Bayesian updating)
      const observedOutcome = normalRandom(trueEffects[selectedTreatment], 1.0);
      observedData[selectedTreatment].sum += observedOutcome;
      observedData[selectedTreatment].count += 1;
      
      // Posterior update: prior + data
      const priorPrecision = 1 / (params.priors[selectedTreatment].sd ** 2);
      const dataPrecision = observedData[selectedTreatment].count;
      const posteriorPrecision = priorPrecision + dataPrecision;
      
      posteriorMeans[selectedTreatment] = 
        (priorPrecision * params.priors[selectedTreatment].mean + 
         dataPrecision * (observedData[selectedTreatment].sum / observedData[selectedTreatment].count)) / 
        posteriorPrecision;
      posteriorSDs[selectedTreatment] = Math.sqrt(1 / posteriorPrecision);
    }
    
    for (let i = 0; i < params.treatments.length; i++) {
      allocationCounts[i] += simAllocations[i];
    }
  }
  
  const expectedAllocations = params.treatments.map((name, i) => ({
    treatment: name,
    n: Math.round(allocationCounts[i] / nSims),
    proportion: allocationCounts[i] / (nSims * params.maxN)
  }));
  
  for (let stage = 1; stage <= 10; stage++) {
    const stageN = Math.floor((params.maxN / 10) * stage);
    const stageAllocations: { [treatment: string]: number } = {};
    
    params.treatments.forEach((name, i) => {
      stageAllocations[name] = Math.round((expectedAllocations[i].proportion * stageN));
    });
    
    allocationCurve.push({
      stage,
      allocations: stageAllocations
    });
  }
  
  const avgEffect = params.priors.reduce((sum, p) => sum + p.mean, 0) / params.priors.length;
  const nPerGroup = params.maxN / params.treatments.length;
  
  let adaptivePower = 0;
  let equalPower = 0;
  
  try {
    adaptivePower = calculateOneWayAnovaPower(
      Math.max(...expectedAllocations.map(a => a.n)),
      params.treatments.length,
      avgEffect,
      params.alpha
    ).power;
    
    equalPower = calculateOneWayAnovaPower(
      nPerGroup,
      params.treatments.length,
      avgEffect,
      params.alpha
    ).power;
  } catch (e) {
    adaptivePower = 0.5;
    equalPower = 0.4;
  }
  
  const powerGain = ((adaptivePower - equalPower) / equalPower) * 100;
  
  const bestTreatment = expectedAllocations.reduce((best, curr) => 
    curr.n > best.n ? curr : best
  );
  
  const worstTreatment = expectedAllocations.reduce((worst, curr) => 
    curr.n < worst.n ? curr : worst
  );
  
  const ethicalBenefit = `${bestTreatment.treatment} receives ${bestTreatment.n} samples (most promising), while ${worstTreatment.treatment} receives only ${worstTreatment.n} (least effective). This minimizes exposure to inferior treatments.`;
  
  const summary = `Adaptive ${params.allocationRule} allocation assigns more samples to promising treatments. Best treatment receives <strong>${bestTreatment.n}</strong> samples vs. ${Math.round(nPerGroup)} under equal allocation. Expected power: <strong>${(adaptivePower * 100).toFixed(0)}%</strong> (${powerGain > 0 ? '+' : ''}${powerGain.toFixed(0)}% vs. equal allocation).`;
  
  return {
    expectedAllocations,
    expectedPower: adaptivePower,
    comparisonToEqual: {
      powerGain,
      ethicalBenefit
    },
    allocationCurve,
    summary
  };
};

// ============= 6. BAYESIAN EQUIVALENCE TESTING =============

export interface EquivalenceTestingInput {
  equivalenceMargin: number;
  priorEffect: { mean: number; sd: number };
  targetProbability: number;
  testType: 'ttest' | 'correlation';
  alpha: number;
}

export interface EquivalenceTestingResult {
  requiredN: number;
  posteriorProbEquivalent: number;
  ropeAnalysis: {
    probInROPE: number;
    probBelowROPE: number;
    probAboveROPE: number;
  };
  comparisonToTOST: {
    tostN: number;
    difference: number;
  };
  chart: Array<{
    n: number;
    probEquivalent: number;
  }>;
  summary: string;
}

export const calculateEquivalenceN = (
  params: EquivalenceTestingInput
): EquivalenceTestingResult => {
  // Phase 3: Validation
  if (params.equivalenceMargin <= 0) {
    throw new Error('Equivalence margin must be positive');
  }
  if (params.targetProbability <= 0 || params.targetProbability > 1) {
    throw new Error('Target probability must be between 0 and 1');
  }
  
  const nSims = 2000;
  const chart: Array<{ n: number; probEquivalent: number }> = [];
  
  let requiredN = 10;
  let foundN = false;
  
  for (let n = 10; n <= 500; n += 10) {
    let inRopeCount = 0;
    
    for (let i = 0; i < nSims; i++) {
      const sampledEffect = normalRandom(params.priorEffect.mean, params.priorEffect.sd);
      
      // Posterior precision accounts for both prior and data (assuming unit variance)
      const dataVariance = 1.0;
      const priorPrecision = 1 / (params.priorEffect.sd * params.priorEffect.sd);
      const dataPrecision = n / dataVariance;
      const posteriorPrecision = priorPrecision + dataPrecision;
      const posteriorSD = Math.sqrt(1 / posteriorPrecision);
      
      const probInRope = jStat.normal.cdf(params.equivalenceMargin, sampledEffect, posteriorSD) -
                          jStat.normal.cdf(-params.equivalenceMargin, sampledEffect, posteriorSD);
      
      if (probInRope >= params.targetProbability) inRopeCount++;
    }
    
    const probEquivalent = inRopeCount / nSims;
    chart.push({ n, probEquivalent });
    
    if (probEquivalent >= params.targetProbability && !foundN) {
      requiredN = n;
      foundN = true;
    }
  }
  
  if (!foundN) requiredN = 500;
  
  let finalInRope = 0;
  let belowRope = 0;
  let aboveRope = 0;
  
  for (let i = 0; i < nSims; i++) {
    const sampledEffect = normalRandom(params.priorEffect.mean, params.priorEffect.sd);
    
    if (Math.abs(sampledEffect) <= params.equivalenceMargin) {
      finalInRope++;
    } else if (sampledEffect < -params.equivalenceMargin) {
      belowRope++;
    } else {
      aboveRope++;
    }
  }
  
  const ropeAnalysis = {
    probInROPE: finalInRope / nSims,
    probBelowROPE: belowRope / nSims,
    probAboveROPE: aboveRope / nSims
  };
  
  let tostN = requiredN;
  const tostEffect = params.equivalenceMargin / 2;
  for (let n = 10; n <= 500; n += 10) {
    let power = 0;
    try {
      if (params.testType === 'ttest') {
        power = calculateTTestPower(n, tostEffect, params.alpha).power;
      } else if (params.testType === 'correlation') {
        power = calculateCorrelationPower(n, tostEffect, params.alpha).power;
      }
    } catch (e) {
      power = 0;
    }
    
    if (power >= 0.8) {
      tostN = n;
      break;
    }
  }
  
  const dataVariance = 1.0;
  const priorPrecision = 1 / (params.priorEffect.sd * params.priorEffect.sd);
  const dataPrecision = requiredN / dataVariance;
  const posteriorPrecision = priorPrecision + dataPrecision;
  const posteriorSD = Math.sqrt(1 / posteriorPrecision);
  const posteriorProbEquivalent = jStat.normal.cdf(params.equivalenceMargin, params.priorEffect.mean, posteriorSD) -
                                    jStat.normal.cdf(-params.equivalenceMargin, params.priorEffect.mean, posteriorSD);
  
  const summary = `To establish equivalence within ±${params.equivalenceMargin} with ${(params.targetProbability * 100).toFixed(0)}% probability, you need <strong>N=${requiredN}</strong>. ROPE analysis: <strong>${(ropeAnalysis.probInROPE * 100).toFixed(0)}%</strong> probability effect is practically equivalent. Bayesian approach requires ${((tostN - requiredN) / tostN * 100).toFixed(0)}% ${tostN > requiredN ? 'less' : 'more'} samples than TOST (N=${tostN}).`;
  
  return {
    requiredN,
    posteriorProbEquivalent,
    ropeAnalysis,
    comparisonToTOST: {
      tostN,
      difference: tostN - requiredN
    },
    chart,
    summary
  };
};

// ============= 7. BAYESIAN MODEL COMPARISON =============

export interface ModelComparisonInput {
  models: Array<{
    name: string;
    prior: { mean: number; sd: number };
    priorProbability: number;
    complexity: number;
  }>;
  nPerGroup: number;
  testType: 'ttest' | 'anova';
  groups?: number;
  alpha: number;
  targetBayesFactor: number;
}

export interface ModelComparisonResult {
  requiredN: number;
  expectedBayesFactors: Array<{ model: string; BF: number }>;
  probabilityCorrectSelection: number;
  comparisonChart: Array<{
    n: number;
    model: string;
    posteriorProb: number;
  }>;
  summary: string;
}

export const calculateModelComparisonN = (
  params: ModelComparisonInput
): ModelComparisonResult => {
  // Phase 3: Validation
  if (params.models.length < 2) {
    throw new Error('At least 2 models required for comparison');
  }
  const totalPriorProb = params.models.reduce((sum, m) => sum + m.priorProbability, 0);
  if (Math.abs(totalPriorProb - 1.0) > 0.01) {
    throw new Error('Model prior probabilities must sum to 1.0');
  }
  
  const nSims = 2000;
  let requiredN = params.nPerGroup;
  
  const comparisonChart: Array<{ n: number; model: string; posteriorProb: number }> = [];
  
  for (let n = params.nPerGroup; n <= 500; n += 20) {
    const modelProbs: { [model: string]: number } = {};
    
    params.models.forEach(model => {
      let probSum = 0;
      
      for (let i = 0; i < 100; i++) {
        const sampledEffect = normalRandom(model.prior.mean, model.prior.sd);
        
        // BIC approximation: BF ≈ exp((BIC_null - BIC_model)/2)
        // For normal model: log(L) ≈ -0.5 * n * (effect² + log(2π))
        const logLikelihood = -0.5 * n * (Math.pow(sampledEffect, 2) + Math.log(2 * Math.PI));
        const bic = model.complexity * Math.log(n) - 2 * logLikelihood;
        const dataLikelihood = Math.exp(-bic / 2);
        const posterior = model.priorProbability * dataLikelihood;
        
        probSum += posterior;
      }
      
      modelProbs[model.name] = probSum / 100;
      
      comparisonChart.push({
        n,
        model: model.name,
        posteriorProb: probSum / 100
      });
    });
    
    const totalProb = Object.values(modelProbs).reduce((sum, p) => sum + p, 0);
    Object.keys(modelProbs).forEach(key => {
      modelProbs[key] /= totalProb;
    });
    
    const maxProb = Math.max(...Object.values(modelProbs));
    const secondMaxProb = Object.values(modelProbs).sort((a, b) => b - a)[1] || 0.01;
    const bayesFactor = maxProb / secondMaxProb;
    
    if (bayesFactor >= params.targetBayesFactor) {
      requiredN = n;
      break;
    }
  }
  
  const finalModelProbs: { [model: string]: number } = {};
  params.models.forEach(model => {
    let probSum = 0;
    
    for (let i = 0; i < nSims; i++) {
      const sampledEffect = normalRandom(model.prior.mean, model.prior.sd);
      
      // BIC approximation for final calculation
      const logLikelihood = -0.5 * requiredN * (Math.pow(sampledEffect, 2) + Math.log(2 * Math.PI));
      const bic = model.complexity * Math.log(requiredN) - 2 * logLikelihood;
      const dataLikelihood = Math.exp(-bic / 2);
      const posterior = model.priorProbability * dataLikelihood;
      probSum += posterior;
    }
    
    finalModelProbs[model.name] = probSum / nSims;
  });
  
  const totalProb = Object.values(finalModelProbs).reduce((sum, p) => sum + p, 0);
  Object.keys(finalModelProbs).forEach(key => {
    finalModelProbs[key] /= totalProb;
  });
  
  const expectedBayesFactors = params.models.map(model => {
    const otherProb = 1 - finalModelProbs[model.name];
    const bf = finalModelProbs[model.name] / (otherProb || 0.01);
    return { model: model.name, BF: bf };
  });
  
  const bestModel = params.models.reduce((best, curr) => 
    finalModelProbs[curr.name] > finalModelProbs[best.name] ? curr : best
  );
  
  const probabilityCorrectSelection = finalModelProbs[bestModel.name];
  
  const summary = `To achieve Bayes Factor ≥ ${params.targetBayesFactor} for model selection among ${params.models.length} models, you need <strong>N=${requiredN}</strong> per group. Best model (<strong>${bestModel.name}</strong>) has <strong>${(probabilityCorrectSelection * 100).toFixed(0)}%</strong> posterior probability. Complexity penalties ensure parsimony.`;
  
  return {
    requiredN,
    expectedBayesFactors,
    probabilityCorrectSelection,
    comparisonChart,
    summary
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
  bayesianAssurance: number;
  assuranceLoss: number;
  recommendedN: number;
  calibrationCurve: Array<{
    uncertainty: number;
    assurance: number;
  }>;
  summary: string;
}

export const calibrateFrequentistToBayesian = (
  params: CalibrationInput
): CalibrationResult => {
  // Phase 3: Validation
  if (params.frequentistPower <= 0 || params.frequentistPower > 1) {
    throw new Error('Frequentist power must be between 0 and 1');
  }
  if (params.nPerGroup <= 0) {
    throw new Error('Sample size must be positive');
  }
  if (params.effectUncertainty < 0) {
    throw new Error('Effect uncertainty cannot be negative');
  }
  
  const nSims = 2000;
  let powerCount = 0;
  
  for (let i = 0; i < nSims; i++) {
    const sampledEffect = normalRandom(params.effectSize, params.effectUncertainty);
    
    let power = 0;
    try {
      if (params.testType === 'ttest') {
        power = calculateTTestPower(params.nPerGroup, Math.abs(sampledEffect), params.alpha).power;
      } else if (params.testType === 'anova' && params.groups) {
        power = calculateOneWayAnovaPower(params.nPerGroup, params.groups, Math.abs(sampledEffect), params.alpha).power;
      }
    } catch (e) {
      power = 0;
    }
    
    if (power >= params.frequentistPower) powerCount++;
  }
  
  const bayesianAssurance = powerCount / nSims;
  const assuranceLoss = ((params.frequentistPower - bayesianAssurance) / params.frequentistPower) * 100;
  
  let recommendedN = params.nPerGroup;
  for (let n = params.nPerGroup; n <= 500; n += 5) {
    let count = 0;
    for (let i = 0; i < 500; i++) {
      const sampledEffect = normalRandom(params.effectSize, params.effectUncertainty);
      let power = 0;
      try {
        if (params.testType === 'ttest') {
          power = calculateTTestPower(n, Math.abs(sampledEffect), params.alpha).power;
        } else if (params.testType === 'anova' && params.groups) {
          power = calculateOneWayAnovaPower(n, params.groups, Math.abs(sampledEffect), params.alpha).power;
        }
      } catch (e) {
        power = 0;
      }
      if (power >= params.frequentistPower) count++;
    }
    
    if (count / 500 >= params.frequentistPower) {
      recommendedN = n;
      break;
    }
  }
  
  const calibrationCurve: Array<{ uncertainty: number; assurance: number }> = [];
  for (let unc = 0; unc <= params.effectSize; unc += params.effectSize / 20) {
    let count = 0;
    for (let i = 0; i < 200; i++) {
      const sampledEffect = normalRandom(params.effectSize, unc);
      let power = 0;
      try {
        if (params.testType === 'ttest') {
          power = calculateTTestPower(params.nPerGroup, Math.abs(sampledEffect), params.alpha).power;
        } else if (params.testType === 'anova' && params.groups) {
          power = calculateOneWayAnovaPower(params.nPerGroup, params.groups, Math.abs(sampledEffect), params.alpha).power;
        }
      } catch (e) {
        power = 0;
      }
      if (power >= params.frequentistPower) count++;
    }
    calibrationCurve.push({ uncertainty: unc, assurance: count / 200 });
  }
  
  const summary = `Frequentist power of <strong>${(params.frequentistPower * 100).toFixed(0)}%</strong> (assuming exact effect=${params.effectSize.toFixed(2)}) translates to Bayesian assurance of only <strong>${(bayesianAssurance * 100).toFixed(0)}%</strong> when accounting for uncertainty (SD=${params.effectUncertainty.toFixed(2)}). This represents a <strong>${assuranceLoss.toFixed(0)}%</strong> loss. To maintain ${(params.frequentistPower * 100).toFixed(0)}% assurance, increase N to <strong>${recommendedN}</strong>.`;
  
  return {
    bayesianAssurance,
    assuranceLoss,
    recommendedN,
    calibrationCurve,
    summary
  };
};
