interface SimplePowerChartProps {
  data: { x: number; y: number }[];
  currentValue: number;
  xLabel?: string;
  title?: string;
}

const SimplePowerChart = ({ data, currentValue, xLabel = 'Sample Size', title = 'Power Curve' }: SimplePowerChartProps) => {
  if (!data || data.length === 0) return <div className="text-muted-foreground">No data to display</div>;

  const maxX = Math.max(...data.map(d => d.x));
  
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
        <svg className="w-full h-full" viewBox="0 0 800 420">
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
          
          {/* Power curve */}
          <polyline
            points={data
              .map((d) => {
                const x = 50 + (d.x / maxX) * 700;
                const y = 350 - d.y * 300;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
          />
          
          {/* Current point marker */}
          <circle
            cx={50 + (currentValue / maxX) * 700}
            cy={350 - currentY * 300}
            r="6"
            fill="hsl(var(--accent))"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
          
          {/* Axis labels */}
          <text x="400" y="395" fontSize="28" fill="hsl(var(--foreground))" textAnchor="middle" fontWeight="600">
            {xLabel}
          </text>
          <text x="15" y="210" fontSize="28" fill="hsl(var(--foreground))" textAnchor="middle" fontWeight="600" transform="rotate(-90 15 210)">
            Power (%)
          </text>
        </svg>
      </div>
    </div>
  );
};

export default SimplePowerChart;
