import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TestType } from './wizardConfig';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EFFECT_SIZE_LIBRARY } from '@/data/effectSizeLibrary';

// Wizard choices come from the verified Effect Size Library.
const PERMANOVA_ENTRIES = EFFECT_SIZE_LIBRARY.filter((e) => e.effectType === 'R² (PERMANOVA)');
const DF_ENTRIES = EFFECT_SIZE_LIBRARY.filter(
  (e) => e.effectType !== 'R² (PERMANOVA)' && e.basis === 'Meta-analysis',
);
const R2_MIN = Math.min(...PERMANOVA_ENTRIES.map((e) => e.effectSize));
const R2_MAX = Math.max(...PERMANOVA_ENTRIES.map((e) => e.effectSize));

interface EffectSizeSelectorProps {
  testType: TestType;
  numGroups?: number;
  onSelect: (effectSize: number, effectType: string) => void;
  onBack: () => void;
}

const EffectSizeSelector = ({ testType, numGroups, onSelect, onBack }: EffectSizeSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [customEffectSize, setCustomEffectSize] = useState<string>('');
  
  // Determine if this is a multi-group PERMANOVA
  const isMicrobiome = testType === 'microbiome' || testType === 'repeated-microbiome';
  const isMultiGroup = numGroups !== undefined && numGroups > 2;

  const source = isMicrobiome ? PERMANOVA_ENTRIES : DF_ENTRIES;
  const q = searchTerm.toLowerCase();
  const filteredData = source.filter((item) => {
    const matchesSearch =
      !q ||
      [item.studyType, item.responseVariable, item.taxonomicGroup, item.shortRef].some((f) =>
        f.toLowerCase().includes(q),
      );
    const matchesFilter = filterType === 'all' || item.basis === filterType;
    return matchesSearch && matchesFilter;
  });

  const studyTypes = ['all', ...Array.from(new Set(source.map((d) => d.basis)))];

  const handleCustomSubmit = () => {
    const value = parseFloat(customEffectSize);
    
    // Validation depends on whether it's R² or Cohen's d
    if (isMicrobiome) {
      // For microbiome tests, expect R² (0 to 1)
      if (!isNaN(value) && value > 0 && value < 1) {
        onSelect(value, 'R² (PERMANOVA)');
      }
    } else {
      // For other tests, expect Cohen's d
      if (!isNaN(value) && value > 0 && value <= 3) {
        onSelect(value, "Cohen's d");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What effect size do you expect?</h2>
        <p className="text-muted-foreground">
          Select a published estimate or enter your own
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {isMicrobiome ? (
            <>
              <strong>PERMANOVA Analysis:</strong> Use <strong>R² values</strong> (0-1) which represent the proportion of variance explained by your grouping variable. 
              These measure community composition differences between groups.
            </>
          ) : (
            <>Effect size represents the magnitude of difference you expect to find. Look for studies similar to yours!</>
          )}
        </AlertDescription>
      </Alert>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search Studies</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="e.g., pollution, birds, temperature..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <Label htmlFor="filter">Evidence</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger id="filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {studyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All evidence' : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto border rounded-lg">
          {filteredData.length > 0 ? (
            <div className="divide-y">
              {filteredData.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(Math.abs(item.effectSize), item.effectType)}
                  className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{item.studyType}</span>
                        <span className="text-xs px-2 py-0.5 bg-secondary rounded-full">
                          {item.taxonomicGroup}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.responseVariable}</p>
                      {item.caution && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{item.caution}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.shortRef} · {item.basis} · {item.reportedStatistic}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-primary">
                        {item.effectSize}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.effectType}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No matching studies found. Try different search terms or enter a custom value below.
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Or Enter Your Own Effect Size</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            {isMicrobiome ? (
              <>
                <Label htmlFor="custom">Custom Effect Size (R²)</Label>
                <Input
                  id="custom"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.99"
                  placeholder="e.g., 0.10"
                  value={customEffectSize}
                  onChange={(e) => setCustomEffectSize(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Published values in the library range from R² = {R2_MIN} to {R2_MAX} (proportion of variance explained)
                </p>
              </>
            ) : (
              <>
                <Label htmlFor="custom">Custom Effect Size (Cohen's d)</Label>
                <Input
                  id="custom"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="3"
                  placeholder="e.g., 0.5"
                  value={customEffectSize}
                  onChange={(e) => setCustomEffectSize(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Small = 0.2, Medium = 0.5, Large = 0.8
                </p>
                {(testType === 'correlation' || testType === 'chisquare') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Values are converted from Cohen's d to {testType === 'correlation' ? 'r' : 'w'} using
                    d / √(d² + 4) (e.g., d = 0.5 gives {testType === 'correlation' ? 'r' : 'w'} ≈ 0.24).
                  </p>
                )}
                {(testType === 'oneway' || testType === 'twoway' || testType === 'repeated' || testType === 'lmm-microbiome') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Values are converted from Cohen's d to Cohen's f using f = d / 2.
                  </p>
                )}
              </>
            )}
          </div>
          <div className="flex items-end">
            <Button onClick={handleCustomSubmit} disabled={!customEffectSize}>
              Use This
            </Button>
          </div>
        </div>
      </Card>

      <Button variant="outline" onClick={onBack} className="w-full">
        Back
      </Button>
    </div>
  );
};

export default EffectSizeSelector;
