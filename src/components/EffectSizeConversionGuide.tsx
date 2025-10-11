import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDown, BookOpen, AlertTriangle, Info, Calculator as CalcIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EffectSizeConversionGuideProps {
  rSquared: number;
  numGroups: number;
  showInEffectSizeTab?: boolean;
}

export default function EffectSizeConversionGuide({ 
  rSquared, 
  numGroups,
  showInEffectSizeTab = false 
}: EffectSizeConversionGuideProps) {
  const [isOpen, setIsOpen] = useState(showInEffectSizeTab);
  
  // Interactive converter state
  const [converterInput, setConverterInput] = useState('0.5');
  const [converterType, setConverterType] = useState<'d' | 'f' | 'r2' | 'eta2'>('d');

  // Calculate Cohen's d from R² (only valid for 2 groups)
  const calculateCohensD = (r2: number): number => {
    if (r2 >= 1) return Infinity;
    return 2 * Math.sqrt(r2 / (1 - r2));
  };

  // Calculate R² from Cohen's d
  const calculateR2FromD = (d: number): number => {
    return (d * d) / (d * d + 4);
  };

  // Calculate Cohen's f from R²/Eta²
  const calculateCohensF = (r2: number): number => {
    if (r2 >= 1) return Infinity;
    return Math.sqrt(r2 / (1 - r2));
  };

  // Calculate R²/Eta² from Cohen's f
  const calculateR2FromF = (f: number): number => {
    return (f * f) / (1 + f * f);
  };

  const cohensD = calculateCohensD(rSquared);
  const cohensF = calculateCohensF(rSquared);
  
  const getEffectInterpretationD = (d: number): string => {
    if (d < 0.2) return "very small";
    if (d < 0.5) return "small";
    if (d < 0.8) return "medium";
    if (d < 1.2) return "large";
    return "very large";
  };

  const getEffectInterpretationF = (f: number): string => {
    if (f < 0.1) return "negligible";
    if (f < 0.25) return "small";
    if (f < 0.4) return "medium";
    return "large";
  };

  const benchmarksD = [
    { d: 0.2, r2: calculateR2FromD(0.2), label: "Small" },
    { d: 0.5, r2: calculateR2FromD(0.5), label: "Medium" },
    { d: 0.8, r2: calculateR2FromD(0.8), label: "Large" },
    { d: 1.0, r2: calculateR2FromD(1.0), label: "Very Large" },
  ];

  const benchmarksF = [
    { f: 0.1, eta2: calculateR2FromF(0.1), label: "Small" },
    { f: 0.25, eta2: calculateR2FromF(0.25), label: "Medium" },
    { f: 0.4, eta2: calculateR2FromF(0.4), label: "Large" },
    { f: 0.5, eta2: calculateR2FromF(0.5), label: "Very Large" },
  ];

  // Interactive converter calculations
  const getConversions = () => {
    const value = parseFloat(converterInput);
    if (isNaN(value) || value < 0) return null;

    let d = 0, f = 0, r2 = 0, eta2 = 0, correlation = 0;

    switch (converterType) {
      case 'd':
        d = value;
        r2 = calculateR2FromD(d);
        correlation = Math.sqrt(r2);
        // For 2 groups, f ≈ d/2
        f = d / 2;
        eta2 = calculateR2FromF(f);
        break;
      case 'f':
        f = value;
        eta2 = calculateR2FromF(f);
        r2 = eta2;
        // For 2 groups, d ≈ 2f
        d = 2 * f;
        correlation = Math.sqrt(r2);
        break;
      case 'r2':
      case 'eta2':
        r2 = value;
        eta2 = value;
        d = calculateCohensD(r2);
        f = calculateCohensF(r2);
        correlation = Math.sqrt(r2);
        break;
    }

    return { d, f, r2, eta2, correlation };
  };

  const conversions = getConversions();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {showInEffectSizeTab 
                    ? "Effect Size Conversions & Relationships" 
                    : "Understanding Effect Sizes: R² vs Cohen's d"}
                </CardTitle>
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`} 
              />
            </div>
            <CardDescription className="text-left">
              {showInEffectSizeTab 
                ? "Convert between effect sizes and understand their relationships" 
                : "How multivariate R² relates to univariate Cohen's d"}
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-4">
            {/* Visual Relationship Diagram */}
            {showInEffectSizeTab && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Effect Size Relationships
                </h4>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="mb-4">
                    <svg viewBox="0 0 800 300" className="w-full h-auto">
                      {/* Cohen's d */}
                      <rect x="50" y="40" width="140" height="60" fill="hsl(var(--primary))" fillOpacity="0.2" stroke="hsl(var(--primary))" strokeWidth="2" rx="8"/>
                      <text x="120" y="65" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold">Cohen's d</text>
                      <text x="120" y="82" textAnchor="middle" fill="currentColor" fontSize="11">t-test (2 groups)</text>

                      {/* Point-Biserial r */}
                      <rect x="250" y="40" width="140" height="60" fill="hsl(var(--accent))" fillOpacity="0.2" stroke="hsl(var(--accent))" strokeWidth="2" rx="8"/>
                      <text x="320" y="65" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold">Correlation r</text>
                      <text x="320" y="82" textAnchor="middle" fill="currentColor" fontSize="11">Point-Biserial</text>

                      {/* R² (2 groups) */}
                      <rect x="450" y="40" width="140" height="60" fill="hsl(var(--secondary))" fillOpacity="0.2" stroke="hsl(var(--secondary))" strokeWidth="2" rx="8"/>
                      <text x="520" y="65" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold">R²</text>
                      <text x="520" y="82" textAnchor="middle" fill="currentColor" fontSize="11">Variance Explained</text>

                      {/* Cohen's f */}
                      <rect x="50" y="200" width="140" height="60" fill="hsl(var(--primary))" fillOpacity="0.2" stroke="hsl(var(--primary))" strokeWidth="2" rx="8"/>
                      <text x="120" y="225" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold">Cohen's f</text>
                      <text x="120" y="242" textAnchor="middle" fill="currentColor" fontSize="11">ANOVA (3+ groups)</text>

                      {/* Eta² / R² */}
                      <rect x="250" y="200" width="140" height="60" fill="hsl(var(--secondary))" fillOpacity="0.2" stroke="hsl(var(--secondary))" strokeWidth="2" rx="8"/>
                      <text x="320" y="225" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold">Eta² / R²</text>
                      <text x="320" y="242" textAnchor="middle" fill="currentColor" fontSize="11">ANOVA Variance</text>

                      {/* Arrows and formulas */}
                      {/* d to r */}
                      <line x1="190" y1="70" x2="250" y2="70" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <text x="220" y="60" textAnchor="middle" fill="currentColor" fontSize="10">r = d/√(d²+4)</text>

                      {/* r to R² */}
                      <line x1="390" y1="70" x2="450" y2="70" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <text x="420" y="60" textAnchor="middle" fill="currentColor" fontSize="10">r²</text>

                      {/* f to Eta² */}
                      <line x1="190" y1="230" x2="250" y2="230" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <text x="220" y="220" textAnchor="middle" fill="currentColor" fontSize="10">η² = f²/(1+f²)</text>

                      {/* R² to d (reverse) */}
                      <path d="M 520 100 Q 520 140 120 140 L 120 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" markerEnd="url(#arrowhead)"/>
                      <text x="320" y="155" textAnchor="middle" fill="currentColor" fontSize="10">d = 2√(R²/(1-R²))</text>

                      {/* Eta² to f (reverse) */}
                      <path d="M 320 200 L 320 180 L 120 180 L 120 200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" markerEnd="url(#arrowhead)"/>
                      <text x="220" y="170" textAnchor="middle" fill="currentColor" fontSize="10">f = √(η²/(1-η²))</text>

                      {/* Arrow marker definition */}
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Effect sizes are interconnected. Use the formulas to convert between them based on your study design.
                  </p>
                </div>
              </div>
            )}

            {/* Interactive Converter */}
            {showInEffectSizeTab && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <CalcIcon className="h-4 w-4 text-primary" />
                  Interactive Effect Size Converter
                </h4>
                <Card className="p-4 bg-accent/10 border-primary/20">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="converter-value">Input Value</Label>
                      <Input
                        id="converter-value"
                        type="number"
                        step="0.01"
                        value={converterInput}
                        onChange={(e) => setConverterInput(e.target.value)}
                        placeholder="0.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="converter-type">Input Type</Label>
                      <Select value={converterType} onValueChange={(v) => setConverterType(v as any)}>
                        <SelectTrigger id="converter-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="d">Cohen's d</SelectItem>
                          <SelectItem value="f">Cohen's f</SelectItem>
                          <SelectItem value="r2">R²</SelectItem>
                          <SelectItem value="eta2">Eta²</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {conversions && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold mb-2">Equivalent Effect Sizes:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div className="p-3 bg-background rounded-md border">
                          <p className="text-xs text-muted-foreground">Cohen's d</p>
                          <p className="font-mono font-bold">{conversions.d.toFixed(3)}</p>
                          <p className="text-xs text-muted-foreground">{getEffectInterpretationD(conversions.d)}</p>
                        </div>
                        <div className="p-3 bg-background rounded-md border">
                          <p className="text-xs text-muted-foreground">Cohen's f</p>
                          <p className="font-mono font-bold">{conversions.f.toFixed(3)}</p>
                          <p className="text-xs text-muted-foreground">{getEffectInterpretationF(conversions.f)}</p>
                        </div>
                        <div className="p-3 bg-background rounded-md border">
                          <p className="text-xs text-muted-foreground">R²</p>
                          <p className="font-mono font-bold">{(conversions.r2 * 100).toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">variance</p>
                        </div>
                        <div className="p-3 bg-background rounded-md border">
                          <p className="text-xs text-muted-foreground">Eta²</p>
                          <p className="font-mono font-bold">{(conversions.eta2 * 100).toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">variance</p>
                        </div>
                        <div className="p-3 bg-background rounded-md border">
                          <p className="text-xs text-muted-foreground">Correlation r</p>
                          <p className="font-mono font-bold">{conversions.correlation.toFixed(3)}</p>
                          <p className="text-xs text-muted-foreground">association</p>
                        </div>
                      </div>
                      <Alert className="mt-3">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>Note:</strong> Conversions between d and f assume approximately equal group sizes. 
                          For unequal groups, these approximations become less accurate.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Conceptual Explanation */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Key Differences
              </h4>
              <div className="grid gap-2 text-sm">
                <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
                  <p className="font-medium text-primary">Cohen's d (Univariate)</p>
                  <p className="text-muted-foreground">Measures the standardized mean difference between groups for a single variable. Common in t-tests and simple comparisons.</p>
                </div>
                <div className="p-3 bg-secondary/5 rounded-md border border-secondary/10">
                  <p className="font-medium text-secondary-foreground">R² (Multivariate)</p>
                  <p className="text-muted-foreground">Measures the proportion of total variance explained by group differences across multiple variables. Used in PERMANOVA and NMDS.</p>
                </div>
              </div>
            </div>

            {/* Cohen's d ↔ R² Conversion for 2 Groups */}
            <div className="space-y-3">
              <h4 className="font-semibold">Cohen's d ↔ R² (Two Groups)</h4>
              
              {numGroups === 2 ? (
                <>
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                    <div className="space-y-2">
                      <p className="text-sm font-mono text-center">
                        d = 2 × √(R² / (1 - R²))
                      </p>
                      <p className="text-sm font-mono text-center">
                        R² = d² / (d² + 4)
                      </p>
                    </div>
                  </div>

                  {!showInEffectSizeTab && (
                    <div className="p-4 bg-accent rounded-lg border-2 border-primary">
                      <p className="text-sm font-medium">Current Values:</p>
                      <p className="text-lg mt-1">
                        <span className="font-semibold">R² = {rSquared.toFixed(3)}</span>
                        {" ≈ "}
                        <span className="font-semibold text-primary">
                          Cohen's d = {cohensD.toFixed(2)}
                        </span>
                        {" "}
                        <span className="text-muted-foreground">
                          ({getEffectInterpretationD(cohensD)} effect)
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Benchmark Table for d */}
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Cohen's d</th>
                          <th className="px-4 py-2 text-left font-medium">R²</th>
                          <th className="px-4 py-2 text-left font-medium">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {benchmarksD.map((benchmark, i) => (
                          <tr key={i} className="hover:bg-accent/50 transition-colors">
                            <td className="px-4 py-2 font-mono">{benchmark.d.toFixed(1)}</td>
                            <td className="px-4 py-2 font-mono">{(benchmark.r2 * 100).toFixed(1)}%</td>
                            <td className="px-4 py-2 text-muted-foreground">{benchmark.label}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Multi-group comparison detected ({numGroups} groups).</strong> The simple conversion between R² and Cohen's d is only valid for 2-group comparisons. For 3+ groups, use <strong>Cohen's f</strong> instead (see below).
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Cohen's f ↔ Eta²/R² Conversion for ANOVA */}
            <div className="space-y-3">
              <h4 className="font-semibold">Cohen's f ↔ Eta²/R² (Multiple Groups - ANOVA)</h4>
              
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                <div className="space-y-2">
                  <p className="text-sm font-mono text-center">
                    f = √(R² / (1 - R²))
                  </p>
                  <p className="text-sm font-mono text-center">
                    R² = f² / (1 + f²)
                  </p>
                </div>
              </div>

              {!showInEffectSizeTab && numGroups > 2 && (
                <div className="p-4 bg-accent rounded-lg border-2 border-primary">
                  <p className="text-sm font-medium">Current Values:</p>
                  <p className="text-lg mt-1">
                    <span className="font-semibold">R² = {rSquared.toFixed(3)}</span>
                    {" ≈ "}
                    <span className="font-semibold text-primary">
                      Cohen's f = {cohensF.toFixed(2)}
                    </span>
                    {" "}
                    <span className="text-muted-foreground">
                      ({getEffectInterpretationF(cohensF)} effect)
                    </span>
                  </p>
                </div>
              )}

              {/* Benchmark Table for f */}
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Cohen's f</th>
                      <th className="px-4 py-2 text-left font-medium">Eta²/R²</th>
                      <th className="px-4 py-2 text-left font-medium">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {benchmarksF.map((benchmark, i) => (
                      <tr key={i} className="hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-2 font-mono">{benchmark.f.toFixed(2)}</td>
                        <td className="px-4 py-2 font-mono">{(benchmark.eta2 * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2 text-muted-foreground">{benchmark.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Why f is better for ANOVA:</strong> Cohen's f is designed for comparing 3+ groups and properly accounts for between-group variance relative to within-group variance. An R² of 0.10 in PERMANOVA (equivalent to f = 0.33) represents a medium-to-large effect in ecology studies.
                </AlertDescription>
              </Alert>
            </div>

            {/* Comprehensive Comparison Table */}
            {showInEffectSizeTab && (
              <div className="space-y-2">
                <h4 className="font-semibold">Comprehensive Effect Size Benchmarks</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border rounded-lg">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Effect Size</th>
                        <th className="px-3 py-2 text-left font-medium">Small</th>
                        <th className="px-3 py-2 text-left font-medium">Medium</th>
                        <th className="px-3 py-2 text-left font-medium">Large</th>
                        <th className="px-3 py-2 text-left font-medium">Context</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-accent/50">
                        <td className="px-3 py-2 font-medium">Cohen's d</td>
                        <td className="px-3 py-2 font-mono">0.2</td>
                        <td className="px-3 py-2 font-mono">0.5</td>
                        <td className="px-3 py-2 font-mono">0.8</td>
                        <td className="px-3 py-2 text-muted-foreground">t-test (2 groups)</td>
                      </tr>
                      <tr className="hover:bg-accent/50">
                        <td className="px-3 py-2 font-medium">Cohen's f</td>
                        <td className="px-3 py-2 font-mono">0.1</td>
                        <td className="px-3 py-2 font-mono">0.25</td>
                        <td className="px-3 py-2 font-mono">0.4</td>
                        <td className="px-3 py-2 text-muted-foreground">ANOVA (3+ groups)</td>
                      </tr>
                      <tr className="hover:bg-accent/50">
                        <td className="px-3 py-2 font-medium">R² (2 groups)</td>
                        <td className="px-3 py-2 font-mono">1%</td>
                        <td className="px-3 py-2 font-mono">6%</td>
                        <td className="px-3 py-2 font-mono">14%</td>
                        <td className="px-3 py-2 text-muted-foreground">% variance explained</td>
                      </tr>
                      <tr className="hover:bg-accent/50">
                        <td className="px-3 py-2 font-medium">Eta² / R²</td>
                        <td className="px-3 py-2 font-mono">1%</td>
                        <td className="px-3 py-2 font-mono">6%</td>
                        <td className="px-3 py-2 font-mono">14%</td>
                        <td className="px-3 py-2 text-muted-foreground">ANOVA % variance</td>
                      </tr>
                      <tr className="hover:bg-accent/50">
                        <td className="px-3 py-2 font-medium">Cohen's w</td>
                        <td className="px-3 py-2 font-mono">0.1</td>
                        <td className="px-3 py-2 font-mono">0.3</td>
                        <td className="px-3 py-2 font-mono">0.5</td>
                        <td className="px-3 py-2 text-muted-foreground">Chi-square tests</td>
                      </tr>
                      <tr className="hover:bg-accent/50">
                        <td className="px-3 py-2 font-medium">Correlation r</td>
                        <td className="px-3 py-2 font-mono">0.1</td>
                        <td className="px-3 py-2 font-mono">0.3</td>
                        <td className="px-3 py-2 font-mono">0.5</td>
                        <td className="px-3 py-2 text-muted-foreground">Pearson/Spearman</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Partial vs. Full Eta² */}
            {showInEffectSizeTab && (
              <div className="space-y-2">
                <h4 className="font-semibold">Partial vs. Full Eta²</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
                    <p className="font-medium text-primary mb-1">Full Eta² (η²)</p>
                    <p className="text-muted-foreground">Proportion of <strong>total variance</strong> explained by a factor. Used in simple ANOVA and PERMANOVA. More conservative and comparable across studies.</p>
                  </div>
                  <div className="p-3 bg-secondary/5 rounded-md border border-secondary/10">
                    <p className="font-medium text-secondary-foreground mb-1">Partial Eta² (η²p)</p>
                    <p className="text-muted-foreground">Proportion of variance explained after <strong>removing other factors</strong>. Used in complex designs with multiple predictors. Generally larger than full eta².</p>
                  </div>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>For microbiome studies:</strong> PERMANOVA R² is analogous to <strong>full eta²</strong>, 
                    representing the proportion of total community variance explained by your treatment. 
                    This is why R² values of 5-15% are considered meaningful in ecology.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Important Caveats */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p className="font-semibold">Important Caveats:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Conversions between d and R² are only accurate for <strong>2 groups with equal sample sizes</strong></li>
                  <li>For 3+ groups, always use <strong>Cohen's f</strong> instead of Cohen's d</li>
                  <li>R² in PERMANOVA/NMDS is multivariate, while Cohen's d/f are typically univariate</li>
                  <li>In microbiome and ecology studies, R² values of 0.05-0.15 (5-15%) are common and meaningful</li>
                  <li>Small R² doesn't mean "no effect" - it reflects the complexity of multivariate data</li>
                  <li>These conversions assume approximately equal group sizes; unequal groups reduce accuracy</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Practical Guidance */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">💡 Tip:</strong> When planning microbiome studies, R² values seem "smaller" than Cohen's d/f because they represent the proportion of <em>total multivariate variance</em> explained. An R² of 0.10 (10%) in a PERMANOVA is often considered a <strong>medium-to-large effect</strong> in ecology and microbiome research, equivalent to Cohen's f ≈ 0.33.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}