import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DistributionVisualizationProps {
  type: 'negative-binomial' | 'zero-inflated';
  meanCount: number;
  dispersion: number;
  zeroInflation?: number;
}

const DistributionVisualization = ({ 
  type, 
  meanCount, 
  dispersion, 
  zeroInflation = 0 
}: DistributionVisualizationProps) => {
  
  // Generate negative binomial distribution data
  const generateNBData = () => {
    const data = [];
    const maxCount = Math.min(Math.ceil(meanCount * 3), 100);
    
    for (let x = 0; x <= maxCount; x++) {
      // Simplified negative binomial probability mass function
      const r = 1 / dispersion; // size parameter
      const p = r / (r + meanCount); // probability parameter
      
      // Using gamma function approximation for factorial
      const prob = Math.exp(
        gammaLn(x + r) - gammaLn(r) - gammaLn(x + 1) +
        r * Math.log(p) + x * Math.log(1 - p)
      );
      
      data.push({ count: x, probability: isNaN(prob) ? 0 : prob });
    }
    
    return data;
  };
  
  // Generate zero-inflated data
  const generateZINBData = () => {
    const nbData = generateNBData();
    
    return nbData.map(d => ({
      count: d.count,
      zinb: d.count === 0 
        ? zeroInflation + (1 - zeroInflation) * d.probability
        : (1 - zeroInflation) * d.probability,
      nb: d.probability
    }));
  };
  
  // Gamma function (natural log)
  const gammaLn = (x: number): number => {
    if (x <= 0) return Infinity;
    
    // Stirling's approximation
    const cof = [
      76.18009172947146, -86.50532032941677,
      24.01409824083091, -1.231739572450155,
      0.1208650973866179e-2, -0.5395239384953e-5
    ];
    
    let y = x;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    
    for (let j = 0; j < 6; j++) {
      ser += cof[j] / ++y;
    }
    
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  };
  
  if (type === 'zero-inflated') {
    const data = generateZINBData();
    
    return (
      <Card className="p-4 min-h-[450px]">
        <h3 className="text-sm font-semibold mb-3">Distribution Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.slice(0, 30)}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="count" 
              label={{ value: 'Count', position: 'insideBottom', offset: -5, style: { fontSize: 28, fontWeight: 600 } }}
              stroke="hsl(var(--foreground))"
              tick={{ fontSize: 24 }}
            />
            <YAxis 
              label={{ value: 'Probability', angle: -90, position: 'insideLeft', style: { fontSize: 28, fontWeight: 600 } }}
              stroke="hsl(var(--foreground))"
              tick={{ fontSize: 24 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Bar dataKey="zinb" fill="hsl(var(--accent))" name="Zero-Inflated NB" opacity={0.8} />
            <Bar dataKey="nb" fill="hsl(var(--primary))" name="Standard NB" opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-2">
          Zero-inflation adds extra zeros (structural zeros) to the standard distribution
        </p>
      </Card>
    );
  }
  
  // Standard negative binomial
  const data = generateNBData();
  
  return (
    <Card className="p-4 min-h-[450px]">
      <h3 className="text-sm font-semibold mb-3">Expected Distribution</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data.slice(0, 30)}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="count" 
            label={{ value: 'Count', position: 'insideBottom', offset: -5, style: { fontSize: 28, fontWeight: 600 } }}
            stroke="hsl(var(--foreground))"
            tick={{ fontSize: 24 }}
          />
          <YAxis 
            label={{ value: 'Probability', angle: -90, position: 'insideLeft', style: { fontSize: 28, fontWeight: 600 } }}
            stroke="hsl(var(--foreground))"
            tick={{ fontSize: 24 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Bar dataKey="probability" fill="hsl(var(--primary))" name="Probability" />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground mt-2">
        Mean: {meanCount.toFixed(1)}, Dispersion: {dispersion.toFixed(2)}
      </p>
    </Card>
  );
};

export default DistributionVisualization;