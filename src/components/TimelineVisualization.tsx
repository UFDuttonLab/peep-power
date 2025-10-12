import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface TimelineVisualizationProps {
  nTimepoints: number;
  dropoutRate: number;
}

const TimelineVisualization = ({ nTimepoints, dropoutRate }: TimelineVisualizationProps) => {
  const timepoints = Array.from({ length: nTimepoints }, (_, i) => i);
  
  // Calculate expected retention at each timepoint
  const getRetention = (timepoint: number) => {
    return Math.pow(1 - dropoutRate, timepoint) * 100;
  };
  
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Longitudinal Sampling Schedule</h3>
      </div>
      
      <div className="space-y-4">
        {/* Timeline visualization */}
        <div className="relative">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-border" />
          <div className="flex justify-between items-start relative">
            {timepoints.map((t) => {
              const retention = getRetention(t);
              return (
                <div key={t} className="flex flex-col items-center">
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-primary bg-background flex items-center justify-center font-semibold text-sm relative z-10"
                    style={{ 
                      opacity: retention / 100,
                      borderColor: retention < 80 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'
                    }}
                  >
                    T{t}
                  </div>
                  <div className="mt-2 text-xs text-center">
                    <div className="font-medium">{retention.toFixed(0)}%</div>
                    <div className="text-muted-foreground">retained</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Dropout rate:</strong> {(dropoutRate * 100).toFixed(0)}% per timepoint</p>
          <p><strong>Final retention:</strong> {getRetention(nTimepoints - 1).toFixed(1)}% of original subjects</p>
        </div>
        
        {dropoutRate > 0.15 && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            ⚠️ High dropout rate may substantially reduce statistical power
          </div>
        )}
      </div>
    </Card>
  );
};

export default TimelineVisualization;