import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PowerComparisonChartProps {
  title: string;
  data: Array<{
    x: number;
    method1: number;
    method2: number;
  }>;
  xLabel: string;
  method1Name: string;
  method2Name: string;
}

const PowerComparisonChart = ({ 
  title, 
  data, 
  xLabel, 
  method1Name, 
  method2Name 
}: PowerComparisonChartProps) => {
  return (
    <Card className="p-4 min-h-[500px]">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="x" 
            label={{ value: xLabel, position: 'insideBottom', offset: -5, style: { fontSize: 28, fontWeight: 600 } }}
            stroke="hsl(var(--foreground))"
            tick={{ fontSize: 24 }}
          />
            <YAxis 
              label={{ value: 'Statistical Power', angle: -90, position: 'left', style: { fontSize: 28, fontWeight: 600 } }}
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              stroke="hsl(var(--foreground))"
              tick={{ fontSize: 24 }}
            />
          <Tooltip 
            formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Legend />
          <ReferenceLine 
            y={0.8} 
            stroke="hsl(var(--destructive))" 
            strokeDasharray="5 5"
            label={{ value: '80% threshold', position: 'right', fill: 'hsl(var(--destructive))' }}
          />
          <Line 
            type="monotone" 
            dataKey="method1" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            name={method1Name}
            dot={{ fill: 'hsl(var(--primary))' }}
          />
          <Line 
            type="monotone" 
            dataKey="method2" 
            stroke="hsl(var(--accent))" 
            strokeWidth={2}
            name={method2Name}
            dot={{ fill: 'hsl(var(--accent))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default PowerComparisonChart;