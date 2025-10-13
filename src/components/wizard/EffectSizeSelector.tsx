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

interface EffectSizeExample {
  studyType: string;
  responseVariable: string;
  taxonomicGroup: string;
  effectSize: number;
  effectType: string;
  reference: string;
  notes?: string;
}

// Curated subset of effect sizes from the library
const effectSizeData: EffectSizeExample[] = [
  { studyType: 'Restoration', responseVariable: 'Species richness', taxonomicGroup: 'Plants', effectSize: 0.65, effectType: "Cohen's d", reference: 'Brudvig et al. (2017)', notes: 'Prairie restoration' },
  { studyType: 'Pollution', responseVariable: 'Abundance', taxonomicGroup: 'Macroinvertebrates', effectSize: 0.85, effectType: "Cohen's d", reference: 'Clements & Kotalik (2016)', notes: 'Heavy metal' },
  { studyType: 'Climate change', responseVariable: 'Body size', taxonomicGroup: 'Fish', effectSize: 0.45, effectType: "Cohen's d", reference: 'Sheridan & Bickford (2011)', notes: 'Temperature effects' },
  { studyType: 'Invasive species', responseVariable: 'Native diversity', taxonomicGroup: 'Plants', effectSize: 0.92, effectType: "Cohen's d", reference: 'Pyšek et al. (2012)', notes: 'High-impact invaders' },
  { studyType: 'Habitat fragmentation', responseVariable: 'Species richness', taxonomicGroup: 'Birds', effectSize: 0.55, effectType: "Cohen's d", reference: 'Laurance et al. (2011)', notes: 'Forest fragments' },
  { studyType: 'Nutrient enrichment', responseVariable: 'Primary productivity', taxonomicGroup: 'Algae', effectSize: 0.38, effectType: "Cohen's f", reference: 'Hillebrand & Cardinale (2010)', notes: 'Nitrogen addition' },
  { studyType: 'Predator removal', responseVariable: 'Prey abundance', taxonomicGroup: 'Invertebrates', effectSize: 0.72, effectType: "Cohen's d", reference: 'Sih et al. (2010)', notes: 'Mesopredator release' },
  { studyType: 'Ocean acidification', responseVariable: 'Shell thickness', taxonomicGroup: 'Mollusks', effectSize: 0.68, effectType: "Cohen's d", reference: 'Kroeker et al. (2013)', notes: 'pH manipulation' },
  { studyType: 'Parasitism', responseVariable: 'Host survival', taxonomicGroup: 'Amphibians', effectSize: 0.81, effectType: "Cohen's d", reference: 'Kilpatrick et al. (2010)', notes: 'Chytrid fungus' },
  { studyType: 'Grazing', responseVariable: 'Vegetation height', taxonomicGroup: 'Grassland', effectSize: 0.43, effectType: "Cohen's f", reference: 'Bakker et al. (2006)', notes: 'Herbivore exclusion' },
  { studyType: 'Disease', responseVariable: 'Population density', taxonomicGroup: 'Mammals', effectSize: 0.95, effectType: "Cohen's d", reference: 'Smith et al. (2009)', notes: 'Infectious disease' },
  { studyType: 'Drought', responseVariable: 'Tree mortality', taxonomicGroup: 'Trees', effectSize: 0.76, effectType: "Cohen's d", reference: 'Allen et al. (2010)', notes: 'Extreme drought' },
  { studyType: 'Urbanization', responseVariable: 'Species diversity', taxonomicGroup: 'Birds', effectSize: 0.52, effectType: "Cohen's d", reference: 'McKinney (2008)', notes: 'Urban vs. rural' },
  { studyType: 'Wetland restoration', responseVariable: 'Waterbird abundance', taxonomicGroup: 'Birds', effectSize: 0.58, effectType: "Cohen's d", reference: 'Jones & Schmitz (2009)', notes: 'Created wetlands' },
  { studyType: 'Pesticide exposure', responseVariable: 'Taxa richness', taxonomicGroup: 'Aquatic insects', effectSize: 0.97, effectType: "Cohen's d", reference: 'Beketov et al. (2013)', notes: 'Insecticide contamination' },
  { studyType: 'Marine protected areas', responseVariable: 'Fish biomass', taxonomicGroup: 'Fish', effectSize: 0.82, effectType: "Cohen's d", reference: 'Sala & Giakoumi (2018)', notes: 'MPA vs. unprotected' },
  { studyType: 'Road noise', responseVariable: 'Bird density', taxonomicGroup: 'Birds', effectSize: 0.53, effectType: "Cohen's d", reference: 'Halfwerk & Slabbekoorn (2015)', notes: 'Traffic noise' },
  { studyType: 'Wildfire', responseVariable: 'Soil microbial biomass', taxonomicGroup: 'Microbes', effectSize: 0.49, effectType: "Cohen's d", reference: 'Pressler et al. (2019)', notes: 'Post-fire recovery' },
  { studyType: 'Microbiome', responseVariable: 'Beta diversity', taxonomicGroup: 'Gut bacteria', effectSize: 0.18, effectType: 'R² (PERMANOVA)', reference: 'Gevers et al. (2014)', notes: 'Healthy vs. IBD' },
  { studyType: 'Microbiome', responseVariable: 'Beta diversity', taxonomicGroup: 'Soil bacteria', effectSize: 0.24, effectType: 'R² (PERMANOVA)', reference: 'Lauber et al. (2013)', notes: 'Forest vs. agricultural' },
  { studyType: 'Microbiome', responseVariable: 'Composition change', taxonomicGroup: 'Gut bacteria', effectSize: 0.20, effectType: 'R² (PERMANOVA)', reference: 'Antibiotic studies', notes: 'Before/after antibiotics' },
  { studyType: 'Microbiome', responseVariable: 'Composition change', taxonomicGroup: 'Gut bacteria', effectSize: 0.10, effectType: 'R² (PERMANOVA)', reference: 'Diet studies', notes: 'Diet modification' },
  { studyType: 'Microbiome', responseVariable: 'Composition change', taxonomicGroup: 'Gut bacteria', effectSize: 0.05, effectType: 'R² (PERMANOVA)', reference: 'Probiotic studies', notes: 'Probiotic supplement' },
];

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
  const isMultiGroup = numGroups && numGroups > 2;

  const filteredData = effectSizeData.filter((item) => {
    const matchesSearch =
      item.studyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.responseVariable.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.taxonomicGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || item.studyType === filterType;
    
    // For multi-group PERMANOVA, only show R² examples
    const matchesEffectType = !(isMicrobiome && isMultiGroup) || item.effectType === 'R² (PERMANOVA)';
    
    return matchesSearch && matchesFilter && matchesEffectType;
  });

  const studyTypes = ['all', ...Array.from(new Set(effectSizeData.map((d) => d.studyType)))];

  const handleCustomSubmit = () => {
    const value = parseFloat(customEffectSize);
    
    // Validation depends on whether it's R² or Cohen's d
    if (isMicrobiome && isMultiGroup) {
      // For multi-group PERMANOVA, expect R² (0 to 1)
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
          Select from published studies or enter your own estimate
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {isMicrobiome && isMultiGroup ? (
            <>
              <strong>Multi-group PERMANOVA:</strong> Use <strong>R² values</strong> (0-1) which represent the proportion of variance explained by your grouping variable. 
              Cohen's d is only appropriate for 2-group comparisons.
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
            <Label htmlFor="filter">Filter by Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger id="filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {studyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto border rounded-lg">
          {filteredData.length > 0 ? (
            <div className="divide-y">
              {filteredData.map((item, idx) => (
                <button
                  key={idx}
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
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{item.reference}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-primary">
                        {Math.abs(item.effectSize)}
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
            {isMicrobiome && isMultiGroup ? (
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
                  Small = 0.05, Medium = 0.10, Large = 0.20 (proportion of variance explained)
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
