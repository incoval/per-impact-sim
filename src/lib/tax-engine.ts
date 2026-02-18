// Barème IR 2025 (France) - tranches par part
export const TRANCHES_IR_2025 = [
  { min: 0, max: 11294, taux: 0 },
  { min: 11294, max: 28797, taux: 0.11 },
  { min: 28797, max: 82341, taux: 0.30 },
  { min: 82341, max: 177106, taux: 0.41 },
  { min: 177106, max: Infinity, taux: 0.45 },
];

export const ABATTEMENT_TAUX = 0.10;
export const ABATTEMENT_MIN = 504;
export const ABATTEMENT_MAX = 14426;

// Plafond PER : 10% du revenu net imposable, plafonné à 48 000 €
export const PER_PLAFOND_TAUX = 0.10;
export const PER_PLAFOND_MAX = 48000;

export function computePlafondPER(revenuNet: number): number {
  return Math.min(revenuNet * PER_PLAFOND_TAUX, PER_PLAFOND_MAX);
}

export function computeAbattement(revenuNet: number): number {
  const raw = revenuNet * ABATTEMENT_TAUX;
  return Math.min(Math.max(raw, ABATTEMENT_MIN), ABATTEMENT_MAX);
}

export function computeRevenuImposable(revenuNet: number): number {
  return Math.max(0, revenuNet - computeAbattement(revenuNet));
}

export interface IRResult {
  impot: number;
  tmi: number;
  revenuImposable: number;
  abattement: number;
}

export function computeIR(revenuNet: number, parts: number): IRResult {
  const abattement = computeAbattement(revenuNet);
  const revenuImposable = Math.max(0, revenuNet - abattement);
  const quotient = revenuImposable / parts;

  let impotParPart = 0;
  let tmi = 0;

  for (const tranche of TRANCHES_IR_2025) {
    if (quotient <= tranche.min) break;
    const base = Math.min(quotient, tranche.max) - tranche.min;
    impotParPart += base * tranche.taux;
    if (quotient > tranche.min) tmi = tranche.taux;
  }

  return {
    impot: Math.round(impotParPart * parts),
    tmi,
    revenuImposable: Math.round(revenuImposable),
    abattement: Math.round(abattement),
  };
}

export function computeIRWithPER(
  revenuNet: number,
  versementPER: number,
  parts: number
): { avant: IRResult; apres: IRResult; gain: number } {
  const avant = computeIR(revenuNet, parts);
  const revenuNetApresPER = Math.max(0, revenuNet - versementPER);
  const apres = computeIR(revenuNetApresPER, parts);
  return { avant, apres, gain: avant.impot - apres.impot };
}

// Find optimal PER contribution to drop to lower bracket
export function computeOptimalVersement(revenuNet: number, parts: number): number | null {
  const avant = computeIR(revenuNet, parts);
  if (avant.tmi <= 0.11) return null; // Already at lowest meaningful bracket

  // Find the threshold where TMI drops
  const quotientAvant = avant.revenuImposable / parts;
  
  // Find current bracket upper bound of the bracket below
  let targetMax = 0;
  for (const tranche of TRANCHES_IR_2025) {
    if (quotientAvant > tranche.min && quotientAvant <= tranche.max) {
      targetMax = tranche.min;
      break;
    }
  }

  if (targetMax === 0) return null;

  // We need revenuImposableApres / parts <= targetMax
  // revenuImposableApres = revenuNetApres - abattementApres
  // We iterate to find the right amount (abattement depends on revenuNetApres)
  // Simple approach: binary search
  let lo = 0;
  let hi = revenuNet;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const rna = Math.max(0, revenuNet - mid);
    const aba = computeAbattement(rna);
    const ri = Math.max(0, rna - aba);
    const q = ri / parts;
    if (q > targetMax) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const versement = Math.ceil((lo + hi) / 2);
  if (versement <= 0 || versement >= revenuNet) return null;
  return versement;
}

export function generateScenarios(
  revenuNet: number,
  versementPER: number,
  parts: number
): Array<{
  versement: number;
  revenuNetFiscal: number;
  revenuImposable: number;
  impot: number;
  gain: number;
  variationPct: number;
  tmi: number;
  isOptimal: boolean;
  isCurrent: boolean;
}> {
  const base = computeIR(revenuNet, parts);
  const defaultAmounts = [0, 1000, 2000, 3000, versementPER].filter(
    (v, i, arr) => arr.indexOf(v) === i
  );

  const optimal = computeOptimalVersement(revenuNet, parts);
  const amounts = [...new Set([...defaultAmounts, ...(optimal ? [optimal] : [])])].sort(
    (a, b) => a - b
  );

  return amounts.map((v) => {
    const rn = Math.max(0, revenuNet - v);
    const res = computeIR(rn, parts);
    const gain = base.impot - res.impot;
    const variationPct = base.impot > 0 ? ((res.impot - base.impot) / base.impot) * 100 : 0;
    return {
      versement: v,
      revenuNetFiscal: rn,
      revenuImposable: res.revenuImposable,
      impot: res.impot,
      gain,
      variationPct,
      tmi: res.tmi,
      isOptimal: optimal !== null && v === optimal,
      isCurrent: v === versementPER,
    };
  });
}

export function formatEuro(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}
