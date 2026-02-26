import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { RotateCcw, FileDown, Info } from 'lucide-react';
import { formatEuro, computePlafondTotal } from '@/lib/tax-engine';

interface HypothesesProps {
  revenuNet: number;
  setRevenuNet: (v: number) => void;
  versementPER: number;
  setVersementPER: (v: number) => void;
  parts: number;
  setParts: (v: number) => void;
  report5ans: boolean;
  setReport5ans: (v: boolean) => void;
  onReset: () => void;
  onExportPDF: () => void;
}

const InfoTooltip = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline ml-1" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
  </Tooltip>
);

export default function Hypotheses({
  revenuNet,
  setRevenuNet,
  versementPER,
  setVersementPER,
  parts,
  setParts,
  report5ans,
  setReport5ans,
  onReset,
  onExportPDF,
}: HypothesesProps) {
  const plafondTotal = computePlafondTotal(revenuNet, report5ans);

  return (
    <div className="rounded-xl bg-card card-shadow p-5 space-y-6">
      <h3 className="text-lg font-semibold">Hypothèses</h3>

      {/* Revenu net */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Revenu net annuel (avant IR)
          <InfoTooltip text="Base de calcul, avant abattement 10%. Le PER peut réduire votre revenu imposable (sous conditions)." />
        </Label>
        <Input
          type="number"
          value={revenuNet}
          onChange={(e) => setRevenuNet(Math.max(0, Number(e.target.value)))}
          className="font-mono"
        />
        <Slider
          value={[revenuNet]}
          onValueChange={([v]) => setRevenuNet(v)}
          min={0}
          max={200000}
          step={500}
        />
      </div>

      {/* Report 5 ans */}
      <div className="flex items-start gap-2">
        <Checkbox
          id="report5ans"
          checked={report5ans}
          onCheckedChange={(checked) => setReport5ans(checked === true)}
        />
        <div className="grid gap-1 leading-none">
          <label
            htmlFor="report5ans"
            className="text-sm font-medium cursor-pointer leading-snug"
          >
            Aucun versement PER ces 5 dernières années
            <InfoTooltip text="Si vous n'avez jamais versé sur un PER durant les 5 dernières années, vous pouvez cumuler les plafonds annuels non utilisés (x5)." />
          </label>
          <p className="text-xs text-muted-foreground">
            Report du plafond sur 5 ans
          </p>
        </div>
      </div>

      {/* Versement PER */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Versement PER annuel
          <InfoTooltip text="Le gain dépend de votre tranche marginale d'imposition. Déduction sur le revenu imposable, plafonnée." />
        </Label>
        <Input
          type="number"
          value={versementPER}
          onChange={(e) => setVersementPER(Math.max(0, Math.min(Number(e.target.value), plafondTotal)))}
          className="font-mono"
        />
        <Slider
          value={[versementPER]}
          onValueChange={([v]) => setVersementPER(v)}
          min={0}
          max={plafondTotal}
          step={100}
        />
        <p className="text-xs text-muted-foreground">
          Soit {formatEuro(Math.round(versementPER / 12))} / mois — Plafond : {formatEuro(plafondTotal)}
          {report5ans && ' (report 5 ans)'}
        </p>
      </div>

      {/* Parts */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Situation familiale / parts</Label>
        <Select value={String(parts)} onValueChange={(v) => setParts(Number(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 part (célibataire)</SelectItem>
            <SelectItem value="1.5">1,5 parts</SelectItem>
            <SelectItem value="2">2 parts (marié/pacsé)</SelectItem>
            <SelectItem value="2.5">2,5 parts</SelectItem>
            <SelectItem value="3">3 parts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Barème */}
      <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Barème IR 2025</p>
        <p>Abattement 10% appliqué au revenu net annuel (min 504 €, max 14 426 €).</p>
        <p>Plafond déduction PER : max 29 316 €/an.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onReset} className="flex-1 gap-1.5">
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </Button>
        <Button onClick={onExportPDF} className="flex-1 gap-1.5">
          <FileDown className="h-4 w-4" />
          Exporter PDF
        </Button>
      </div>
    </div>
  );
}
