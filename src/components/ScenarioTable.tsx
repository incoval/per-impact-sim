import { generateScenarios, formatEuro, formatPct } from '@/lib/tax-engine';
import { Star } from 'lucide-react';

interface ScenarioTableProps {
  revenuNet: number;
  versementPER: number;
  parts: number;
}

export default function ScenarioTable({ revenuNet, versementPER, parts }: ScenarioTableProps) {
  const scenarios = generateScenarios(revenuNet, versementPER, parts);

  return (
    <div className="rounded-xl bg-card card-shadow overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold">Exemples chiffrés</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Versement PER</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Rev. net fiscal</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Rev. imposable</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Impôt estimé</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gain fiscal</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">TMI</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s, i) => (
              <tr
                key={i}
                className={`border-b border-border/50 transition-colors ${
                  s.isOptimal
                    ? 'bg-accent/20 font-medium'
                    : s.isCurrent && s.versement > 0
                    ? 'bg-primary/5'
                    : 'hover:bg-secondary/30'
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {s.isOptimal && <Star className="h-3.5 w-3.5 text-accent fill-accent" />}
                    <span>{formatEuro(s.versement)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatEuro(Math.round(s.versement / 12))}/mois)
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{formatEuro(s.revenuNetFiscal)}</td>
                <td className="px-4 py-3 text-right">{formatEuro(s.revenuImposable)}</td>
                <td className="px-4 py-3 text-right">
                  <span>{formatEuro(s.impot)}</span>
                  {s.versement > 0 && (
                    <span className="ml-1 text-xs text-success">
                      {s.variationPct.toFixed(1)}%
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-success">
                  {s.gain > 0 ? formatEuro(s.gain) : '–'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                    {formatPct(s.tmi)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
