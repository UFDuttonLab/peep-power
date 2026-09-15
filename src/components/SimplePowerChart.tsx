interface SimplePowerChartProps {
  data: { x: number; y: number }[];
  currentValue: number;
  xLabel?: string;
  title?: string;
}

const SimplePowerChart = ({ data, currentValue, xLabel = 'Sample Size', title = 'Power Curve' }: SimplePowerChartProps) => {
  if (!data || data.length === 0 || !(Math.max(...data.map(d => d.x)) > 0)) return <div className="text-muted-foreground">No data to display</div>;

  const maxX = Math.max(...data.map(d => d.x));
  const minX = Math.min(...data.map(d => d.x));
  const inRange = Number.isFinite(currentValue) && currentValue >= minX && currentValue <= maxX;
  const toSvgX = (x: number) => 50 + (x / maxX) * 700;

  // Round tick values to a "nice" step
  const rawStep = maxX / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceStep = [1, 2, 2.5, 5, 10].map(m => m * magnitude).find(v => v >= rawStep) ?? rawStep;
  const xTicks: number[] = [];
  if (niceStep > 0) for (let t = 0; t <= maxX + 1e-9; t += niceStep) xTicks.push(Math.round(t * 1000) / 1000);
  
  // Find or interpolate the current point
  let currentY = 0;
  const exactPoint = data.find(d => d.x === currentValue);
  if (exactPoint) {
    currentY = exactPoint.y;
  } else {
    // Interpolate between two nearest points
    const sortedData = [...data].sort((a, b) => a.x - b.x);
    for (let i = 0; i < sortedData.length - 1; i++) {
      if (sortedData[i].x <= currentValue && sortedData[i + 1].x >= currentValue) {
        const x1 = sortedData[i].x;
        const y1 = sortedData[i].y;
        const x2 = sortedData[i + 1].x;
        const y2 = sortedData[i + 1].y;
        // Linear interpolation
        currentY = y1 + ((currentValue - x1) / (x2 - x1)) * (y2 - y1);
        break;
      }
    }
    // If currentValue is beyond the curve, use the nearest endpoint
    if (currentValue < sortedData[0].x) currentY = sortedData[0].y;
    if (currentValue > sortedData[sortedData.length - 1].x) currentY = sortedData[sortedData.length - 1].y;
  }

  return (
    <div className="w-full h-[500px] flex flex-col">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="flex-1 relative bg-card border rounded-lg p-6">
        <svg className="w-full h-full" viewBox="-40 0 860 425">
          {/* Grid lines */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((y) => (
            <line
              key={y}
              x1="50"
              y1={350 - y * 300}
              x2="750"
              y2={350 - y * 300}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}
          
          {/* Axes */}
          <line x1="50" y1="350" x2="750" y2="350" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <line x1="50" y1="50" x2="50" y2="350" stroke="hsl(var(--foreground))" strokeWidth="2" />
          
          {/* Y-axis labels */}
          {[0, 20, 40, 60, 80, 100].map((label, i) => (
            <text
              key={label}
              x="30"
              y={355 - (i * 60)}
              fontSize="24"
              fill="hsl(var(--foreground))"
              textAnchor="end"
            >
              {label}%
            </text>
          ))}
          
          {/* X-axis ticks */}
          {xTicks.map((t) => (
            <g key={`xt-${t}`}>
              <line x1={toSvgX(t)} y1="350" x2={toSvgX(t)} y2="358" stroke="hsl(var(--foreground))" strokeWidth="2" />
              <text x={toSvgX(t)} y="380" fontSize="20" fill="hsl(var(--foreground))" textAnchor="middle">
                {t}
              </text>
            </g>
          ))}

          {/* Power curve */}
          <polyline
            points={data
              .map((d) => {
                const x = toSvgX(d.x);
                const y = 350 - d.y * 300;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
          />
          
          {/* Current point marker */}
          {inRange ? (
            <circle
              cx={toSvgX(currentValue)}
              cy={350 - currentY * 300}
              r="6"
              fill="hsl(var(--accent))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
          ) : (
            <text x="400" y="35" fontSize="20" fill="hsl(var(--muted-foreground))" textAnchor="middle">
              Current value ({currentValue}) is outside the plotted range ({minX} to {maxX})
            </text>
          )}
          
          {/* Axis labels */}
          <text x="400" y="412" fontSize="26" fill="hsl(var(--foreground))" textAnchor="middle" fontWeight="600">
            {xLabel}
          </text>
          <text x="-20" y="210" fontSize="28" fill="hsl(var(--foreground))" textAnchor="middle" fontWeight="600" transform="rotate(-90 -20 210)">
            Power (%)
          </text>
        </svg>
      </div>
    </div>
  );
};

export default SimplePowerChart;
