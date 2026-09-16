import data from './effectSizeLibrary.json';

export type LibraryEffectType = "Cohen's d" | "Cohen's f" | 'R² (PERMANOVA)';
export type EvidenceBasis = 'Meta-analysis' | 'Single study' | 'Correlational';

/**
 * One verified effect size. Every value was read in the source text on the
 * lastVerified date and checked a second time by an independent reader.
 */
export interface LibraryEntry {
  id: string;
  studyType: string;
  responseVariable: string;
  taxonomicGroup: string;
  /** Magnitude used in PEEP (absolute value) */
  effectSize: number;
  effectType: LibraryEffectType;
  /** Statistic as printed in the source */
  reportedStatistic: string;
  /** Formula used to obtain effectSize; empty when the printed value is used directly */
  conversion: string;
  sampleSize: string;
  /** Where the statistic appears in the source */
  location: string;
  direction: string;
  basis: EvidenceBasis;
  /** Limits on using the value for planning; empty when none */
  caution: string;
  citation: string;
  shortRef: string;
  doi: string;
  /** Wizard-only microbiome defaults */
  wizard: boolean;
}

export const EFFECT_SIZE_LIBRARY_VERIFIED: string = data.lastVerified;
export const EFFECT_SIZE_LIBRARY: LibraryEntry[] = data.entries as LibraryEntry[];
