import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { computeRevenuImposable, formatEuro } from '@/lib/tax-engine';

export default function IncomeEntry({ revenuNet, onChange, couple, onCoupleChange }: {
  revenuNet: number;
  onChange: (annual: number) => void;
  couple: boolean;
  onCoupleChange: (couple: boolean) => void;
}) {
  const [monthly, setMonthly] = useState(false);
  const [firstShare, setFirstShare] = useState(0.5);
  const factor = monthly ? 12 : 1;
  const totalPeriod = revenuNet / factor;
  const firstIncome = couple ? totalPeriod * firstShare : totalPeriod;
  const secondIncome = totalPeriod - firstIncome;
  const updateIncome = (value: number, second = false) => {
    const first = second ? Math.round(firstIncome * 100) / 100 : value;
    const spouse = couple ? (second ? value : Math.round(secondIncome * 100) / 100) : 0;
    const total = first + spouse;
    setFirstShare(total > 0 ? first / total : 0.5);
    onChange(Math.round(total * factor * 100) / 100);
  };
  const displayIncome = (value: number) => Math.round(value * 100) / 100;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="income-period">Saisie des revenus nets du foyer</Label>
        <select id="income-period" value={monthly ? 'monthly' : 'annual'}
          onChange={(event) => setMonthly(event.target.value === 'monthly')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="annual">Revenu net annuel</option>
          <option value="monthly">Revenus nets mensuels</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
            <input id="monthly-couple" type="checkbox" checked={couple}
              onChange={(event) => {
                onCoupleChange(event.target.checked);
                setFirstShare(0.5);
              }} />
            <Label htmlFor="monthly-couple" className="cursor-pointer">Foyer marié ou pacsé : deux revenus</Label>
          </div>
      {monthly || couple ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="monthly-income">{`${couple ? 'Votre revenu net' : 'Revenu net'} ${monthly ? 'mensuel' : 'annuel'} (avant IR)`}</Label>
            <Input id="monthly-income" type="number" min={0} step="0.01" value={displayIncome(firstIncome)}
              onChange={(event) => updateIncome(Math.max(0, Number(event.target.value)))} className="font-mono" />
          </div>
          {couple && (
            <div className="space-y-2">
              <Label htmlFor="spouse-monthly-income">{`Revenu net ${monthly ? 'mensuel' : 'annuel'} du conjoint (avant IR)`}</Label>
              <Input id="spouse-monthly-income" type="number" min={0} step="0.01" value={displayIncome(secondIncome)}
                onChange={(event) => updateIncome(Math.max(0, Number(event.target.value)), true)} className="font-mono" />
            </div>
          )}
          <p className="text-xs text-muted-foreground">Revenu net annuel du foyer : {formatEuro(revenuNet)}. {monthly && 'Estimation sur 12 mois ; incluez les primes dans votre moyenne mensuelle.'} {couple && 'Ajustez les parts fiscales selon votre situation familiale.'}</p>
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="annual-income">Revenu net annuel du foyer (avant IR)</Label>
          <Input id="annual-income" type="number" min={0} value={revenuNet}
            onChange={(event) => onChange(Math.max(0, Number(event.target.value)))} className="font-mono" />
          <Slider value={[revenuNet]} onValueChange={([value]) => onChange(value)} min={0} max={200000} step={500} />
        </div>
      )}
      <p className="text-xs text-muted-foreground">L'application calcule automatiquement l'abattement de 10 %. Revenu imposable estimé avant PER : {formatEuro(computeRevenuImposable(revenuNet))}.</p>
    </div>
  );
}
