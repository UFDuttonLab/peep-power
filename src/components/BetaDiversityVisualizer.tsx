import { useEffect, useState } from 'react';
import { generateNMDSData, NMDSPoint, EllipseParams } from '@/utils/nmdSimulation';
import { calculatePERMANOVAPower } from '@/utils/powerCalculations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

interface Props {
  nPerGroup: number;
  groups: number;
  rSquared: number;
}

const BetaDiversityVisualizer = ({ nPerGroup, groups, rSquared }: Props) => {
  const [data, setData] = useState<{ points: NMDSPoint[], ellipses: EllipseParams[] }>({ 
    points: [], 
    ellipses: [] 
  });
  const [simulationSeed, setSimulationSeed] = useState(() => Math.floor(Math.random() * 1000000));
  const [calculatedPower, setCalculatedPower] = useState<number | null>(null);

  // Regenerate seed only when number of groups changes
  useEffect(() => {
    setSimulationSeed(Math.floor(Math.random() * 1000000));
  }, [groups]);

  // Generate data with stable seed
  useEffect(() => {
    const newData = generateNMDSData(nPerGroup, groups, rSquared, simulationSeed);
    setData(newData);
  }, [nPerGroup, groups, rSquared, simulationSeed]);

  // Calculate statistical power
  useEffect(() => {
    const result = calculatePERMANOVAPower(nPerGroup, groups, rSquared, 0.05);
    setCalculatedPower(result.power);
  }, [nPerGroup, groups, rSquared]);

  const padding = 60;
  const width = 600;
  const height = 650;
  const plotWidth = width - 2 * padding;
  const plotHeight = height - 2 * padding;
  
  // Find data bounds
  const allX = data.points.map(p => p.x);
  const allY = data.points.map(p => p.y);
  const minX = Math.min(...allX, -5);
  const maxX = Math.max(...allX, 5);
  const minY = Math.min(...allY, -5);
  const maxY = Math.max(...allY, 5);
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  
  // Coordinate transformation
  const toSVGX = (x: number) => padding + ((x - minX) / rangeX) * plotWidth;
  const toSVGY = (y: number) => padding + plotHeight - ((y - minY) / rangeY) * plotHeight;
  const scaleX = (val: number) => (val / rangeX) * plotWidth;
  const scaleY = (val: number) => (val / rangeY) * plotHeight;

  return (
    <div className="w-full bg-card border rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground">NMDS Ordination Plot</h3>
        <button
          onClick={() => setSimulationSeed(Math.floor(Math.random() * 1000000))}
          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          Regenerate
        </button>
      </div>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="max-w-full">
        {/* Background */}
        <rect x={padding} y={padding} width={plotWidth} height={plotHeight} 
          fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
        
        {/* Grid lines */}
        {[-4, -2, 0, 2, 4].map(val => (
          <g key={`grid-${val}`}>
            <line
              x1={toSVGX(val)}
              y1={padding}
              x2={toSVGX(val)}
              y2={padding + plotHeight}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              opacity="0.3"
              strokeDasharray="2,2"
            />
            <line
              x1={padding}
              y1={toSVGY(val)}
              x2={padding + plotWidth}
              y2={toSVGY(val)}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              opacity="0.3"
              strokeDasharray="2,2"
            />
          </g>
        ))}
        
        {/* Uncertainty overlay for small samples */}
        {nPerGroup < 20 && data.ellipses.map((ellipse, i) => (
          <ellipse
            key={`uncertainty-${i}`}
            cx={toSVGX(ellipse.cx)}
            cy={toSVGY(ellipse.cy)}
            rx={scaleX(ellipse.rx * 1.5)}
            ry={scaleY(ellipse.ry * 1.5)}
            transform={`rotate(${-ellipse.rotation} ${toSVGX(ellipse.cx)} ${toSVGY(ellipse.cy)})`}
            fill={ellipse.color}
            fillOpacity="0.05"
            stroke={ellipse.color}
            strokeWidth="1"
            strokeDasharray="1,3"
            strokeOpacity="0.3"
          />
        ))}
        
        {/* Confidence ellipses */}
        {data.ellipses.map((ellipse, i) => (
          <ellipse
            key={`ellipse-${i}`}
            cx={toSVGX(ellipse.cx)}
            cy={toSVGY(ellipse.cy)}
            rx={scaleX(ellipse.rx)}
            ry={scaleY(ellipse.ry)}
            transform={`rotate(${-ellipse.rotation} ${toSVGX(ellipse.cx)} ${toSVGY(ellipse.cy)})`}
            fill={ellipse.color}
            fillOpacity="0.15"
            stroke={ellipse.color}
            strokeWidth="2"
            strokeDasharray="4,4"
          />
        ))}
        
        {/* Sample points */}
        {data.points.map((point, i) => {
          const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
          return (
            <circle
              key={`point-${i}`}
              cx={toSVGX(point.x)}
              cy={toSVGY(point.y)}
              r="4"
              fill={colors[point.group]}
              opacity="0.7"
              stroke="white"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Axes labels */}
        <text x={width/2} y={height - 20} textAnchor="middle" 
          fontSize="28" fill="hsl(var(--foreground))" fontWeight="600">
          NMDS1
        </text>
        <text x={10} y={height/2} textAnchor="middle" 
          fontSize="28" fill="hsl(var(--foreground))" fontWeight="600"
          transform={`rotate(-90 10 ${height/2})`}>
          NMDS2
        </text>
        
        {/* Legend */}
        {data.ellipses.map((ellipse, i) => (
          <g key={`legend-${i}`} transform={`translate(${width - 120}, ${30 + i * 25})`}>
            <circle cx="10" cy="0" r="6" fill={ellipse.color} opacity="0.7" />
            <text x="25" y="4" fontSize="24" fill="hsl(var(--foreground))">
              {ellipse.groupName}
            </text>
          </g>
        ))}
      </svg>
      
      <div className="mt-3 space-y-2">
        <div className="text-xs text-muted-foreground">
          <p className="mb-1">
            Dashed ellipses represent 95% confidence intervals. 
            R² = {(rSquared * 100).toFixed(1)}% variance explained 
            ({rSquared < 0.05 ? 'small' : rSquared < 0.12 ? 'moderate' : 'large'} effect size).
          </p>
          {calculatedPower !== null && (
            <p className="text-xs font-semibold mt-1">
              Statistical power with n={nPerGroup}/group: {(calculatedPower * 100).toFixed(0)}%
              {calculatedPower < 0.6 && ' ⚠️ Low power - results may be unreliable'}
              {calculatedPower >= 0.6 && calculatedPower < 0.8 && ' ⚠️ Moderate power'}
              {calculatedPower >= 0.8 && ' ✓ Adequate power'}
            </p>
          )}
        </div>
        
        {calculatedPower !== null && calculatedPower < 0.6 && (
          <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-400">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Why does separation look clear but power is low?</strong>
              <p className="mt-1">
                This plot shows ONE simulated dataset. With small samples (n={nPerGroup}/group), 
                you might get lucky and see apparent separation in your specific sample. 
                However, with only {(calculatedPower * 100).toFixed(0)}% power, 
                you would NOT reliably detect this effect if you repeated the study. 
                The wide confidence ellipses show this uncertainty.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default BetaDiversityVisualizer;
