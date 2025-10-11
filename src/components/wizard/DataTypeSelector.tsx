import { Card } from '@/components/ui/card';
import { LineChart, BarChart3, Dna, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataType } from './wizardConfig';

interface DataTypeSelectorProps {
  onSelect: (type: DataType) => void;
  selected: DataType;
}

const iconMap = {
  LineChart,
  BarChart3,
  Dna,
  TrendingUp,
};

const options = [
  {
    id: 'continuous' as const,
    title: 'Continuous/Numeric Data',
    description: 'Plant height, fish weight, enzyme activity, temperature',
    icon: 'LineChart',
  },
  {
    id: 'categorical' as const,
    title: 'Count/Categorical Data',
    description: 'Number of species, survival (yes/no), habitat type',
    icon: 'BarChart3',
  },
  {
    id: 'microbiome' as const,
    title: 'Microbiome/Community Data',
    description: '16S sequencing, metabarcoding, species abundance matrices',
    icon: 'Dna',
  },
  {
    id: 'correlation' as const,
    title: 'Correlation/Relationship',
    description: 'Is temperature related to growth rate?',
    icon: 'TrendingUp',
  },
];

const DataTypeSelector = ({ onSelect, selected }: DataTypeSelectorProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What type of data are you analyzing?</h2>
        <p className="text-muted-foreground">Choose the option that best describes your measurements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => {
          const Icon = iconMap[option.icon as keyof typeof iconMap];
          const isSelected = selected === option.id;

          return (
            <Card
              key={option.id}
              className={cn(
                'p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105',
                isSelected && 'border-primary border-2 bg-primary/5'
              )}
              onClick={() => onSelect(option.id)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm">✓</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DataTypeSelector;
