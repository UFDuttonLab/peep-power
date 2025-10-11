import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDown, BookOpen, AlertTriangle, Info } from "lucide-react";
import { useState } from "react";

interface EffectSizeConversionGuideProps {
  rSquared: number;
  numGroups: number;
}

export default function EffectSizeConversionGuide({ rSquared, numGroups }: EffectSizeConversionGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate Cohen's d from R² (only valid for 2 groups)
  const calculateCohensD = (r2: number): number => {
    if (r2 >= 1) return Infinity;
    return 2 * Math.sqrt(r2 / (1 - r2));
  };

  // Calculate R² from Cohen's d
  const calculateR2FromD = (d: number): number => {
    return (d * d) / (d * d + 4);
  };

  const cohensD = calculateCohensD(rSquared);
  
  const getEffectInterpretation = (d: number): string => {
    if (d < 0.2) return "very small";
    if (d < 0.5) return "small";
    if (d < 0.8) return "medium";
    if (d < 1.2) return "large";
    return "very large";
  };

  const benchmarks = [
    { d: 0.2, r2: calculateR2FromD(0.2), label: "Small" },
    { d: 0.5, r2: calculateR2FromD(0.5), label: "Medium" },
    { d: 0.8, r2: calculateR2FromD(0.8), label: "Large" },
    { d: 1.0, r2: calculateR2FromD(1.0), label: "Very Large" },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Understanding Effect Sizes: R² vs Cohen's d</CardTitle>
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`} 
              />
            </div>
            <CardDescription className="text-left">
              How multivariate R² relates to univariate Cohen's d
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-4">
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

            {/* Conversion for 2 Groups */}
            {numGroups === 2 ? (
              <div className="space-y-3">
                <h4 className="font-semibold">Approximate Conversion (2 Groups)</h4>
                
                <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                  <div className="space-y-2">
                    <p className="text-sm font-mono text-center">
                      d ≈ 2 × √(R² / (1 - R²))
                    </p>
                    <p className="text-sm font-mono text-center">
                      R² ≈ d² / (d² + 4)
                    </p>
                  </div>
                </div>

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
                      ({getEffectInterpretation(cohensD)} effect)
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Multi-group comparison detected ({numGroups} groups).</strong> The simple conversion between R² and Cohen's d is only valid for 2-group comparisons. For 3+ groups, use <strong>Cohen's f</strong> instead, or interpret R² directly as the proportion of variance explained.
                </AlertDescription>
              </Alert>
            )}

            {/* Benchmark Table */}
            <div className="space-y-2">
              <h4 className="font-semibold">Benchmark Comparison (2 Groups)</h4>
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
                    {benchmarks.map((benchmark, i) => (
                      <tr key={i} className="hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-2 font-mono">{benchmark.d.toFixed(1)}</td>
                        <td className="px-4 py-2 font-mono">{(benchmark.r2 * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2 text-muted-foreground">{benchmark.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Important Caveats */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p className="font-semibold">Important Caveats:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Conversion is only accurate for <strong>2 groups with equal sample sizes</strong></li>
                  <li>For 3+ groups, use Cohen's f: <span className="font-mono">f = √(R² / (1 - R²))</span></li>
                  <li>R² in PERMANOVA/NMDS is multivariate, while Cohen's d is univariate</li>
                  <li>In microbiome studies, R² values of 0.05-0.15 (5-15%) are common and meaningful</li>
                  <li>Small R² doesn't mean "no effect" - it reflects the complexity of multivariate data</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Practical Guidance */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">💡 Tip:</strong> When planning microbiome studies, R² values seem "smaller" than Cohen's d because they represent the proportion of <em>total multivariate variance</em> explained. An R² of 0.10 (10%) in a PERMANOVA is often considered a <strong>medium-to-large effect</strong> in ecology and microbiome research.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
