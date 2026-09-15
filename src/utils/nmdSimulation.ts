import jStat from 'jstat';

// Seeded random number generator for reproducible simulations
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    // Linear Congruential Generator
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    // Offset by half a step so the result is in (0, 1): Box-Muller needs log(u) finite
    return (this.seed + 0.5) / 4294967296;
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

// Critical value F_{0.05; p, n-p} for the Hotelling T^2 region
const getFCritical = (n: number, p: number = 2): number => {
  if (n <= p) return Infinity;
  return jStat.centralF.inv(0.95, p, n - p);
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
  // Guard against a tiny negative discriminant from floating-point rounding
  const disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
  const lambda1 = trace / 2 + disc;
  const lambda2 = Math.max(0, trace / 2 - disc);
  
  // Rotation angle of ellipse
  const rotation = Math.atan2(lambda1 - covXX, covXY) * (180 / Math.PI);
  
  // ===== CONFIDENCE REGION FOR THE GROUP CENTROID (HOTELLING T^2) =====
  // (x_bar - mu)' S^-1 (x_bar - mu) <= p (n-1) / (n (n-p)) * F_{alpha; p, n-p}
  // so each semi-axis is sqrt(eigenvalue * c). p = 2 for a 2D ordination.
  const p = 2;
  const fCritical = getFCritical(n, p);
  const c = (p * (n - 1) * fCritical) / (n * (n - p));

  // Visual amplification for small samples (UX only, not part of the formula)
  const visualAmplification = n < 10 ? 1.3 : n < 20 ? 1.15 : 1.0;
  const safe = (v: number) => (Number.isFinite(v) ? v : 0);

  return {
    cx: meanX,
    cy: meanY,
    rx: safe(Math.sqrt(lambda1 * c) * visualAmplification),
    ry: safe(Math.sqrt(lambda2 * c) * visualAmplification),
    rotation
  };
};
