import { useEffect, useState } from 'react';
import { generateNMDSData, NMDSPoint, EllipseParams } from '@/utils/nmdSimulation';

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

  useEffect(() => {
    const newData = generateNMDSData(nPerGroup, groups, rSquared);
    setData(newData);
  }, [nPerGroup, groups, rSquared]);

  const padding = 60;
  const width = 600;
  const height = 500;
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
          const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];
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
          fontSize="14" fill="hsl(var(--foreground))" fontWeight="600">
          NMDS1
        </text>
        <text x={20} y={height/2} textAnchor="middle" 
          fontSize="14" fill="hsl(var(--foreground))" fontWeight="600"
          transform={`rotate(-90 20 ${height/2})`}>
          NMDS2
        </text>
        
        {/* Legend */}
        {data.ellipses.map((ellipse, i) => (
          <g key={`legend-${i}`} transform={`translate(${width - 120}, ${30 + i * 25})`}>
            <circle cx="10" cy="0" r="6" fill={ellipse.color} opacity="0.7" />
            <text x="25" y="4" fontSize="12" fill="hsl(var(--foreground))">
              {ellipse.groupName}
            </text>
          </g>
        ))}
      </svg>
      
      <div className="mt-3 text-xs text-muted-foreground text-center">
        Dashed ellipses represent 95% confidence intervals around group centroids. 
        {rSquared < 0.05 ? ' Groups show substantial overlap - low effect size.' : 
         rSquared < 0.12 ? ' Moderate separation between groups.' : 
         ' Clear separation - high effect size.'}
      </div>
    </div>
  );
};

export default BetaDiversityVisualizer;
