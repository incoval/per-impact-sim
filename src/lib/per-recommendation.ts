import { computeIRWithPER, computePlafondTotal, TRANCHES_IR_2025 } from './tax-engine';

export interface AnnualPERParameters {
  year: number;
  revenuNet: number;
  versementPER: number;
  parts: number;
  report5ans?: boolean;
  /** Actual available ceiling, when supplied by an annual projection. */
  plafondDisponible?: number;
  revenuEstime?: boolean;
}

/** Uses the same taxable income, rounding and brackets as the simulation.
 * Portions remain unrounded; only the recommended payment is floored so that
 * it never exceeds either the bracket boundary or the available ceiling.
 * Each projected year must supply its own income, payment and ceiling.
 */
export function computePERRecommendation(parameters: AnnualPERParameters) {
  const { year, revenuNet, versementPER, parts, report5ans = false } = parameters;
  if (!Number.isFinite(parts) || parts <= 0 ||
      !Number.isFinite(revenuNet) || revenuNet < 0 ||
      !Number.isFinite(versementPER) || versementPER < 0 ||
      (parameters.plafondDisponible !== undefined &&
        (!Number.isFinite(parameters.plafondDisponible) || parameters.plafondDisponible < 0))) {
    throw new RangeError('Paramètres PER invalides');
  }
  const plafond = parameters.plafondDisponible ?? computePlafondTotal(revenuNet, report5ans);
  const deductible = Math.min(versementPER, plafond);
  const { avant, apres } = computeIRWithPER(revenuNet, deductible, parts);
  const end = Math.max(0, avant.revenuImposable - deductible);
  const portions = [...TRANCHES_IR_2025].reverse().flatMap((bracket) => {
    const montant = Math.max(0,
      Math.min(avant.revenuImposable, bracket.max * parts) -
      Math.max(end, bracket.min * parts));
    return montant > 0 ? [{ taux: bracket.taux, montant }] : [];
  });
  const initialBracket = TRANCHES_IR_2025.find((bracket) => bracket.taux === avant.tmi)!;
  const capaciteTMI = avant.tmi > 0
    ? Math.max(0, avant.revenuImposable - initialBracket.min * parts) : 0;
  const recommande = Math.floor(Math.min(versementPER, plafond, capaciteTMI));
  return {
    montantAvantTrancheInferieure: Math.floor(Math.min(plafond, capaciteTMI)),
    plafondAvantTranche: plafond < capaciteTMI,
    year, versement: versementPER, plafond, deductible, recommande,
    tmiAvant: avant.tmi, tmiApres: apres.tmi,
    portions, portionsInferieures: portions.filter((p) => p.taux < avant.tmi),
    nonDeductible: versementPER - deductible,
    surplus: versementPER - recommande,
    plafondLimitant: plafond < versementPER && plafond <= capaciteTMI,
    revenuEstime: parameters.revenuEstime ?? true,
  };
}

export type PERRecommendation = ReturnType<typeof computePERRecommendation>;
