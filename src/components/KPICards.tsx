import { formatEuro, formatPct, type IRResult } from '@/lib/tax-engine';
import { TrendingDown, ArrowRight } from 'lucide-react';

interface KPICardsProps {
  avant: IRResult;
  apres: IRResult;
  gain: number;
}

const KPICard = ({
  label,
  value,
  subtitle,
  highlight,
}: {
  label: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-xl p-5 card-shadow transition-shadow hover:card-shadow-hover ${
      highlight
        ? 'bg-primary text-primary-foreground'
        : 'bg-card text-card-foreground'
    }`}
  >
    <p className={`text-xs font-medium uppercase tracking-wider ${highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
      {label}
    </p>
    <p className="mt-2 text-2xl font-bold font-sans">{value}</p>
    {subtitle && (
      <p className={`mt-1 text-xs ${highlight ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
        {subtitle}
      </p>
    )}
  </div>
);

export default function KPICards({ avant, apres, gain }: KPICardsProps) {
  const tmiBefore = avant.tmi;
  const tmiAfter = apres.tmi;
  const trancheChanged = tmiBefore !== tmiAfter;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          label="Revenu imposable (avant PER)"
          value={formatEuro(avant.revenuImposable)}
        />
        <KPICard
          label="Impôt estimé (avant PER)"
          value={formatEuro(avant.impot)}
        />
        <KPICard
          label="Impôt estimé (après PER)"
          value={formatEuro(apres.impot)}
        />
        <KPICard
          label="Gain fiscal"
          value={formatEuro(gain)}
          highlight
          subtitle="Économie d'impôt"
        />
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-card p-3 card-shadow text-sm">
        <span className="text-muted-foreground">TMI avant :</span>
        <span className="font-bold">{formatPct(tmiBefore)}</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">TMI après :</span>
        <span className="font-bold">{formatPct(tmiAfter)}</span>
        {trancheChanged && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
            <TrendingDown className="h-3 w-3" />
            Changement de tranche
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground italic">
        Calcul indicatif : hors décote et dispositifs spécifiques.
      </p>
    </div>
  );
}
