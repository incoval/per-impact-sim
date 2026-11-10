import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { formatEuro, formatPct } from '@/lib/tax-engine';
import type { PERRecommendation as Recommendation } from '@/lib/per-recommendation';
import { Button } from '@/components/ui/button';

export default function PERRecommendation({ recommendations, onApply }: {
  recommendations: Recommendation[];
  onApply?: (year: number, amount: number) => void;
}) {
  const [selectedYear, setSelectedYear] = useState<number>();
  const recommendation = recommendations.find((r) => r.year === selectedYear) ?? recommendations[0];
  if (!recommendation) return null;
  const r = recommendation;
  const sameRate = r.surplus === 0 && r.tmiAvant > 0;

  return (
    <section aria-label="Notre préconisation" className="rounded-xl border border-primary/15 bg-secondary/40 p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-primary">
          <Lightbulb aria-hidden="true" className="h-5 w-5 shrink-0" />
          Notre préconisation pour {r.year}
        </h3>
        {recommendations.length > 1 && (
          <select aria-label="Année de préconisation" value={r.year}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            className="rounded-md border border-input bg-background p-2 text-sm">
            {recommendations.map((annual) => <option key={annual.year} value={annual.year}>{annual.year}</option>)}
          </select>
        )}
      </div>
      <div aria-live="polite" aria-atomic="true" className="space-y-3 text-sm leading-relaxed">
        {r.tmiAvant > 0 && (
          <div className="rounded-lg border border-primary/10 bg-background/70 p-3">
            <p className="text-xs text-muted-foreground">{r.plafondAvantTranche ? 'Montant maximal au taux initial dans votre plafond PER' : 'Montant à verser avant de basculer dans la tranche inférieure'}</p>
            <p className="mt-1 text-xl font-bold text-primary">{formatEuro(r.montantAvantTrancheInferieure)} <span className="text-sm font-normal text-muted-foreground">({formatEuro(Math.round(r.montantAvantTrancheInferieure / 12))}/mois)</span></p>
            <p className="text-xs text-muted-foreground">Montant total annuel bénéficiant du taux marginal de {formatPct(r.tmiAvant)}.{r.plafondAvantTranche && ' Votre plafond de déduction est atteint avant le changement de tranche.'}</p>
          </div>
        )}
        {sameRate ? (
          <p>Votre versement de {formatEuro(r.versement)} bénéficie intégralement d'une économie d'impôt au taux marginal de {formatPct(r.tmiAvant)}, dans les limites de votre plafond disponible.</p>
        ) : r.tmiAvant === 0 ? (
          <p>Votre revenu imposable ne génère pas d'impôt au barème : ce versement ne procure pas d'économie d'impôt immédiate. Vous pourriez envisager une assurance-vie pour conserver davantage de flexibilité.</p>
        ) : (
          <>
            <p className="text-xl sm:text-2xl font-bold text-primary">{formatEuro(r.recommande)} à verser sur votre PER</p>
            <p>Pour optimiser votre avantage fiscal, nous vous recommandons de limiter votre versement PER à {formatEuro(r.recommande)} cette année. Ce montant bénéficie d'une économie d'impôt de {formatPct(r.tmiAvant)} selon le barème simulé.</p>
            {r.portionsInferieures.length > 0 && (
              <p>Sur le versement envisagé, les montants suivants bénéficieraient d'un taux inférieur : {r.portionsInferieures.map((p) => `${formatEuro(p.montant)} à ${formatPct(p.taux)}`).join(' ; ')}.</p>
            )}
            <p>Vous pourriez envisager d'orienter les {formatEuro(r.surplus)} supplémentaires vers une assurance-vie afin de conserver davantage de flexibilité.</p>
            {onApply && <Button variant="outline" size="sm" className="h-auto whitespace-normal" onClick={() => onApply(r.year, r.recommande)}>Tester les versements limités à la tranche</Button>}
          </>
        )}
        {r.nonDeductible > 0 && (
          <p>Votre plafond PER disponible est de {formatEuro(r.plafond)} : {formatEuro(r.nonDeductible)} ne seraient pas déductibles. {r.plafondLimitant ? 'La limite conseillée provient du plafond PER, avant tout changement de TMI.' : 'Ce plafond s’ajoute à la limite liée au changement de TMI.'}</p>
        )}
        {r.revenuEstime && <p className="text-xs text-muted-foreground">Préconisation estimative : revenu imposable reconstitué à partir du revenu net annuel, avec l'abattement du simulateur. Hors décote et dispositifs spécifiques.</p>}
      </div>
    </section>
  );
}
