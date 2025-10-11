export type DataType = 'continuous' | 'categorical' | 'microbiome' | 'correlation' | null;
export type TestType = 'ttest' | 'oneway' | 'twoway' | 'repeated' | 'nested' | 'chisquare' | 'correlation' | 'microbiome';

export interface WizardState {
  step: number;
  dataType: DataType;
  numGroups: number | null;
  subjectType: 'independent' | 'repeated' | null;
  numFactors: number | null;
  selectedTest: TestType | null;
  selectedEffectSize: number | null;
  parameters: {
    n: number;
    effectSize: number;
    alpha: number;
    groups?: number;
  };
}

export const initialState: WizardState = {
  step: 0,
  dataType: null,
  numGroups: null,
  subjectType: null,
  numFactors: null,
  selectedTest: null,
  selectedEffectSize: null,
  parameters: {
    n: 30,
    effectSize: 0.5,
    alpha: 0.05,
  },
};

export const dataTypeOptions = [
  {
    id: 'continuous',
    title: 'Continuous/Numeric Data',
    description: 'Plant height, fish weight, enzyme activity, temperature',
    icon: 'LineChart',
  },
  {
    id: 'categorical',
    title: 'Count/Categorical Data',
    description: 'Number of species, survival (yes/no), habitat type',
    icon: 'BarChart3',
  },
  {
    id: 'microbiome',
    title: 'Microbiome/Community Data',
    description: '16S sequencing, metabarcoding, species abundance matrices',
    icon: 'Dna',
  },
  {
    id: 'correlation',
    title: 'Correlation/Relationship',
    description: 'Is temperature related to growth rate?',
    icon: 'TrendingUp',
  },
];

export const presets = {
  small: { n: 15, effectSize: 0.8, alpha: 0.05, label: 'Tight Budget' },
  moderate: { n: 30, effectSize: 0.5, alpha: 0.05, label: 'Moderate' },
  large: { n: 50, effectSize: 0.3, alpha: 0.05, label: 'Well-Funded' },
};
