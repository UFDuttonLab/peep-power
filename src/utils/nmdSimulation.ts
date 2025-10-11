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
  const groupNames = ['Group A', 'Group B', 'Group C', 'Group D'];
  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];
  
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
  // Calculate centroid (mean)
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  
  // Calculate covariance matrix
  let covXX = 0, covYY = 0, covXY = 0;
  points.forEach(p => {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    covXX += dx * dx;
    covYY += dy * dy;
    covXY += dx * dy;
  });
  covXX /= points.length - 1;
  covYY /= points.length - 1;
  covXY /= points.length - 1;
  
  // Compute eigenvalues for principal axes
  const trace = covXX + covYY;
  const det = covXX * covYY - covXY * covXY;
  const lambda1 = trace/2 + Math.sqrt(trace*trace/4 - det);
  const lambda2 = trace/2 - Math.sqrt(trace*trace/4 - det);
  
  // Rotation angle of ellipse
  const rotation = Math.atan2(lambda1 - covXX, covXY) * (180 / Math.PI);
  
  // Chi-square critical value for 2D at 95% confidence
  const chiSquare = 5.991;
  
  return {
    cx: meanX,
    cy: meanY,
    rx: Math.sqrt(lambda1 * chiSquare),
    ry: Math.sqrt(lambda2 * chiSquare),
    rotation
  };
};
