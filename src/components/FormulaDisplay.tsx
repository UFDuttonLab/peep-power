import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info } from 'lucide-react';

export interface FormulaInfo {
  title: string;
  formula: string;
  variables: Array<{ symbol: string; description: string }>;
  notes?: string[];
  references?: Array<{ text: string; url?: string }>;
  limitations?: string[];
}

interface FormulaDisplayProps {
  formula: FormulaInfo;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

const FormulaDisplay = ({ formula, buttonVariant = 'outline' }: FormulaDisplayProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size="sm">
          <Info className="mr-2 h-4 w-4" />
          Show Formula
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{formula.title}</DialogTitle>
          <DialogDescription>
            Mathematical formula used for this calculation
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Formula */}
            <div className="bg-secondary/30 p-4 rounded-lg">
              <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                {formula.formula}
              </pre>
            </div>

            {/* Variable Definitions */}
            <div>
              <h4 className="font-semibold mb-2">Where:</h4>
              <dl className="space-y-2">
                {formula.variables.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-[auto_1fr] gap-3">
                    <dt className="font-mono font-medium">{v.symbol}</dt>
                    <dd className="text-sm text-muted-foreground">{v.description}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Notes */}
            {formula.notes && formula.notes.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {formula.notes.map((note, idx) => (
                        <li key={idx} className="text-sm">{note}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Limitations */}
            {formula.limitations && formula.limitations.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Limitations & Approximations:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {formula.limitations.map((limit, idx) => (
                        <li key={idx} className="text-sm">{limit}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* References */}
            {formula.references && formula.references.length > 0 && (
              <div className="text-sm">
                <h4 className="font-semibold mb-2">References:</h4>
                <ul className="space-y-1">
                  {formula.references.map((ref, idx) => (
                    <li key={idx}>
                      {ref.url ? (
                        <a 
                          href={ref.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {ref.text}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{ref.text}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FormulaDisplay;
