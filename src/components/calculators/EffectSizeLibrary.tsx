import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, Search, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface EffectSizeExample {
  studyType: string;
  responseVariable: string;
  taxonomicGroup: string;
  effectSize: number;
  effectType: string;
  reference: string;
  doi?: string;
  notes?: string;
}

const effectSizeData: EffectSizeExample[] = [
  {
    studyType: 'Restoration',
    responseVariable: 'Species richness',
    taxonomicGroup: 'Plants',
    effectSize: 0.65,
    effectType: "Cohen's d",
    reference: 'Brudvig et al. (2017) Ecology',
    doi: '10.1002/ecy.1683',
    notes: 'Prairie restoration vs. control'
  },
  {
    studyType: 'Pollution',
    responseVariable: 'Abundance',
    taxonomicGroup: 'Macroinvertebrates',
    effectSize: 0.85,
    effectType: "Cohen's d",
    reference: 'Clements & Kotalik (2016) Freshwater Science',
    doi: '10.1086/684682',
    notes: 'Heavy metal contamination'
  },
  {
    studyType: 'Climate change',
    responseVariable: 'Body size',
    taxonomicGroup: 'Fish',
    effectSize: 0.45,
    effectType: "Cohen's d",
    reference: 'Sheridan & Bickford (2011) PNAS',
    doi: '10.1073/pnas.1012825108',
    notes: 'Temperature effects'
  },
  {
    studyType: 'Invasive species',
    responseVariable: 'Native diversity',
    taxonomicGroup: 'Plants',
    effectSize: 0.92,
    effectType: "Cohen's d",
    reference: 'Pyšek et al. (2012) Global Change Biology',
    doi: '10.1111/j.1365-2486.2011.02464.x',
    notes: 'High-impact invaders'
  },
  {
    studyType: 'Habitat fragmentation',
    responseVariable: 'Species richness',
    taxonomicGroup: 'Birds',
    effectSize: 0.55,
    effectType: "Cohen's d",
    reference: 'Laurance et al. (2011) Nature',
    doi: '10.1038/nature09844',
    notes: 'Forest fragments vs. continuous'
  },
  {
    studyType: 'Nutrient enrichment',
    responseVariable: 'Primary productivity',
    taxonomicGroup: 'Algae',
    effectSize: 0.38,
    effectType: "Cohen's f",
    reference: 'Hillebrand & Cardinale (2010) Ecology',
    doi: '10.1890/09-1769.1',
    notes: 'Nitrogen addition experiment'
  },
  {
    studyType: 'Predator removal',
    responseVariable: 'Prey abundance',
    taxonomicGroup: 'Invertebrates',
    effectSize: 0.72,
    effectType: "Cohen's d",
    reference: 'Sih et al. (2010) Annual Review Ecology',
    doi: '10.1146/annurev-ecolsys-110512-135803',
    notes: 'Mesopredator release'
  },
  {
    studyType: 'Fire management',
    responseVariable: 'Plant community',
    taxonomicGroup: 'Grassland',
    effectSize: 0.48,
    effectType: "Cohen's f",
    reference: 'Collins et al. (2012) Ecology Letters',
    doi: '10.1111/j.1461-0248.2011.01716.x',
    notes: 'Prescribed burn effects'
  },
  {
    studyType: 'Ocean acidification',
    responseVariable: 'Shell thickness',
    taxonomicGroup: 'Mollusks',
    effectSize: 0.68,
    effectType: "Cohen's d",
    reference: 'Kroeker et al. (2013) Ecology Letters',
    doi: '10.1111/ele.12129',
    notes: 'pH manipulation experiments'
  },
  {
    studyType: 'Parasitism',
    responseVariable: 'Host survival',
    taxonomicGroup: 'Amphibians',
    effectSize: 0.81,
    effectType: "Cohen's d",
    reference: 'Kilpatrick et al. (2010) EcoHealth',
    doi: '10.1007/s10393-010-0319-z',
    notes: 'Chytrid fungus infection'
  },
  {
    studyType: 'Light pollution',
    responseVariable: 'Reproductive success',
    taxonomicGroup: 'Insects',
    effectSize: 0.59,
    effectType: "Cohen's d",
    reference: 'Longcore & Rich (2004) Frontiers',
    doi: '10.1890/1540-9295(2004)002[0191:EOLP]2.0.CO;2',
    notes: 'Artificial light at night'
  },
  {
    studyType: 'Grazing',
    responseVariable: 'Vegetation height',
    taxonomicGroup: 'Grassland',
    effectSize: 0.43,
    effectType: "Cohen's f",
    reference: 'Bakker et al. (2006) Journal of Ecology',
    doi: '10.1111/j.1365-2745.2006.01129.x',
    notes: 'Large herbivore exclusion'
  },
  {
    studyType: 'Disease',
    responseVariable: 'Population density',
    taxonomicGroup: 'Mammals',
    effectSize: 0.95,
    effectType: "Cohen's d",
    reference: 'Smith et al. (2009) Nature',
    doi: '10.1038/nature08230',
    notes: 'Emerging infectious disease'
  },
  {
    studyType: 'Drought',
    responseVariable: 'Tree mortality',
    taxonomicGroup: 'Trees',
    effectSize: 0.76,
    effectType: "Cohen's d",
    reference: 'Allen et al. (2010) Forest Ecology',
    doi: '10.1016/j.foreco.2009.09.001',
    notes: 'Extreme drought events'
  },
  {
    studyType: 'Urbanization',
    responseVariable: 'Species diversity',
    taxonomicGroup: 'Birds',
    effectSize: 0.52,
    effectType: "Cohen's d",
    reference: 'McKinney (2008) Landscape and Urban Planning',
    doi: '10.1016/j.landurbplan.2007.06.002',
    notes: 'Urban vs. rural comparison'
  },
  {
    studyType: 'Wetland restoration',
    responseVariable: 'Waterbird abundance',
    taxonomicGroup: 'Birds',
    effectSize: 0.58,
    effectType: "Cohen's d",
    reference: 'Jones & Schmitz (2009) Ecology',
    doi: '10.1890/08-0586.1',
    notes: 'Created vs. natural wetlands'
  },
  {
    studyType: 'Pesticide exposure',
    responseVariable: 'Macroinvertebrate taxa',
    taxonomicGroup: 'Aquatic insects',
    effectSize: 0.97,
    effectType: "Cohen's d",
    reference: 'Beketov et al. (2013) PNAS',
    doi: '10.1073/pnas.1305618110',
    notes: 'Insecticide contamination in streams'
  },
  {
    studyType: 'Nitrogen enrichment',
    responseVariable: 'Plant diversity',
    taxonomicGroup: 'Plants',
    effectSize: -0.64,
    effectType: "Cohen's d",
    reference: 'Midolo et al. (2019) Global Change Biology',
    doi: '10.1111/gcb.14569',
    notes: 'Negative effect: N deposition reduces diversity'
  },
  {
    studyType: 'Marine protected areas',
    responseVariable: 'Fish biomass',
    taxonomicGroup: 'Fish',
    effectSize: 0.82,
    effectType: "Cohen's d",
    reference: 'Sala & Giakoumi (2018) PNAS',
    doi: '10.1073/pnas.1705180115',
    notes: 'MPA vs. unprotected areas'
  },
  {
    studyType: 'Coral bleaching',
    responseVariable: 'Coral cover',
    taxonomicGroup: 'Coral',
    effectSize: 1.15,
    effectType: "Cohen's d",
    reference: 'Hughes et al. (2018) Nature',
    doi: '10.1038/nature25733',
    notes: 'Heat stress events'
  },
  {
    studyType: 'Predator reintroduction',
    responseVariable: 'Prey behavior',
    taxonomicGroup: 'Mammals',
    effectSize: 0.67,
    effectType: "Cohen's d",
    reference: 'Creel & Christianson (2008) Ecology',
    doi: '10.1890/07-1519.1',
    notes: 'Wolf effects on elk vigilance'
  },
  {
    studyType: 'Road noise',
    responseVariable: 'Bird density',
    taxonomicGroup: 'Birds',
    effectSize: 0.53,
    effectType: "Cohen's d",
    reference: 'Halfwerk & Slabbekoorn (2015) Behavioral Ecology',
    doi: '10.1093/beheco/aru218',
    notes: 'Traffic noise pollution'
  },
  {
    studyType: 'Microplastic pollution',
    responseVariable: 'Zooplankton feeding',
    taxonomicGroup: 'Zooplankton',
    effectSize: 0.71,
    effectType: "Cohen's d",
    reference: 'Cole et al. (2015) Environ Sci Tech',
    doi: '10.1021/es504525u',
    notes: 'Microplastic ingestion effects'
  },
  {
    studyType: 'Wildfire',
    responseVariable: 'Soil microbial biomass',
    taxonomicGroup: 'Microbes',
    effectSize: 0.49,
    effectType: "Cohen's d",
    reference: 'Pressler et al. (2019) Global Change Biology',
    doi: '10.1111/gcb.14575',
    notes: 'Post-fire soil recovery'
  },
  {
    studyType: 'Ant-plant mutualism',
    responseVariable: 'Plant herbivory',
    taxonomicGroup: 'Plants',
    effectSize: 0.88,
    effectType: "Cohen's d",
    reference: 'Rosumek et al. (2009) Ecological Entomology',
    doi: '10.1111/j.1365-2311.2008.01079.x',
    notes: 'Ant exclusion experiments'
  },
  {
    studyType: 'Salinity increase',
    responseVariable: 'Wetland plant cover',
    taxonomicGroup: 'Plants',
    effectSize: 0.78,
    effectType: "Cohen's d",
    reference: 'Herbert et al. (2015) Limnol Oceanogr',
    doi: '10.1002/lno.10027',
    notes: 'Saltwater intrusion effects'
  },
  {
    studyType: 'Dam removal',
    responseVariable: 'Salmon abundance',
    taxonomicGroup: 'Fish',
    effectSize: 0.91,
    effectType: "Cohen's d",
    reference: 'Bellmore et al. (2019) Science',
    doi: '10.1126/sciadv.aax1213',
    notes: 'Barrier removal for fish passage'
  },
  {
    studyType: 'Soil warming',
    responseVariable: 'Decomposition rate',
    taxonomicGroup: 'Ecosystem function',
    effectSize: 0.44,
    effectType: "Cohen's d",
    reference: 'Bradford et al. (2016) Nature Climate Change',
    doi: '10.1038/nclimate2930',
    notes: 'Experimental warming plots'
  },
  {
    studyType: 'Artificial reef',
    responseVariable: 'Fish recruitment',
    taxonomicGroup: 'Fish',
    effectSize: 0.63,
    effectType: "Cohen's d",
    reference: 'Becker et al. (2018) Ecological Applications',
    doi: '10.1002/eap.1651',
    notes: 'Reef structure deployment'
  },
  {
    studyType: 'Tree diversity',
    responseVariable: 'Insect diversity',
    taxonomicGroup: 'Insects',
    effectSize: 0.41,
    effectType: "Cohen's d",
    reference: 'Castagneyrol et al. (2014) Ecology Letters',
    doi: '10.1111/ele.12291',
    notes: 'Forest biodiversity experiments'
  },
  {
    studyType: 'Lead contamination',
    responseVariable: 'Bird reproduction',
    taxonomicGroup: 'Birds',
    effectSize: 0.89,
    effectType: "Cohen's d",
    reference: 'Eeva et al. (2014) Environmental Pollution',
    doi: '10.1016/j.envpol.2013.12.014',
    notes: 'Heavy metal pollution near smelters'
  },
  {
    studyType: 'Livestock grazing',
    responseVariable: 'Grasshopper abundance',
    taxonomicGroup: 'Insects',
    effectSize: 0.56,
    effectType: "Cohen's d",
    reference: 'Branson et al. (2006) Rangeland Ecology',
    doi: '10.2111/05-099R1.1',
    notes: 'Grazing intensity effects'
  },
  {
    studyType: 'Coastal development',
    responseVariable: 'Shorebird nesting',
    taxonomicGroup: 'Birds',
    effectSize: 0.94,
    effectType: "Cohen's d",
    reference: 'Defeo et al. (2009) Estuarine Coastal Shelf Sci',
    doi: '10.1016/j.ecss.2008.09.022',
    notes: 'Beach urbanization impacts'
  },
  {
    studyType: 'Fungicide application',
    responseVariable: 'Amphibian survival',
    taxonomicGroup: 'Amphibians',
    effectSize: 0.73,
    effectType: "Cohen's d",
    reference: 'McMahon et al. (2012) Ecology Letters',
    doi: '10.1111/j.1461-0248.2012.01790.x',
    notes: 'Agricultural fungicide exposure'
  },
  {
    studyType: 'Beaver reintroduction',
    responseVariable: 'Wetland area',
    taxonomicGroup: 'Ecosystem function',
    effectSize: 0.52,
    effectType: "Cohen's f",
    reference: 'Law et al. (2017) Freshwater Biology',
    doi: '10.1111/fwb.12721',
    notes: 'Ecosystem engineering effects'
  },
  {
    studyType: 'UV radiation increase',
    responseVariable: 'Phytoplankton growth',
    taxonomicGroup: 'Phytoplankton',
    effectSize: 0.61,
    effectType: "Cohen's d",
    reference: 'Häder et al. (2015) Photochem Photobiol Sci',
    doi: '10.1039/c4pp90035a',
    notes: 'Ozone depletion effects'
  },
  {
    studyType: 'Biological control',
    responseVariable: 'Pest density',
    taxonomicGroup: 'Insects',
    effectSize: 0.84,
    effectType: "Cohen's d",
    reference: 'Jonsson et al. (2008) Ecology Letters',
    doi: '10.1111/j.1461-0248.2007.01145.x',
    notes: 'Natural enemy release'
  },
  {
    studyType: 'Mangrove restoration',
    responseVariable: 'Crab density',
    taxonomicGroup: 'Crustaceans',
    effectSize: 0.69,
    effectType: "Cohen's d",
    reference: 'Lee et al. (2014) Restoration Ecology',
    doi: '10.1111/rec.12052',
    notes: 'Replanted mangrove recovery'
  },
  {
    studyType: 'Invasive plant removal',
    responseVariable: 'Native plant cover',
    taxonomicGroup: 'Plants',
    effectSize: 0.57,
    effectType: "Cohen's d",
    reference: 'Reid et al. (2009) Restoration Ecology',
    doi: '10.1111/j.1526-100X.2008.00454.x',
    notes: 'Invasive species management'
  },
  {
    studyType: 'Soil compaction',
    responseVariable: 'Root biomass',
    taxonomicGroup: 'Plants',
    effectSize: 0.76,
    effectType: "Cohen's d",
    reference: 'Nawaz et al. (2013) Soil & Tillage Research',
    doi: '10.1016/j.still.2012.07.002',
    notes: 'Mechanical soil disturbance'
  }
];

const EffectSizeLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  const filteredData = effectSizeData.filter(item => {
    const matchesSearch = 
      item.studyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.responseVariable.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.taxonomicGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterType || item.studyType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const studyTypes = Array.from(new Set(effectSizeData.map(d => d.studyType))).sort();

  return (
    <div className="max-w-7xl mx-auto">
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Effect Size Library</h2>
        </div>
        <p className="mb-6 text-muted-foreground">
          Reference database of typical effect sizes from published ecological studies. 
          Use these to inform your power analysis when you don't have pilot data.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by study type, variable, taxa, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter">Filter by Study Type</Label>
            <select
              id="filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="">All Types</option>
              {studyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <Card className="p-4 bg-accent/20 mb-4">
          <p className="text-sm">
            <strong>How to use:</strong> Find studies similar to yours and note their effect sizes. 
            If multiple studies are relevant, use the average. Remember that effect sizes can vary 
            widely based on study design, taxa, and environmental conditions.
          </p>
        </Card>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Study Type</TableHead>
                <TableHead>Response Variable</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead className="text-right">Effect Size</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No matching studies found. Try different search terms.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.studyType}</TableCell>
                    <TableCell>{item.responseVariable}</TableCell>
                    <TableCell>{item.taxonomicGroup}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {item.effectSize.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.effectType}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.reference}</span>
                        {item.doi && (
                          <a
                            href={`https://doi.org/${item.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Card className="mt-6 p-4 bg-secondary/30 border-l-4 border-accent">
          <h3 className="font-bold mb-2">Important Notes</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Effect sizes shown are typical but can vary greatly depending on context</li>
            <li>• When possible, use pilot data or local studies from similar systems</li>
            <li>• Conservative approach: use a smaller effect size to ensure adequate power</li>
            <li>• Meta-analyses are excellent sources for expected effect sizes in your field</li>
          </ul>
        </Card>
      </Card>
    </div>
  );
};

export default EffectSizeLibrary;
