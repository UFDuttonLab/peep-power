// Seeded random number generator for reproducible simulations
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    // Linear Congruential Generator
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
}

export interface NMDSPoint {
  x: number;
  y: number;
  group: number;
  groupName: string;
}

export interface EllipseParams {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
  color: string;
  groupName: string;
}

// F-distribution approximation for (2, n-2) degrees of freedom at α=0.05
const getFCritical = (n: number): number => {
  if (n < 3) return 10; // Minimum sample size
  
  // Simple approximation using lookup table with interpolation
  const lookupTable = [
    { n: 3, f: 19.00 },
    { n: 5, f: 6.94 },
    { n: 10, f: 4.46 },
    { n: 15, f: 3.89 },
    { n: 20, f: 3.55 },
    { n: 30, f: 3.33 },
    { n: 50, f: 3.18 },
    { n: 100, f: 3.09 },
    { n: 200, f: 3.04 },
    { n: Infinity, f: 3.00 }
  ];
  
  // Find bracketing values and interpolate
  for (let i = 0; i < lookupTable.length - 1; i++) {
    if (n <= lookupTable[i + 1].n) {
      const lower = lookupTable[i];
      const upper = lookupTable[i + 1];
      const t = (n - lower.n) / (upper.n - lower.n);
      return lower.f + t * (upper.f - lower.f);
    }
  }
  return 3.00; // For very large n
};

export const generateNMDSData = (
  nPerGroup: number,
  numGroups: number,
  rSquared: number,
  seed: number = 42
): { points: NMDSPoint[], ellipses: EllipseParams[] } => {
  const rng = new SeededRandom(seed);
  // Calculate separation based on R²
  const effectMagnitude = Math.sqrt(rSquared / (1 - rSquared + 0.001));
  
  // Position group centroids in ordination space
  const centroids = [];
  for (let g = 0; g < numGroups; g++) {
    const angle = (2 * Math.PI * g) / numGroups;
    centroids.push({
      x: effectMagnitude * 3 * Math.cos(angle),
      y: effectMagnitude * 3 * Math.sin(angle)
    });
  }
  
  // Generate sample points around centroids with Gaussian noise
  const points: NMDSPoint[] = [];
  const groupNames = ['Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F', 'Group G', 'Group H', 'Group I', 'Group J'];
  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
  
  for (let g = 0; g < numGroups; g++) {
    for (let i = 0; i < nPerGroup; i++) {
      // Box-Muller transform for Gaussian noise using seeded random
      const u1 = rng.next();
      const u2 = rng.next();
      const noise_x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const noise_y = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
      
      points.push({
        x: centroids[g].x + noise_x,
        y: centroids[g].y + noise_y,
        group: g,
        groupName: groupNames[g]
      });
    }
  }
  
  // Calculate 95% confidence ellipses for each group
  const ellipses: EllipseParams[] = [];
  for (let g = 0; g < numGroups; g++) {
    const groupPoints = points.filter(p => p.group === g);
    const ellipse = calculateConfidenceEllipse(groupPoints, 0.95);
    ellipses.push({
      ...ellipse,
      color: colors[g],
      groupName: groupNames[g]
    });
  }
  
  return { points, ellipses };
};

export const calculateConfidenceEllipse = (
  points: NMDSPoint[],
  confidence: number
): { cx: number, cy: number, rx: number, ry: number, rotation: number } => {
  const n = points.length;
  
  // Calculate centroid (mean)
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;
  
  // Calculate covariance matrix
  let covXX = 0, covYY = 0, covXY = 0;
  points.forEach(p => {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    covXX += dx * dx;
    covYY += dy * dy;
    covXY += dx * dy;
  });
  covXX /= (n - 1);
  covYY /= (n - 1);
  covXY /= (n - 1);
  
  // Compute eigenvalues for principal axes
  const trace = covXX + covYY;
  const det = covXX * covYY - covXY * covXY;
  const lambda1 = trace/2 + Math.sqrt(trace*trace/4 - det);
  const lambda2 = trace/2 - Math.sqrt(trace*trace/4 - det);
  
  // Rotation angle of ellipse
  const rotation = Math.atan2(lambda1 - covXX, covXY) * (180 / Math.PI);
  
  // Sample-size-dependent scaling factor using F-distribution
  // Formula: sqrt((n-1) * p * F_critical / (n-p))
  // where p = 2 (number of dimensions)
  const p = 2;
  const fCritical = getFCritical(n);
  const scaleFactor = Math.sqrt((n - 1) * p * fCritical / (n - p));
  
  return {
    cx: meanX,
    cy: meanY,
    rx: Math.sqrt(lambda1 * scaleFactor),
    ry: Math.sqrt(lambda2 * scaleFactor),
    rotation
  };
};
