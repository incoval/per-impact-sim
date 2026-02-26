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

// Plafond PER 2025
export const PER_PLAFOND_MIN = 4800;
export const PER_PLAFOND_TAUX = 0.10;
export const MAX_DEDUCTION_2025 = 29_316;

export function computeAbattement(revenuNet: number): number {
  const raw = revenuNet * ABATTEMENT_TAUX;
  return Math.min(Math.max(raw, ABATTEMENT_MIN), ABATTEMENT_MAX);
}

export function computeRevenuImposable(revenuNet: number): number {
  return Math.max(0, revenuNet - computeAbattement(revenuNet));
}

/**
 * Plafond PER annuel de base, calculé sur le revenu imposable (après abattement 10%).
 * min(max(4800, 10% du revenuImposable), 29 316)
 */
export function computePlafondPER(revenuNet: number): number {
  const revenuImposable = computeRevenuImposable(revenuNet);
  return Math.min(Math.max(PER_PLAFOND_MIN, revenuImposable * PER_PLAFOND_TAUX), MAX_DEDUCTION_2025);
}

/**
 * Plafond total PER : si report 5 ans disponible, plafondAnnuel * 5
 */
export function computePlafondTotal(revenuNet: number, report5ans: boolean): number {
  const base = computePlafondPER(revenuNet);
  return report5ans ? base * 5 : base;
}

export interface IRResult {
  impot: number;
  tmi: number;
  revenuImposable: number;
  abattement: number;
}

/**
 * Calcule l'IR à partir d'un revenu imposable déjà calculé (après abattement).
 */
export function computeIRFromImposable(revenuImposable: number, parts: number): { impot: number; tmi: number } {
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
  };
}

/**
 * Calcule l'IR à partir du revenu net (applique l'abattement 10%).
 */
export function computeIR(revenuNet: number, parts: number): IRResult {
  const abattement = computeAbattement(revenuNet);
  const revenuImposable = Math.max(0, revenuNet - abattement);
  const { impot, tmi } = computeIRFromImposable(revenuImposable, parts);

  return {
    impot,
    tmi,
    revenuImposable: Math.round(revenuImposable),
    abattement: Math.round(abattement),
  };
}

/**
 * Calcule l'IR avant et après PER.
 * La déduction PER s'impute sur le revenu imposable (après abattement 10%), pas sur le revenu net.
 */
export function computeIRWithPER(
  revenuNet: number,
  versementPER: number,
  parts: number
): { avant: IRResult; apres: IRResult; gain: number } {
  const avant = computeIR(revenuNet, parts);
  const revenuImposableApres = Math.max(0, avant.revenuImposable - versementPER);
  const { impot, tmi } = computeIRFromImposable(revenuImposableApres, parts);
  const apres: IRResult = {
    impot,
    tmi,
    revenuImposable: Math.round(revenuImposableApres),
    abattement: avant.abattement,
  };
  return { avant, apres, gain: avant.impot - apres.impot };
}

// Find optimal PER contribution to drop to lower bracket
export function computeOptimalVersement(revenuNet: number, parts: number, plafondTotal: number): number | null {
  const avant = computeIR(revenuNet, parts);
  if (avant.tmi <= 0.11) return null;

  const revenuImposableBase = avant.revenuImposable;
  const quotientAvant = revenuImposableBase / parts;

  // Find the threshold of the bracket below current TMI
  let targetMax = 0;
  for (const tranche of TRANCHES_IR_2025) {
    if (quotientAvant > tranche.min && quotientAvant <= tranche.max) {
      targetMax = tranche.min;
      break;
    }
  }

  if (targetMax === 0) return null;

  // versement needed: revenuImposableBase - versement <= targetMax * parts
  // versement >= revenuImposableBase - targetMax * parts
  const versement = Math.ceil(revenuImposableBase - targetMax * parts);
  if (versement <= 0 || versement > plafondTotal) return null;
  return versement;
}

export function generateScenarios(
  revenuNet: number,
  versementPER: number,
  parts: number,
  report5ans: boolean = false
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
  const avant = computeIR(revenuNet, parts);
  const revenuImposableBase = avant.revenuImposable;
  const plafondTotal = computePlafondTotal(revenuNet, report5ans);

  const defaultAmounts = [0, 1000, 2000, 3000, versementPER].filter(
    (v, i, arr) => arr.indexOf(v) === i && v <= plafondTotal
  );

  const optimal = computeOptimalVersement(revenuNet, parts, plafondTotal);
  const amounts = [...new Set([...defaultAmounts, ...(optimal ? [optimal] : [])])].sort(
    (a, b) => a - b
  );

  return amounts.map((v) => {
    const ri = Math.max(0, revenuImposableBase - v);
    const { impot, tmi } = computeIRFromImposable(ri, parts);
    const gain = avant.impot - impot;
    const variationPct = avant.impot > 0 ? ((impot - avant.impot) / avant.impot) * 100 : 0;
    return {
      versement: v,
      revenuNetFiscal: revenuNet, // constant — PER doesn't change net fiscal income
      revenuImposable: Math.round(ri),
      impot,
      gain,
      variationPct,
      tmi,
      isOptimal: optimal !== null && v === optimal,
      isCurrent: v === versementPER,
    };
  });
}

export function formatEuro(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    .format(n)
    .replace(/\u202F/g, ' ');
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}
