import { Fragment, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, Search, ExternalLink, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  EFFECT_SIZE_LIBRARY,
  EFFECT_SIZE_LIBRARY_VERIFIED,
  type LibraryEntry,
} from '@/data/effectSizeLibrary';

const typeBadge = (t: LibraryEntry['effectType']) =>
  t === "Cohen's d"
    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    : t === "Cohen's f"
      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';

const basisBadge = (b: LibraryEntry['basis']) =>
  b === 'Meta-analysis'
    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    : b === 'Single study'
      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';

const Detail = ({ label, value }: { label: string; value: string }) =>
  value ? (
    <div className="grid grid-cols-[9rem_1fr] gap-2">
      <span className="font-medium text-foreground">{label}</span>
      <span>{value}</span>
    </div>
  ) : null;

const libraryEntries = EFFECT_SIZE_LIBRARY.filter((e) => !e.wizard);

const EffectSizeLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [basisFilter, setBasisFilter] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const q = searchTerm.toLowerCase();
  const filteredData = libraryEntries.filter((item) => {
    const matchesSearch =
      !q ||
      [item.studyType, item.responseVariable, item.taxonomicGroup, item.citation].some((f) =>
        f.toLowerCase().includes(q),
      );
    return (
      matchesSearch &&
      (!typeFilter || item.effectType === typeFilter) &&
      (!basisFilter || item.basis === basisFilter)
    );
  });

  const counts = {
    meta: libraryEntries.filter((e) => e.basis === 'Meta-analysis').length,
    single: libraryEntries.filter((e) => e.basis === 'Single study').length,
    corr: libraryEntries.filter((e) => e.basis === 'Correlational').length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Effect Size Library</h2>
        </div>
        <p className="mb-2 text-muted-foreground">
          {libraryEntries.length} published effect sizes: {counts.meta} pooled meta-analytic estimates, {counts.single} single
          studies, and {counts.corr} correlations across gradients converted to Cohen&apos;s d. Each value was read in the
          source text and checked a second time on {EFFECT_SIZE_LIBRARY_VERIFIED}. Select a row to see the statistic as
          printed, its location in the paper, the conversion formula, and the sample size.
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          Values are magnitudes (absolute values). Hedges&apos; g and Hedges&apos; d are used directly as Cohen&apos;s d. Correlations are
          converted with d = 2r/√(1 − r²); F statistics with f = √(F·df1/df2).
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Stressor, response, taxon, or author"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type-filter">Effect size type</Label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="">All types</option>
              <option value="Cohen's d">Cohen&apos;s d</option>
              <option value="Cohen's f">Cohen&apos;s f</option>
              <option value="R² (PERMANOVA)">R² (PERMANOVA)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="basis-filter">Evidence</Label>
            <select
              id="basis-filter"
              value={basisFilter}
              onChange={(e) => setBasisFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="">All evidence</option>
              <option value="Meta-analysis">Meta-analysis</option>
              <option value="Single study">Single study</option>
              <option value="Correlational">Correlational</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-6" />
                <TableHead>Stressor or treatment</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead className="text-right">Effect size</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No matching entries.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => {
                  const isOpen = open === item.id;
                  return (
                    <Fragment key={item.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setOpen(isOpen ? null : item.id)}
                        aria-expanded={isOpen}
                      >
                        <TableCell className="align-top">
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </TableCell>
                        <TableCell className="font-medium align-top">{item.studyType}</TableCell>
                        <TableCell className="align-top">{item.responseVariable}</TableCell>
                        <TableCell className="align-top">{item.taxonomicGroup}</TableCell>
                        <TableCell className="text-right align-top whitespace-nowrap">
                          <div className="font-bold text-primary">{item.effectSize}</div>
                          <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge(item.effectType)}`}>
                            {item.effectType}
                          </span>
                        </TableCell>
                        <TableCell className="align-top">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${basisBadge(item.basis)}`}>
                            {item.basis}
                          </span>
                          {item.caution && (
                            <p className="text-xs text-muted-foreground mt-1 flex gap-1">
                              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-amber-600" />
                              {item.caution}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{item.shortRef}</span>
                            <a
                              href={`https://doi.org/${item.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Open ${item.shortRef}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell />
                          <TableCell colSpan={6}>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <Detail label="Reported" value={item.reportedStatistic} />
                              <Detail label="Location" value={item.location} />
                              <Detail label="Conversion" value={item.conversion} />
                              <Detail label="Sample" value={item.sampleSize} />
                              <Detail label="Direction" value={item.direction} />
                              <Detail label="Citation" value={item.citation} />
                              <Detail label="DOI" value={item.doi} />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Card className="mt-6 p-4 bg-secondary/30 border-l-4 border-accent">
          <h3 className="font-bold mb-2">Using these values</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• A pooled estimate describes the average across studies; the effect in one system can differ in size and sign.</li>
            <li>• Single-study values carry that study&apos;s sampling error. Entries marked with a caution have small samples, pseudoreplication, or non-significant results.</li>
            <li>• Correlational entries convert a correlation across a gradient to d; they do not describe a two-group contrast.</li>
            <li>• An effect near zero requires a very large sample; check the confidence interval in the reported statistic.</li>
          </ul>
        </Card>
      </Card>
    </div>
  );
};

export default EffectSizeLibrary;
