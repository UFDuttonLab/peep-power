import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  
  const MAX_BARS = 60;
  const COVERAGE = 0.995;

  // NB pmf from 0 up to the 99.5% quantile, via the log-space recurrence
  // P(x+1) = P(x) * (x + r) / (x + 1) * (1 - p), with r = 1/phi, p = r / (r + mu)
  const nbPmfToQuantile = (): number[] => {
    if (!(meanCount > 0)) return [1];
    const r = dispersion > 0 ? 1 / dispersion : 1e8; // phi -> 0 approaches Poisson
    const p = r / (r + meanCount);
    const log1mp = Math.log1p(-p);
    let logP = r * Math.log(p);
    const pmf: number[] = [];
    let cdf = 0;
    for (let x = 0; x < 1_000_000; x++) {
      const prob = Math.exp(logP);
      pmf.push(prob);
      cdf += prob;
      if (cdf >= COVERAGE && x >= 1) break;
      logP += Math.log(x + r) - Math.log(x + 1) + log1mp;
    }
    return pmf;
  };

  // Keep count 0 as its own bar (so zero-inflation stays visible), then group
  // counts 1..max into bins of equal width so there are at most MAX_BARS bars.
  const binPmf = <T,>(
    pmf: number[],
    makeRow: (label: string, mass: number, isZero: boolean) => T
  ): T[] => {
    const rows: T[] = [makeRow('0', pmf[0] ?? 0, true)];
    const maxX = pmf.length - 1;
    if (maxX < 1) return rows;
    const width = Math.max(1, Math.ceil(maxX / (MAX_BARS - 1)));
    for (let lo = 1; lo <= maxX; lo += width) {
      const hi = Math.min(maxX, lo + width - 1);
      let mass = 0;
      for (let x = lo; x <= hi; x++) mass += pmf[x];
      rows.push(makeRow(lo === hi ? `${lo}` : `${lo}-${hi}`, mass, false));
    }
    return rows;
  };

  const generateNBData = () =>
    binPmf(nbPmfToQuantile(), (count, probability) => ({ count, probability }));

  // Zero-inflated mixture: pi structural zeros plus (1 - pi) x NB
  const generateZINBData = () =>
    binPmf(nbPmfToQuantile(), (count, nb, isZero) => ({
      count,
      zinb: isZero ? zeroInflation + (1 - zeroInflation) * nb : (1 - zeroInflation) * nb,
      nb,
    }));

  if (type === 'zero-inflated') {
    const data = generateZINBData();
    
    return (
      <Card className="p-4 min-h-[450px]">
        <h3 className="text-sm font-semibold mb-3">Distribution Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ left: 60, right: 20, top: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="count" 
              label={{ value: 'Count', position: 'insideBottom', offset: -5, style: { fontSize: 28, fontWeight: 600 } }}
              stroke="hsl(var(--foreground))"
              tick={{ fontSize: 24 }}
            />
              <YAxis 
                label={{ value: 'Probability', angle: -90, position: 'left', style: { fontSize: 28, fontWeight: 600 } }}
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
          Zero-inflation adds extra zeros (structural zeros) to the standard distribution. Bars cover 99.5% of the NB distribution; wider bars sum the probability over a range of counts.
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
        <BarChart data={data} margin={{ left: 60, right: 20, top: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="count" 
            label={{ value: 'Count', position: 'insideBottom', offset: -5, style: { fontSize: 28, fontWeight: 600 } }}
            stroke="hsl(var(--foreground))"
            tick={{ fontSize: 24 }}
          />
              <YAxis 
                label={{ value: 'Probability', angle: -90, position: 'left', style: { fontSize: 28, fontWeight: 600 } }}
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
        Mean: {meanCount.toFixed(1)}, Dispersion: {dispersion.toFixed(2)}. Bars cover 99.5% of the distribution; wider bars sum the probability over a range of counts.
      </p>
    </Card>
  );
};

export default DistributionVisualization;